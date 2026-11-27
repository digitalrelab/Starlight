import { Slider as BaseSlider } from "@base-ui/react";
import { cn } from "cn";

type Props = Omit<BaseSlider.Root.Props<number>, "className"> & { readonly className?: string };

export const Slider = ({ className, ...props }: Props) => (
  <BaseSlider.Root {...props} className={cn("group/slider w-full", className)}>
    <BaseSlider.Control className="flex h-5 w-full cursor-interactive touch-none items-center">
      <BaseSlider.Track className="h-1 w-full rounded-full bg-neutral">
        <BaseSlider.Indicator className="rounded-full bg-selected-bold" />
        <BaseSlider.Thumb
          className={cn(
            "size-3.5 rounded-full bg-white shadow-lifted transition-[scale] duration-100 ease-out",
            "group-hover/slider:scale-115 has-focus-visible:focus-ring data-dragging:scale-115",
          )}
        />
      </BaseSlider.Track>
    </BaseSlider.Control>
  </BaseSlider.Root>
);
