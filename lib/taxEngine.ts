// India FY 2024-25 tax engine

export type AgeGroup = "under60" | "60to79" | "80plus";
export type Regime = "old" | "new";

export interface PluxeeBenefits {
  mealVouchers: number;         // max 26400/yr  — old regime only
  transportAllowance: number;   // max 19200/yr  — old regime only
  lta: number;                  // user-defined  — old regime only
  telecom: number;              // max 60000/yr  — both regimes
  fuel: number;                 // max 180000/yr — both regimes
  booksAndPeriodicals: number;  // max 60000/yr  — old regime only
  healthWellness: number;       // max 60000/yr  — both regimes
  npsEmployer: number;          // max 10% of basic — both regimes (80CCD2)
}

export interface OldRegimeDeductions {
  section80C: number;           // max 150000
  healthInsurance80D: number;   // max 25000 (50000 for seniors)
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
  telecom: number;
  fuel: number;
  booksAndPeriodicals: number;
  healthWellness: number;
  npsEmployer: number;
  section80C: number;
  healthInsurance80D: number;
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
      cess: 0, totalTax: 0, effectiveRate: 0, takeHome: grossForSurcharge, rebateApplied: false,
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
  const { grossSalary, ageGroup, regime, benefits, oldRegimeDeductions } = input;

  const stdDeduction = regime === "new" ? 75000 : 50000;
  const maxHealthInsurance = ageGroup !== "under60" ? 50000 : 25000;

  // --- Without benefits ---
  let taxableWithout: number;
  if (regime === "old") {
    taxableWithout = Math.max(
      grossSalary
        - stdDeduction
        - Math.min(oldRegimeDeductions.section80C, 150000)
        - Math.min(oldRegimeDeductions.healthInsurance80D, maxHealthInsurance),
      0
    );
  } else {
    taxableWithout = Math.max(grossSalary - stdDeduction, 0);
  }

  const withoutBenefits = computeTax(taxableWithout, ageGroup, regime, grossSalary);

  // --- Benefits applicable per regime ---
  const b = benefits;

  // Both regimes
  const bothRegimes =
    Math.min(b.telecom, 60000) +
    Math.min(b.fuel, 180000) +
    Math.min(b.healthWellness, 60000) +
    b.npsEmployer;

  // Old regime only
  const oldOnly =
    Math.min(b.mealVouchers, 26400) +
    Math.min(b.transportAllowance, 19200) +
    b.lta +
    Math.min(b.booksAndPeriodicals, 60000);

  let taxableWith: number;
  if (regime === "old") {
    taxableWith = Math.max(
      grossSalary
        - stdDeduction
        - bothRegimes
        - oldOnly
        - Math.min(oldRegimeDeductions.section80C, 150000)
        - Math.min(oldRegimeDeductions.healthInsurance80D, maxHealthInsurance),
      0
    );
  } else {
    taxableWith = Math.max(grossSalary - stdDeduction - bothRegimes, 0);
  }

  const withBenefits = computeTax(taxableWith, ageGroup, regime, grossSalary);
  const annualSaving = Math.max(withoutBenefits.totalTax - withBenefits.totalTax, 0);

  const benefitBreakdown: BenefitBreakdown = {
    grossSalary,
    standardDeduction: stdDeduction,
    mealVouchers:        regime === "old" ? Math.min(b.mealVouchers, 26400) : 0,
    transportAllowance:  regime === "old" ? Math.min(b.transportAllowance, 19200) : 0,
    lta:                 regime === "old" ? b.lta : 0,
    telecom:             Math.min(b.telecom, 60000),
    fuel:                Math.min(b.fuel, 180000),
    booksAndPeriodicals: regime === "old" ? Math.min(b.booksAndPeriodicals, 60000) : 0,
    healthWellness:      Math.min(b.healthWellness, 60000),
    npsEmployer:         b.npsEmployer,
    section80C:          regime === "old" ? Math.min(oldRegimeDeductions.section80C, 150000) : 0,
    healthInsurance80D:  regime === "old" ? Math.min(oldRegimeDeductions.healthInsurance80D, maxHealthInsurance) : 0,
    totalDeductions:     grossSalary - taxableWith,
    taxableIncome:       taxableWith,
  };

  return { withoutBenefits, withBenefits, annualSaving, monthlySaving: annualSaving / 12, benefitBreakdown };
}
