export interface ParsedPayslip {
  basic?: number;
  hra?: number;
  specialAllowance?: number;
  lta?: number;
  variablePay?: number;
  tds?: number;
  employeePF?: number;
  employerPF?: number;
}

function parseAmount(raw: string): number | undefined {
  // Strip commas, currency symbols, whitespace
  const cleaned = raw.replace(/[₹,\s]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) || num <= 0 ? undefined : Math.round(num);
}

// Given full PDF text, try to extract a value after a label
function findAmount(text: string, patterns: string[]): number | undefined {
  for (const pattern of patterns) {
    // Look for label followed (on same line or next) by a number
    const regex = new RegExp(
      pattern + "[^\\d₹\\n]{0,30}([₹]?[\\d,]+(?:\\.\\d{1,2})?)",
      "i"
    );
    const match = text.match(regex);
    if (match?.[1]) {
      const amount = parseAmount(match[1]);
      if (amount) return amount;
    }
  }
  return undefined;
}

export async function parsePdfPayslip(file: File): Promise<ParsedPayslip> {
  // Dynamically import pdfjs to avoid SSR issues
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .join(" ");
    fullText += pageText + "\n";
  }

  return {
    basic: findAmount(fullText, [
      "basic salary",
      "basic pay",
      "basic wage",
      "basic",
    ]),
    hra: findAmount(fullText, [
      "house rent allowance",
      "hra",
      "h\\.r\\.a",
    ]),
    specialAllowance: findAmount(fullText, [
      "special allowance",
      "special all\\.",
      "other allowance",
      "misc allowance",
      "flexi",
    ]),
    lta: findAmount(fullText, [
      "leave travel allowance",
      "leave & travel",
      "leave and travel",
      "lta",
      "l\\.t\\.a",
    ]),
    variablePay: findAmount(fullText, [
      "variable pay",
      "variable bonus",
      "performance pay",
      "incentive",
    ]),
    tds: findAmount(fullText, [
      "tax deducted at source",
      "income tax",
      "tds",
      "t\\.d\\.s",
    ]),
    employeePF: findAmount(fullText, [
      "employee pf",
      "employee provident fund",
      "epf employee",
      "pf employee",
      "employee contribution",
    ]),
    employerPF: findAmount(fullText, [
      "employer pf",
      "employer provident fund",
      "epf employer",
      "pf employer",
      "employer contribution",
    ]),
  };
}
