"use client";

import { formatINR, formatPercent } from "@/lib/formatters";
import { TaxResult } from "@/lib/taxEngine";
import { Badge } from "@/components/ui/badge";

interface ResultCardProps {
  label: string;
  result: TaxResult;
  highlight?: boolean;
}

export function ResultCard({ label, result, highlight = false }: ResultCardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 space-y-4 transition-all ${
        highlight
          ? "border-emerald-300 bg-emerald-50 shadow-md"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {result.rebateApplied && (
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-0">
            87A Rebate Applied
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Tax Payable</p>
          <p className={`text-2xl font-bold mt-0.5 ${highlight ? "text-emerald-700" : "text-gray-900"}`}>
            {formatINR(result.totalTax)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Effective rate: {formatPercent(result.effectiveRate)}
          </p>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500">Taxable Income</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">
              {formatINR(result.taxableIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Monthly Take-Home</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">
              {formatINR(result.takeHome / 12)}
            </p>
          </div>
          {result.surcharge > 0 && (
            <div>
              <p className="text-xs text-gray-500">Surcharge</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">
                {formatINR(result.surcharge)}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500">Cess (4%)</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">
              {formatINR(result.cess)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
