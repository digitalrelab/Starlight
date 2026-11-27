import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = { width: 16, height: 16, viewBox: "0 0 16 16", "aria-hidden": true } as const;

export const FolderIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path
      fill="currentColor"
      d="M1.5 4A1.5 1.5 0 0 1 3 2.5h3.09a1.5 1.5 0 0 1 1.06.44L8.2 4H13a1.5 1.5 0 0 1 1.5 1.5v6.5A1.5 1.5 0 0 1 13 13.5H3A1.5 1.5 0 0 1 1.5 12z"
    />
  </svg>
);

export const FileIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      d="M4 1.75h5.25L12.5 5v9.25H4zM9 1.75V5.25h3.5"
    />
  </svg>
);

export const ChevronRightIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path fill="none" stroke="currentColor" strokeWidth="1.5" d="m6 3.5 4.5 4.5L6 12.5" />
  </svg>
);
