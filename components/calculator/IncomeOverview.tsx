"use client";

import { PayslipUploader } from "./PayslipUploader";
import { ParsedPayslip } from "@/lib/pdfParser";
import { formatINR } from "@/lib/formatters";

export interface SalaryState {
  basic: number;
  hra: number;
  specialAllowance: number;
  lta: number;
  variablePay: number;
}

export interface DeductionState {
  tds: number;
  employeePF: number;
  employerPF: number;
}

interface Props {
  salary: SalaryState;
  setSalary: (key: keyof SalaryState, value: number) => void;
  deductions: DeductionState;
  setDeduction: (key: keyof DeductionState, value: number) => void;
  pluxeeTotal: number;
}

function NumberInput({
  label,
  value,
  onChange,
  readOnly = false,
  highlight = false,
}: {
  label: string;
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2.5 border-b border-gray-100 last:border-0 ${highlight ? "pt-3" : ""}`}>
      <label className={`text-sm shrink-0 ${highlight ? "font-semibold text-gray-900" : "text-gray-600"}`}>
        {label}
      </label>
      {readOnly ? (
        <span className={`text-sm font-bold ${highlight ? "text-emerald-700 text-base" : "text-gray-900"}`}>
          {formatINR(value)}
        </span>
      ) : (
        <div className="relative w-36">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
          <input
            type="number"
            value={value || ""}
            onChange={(e) => onChange?.(Math.max(0, Number(e.target.value)))}
            placeholder="0"
            className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      )}
    </div>
  );
}

export function IncomeOverview({ salary, setSalary, deductions, setDeduction, pluxeeTotal }: Props) {
  const gross = salary.basic + salary.hra + salary.specialAllowance + salary.lta + salary.variablePay;
  const totalDeductions = deductions.tds + deductions.employeePF + deductions.employerPF;
  const netPay = gross - totalDeductions;

  function handleParsed(data: ParsedPayslip) {
    if (data.basic)           setSalary("basic", data.basic);
    if (data.hra)             setSalary("hra", data.hra);
    if (data.specialAllowance) setSalary("specialAllowance", data.specialAllowance);
    if (data.lta)             setSalary("lta", data.lta);
    if (data.variablePay)     setSalary("variablePay", data.variablePay);
    if (data.tds)             setDeduction("tds", data.tds);
    if (data.employeePF)      setDeduction("employeePF", data.employeePF);
    if (data.employerPF)      setDeduction("employerPF", data.employerPF);
  }

  return (
    <div className="space-y-5">
      {/* PDF uploader */}
      <PayslipUploader onParsed={handleParsed} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Container 1 — Income */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Income Breakdown</h3>
            <p className="text-xs text-gray-500 mt-0.5">Annual figures in INR</p>
          </div>
          <div className="px-5 py-1">
            <NumberInput label="Basic Salary"        value={salary.basic}           onChange={(v) => setSalary("basic", v)} />
            <NumberInput label="HRA"                 value={salary.hra}             onChange={(v) => setSalary("hra", v)} />
            <NumberInput label="Special Allowance"   value={salary.specialAllowance} onChange={(v) => setSalary("specialAllowance", v)} />
            <NumberInput label="Leave & Travel Allowance" value={salary.lta}        onChange={(v) => setSalary("lta", v)} />
            <NumberInput label="Variable Pay"        value={salary.variablePay}     onChange={(v) => setSalary("variablePay", v)} />
          </div>
          <div className="px-5 py-3.5 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-800">Gross Pay</span>
            <span className="text-lg font-bold text-emerald-700">{formatINR(gross)}</span>
          </div>
        </div>

        {/* Container 2 — Deductions */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Deductions</h3>
            <p className="text-xs text-gray-500 mt-0.5">Annual figures in INR</p>
          </div>
          <div className="px-5 py-1">
            <NumberInput label="Tax Deducted at Source (TDS)" value={deductions.tds}        onChange={(v) => setDeduction("tds", v)} />
            <NumberInput label="Employee PF Contribution"     value={deductions.employeePF}  onChange={(v) => setDeduction("employeePF", v)} />
            <NumberInput label="Employer PF Contribution"     value={deductions.employerPF}  onChange={(v) => setDeduction("employerPF", v)} />

            {/* Pluxee total — read only, from tab 1 */}
            <div className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-600">Pluxee Benefits</p>
                <p className="text-xs text-gray-400">From benefits tab</p>
              </div>
              <span className="text-sm font-semibold text-blue-700">{formatINR(pluxeeTotal)}</span>
            </div>
          </div>

          {/* Net Pay */}
          <div className="px-5 py-3.5 bg-blue-50 border-t border-blue-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-blue-800">Net Pay (after TDS &amp; PF)</span>
              <span className="text-lg font-bold text-blue-700">{formatINR(netPay)}</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Gross {formatINR(gross)} − TDS {formatINR(deductions.tds)} − PF {formatINR(deductions.employeePF)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
