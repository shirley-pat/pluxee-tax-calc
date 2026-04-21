"use client";

import { BenefitBreakdown, TaxResult } from "@/lib/taxEngine";
import { formatINR, formatPercent } from "@/lib/formatters";

interface TaxBreakdownProps {
  breakdown: BenefitBreakdown;
  withoutResult: TaxResult;
  withResult: TaxResult;
  regime: "old" | "new";
}

interface RowProps {
  label: string;
  value: number;
  type: "deduction" | "neutral" | "result";
}

function Row({ label, value, type }: RowProps) {
  const color =
    type === "deduction" ? "text-emerald-600" :
    type === "result"    ? "text-gray-900 font-semibold" :
                           "text-gray-700";
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm ${color}`}>
        {type === "deduction" ? "− " : ""}{formatINR(value)}
      </span>
    </div>
  );
}

function RateBar({ label, rate, max, color }: { label: string; rate: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((rate / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span className="font-medium">{formatPercent(rate)}</span>
      </div>
      <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function TaxBreakdown({ breakdown, withoutResult, withResult, regime }: TaxBreakdownProps) {
  const maxRate = Math.max(withoutResult.effectiveRate, 0.1);

  return (
    <div className="space-y-6">

      {/* Deduction waterfall */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Deduction Breakdown</h3>
        <Row label="Gross Salary" value={breakdown.grossSalary} type="neutral" />
        <Row label="Standard Deduction" value={breakdown.standardDeduction} type="deduction" />
        {breakdown.mealVouchers > 0 && (
          <Row label="Meal Vouchers" value={breakdown.mealVouchers} type="deduction" />
        )}
        {breakdown.fuel > 0 && (
          <Row label="Fuel Reimbursement" value={breakdown.fuel} type="deduction" />
        )}
        {breakdown.telecom > 0 && (
          <Row label="Telecommunication & Data" value={breakdown.telecom} type="deduction" />
        )}
        {breakdown.healthWellness > 0 && (
          <Row label="Health & Wellness" value={breakdown.healthWellness} type="deduction" />
        )}
        {breakdown.driverSalary > 0 && (
          <Row label="Driver Salary" value={breakdown.driverSalary} type="deduction" />
        )}
        {breakdown.booksAndPeriodicals > 0 && (
          <Row label="Books & Periodicals" value={breakdown.booksAndPeriodicals} type="deduction" />
        )}
        <div className="mt-1">
          <Row label="Taxable Income" value={breakdown.taxableIncome} type="result" />
        </div>

        {regime === "new" && (
          <p className="text-xs text-amber-600 mt-3 p-2 bg-amber-50 rounded-lg">
            New Regime: Books &amp; periodicals are not exempt. All other Pluxee benefits apply.
          </p>
        )}
      </div>

      {/* Rate bars */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Effective Tax Rate Comparison</h3>
        <div className="space-y-3">
          <RateBar label="Without Pluxee Benefits" rate={withoutResult.effectiveRate} max={maxRate} color="bg-red-400" />
          <RateBar label="With Pluxee Benefits"    rate={withResult.effectiveRate}    max={maxRate} color="bg-emerald-400" />
        </div>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <span className="text-xs text-gray-500">Without benefits</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-xs text-gray-500">With Pluxee benefits</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-gray-500">Tax without</p>
          <p className="text-base font-bold text-red-500 mt-1">{formatINR(withoutResult.totalTax)}</p>
        </div>
        <div className="text-center border-x border-gray-200">
          <p className="text-xs text-gray-500">Tax with</p>
          <p className="text-base font-bold text-emerald-600 mt-1">{formatINR(withResult.totalTax)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">You save</p>
          <p className="text-base font-bold text-emerald-700 mt-1">
            {formatINR(Math.max(withoutResult.totalTax - withResult.totalTax, 0))}
          </p>
        </div>
      </div>
    </div>
  );
}
