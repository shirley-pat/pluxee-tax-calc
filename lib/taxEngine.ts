// India FY 2024-25 tax engine

export type AgeGroup = "under60" | "60to79" | "80plus";
export type Regime = "old" | "new";

export interface PluxeeBenefits {
  mealVouchers: number;       // max 26400
  transportAllowance: number; // max 19200
  lta: number;                // user-defined, LTA claimed
  phoneInternet: number;      // max 12000
  npsEmployer: number;        // max 10% of basic (calculated externally)
}

export interface OldRegimeDeductions {
  section80C: number;         // max 150000
  healthInsurance80D: number; // max 25000 (50000 senior)
}

export interface TaxInput {
  grossSalary: number;
  ageGroup: AgeGroup;
  regime: Regime;
  benefits: PluxeeBenefits;
  oldRegimeDeductions: OldRegimeDeductions;
}

export interface TaxResult {
  taxableIncome: number;
  taxBeforeCess: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
  takeHome: number;
  rebateApplied: boolean;
}

export interface CalculationOutput {
  withoutBenefits: TaxResult;
  withBenefits: TaxResult;
  annualSaving: number;
  monthlySaving: number;
  benefitBreakdown: BenefitBreakdown;
}

export interface BenefitBreakdown {
  grossSalary: number;
  standardDeduction: number;
  mealVouchers: number;
  transportAllowance: number;
  lta: number;
  phoneInternet: number;
  npsEmployer: number;
  section80C: number;
  healthInsurance80D: number;
  totalDeductions: number;
  taxableIncome: number;
}

function oldRegimeSlabs(income: number, ageGroup: AgeGroup): number {
  const nilSlab = ageGroup === "80plus" ? 500000 : ageGroup === "60to79" ? 300000 : 250000;
  let tax = 0;

  if (income <= nilSlab) return 0;

  if (ageGroup === "80plus") {
    // Above 5L: 20% up to 10L, 30% above
    const slab20 = Math.min(Math.max(income - 500000, 0), 500000);
    const slab30 = Math.max(income - 1000000, 0);
    tax = slab20 * 0.20 + slab30 * 0.30;
  } else if (ageGroup === "60to79") {
    // Nil: 0–3L, 5%: 3L–5L, 20%: 5L–10L, 30%: above 10L
    const slab5 = Math.min(Math.max(income - 300000, 0), 200000);
    const slab20 = Math.min(Math.max(income - 500000, 0), 500000);
    const slab30 = Math.max(income - 1000000, 0);
    tax = slab5 * 0.05 + slab20 * 0.20 + slab30 * 0.30;
  } else {
    // Under 60: Nil: 0–2.5L, 5%: 2.5L–5L, 20%: 5L–10L, 30%: above 10L
    const slab5 = Math.min(Math.max(income - 250000, 0), 250000);
    const slab20 = Math.min(Math.max(income - 500000, 0), 500000);
    const slab30 = Math.max(income - 1000000, 0);
    tax = slab5 * 0.05 + slab20 * 0.20 + slab30 * 0.30;
  }

  return tax;
}

function newRegimeSlabs(income: number): number {
  // Nil: 0–3L, 5%: 3L–7L, 10%: 7L–10L, 15%: 10L–12L, 20%: 12L–15L, 30%: above 15L
  const slab5 = Math.min(Math.max(income - 300000, 0), 400000);
  const slab10 = Math.min(Math.max(income - 700000, 0), 300000);
  const slab15 = Math.min(Math.max(income - 1000000, 0), 200000);
  const slab20 = Math.min(Math.max(income - 1200000, 0), 300000);
  const slab30 = Math.max(income - 1500000, 0);

  return slab5 * 0.05 + slab10 * 0.10 + slab15 * 0.15 + slab20 * 0.20 + slab30 * 0.30;
}

function getSurcharge(income: number, tax: number): number {
  if (income <= 5000000) return 0;
  if (income <= 10000000) return tax * 0.10;
  if (income <= 20000000) return tax * 0.15;
  if (income <= 50000000) return tax * 0.25;
  return tax * 0.37;
}

