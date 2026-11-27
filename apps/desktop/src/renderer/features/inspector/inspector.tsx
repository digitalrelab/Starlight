import type { Entry, EntryRef, FileDetails, Property } from "@starlight/client";
import { Badge, Card, Details, ScrollArea, Swatch, Tooltip } from "@starlight/ui";
import { useQuery } from "@tanstack/react-query";
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

const Palette = ({ palette }: Pick<FileDetails, "palette">) => (
  <div className="flex items-center gap-1">
    {palette.map((swatch) => (
      <Tooltip key={swatch.color} label={`${swatch.color} · ${shareFormat.format(swatch.share)}`}>
        <Swatch color={swatch.color} />
      </Tooltip>
    ))}
  </div>
);

const PropertyCards = ({ properties }: Pick<FileDetails, "properties">) =>
  [...Map.groupBy(properties, (property) => property.namespace)].map(([namespace, group]) => (
    <Card key={namespace} surface="panel" className="flex shrink-0 flex-col gap-2 p-3">
      <span className="text-subtle">{NAMESPACE_LABELS[namespace]}</span>
      <div className="flex flex-wrap gap-1">
        {group.map((property) => (
          <Badge key={propertyName(property)}>
            {PROPERTY_LABELS[propertyName(property)] ?? property.key}
            {property.value === true ? null : `: ${String(property.value)}`}
          </Badge>
        ))}
      </div>
    </Card>
  ));

const DetailsCard = ({ details }: { readonly details: FileDetails }) => (
  <Details.Root surface="panel">
    <Details.Row label="Kind">{details.mediaType ?? "File"}</Details.Row>
    <Details.Row label="Size">{formatSize(details.size)}</Details.Row>
    {details.dimensions ? (
      <Details.Row label="Dimensions">
        {numberFormat.format(details.dimensions.width)} × {numberFormat.format(details.dimensions.height)}
      </Details.Row>
    ) : null}
    <Details.Row label="Folder">{details.folderName}</Details.Row>
    <Details.Row label="Created">{formatDate(details.createdAt)}</Details.Row>
    <Details.Row label="Modified">{formatDate(details.modifiedAt)}</Details.Row>
    {details.palette.length > 0 ? (
      <Details.Row label="Palette">
        <Palette palette={details.palette} />
      </Details.Row>
    ) : null}
  </Details.Root>
);

interface Props {
  readonly projectId: string;
  readonly directory: EntryRef;
  readonly entry: Entry;
}

export const Inspector = ({ projectId, directory, entry }: Props) => {
  const { queries } = useStarlight();
  const { data: details } = useQuery(queries.fileDetails(projectId, directory, entry.ref));
  return (
    <ScrollArea className="flex-1 [container-type:inline-size]">
      {details ? (
        <div className="flex flex-col gap-2">
          <DetailsCard details={details} />
          <PropertyCards properties={details.properties} />
        </div>
      ) : null}
    </ScrollArea>
  );
};
