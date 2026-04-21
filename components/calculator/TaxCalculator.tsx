"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BenefitSlider } from "./BenefitSlider";
import { ResultCard } from "./ResultCard";
import { TaxBreakdown } from "./TaxBreakdown";
import { formatINR, parseINR } from "@/lib/formatters";
import {
  calculateTax,
  AgeGroup,
  Regime,
  PluxeeBenefits,
  OldRegimeDeductions,
} from "@/lib/taxEngine";

const BASIC_RATIO = 0.5; // assume basic = 50% of gross for NPS cap calc

export function TaxCalculator() {
  const [grossSalary, setGrossSalary] = useState(1200000);
  const [salaryInput, setSalaryInput] = useState("12,00,000");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("under60");
  const [regime, setRegime] = useState<Regime>("new");

  const [benefits, setBenefits] = useState<PluxeeBenefits>({
    mealVouchers: 26400,
    transportAllowance: 19200,
    lta: 0,
    phoneInternet: 12000,
    npsEmployer: 0,
  });

  const [oldDeductions, setOldDeductions] = useState<OldRegimeDeductions>({
    section80C: 150000,
    healthInsurance80D: 25000,
  });

  const npsMax = Math.round(grossSalary * BASIC_RATIO * 0.1);

  const result = useMemo(
    () =>
      calculateTax({
        grossSalary,
        ageGroup,
        regime,
        benefits: {
          ...benefits,
          npsEmployer: Math.min(benefits.npsEmployer, npsMax),
        },
        oldRegimeDeductions: oldDeductions,
      }),
    [grossSalary, ageGroup, regime, benefits, oldDeductions, npsMax]
  );

  // Old vs New comparison (ignoring Pluxee — pure regime comparison)
  const regimeComparison = useMemo(() => {
    const oldResult = calculateTax({
      grossSalary,
      ageGroup,
      regime: "old",
      benefits: { mealVouchers: 0, transportAllowance: 0, lta: 0, phoneInternet: 0, npsEmployer: 0 },
      oldRegimeDeductions: oldDeductions,
    });
    const newResult = calculateTax({
      grossSalary,
      ageGroup,
      regime: "new",
      benefits: { mealVouchers: 0, transportAllowance: 0, lta: 0, phoneInternet: 0, npsEmployer: 0 },
      oldRegimeDeductions: oldDeductions,
    });
    return { oldResult, newResult };
  }, [grossSalary, ageGroup, oldDeductions]);

  const recommendedRegime: Regime =
    regimeComparison.oldResult.withoutBenefits.totalTax <=
    regimeComparison.newResult.withoutBenefits.totalTax
      ? "old"
      : "new";

  const handleSalaryBlur = useCallback(() => {
    const val = parseINR(salaryInput);
    const clamped = Math.max(0, Math.min(val, 100000000));
    setGrossSalary(clamped);
    // Format with Indian grouping
    setSalaryInput(
      clamped === 0 ? "" : clamped.toLocaleString("en-IN")
    );
  }, [salaryInput]);

  const setBenefit = (key: keyof PluxeeBenefits, value: number) => {
    setBenefits((prev) => ({ ...prev, [key]: value }));
  };

  const setOldDeduction = (key: keyof OldRegimeDeductions, value: number) => {
    setOldDeductions((prev) => ({ ...prev, [key]: value }));
  };

  const annualSaving = result.annualSaving;
  const monthlySaving = result.monthlySaving;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            India FY 2024–25
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Income Tax Calculator
          </h1>
          <p className="text-gray-500 text-sm max-w-xl mx-auto">
            Calculate your tax liability and discover how Pluxee employee benefits
            can reduce your taxable income under both regimes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT PANEL — Inputs */}
          <div className="lg:col-span-1 space-y-5">

            {/* Salary & Profile */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Salary */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Annual Gross Salary (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                    <input
                      type="text"
                      value={salaryInput}
                      onChange={(e) => setSalaryInput(e.target.value)}
                      onBlur={handleSalaryBlur}
                      onKeyDown={(e) => e.key === "Enter" && handleSalaryBlur()}
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="12,00,000"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    = {formatINR(grossSalary, true)}
                  </p>
                </div>

                {/* Age Group */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Age Group
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { key: "under60", label: "Under 60" },
                        { key: "60to79", label: "60–79" },
                        { key: "80plus", label: "80+" },
                      ] as const
                    ).map(({ key, label }) => (
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
                    {recommendedRegime !== regime && (
                      <span className="text-xs text-amber-600 font-medium">
                        {recommendedRegime === "new" ? "New" : "Old"} may save more
                      </span>
                    )}
                    {recommendedRegime === regime && (
                      <Badge className="text-xs bg-emerald-100 text-emerald-700 border-0 font-medium">
                        Optimal
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { key: "new", label: "New Regime" },
                        { key: "old", label: "Old Regime" },
                      ] as const
                    ).map(({ key, label }) => (
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
                        {recommendedRegime === key && (
                          <span className="ml-1 opacity-75">★</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Regime comparison chip */}
                  <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs space-y-1">
                    <p className="font-medium text-blue-800">Regime Comparison (no Pluxee)</p>
                    <div className="flex justify-between text-blue-700">
                      <span>Old Regime tax:</span>
                      <span className="font-medium">
                        {formatINR(regimeComparison.oldResult.withoutBenefits.totalTax)}
                      </span>
                    </div>
                    <div className="flex justify-between text-blue-700">
                      <span>New Regime tax:</span>
                      <span className="font-medium">
                        {formatINR(regimeComparison.newResult.withoutBenefits.totalTax)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Old Regime Deductions */}
            {regime === "old" && (
              <Card className="shadow-sm border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Old Regime Deductions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <BenefitSlider
                    label="Section 80C"
                    sublabel="PF, ELSS, LIC, etc."
                    value={oldDeductions.section80C}
                    max={150000}
                    step={1000}
                    onChange={(v) => setOldDeduction("section80C", v)}
                    color="purple"
                  />
                  <BenefitSlider
                    label="Health Insurance (80D)"
                    sublabel={ageGroup !== "under60" ? "Up to ₹50,000 for seniors" : "Up to ₹25,000"}
                    value={oldDeductions.healthInsurance80D}
                    max={ageGroup !== "under60" ? 50000 : 25000}
                    step={500}
                    onChange={(v) => setOldDeduction("healthInsurance80D", v)}
                    color="purple"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT PANEL — Results + Breakdown */}
          <div className="lg:col-span-2 space-y-5">

            {/* Saving banner */}
            {annualSaving > 0 && (
              <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-5 text-white shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-medium opacity-90">Annual Tax Saving with Pluxee</p>
                    <p className="text-4xl font-bold mt-0.5">{formatINR(annualSaving)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-75">Monthly saving</p>
                    <p className="text-2xl font-bold">{formatINR(monthlySaving)}</p>
                  </div>
                </div>
              </div>
            )}

            {annualSaving === 0 && (
              <div className="rounded-2xl bg-gray-100 border border-gray-200 p-4 text-sm text-gray-600 text-center">
                Adjust Pluxee benefit sliders below to see your potential tax savings.
              </div>
            )}

            {/* Results side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ResultCard
                label="Without Pluxee Benefits"
                result={result.withoutBenefits}
              />
              <ResultCard
                label="With Pluxee Benefits"
                result={result.withBenefits}
                highlight
              />
            </div>

            {/* Pluxee Benefits Sliders */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Pluxee Benefits</CardTitle>
                  <span className="text-xs text-gray-400">Drag to adjust</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <BenefitSlider
                  label="Meal Vouchers"
                  sublabel="Tax-exempt up to ₹2,200/mo"
                  value={benefits.mealVouchers}
                  max={26400}
                  step={200}
                  onChange={(v) => setBenefit("mealVouchers", v)}
                  disabled={regime === "new"}
                  disabledReason="Not exempt under New Regime"
                  color="green"
                />
                <Separator />
                <BenefitSlider
                  label="Transport Allowance"
                  sublabel="Exempt up to ₹1,600/mo"
                  value={benefits.transportAllowance}
                  max={19200}
                  step={200}
                  onChange={(v) => setBenefit("transportAllowance", v)}
                  disabled={regime === "new"}
                  disabledReason="Not exempt under New Regime"
                  color="green"
                />
                <Separator />
                <BenefitSlider
                  label="Leave Travel Allowance (LTA)"
                  sublabel="Claimed twice in 4-year block"
                  value={benefits.lta}
                  max={Math.round(grossSalary * 0.08)}
                  step={1000}
                  onChange={(v) => setBenefit("lta", v)}
                  disabled={regime === "new"}
                  disabledReason="Not exempt under New Regime"
                  color="green"
                />
                <Separator />
                <BenefitSlider
                  label="Phone & Internet Reimbursement"
                  sublabel="Up to ₹12,000/yr — allowed both regimes"
                  value={benefits.phoneInternet}
                  max={12000}
                  step={500}
                  onChange={(v) => setBenefit("phoneInternet", v)}
                  color="blue"
                />
                <Separator />
                <BenefitSlider
                  label="NPS Employer Contribution"
                  sublabel={`Section 80CCD(2) — up to ${formatINR(npsMax)}/yr (10% of basic)`}
                  value={Math.min(benefits.npsEmployer, npsMax)}
                  max={npsMax}
                  step={1000}
                  onChange={(v) => setBenefit("npsEmployer", v)}
                  color="blue"
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

            {/* Footer note */}
            <p className="text-xs text-gray-400 text-center pb-4">
              Estimates only. Consult a tax professional for personalised advice. FY 2024–25 slabs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
