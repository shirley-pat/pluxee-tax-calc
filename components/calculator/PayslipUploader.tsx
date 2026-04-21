"use client";

import { useRef, useState } from "react";
import { parsePdfPayslip, ParsedPayslip } from "@/lib/pdfParser";

interface PayslipUploaderProps {
  onParsed: (data: ParsedPayslip) => void;
}

export function PayslipUploader({ onParsed }: PayslipUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "parsing" | "done" | "error">("idle");
  const [filename, setFilename] = useState("");
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    if (file.type !== "application/pdf") {
      setStatus("error");
      setFilename("Only PDF files are supported");
      return;
    }
    setFilename(file.name);
    setStatus("parsing");
    try {
      const data = await parsePdfPayslip(file);
      onParsed(data);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const fieldCount: Record<string, string> = {
    parsing: "Reading payslip…",
    done: "Fields auto-filled from payslip",
    error: "Could not read file — fill fields manually",
    idle: "Upload your payslip to auto-fill fields below",
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-5 cursor-pointer transition-all select-none ${
        dragging
          ? "border-blue-400 bg-blue-50"
          : status === "done"
          ? "border-emerald-400 bg-emerald-50"
          : status === "error"
          ? "border-red-300 bg-red-50"
          : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={onInputChange}
      />

      <div className="text-2xl">
        {status === "parsing" ? "⏳" : status === "done" ? "✅" : status === "error" ? "❌" : "📄"}
      </div>

      <div className="text-center">
        <p className={`text-sm font-medium ${
          status === "done" ? "text-emerald-700" :
          status === "error" ? "text-red-600" :
          "text-gray-700"
        }`}>
          {status === "idle" ? "Upload Payslip (PDF)" : filename}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{fieldCount[status]}</p>
      </div>

      {status === "done" && (
        <button
          onClick={(e) => { e.stopPropagation(); setStatus("idle"); setFilename(""); }}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          Upload a different file
        </button>
      )}
    </div>
  );
}
