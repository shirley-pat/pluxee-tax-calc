"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onValueChange?: (value: number[]) => void;
  className?: string;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value,
      defaultValue,
      min = 0,
      max = 100,
      step = 1,
      disabled = false,
      onValueChange,
      className,
    },
    ref
  ) => {
    const currentValue = value?.[0] ?? defaultValue?.[0] ?? min;
    const pct = max > min ? ((currentValue - min) / (max - min)) * 100 : 0;

    return (
      <div className={cn("relative flex w-full touch-none items-center", className)}>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="absolute h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          disabled={disabled}
          onChange={(e) => onValueChange?.([Number(e.target.value)])}
          className="absolute inset-0 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          style={{ height: "100%" }}
        />
        <div
          className="absolute h-4 w-4 rounded-full border-2 border-primary bg-background shadow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
