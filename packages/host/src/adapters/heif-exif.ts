interface Box {
  readonly type: string;
  readonly start: number;
  readonly end: number;
}

export interface ByteRange {
  readonly offset: number;
  readonly length: number;
}

const ORIENTATION_TAG = 0x0112;
const SHORT = 3;

const fourCC = (view: DataView, offset: number) =>
  String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );

function* boxes(view: DataView, start: number, end: number): Generator<Box> {
  let offset = start;
  while (offset + 8 <= end) {
    let size = view.getUint32(offset);
    let header = 8;
    if (size === 1) {
      size = Number(view.getBigUint64(offset + 8));
      header = 16;
    } else if (size === 0) size = end - offset;
    if (size < header || offset + size > end) return;
    yield { type: fourCC(view, offset + 4), start: offset + header, end: offset + size };
    offset += size;
  }
}

const findBox = (view: DataView, start: number, end: number, type: string) => {
  for (const box of boxes(view, start, end)) if (box.type === type) return box;
  return undefined;
};

const readUint = (view: DataView, offset: number, size: number) => {
  if (size === 0) return 0;
  if (size === 4) return view.getUint32(offset);
  if (size === 8) return Number(view.getBigUint64(offset));
  throw new RangeError(`Unsupported field size: ${size}`);
};

const exifItemId = (view: DataView, iinf: Box) => {
  const version = view.getUint8(iinf.start);
  for (const infe of boxes(view, iinf.start + (version === 0 ? 6 : 8), iinf.end)) {
    if (infe.type !== "infe") continue;
    const infeVersion = view.getUint8(infe.start);
    if (infeVersion < 2) continue;
    const idSize = infeVersion === 2 ? 2 : 4;
    const id = idSize === 2 ? view.getUint16(infe.start + 4) : view.getUint32(infe.start + 4);
    if (fourCC(view, infe.start + 4 + idSize + 2) === "Exif") return id;
  }
  return undefined;
};

const itemExtent = (view: DataView, iloc: Box, itemId: number): ByteRange | null => {
  const version = view.getUint8(iloc.start);
  const sizes = view.getUint8(iloc.start + 4);
  const moreSizes = view.getUint8(iloc.start + 5);
  const offsetSize = sizes >> 4;
  const lengthSize = sizes & 0xf;
  const baseOffsetSize = moreSizes >> 4;
  const indexSize = version > 0 ? moreSizes & 0xf : 0;
  let cursor = iloc.start + 6;
  const itemCount = version < 2 ? view.getUint16(cursor) : view.getUint32(cursor);
  cursor += version < 2 ? 2 : 4;

  for (let item = 0; item < itemCount; item++) {
    const id = version < 2 ? view.getUint16(cursor) : view.getUint32(cursor);
    cursor += version < 2 ? 2 : 4;
    const constructionMethod = version > 0 ? view.getUint16(cursor) & 0xf : 0;
    cursor += version > 0 ? 4 : 2;
    const baseOffset = readUint(view, cursor, baseOffsetSize);
    cursor += baseOffsetSize;
    const extentCount = view.getUint16(cursor);
    cursor += 2;
    for (let extent = 0; extent < extentCount; extent++) {
      cursor += indexSize;
      const offset = readUint(view, cursor, offsetSize);
      cursor += offsetSize;
      const length = readUint(view, cursor, lengthSize);
      cursor += lengthSize;
      if (id === itemId && extent === 0 && constructionMethod === 0)
        return { offset: baseOffset + offset, length };
    }
  }
  return null;
};

export const locateHeifExif = (header: Uint8Array): ByteRange | null => {
  const view = new DataView(header.buffer, header.byteOffset, header.byteLength);
  try {
    const meta = findBox(view, 0, view.byteLength, "meta");
    if (!meta) return null;
    const iinf = findBox(view, meta.start + 4, meta.end, "iinf");
    const iloc = findBox(view, meta.start + 4, meta.end, "iloc");
    if (!iinf || !iloc) return null;
    const itemId = exifItemId(view, iinf);
    return itemId === undefined ? null : itemExtent(view, iloc, itemId);
  } catch {
    return null;
  }
};

export const readExifItemOrientation = (item: Uint8Array): number | undefined => {
  const view = new DataView(item.buffer, item.byteOffset, item.byteLength);
  try {
    const tiff = 4 + view.getUint32(0);
    const littleEndian = fourCC(view, tiff).startsWith("II");
    const ifd = tiff + view.getUint32(tiff + 4, littleEndian);
    const count = view.getUint16(ifd, littleEndian);
    for (let index = 0; index < count; index++) {
      const entry = ifd + 2 + index * 12;
      if (view.getUint16(entry, littleEndian) !== ORIENTATION_TAG) continue;
      return view.getUint16(entry + 2, littleEndian) === SHORT
        ? view.getUint16(entry + 8, littleEndian)
        : undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
};
