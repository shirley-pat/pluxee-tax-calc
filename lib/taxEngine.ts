// India FY 2024-25 tax engine

export type AgeGroup = "under60" | "60to79" | "80plus";
export type Regime = "old" | "new";

export interface PluxeeBenefits {
  mealVouchers: number;         // max 120000/yr — both regimes
  transportAllowance: number;   // max 19200/yr  — old regime only
  telecom: number;              // max 60000/yr  — both regimes
  fuel: number;                 // max 180000/yr — both regimes
  booksAndPeriodicals: number;  // max 60000/yr  — old regime only
  healthWellness: number;       // max 60000/yr  — both regimes
}

export interface TaxInput {
  grossSalary: number;
  ageGroup: AgeGroup;
  regime: Regime;
  benefits: PluxeeBenefits;
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
  telecom: number;
  fuel: number;
  booksAndPeriodicals: number;
  healthWellness: number;
  totalDeductions: number;
  taxableIncome: number;
}

function oldRegimeSlabs(income: number, ageGroup: AgeGroup): number {
  const nilSlab = ageGroup === "80plus" ? 500000 : ageGroup === "60to79" ? 300000 : 250000;

  if (income <= nilSlab) return 0;

  if (ageGroup === "80plus") {
    const slab20 = Math.min(Math.max(income - 500000, 0), 500000);
    const slab30 = Math.max(income - 1000000, 0);
    return slab20 * 0.20 + slab30 * 0.30;
  } else if (ageGroup === "60to79") {
    const slab5  = Math.min(Math.max(income - 300000, 0), 200000);
    const slab20 = Math.min(Math.max(income - 500000, 0), 500000);
    const slab30 = Math.max(income - 1000000, 0);
    return slab5 * 0.05 + slab20 * 0.20 + slab30 * 0.30;
  } else {
    const slab5  = Math.min(Math.max(income - 250000, 0), 250000);
    const slab20 = Math.min(Math.max(income - 500000, 0), 500000);
    const slab30 = Math.max(income - 1000000, 0);
    return slab5 * 0.05 + slab20 * 0.20 + slab30 * 0.30;
  }
}

function newRegimeSlabs(income: number): number {
  const slab5  = Math.min(Math.max(income - 300000,  0), 400000);
  const slab10 = Math.min(Math.max(income - 700000,  0), 300000);
  const slab15 = Math.min(Math.max(income - 1000000, 0), 200000);
  const slab20 = Math.min(Math.max(income - 1200000, 0), 300000);
  const slab30 = Math.max(income - 1500000, 0);
  return slab5 * 0.05 + slab10 * 0.10 + slab15 * 0.15 + slab20 * 0.20 + slab30 * 0.30;
}

function getSurcharge(income: number, tax: number): number {
  if (income <= 5000000)  return 0;
  if (income <= 10000000) return tax * 0.10;
  if (income <= 20000000) return tax * 0.15;
  if (income <= 50000000) return tax * 0.25;
  return tax * 0.37;
}

function computeTax(
  taxableIncome: number,
  ageGroup: AgeGroup,
  regime: Regime,
  grossForSurcharge: number
): TaxResult {
  if (taxableIncome <= 0) {
    return {
      taxableIncome: 0, taxBeforeCess: 0, surcharge: 0,
      cess: 0, totalTax: 0, effectiveRate: 0,
      takeHome: grossForSurcharge, rebateApplied: false,
    };
  }

  let taxBeforeCess = regime === "old"
    ? oldRegimeSlabs(taxableIncome, ageGroup)
    : newRegimeSlabs(taxableIncome);

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

  return { taxableIncome, taxBeforeCess, surcharge, cess, totalTax, effectiveRate, takeHome, rebateApplied };
}

export function calculateTax(input: TaxInput): CalculationOutput {
  const { grossSalary, ageGroup, regime, benefits } = input;

  const stdDeduction = regime === "new" ? 75000 : 50000;

  // Without benefits
  const taxableWithout = Math.max(grossSalary - stdDeduction, 0);
  const withoutBenefits = computeTax(taxableWithout, ageGroup, regime, grossSalary);

  // Benefits allowed in both regimes
  const bothRegimes =
    Math.min(benefits.mealVouchers, 120000) +
    Math.min(benefits.telecom, 60000) +
    Math.min(benefits.fuel, 180000) +
    Math.min(benefits.healthWellness, 60000);

  // Benefits allowed in old regime only
  const oldOnly =
    Math.min(benefits.transportAllowance, 19200) +
    Math.min(benefits.booksAndPeriodicals, 60000);

  const pluxeeDeduction = regime === "old"
    ? bothRegimes + oldOnly
    : bothRegimes;

  const taxableWith = Math.max(grossSalary - stdDeduction - pluxeeDeduction, 0);
  const withBenefits = computeTax(taxableWith, ageGroup, regime, grossSalary);

  const annualSaving = Math.max(withoutBenefits.totalTax - withBenefits.totalTax, 0);

  const benefitBreakdown: BenefitBreakdown = {
    grossSalary,
    standardDeduction: stdDeduction,
    mealVouchers:        Math.min(benefits.mealVouchers, 120000),
    transportAllowance:  regime === "old" ? Math.min(benefits.transportAllowance, 19200) : 0,
    telecom:             Math.min(benefits.telecom, 60000),
    fuel:                Math.min(benefits.fuel, 180000),
    booksAndPeriodicals: regime === "old" ? Math.min(benefits.booksAndPeriodicals, 60000) : 0,
    healthWellness:      Math.min(benefits.healthWellness, 60000),
    totalDeductions:     grossSalary - taxableWith,
    taxableIncome:       taxableWith,
  };

  return { withoutBenefits, withBenefits, annualSaving, monthlySaving: annualSaving / 12, benefitBreakdown };
}
