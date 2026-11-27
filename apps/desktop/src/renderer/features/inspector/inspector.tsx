import type { Entry, EntryRef, FileDetails, Property } from "@starlight/client";
import { Badge, cn, ScrollArea, Tooltip } from "@starlight/ui";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { KindIcon, itemKindOf } from "#renderer/features/files/kind-icon.tsx";
import { useStarlight } from "#renderer/lib/context.ts";
import { formatDate, formatSize } from "#renderer/lib/format.ts";

const NAMESPACE_LABELS: Readonly<Record<Property["namespace"], string>> = { pixels: "Pixels" };

const PROPERTY_LABELS: Readonly<Record<string, string>> = {
  "pixels.transparent": "Transparent",
  "pixels.monochrome": "Monochrome",
};

const propertyName = ({ namespace, key }: Property) => `${namespace}.${key}`;

const shareFormat = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 0 });
const numberFormat = new Intl.NumberFormat();

const Row = ({ label, children }: { readonly label: string; readonly children: ReactNode }) => (
  <>
    <dt className="text-subtle">{label}</dt>
    <dd className="min-w-0 truncate">{children}</dd>
  </>
);

const Palette = ({ palette }: Pick<FileDetails, "palette">) => (
  <div className="flex items-center gap-1">
    {palette.map((swatch) => (
      <Tooltip key={swatch.color} label={`${swatch.color} · ${shareFormat.format(swatch.share)}`}>
        <span
          className="size-4 rounded-full border border-default"
          style={{ backgroundColor: swatch.color }}
        />
      </Tooltip>
    ))}
  </div>
);

const Properties = ({ properties }: Pick<FileDetails, "properties">) =>
  Object.entries(Object.groupBy(properties, (property) => property.namespace)).map(([namespace, group]) => (
    <Row key={namespace} label={NAMESPACE_LABELS[namespace as Property["namespace"]]}>
      <div className="flex flex-wrap gap-1">
        {group?.map((property) => (
          <Badge key={propertyName(property)}>
            {PROPERTY_LABELS[propertyName(property)] ?? property.key}
            {property.value === true ? null : `: ${String(property.value)}`}
          </Badge>
        ))}
      </div>
    </Row>
  ));

const FileDetailsList = ({ details }: { readonly details: FileDetails }) => (
  <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2.5 text-sm">
    <Row label="Kind">{details.mediaType ?? "File"}</Row>
    <Row label="Size">{formatSize(details.size)}</Row>
    {details.dimensions ? (
      <Row label="Dimensions">
        {numberFormat.format(details.dimensions.width)} × {numberFormat.format(details.dimensions.height)}
      </Row>
    ) : null}
    <Row label="Folder">{details.folder.name}</Row>
    <Row label="Created">{formatDate(details.createdAt)}</Row>
    <Row label="Modified">{formatDate(details.modifiedAt)}</Row>
    {details.palette.length > 0 ? (
      <Row label="Palette">
        <Palette palette={details.palette} />
      </Row>
    ) : null}
    <Properties properties={details.properties} />
  </dl>
);

const FileInspector = ({
  projectId,
  directory,
  entry,
}: {
  readonly projectId: string;
  readonly directory: EntryRef;
  readonly entry: Entry;
}) => {
  const { queries } = useStarlight();
  const { data: details } = useQuery(queries.fileDetails(projectId, directory, entry.ref));
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex min-w-0 items-center gap-2 font-medium">
        <KindIcon kind={itemKindOf(entry)} />
        <span className="truncate">{entry.name}</span>
      </div>
      {details ? <FileDetailsList details={details} /> : null}
    </div>
  );
};

interface Props {
  readonly projectId: string;
  readonly directory: EntryRef | null;
  readonly entry: Entry | undefined;
  readonly className?: string;
}

export const Inspector = ({ projectId, directory, entry, className }: Props) => (
  <aside className={cn("flex min-h-0 w-72 shrink-0 flex-col", className)}>
    <ScrollArea className="flex-1">
      {directory && entry?.kind === "file" ? (
        <FileInspector projectId={projectId} directory={directory} entry={entry} />
      ) : (
        <p className="p-4 text-sm text-subtle">Select a file to see its details</p>
      )}
    </ScrollArea>
  </aside>
);
