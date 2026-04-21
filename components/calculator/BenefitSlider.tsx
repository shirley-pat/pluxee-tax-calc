"use client";

import { Slider } from "@/components/ui/slider";
import { formatINR } from "@/lib/formatters";

interface BenefitSliderProps {
  label: string;
  sublabel?: string;
  value: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  disabledReason?: string;
  color?: "blue" | "green" | "purple";
}

const colorMap = {
  blue: "text-blue-600",
  green: "text-emerald-600",
  purple: "text-violet-600",
};

export function BenefitSlider({
  label,
  sublabel,
  value,
  max,
  step = 100,
  onChange,
  disabled = false,
  disabledReason,
  color = "blue",
}: BenefitSliderProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div className={`space-y-2 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-900 leading-tight">{label}</p>
          {sublabel && (
            <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>
          )}
          {disabled && disabledReason && (
            <p className="text-xs text-amber-600 mt-0.5">{disabledReason}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className={`text-sm font-semibold ${colorMap[color]}`}>
            {formatINR(value)}
          </span>
          <span className="text-xs text-gray-400 ml-1">/ yr</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Slider
          value={[value]}
          max={max}
          step={step}
          disabled={disabled}
          onValueChange={([v]) => onChange(v)}
          className="flex-1"
        />
        <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
      </div>
    </div>
  );
}
