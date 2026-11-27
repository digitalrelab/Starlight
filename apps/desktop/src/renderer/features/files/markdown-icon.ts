import type { IconProps } from "@starlight/ui";

const GLYPH =
  "M4.5 15.29L4.5 8.71L6.44 8.71L8.37 11.13L10.31 8.71L12.24 8.71L12.24 15.29L10.31 15.29L10.31 11.52L8.37 13.94L6.44 11.52L6.44 15.29ZM16.6 15.29L13.69 12.1L15.63 12.1L15.63 8.71L17.56 8.71L17.56 12.1L19.5 12.1Z";

export const MarkdownIcon: IconProps["icon"] = [
  [
    "path",
    {
      d: `M4.5 5.25H19.5A3.25 3.25 0 0 1 22.75 8.5V15.5A3.25 3.25 0 0 1 19.5 18.75H4.5A3.25 3.25 0 0 1 1.25 15.5V8.5A3.25 3.25 0 0 1 4.5 5.25Z${GLYPH}`,
      fill: "currentColor",
      fillRule: "evenodd",
      clipRule: "evenodd",
      key: "0",
    },
  ],
];
