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
    { value, defaultValue, min = 0, max = 100, step = 1, disabled = false, onValueChange, className },
    ref
  ) => {
    const currentValue = value?.[0] ?? defaultValue?.[0] ?? min;
    const pct = max > min ? ((currentValue - min) / (max - min)) * 100 : 0;

    return (
      <div className={cn("relative w-full flex items-center h-5", className)}>
        {/* Track background */}
        <div className="absolute w-full h-2 rounded-full bg-gray-200" />
        {/* Filled portion */}
        <div
          className="absolute h-2 rounded-full bg-blue-500"
          style={{ width: `${pct}%` }}
        />
        {/* Native range input — fully visible, styled via globals.css */}
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          disabled={disabled}
          onChange={(e) => onValueChange?.([Number(e.target.value)])}
          className="slider-range absolute w-full"
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
