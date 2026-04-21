"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BenefitSlider } from "./BenefitSlider";
import { ResultCard } from "./ResultCard";
import { TaxBreakdown } from "./TaxBreakdown";
import { IncomeOverview, SalaryState, DeductionState } from "./IncomeOverview";
import { formatINR } from "@/lib/formatters";
import { calculateTax, AgeGroup, Regime, PluxeeBenefits } from "@/lib/taxEngine";

type Tab = "pluxee" | "income";

export function TaxCalculator() {
  const [activeTab, setActiveTab] = useState<Tab>("pluxee");

  // --- Salary state (shared: used in both tabs) ---
  const [salary, setSalaryState] = useState<SalaryState>({
    basic: 600000,
    hra: 240000,
    specialAllowance: 280000,
    lta: 0,
    variablePay: 0,
  });

  const [deductions, setDeductionState] = useState<DeductionState>({
    tds: 0,
    employeePF: 0,
    employerPF: 0,
  });

  const grossSalary = salary.basic + salary.hra + salary.specialAllowance + salary.lta + salary.variablePay;

  const setSalary = (key: keyof SalaryState, value: number) =>
    setSalaryState((prev) => ({ ...prev, [key]: value }));

  const setDeduction = (key: keyof DeductionState, value: number) =>
    setDeductionState((prev) => ({ ...prev, [key]: value }));

  // --- Tax profile ---
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("under60");
  const [regime, setRegime] = useState<Regime>("new");

  // --- Benefits ---
  const [benefits, setBenefits] = useState<PluxeeBenefits>({
    mealVouchers: 120000,
    driverSalary: 0,
    telecom: 60000,
    fuel: 0,
    booksAndPeriodicals: 0,
    healthWellness: 0,
  });

  const setBenefit = (key: keyof PluxeeBenefits, value: number) =>
    setBenefits((prev) => ({ ...prev, [key]: value }));

  // Pluxee total (for Income Overview deductions panel)
  const pluxeeTotal =
    Math.min(benefits.mealVouchers, 120000) +
    Math.min(benefits.driverSalary, 300000) +
    Math.min(benefits.telecom, 60000) +
    Math.min(benefits.fuel, 180000) +
    Math.min(benefits.healthWellness, 60000) +
    (regime === "old" ? Math.min(benefits.booksAndPeriodicals, 60000) : 0);

  // --- Tax calculation ---
  const result = useMemo(
    () => calculateTax({ grossSalary, ageGroup, regime, benefits }),
    [grossSalary, ageGroup, regime, benefits]
  );

  const regimeComparison = useMemo(() => {
    const empty: PluxeeBenefits = {
      mealVouchers: 0, driverSalary: 0, telecom: 0,
      fuel: 0, booksAndPeriodicals: 0, healthWellness: 0,
    };
    return {
      oldTax: calculateTax({ grossSalary, ageGroup, regime: "old", benefits: empty }).withoutBenefits.totalTax,
      newTax: calculateTax({ grossSalary, ageGroup, regime: "new", benefits: empty }).withoutBenefits.totalTax,
    };
  }, [grossSalary, ageGroup]);

  const recommendedRegime: Regime = regimeComparison.oldTax <= regimeComparison.newTax ? "old" : "new";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Pluxee Tax Calculator
          </h1>
          <p className="text-gray-500 text-sm">
            India FY 2024–25 · Optimise your take-home with Pluxee benefits
          </p>
        </div>

        {/* Global Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm w-fit mx-auto">
          {([
            { key: "pluxee", label: "Pluxee Benefits" },
            { key: "income", label: "Income Overview" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── TAB 1: PLUXEE BENEFITS ── */}
        {activeTab === "pluxee" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left panel */}
            <div className="lg:col-span-1 space-y-5">
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tax Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">

                  {/* Gross salary — read-only, driven from Income Overview */}
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-0.5">Annual Gross Salary</p>
                    <p className="text-xl font-bold text-gray-900">{formatINR(grossSalary)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Edit components in{" "}
                      <button
                        onClick={() => setActiveTab("income")}
                        className="text-blue-500 underline"
                      >
                        Income Overview
                      </button>
                    </p>
                  </div>

                  {/* Age Group */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Age Group</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([
                        { key: "under60", label: "Under 60" },
                        { key: "60to79",  label: "60–79" },
                        { key: "80plus",  label: "80+" },
                      ] as const).map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setAgeGroup(key)}
                          className={`py-2 rounded-lg text-xs font-medium transition-all border ${
                            ageGroup === key
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Regime */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Tax Regime</label>
                      {recommendedRegime === regime ? (
                        <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0 font-medium">Optimal</Badge>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium">
                          {recommendedRegime === "new" ? "New" : "Old"} saves more
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {([
                        { key: "new", label: "New Regime" },
                        { key: "old", label: "Old Regime" },
                      ] as const).map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setRegime(key)}
                          className={`py-2 rounded-lg text-xs font-medium transition-all border ${
                            regime === key
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          {label}
                          {recommendedRegime === key && <span className="ml-1 opacity-75">★</span>}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs space-y-1">
                      <p className="font-medium text-blue-800">Without benefits</p>
                      <div className="flex justify-between text-blue-700">
                        <span>Old Regime:</span>
                        <span className="font-medium">{formatINR(regimeComparison.oldTax)}</span>
                      </div>
                      <div className="flex justify-between text-blue-700">
                        <span>New Regime:</span>
                        <span className="font-medium">{formatINR(regimeComparison.newTax)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right panel */}
            <div className="lg:col-span-2 space-y-5">

              {result.annualSaving > 0 ? (
                <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-sm font-medium opacity-90">Annual Tax Saving with Pluxee</p>
                      <p className="text-4xl font-bold mt-0.5">{formatINR(result.annualSaving)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-75">Monthly saving</p>
                      <p className="text-2xl font-bold">{formatINR(result.monthlySaving)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-gray-100 border border-gray-200 p-4 text-sm text-gray-600 text-center">
                  Adjust the benefit sliders below to see your potential tax savings.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ResultCard label="Without Pluxee Benefits" result={result.withoutBenefits} />
                <ResultCard label="With Pluxee Benefits" result={result.withBenefits} highlight />
              </div>

              {/* Benefit sliders */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Pluxee Benefits</CardTitle>
                    <span className="text-xs text-gray-400">Drag to adjust</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">

                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                    Allowed under Old &amp; New Regime
                  </p>

                  <BenefitSlider
                    label="Meal Vouchers"
                    sublabel="Up to ₹10,000/mo"
                    value={benefits.mealVouchers}
                    max={120000}
                    step={500}
                    onChange={(v) => setBenefit("mealVouchers", v)}
                    color="green"
                  />
                  <Separator />
                  <BenefitSlider
                    label="Fuel Reimbursement"
                    sublabel="Up to ₹15,000/mo"
                    value={benefits.fuel}
                    max={180000}
                    step={1000}
                    onChange={(v) => setBenefit("fuel", v)}
                    color="blue"
                  />
                  <Separator />
                  <BenefitSlider
                    label="Telecommunication &amp; Data"
                    sublabel="Up to ₹5,000/mo"
                    value={benefits.telecom}
                    max={60000}
                    step={500}
                    onChange={(v) => setBenefit("telecom", v)}
                    color="blue"
                  />
                  <Separator />
                  <BenefitSlider
                    label="Health &amp; Wellness"
                    sublabel="Up to ₹5,000/mo"
                    value={benefits.healthWellness}
                    max={60000}
                    step={500}
                    onChange={(v) => setBenefit("healthWellness", v)}
                    color="blue"
                  />
                  <Separator />
                  <BenefitSlider
                    label="Driver Salary"
                    sublabel="Up to ₹25,000/mo — Directors & above only"
                    value={benefits.driverSalary}
                    max={300000}
                    step={1000}
                    onChange={(v) => setBenefit("driverSalary", v)}
                    color="blue"
                  />

                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide pt-2">
                    Allowed under Old Regime only
                  </p>

                  <BenefitSlider
                    label="Books &amp; Periodicals"
                    sublabel="Up to ₹5,000/mo"
                    value={benefits.booksAndPeriodicals}
                    max={60000}
                    step={500}
                    onChange={(v) => setBenefit("booksAndPeriodicals", v)}
                    disabled={regime === "new"}
                    disabledReason="Not exempt under New Regime"
                    color="green"
                  />
                </CardContent>
              </Card>

              {/* Tax Breakdown */}
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tax Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <TaxBreakdown
                    breakdown={result.benefitBreakdown}
                    withoutResult={result.withoutBenefits}
                    withResult={result.withBenefits}
                    regime={regime}
                  />
                </CardContent>
              </Card>

              <p className="text-xs text-gray-400 text-center pb-4">
                Estimates only. Consult a tax professional for personalised advice. FY 2024–25 slabs.
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 2: INCOME OVERVIEW ── */}
        {activeTab === "income" && (
          <IncomeOverview
            salary={salary}
            setSalary={setSalary}
            deductions={deductions}
            setDeduction={setDeduction}
            pluxeeTotal={pluxeeTotal}
          />
        )}

      </div>
    </div>
  );
}