function computeTax(taxableIncome: number, ageGroup: AgeGroup, regime: Regime, grossForSurcharge: number): TaxResult {
  if (taxableIncome <= 0) {
    return { taxableIncome: 0, taxBeforeCess: 0, surcharge: 0, cess: 0, totalTax: 0, effectiveRate: 0, takeHome: 0, rebateApplied: false };
  }

  let taxBeforeCess = regime === "old"
    ? oldRegimeSlabs(taxableIncome, ageGroup)
    : newRegimeSlabs(taxableIncome);

  // Rebate u/s 87A — new regime: full rebate if taxable income ≤ 7L
  // Old regime: full rebate if taxable income ≤ 5L
  let rebateApplied = false;
  if (regime === "new" && taxableIncome <= 700000) {
    taxBeforeCess = 0;
    rebateApplied = true;
  } else if (regime === "old" && taxableIncome <= 500000) {
    taxBeforeCess = 0;
    rebateApplied = true;
  }

  const surcharge = getSurcharge(grossForSurcharge, taxBeforeCess);
  const cess = (taxBeforeCess + surcharge) * 0.04;
  const totalTax = taxBeforeCess + surcharge + cess;
  const effectiveRate = grossForSurcharge > 0 ? (totalTax / grossForSurcharge) * 100 : 0;
  const takeHome = grossForSurcharge - totalTax;

  return {
    taxableIncome,
    taxBeforeCess,
    surcharge,
    cess,
    totalTax,
    effectiveRate,
    takeHome,
    rebateApplied,
  };
}

export function calculateTax(input: TaxInput): CalculationOutput {
  const { grossSalary, ageGroup, regime, benefits, oldRegimeDeductions } = input;

  const stdDeduction = regime === "new" ? 75000 : 50000;
  const maxHealthInsurance = ageGroup !== "under60" ? 50000 : 25000;

  // --- Without benefits ---
  let taxableWithout: number;
  if (regime === "old") {
    const deductions =
      stdDeduction +
      Math.min(oldRegimeDeductions.section80C, 150000) +
      Math.min(oldRegimeDeductions.healthInsurance80D, maxHealthInsurance);
    taxableWithout = Math.max(grossSalary - deductions, 0);
  } else {
    taxableWithout = Math.max(grossSalary - stdDeduction, 0);
  }

  const withoutBenefits = computeTax(taxableWithout, ageGroup, regime, grossSalary);

  // --- With benefits ---
  const pluxeeTotal =
    Math.min(benefits.mealVouchers, 26400) +
    Math.min(benefits.transportAllowance, 19200) +
    benefits.lta +
    Math.min(benefits.phoneInternet, 12000) +
    benefits.npsEmployer;

  let taxableWith: number;
  if (regime === "old") {
    const deductions =
      stdDeduction +
      pluxeeTotal +
      Math.min(oldRegimeDeductions.section80C, 150000) +
      Math.min(oldRegimeDeductions.healthInsurance80D, maxHealthInsurance);
    taxableWith = Math.max(grossSalary - deductions, 0);
  } else {
    // In new regime: NPS employer (80CCD2) is still allowed; LTA and transport are not
    // Meal vouchers are taxable in new regime; phone reimbursement is exempt both regimes
    const newRegimeBenefits =
      benefits.npsEmployer +
      Math.min(benefits.phoneInternet, 12000);
    taxableWith = Math.max(grossSalary - stdDeduction - newRegimeBenefits, 0);
  }

  const withBenefits = computeTax(taxableWith, ageGroup, regime, grossSalary);

  const annualSaving = Math.max(withoutBenefits.totalTax - withBenefits.totalTax, 0);

  const benefitBreakdown: BenefitBreakdown = {
    grossSalary,
    standardDeduction: stdDeduction,
    mealVouchers: regime === "old" ? Math.min(benefits.mealVouchers, 26400) : 0,
    transportAllowance: regime === "old" ? Math.min(benefits.transportAllowance, 19200) : 0,
    lta: regime === "old" ? benefits.lta : 0,
    phoneInternet: Math.min(benefits.phoneInternet, 12000),
    npsEmployer: benefits.npsEmployer,
    section80C: regime === "old" ? Math.min(oldRegimeDeductions.section80C, 150000) : 0,
    healthInsurance80D: regime === "old" ? Math.min(oldRegimeDeductions.healthInsurance80D, maxHealthInsurance) : 0,
    totalDeductions: grossSalary - taxableWith,
    taxableIncome: taxableWith,
  };

  return {
    withoutBenefits,
    withBenefits,
    annualSaving,
    monthlySaving: annualSaving / 12,
    benefitBreakdown,
  };
}
