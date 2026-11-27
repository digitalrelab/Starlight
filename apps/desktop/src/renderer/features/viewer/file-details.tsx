import type { Entry, EntryRef, Property, Swatch } from "@starlight/client";
import { Badge, Tooltip } from "@starlight/ui";
import { useQuery } from "@tanstack/react-query";
import { useStarlight } from "#renderer/lib/context.ts";
import { presentationOf } from "./presentation.ts";

const PROPERTY_LABELS: Readonly<Record<string, string>> = {
  transparent: "Transparent",
  monochrome: "Monochrome",
};

const shareFormat = new Intl.NumberFormat(undefined, { style: "percent", maximumFractionDigits: 0 });

const PaletteSwatch = ({ swatch }: { readonly swatch: Swatch }) => (
  <Tooltip label={`${swatch.color} · ${shareFormat.format(swatch.share)}`}>
    <span className="size-4 rounded-full border border-default" style={{ backgroundColor: swatch.color }} />
  </Tooltip>
);

const PropertyBadge = ({ property }: { readonly property: Property }) => (
  <Badge>{PROPERTY_LABELS[property.key] ?? property.key}</Badge>
);

interface Props {
  readonly projectId: string;
  readonly directory: EntryRef;
  readonly entry: Entry;
}

export const FileDetails = ({ projectId, directory, entry }: Props) => {
  const { queries } = useStarlight();
  const { data: source } = useQuery({
    ...queries.fileSource(projectId, directory, entry.ref),
    enabled: presentationOf(entry) !== "none",
  });
  if (!source || (source.palette.length === 0 && source.properties.length === 0)) return null;
  return (
    <div className="flex items-center gap-3">
      {source.properties.map((property) => (
        <PropertyBadge key={`${property.namespace}.${property.key}`} property={property} />
      ))}
      <div className="flex items-center gap-1">
        {source.palette.map((swatch) => (
          <PaletteSwatch key={swatch.color} swatch={swatch} />
        ))}
      </div>
    </div>
  );
};
