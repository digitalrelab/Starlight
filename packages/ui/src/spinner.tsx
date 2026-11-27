import { cn } from "cn";

interface Props {
  readonly size?: number;
  readonly className?: string;
}

const EASE = "0.42,0,0.58,1;0.42,0,0.58,1;0.42,0,0.58,1";

export const Spinner = ({ size = 20, className }: Props) => {
  const center = size / 2;
  return (
    <svg
      role="img"
      aria-label="Loading"
      width={size}
      height={size}
      className={cn("stroke-current text-subtle", className)}
    >
      <g>
        <circle
          cx={center}
          cy={center}
          r={(size - 6) / 2}
          fill="none"
          strokeLinecap="round"
          strokeWidth={Math.ceil(size / 12)}
        >
          <animate
            attributeName="stroke-dasharray"
            calcMode="spline"
            dur="1.5s"
            keySplines={EASE}
            keyTimes="0;0.475;0.95;1"
            repeatCount="indefinite"
            values="0 150;42 150;42 150;42 150"
          />
          <animate
            attributeName="stroke-dashoffset"
            calcMode="spline"
            dur="1.5s"
            keySplines={EASE}
            keyTimes="0;0.475;0.95;1"
            repeatCount="indefinite"
            values="0;-16;-59;-59"
          />
        </circle>
        <animateTransform
          attributeName="transform"
          dur="2s"
          repeatCount="indefinite"
          type="rotate"
          values={`0 ${center} ${center};360 ${center} ${center}`}
        />
      </g>
    </svg>
  );
};
