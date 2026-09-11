"use client";

import React, { useState } from "react";
import { Layers, Download, CheckCircle2, AlertCircle } from "lucide-react";

export function DesktopPrismaView() {
  const [dbIdentified, setDbIdentified] = useState(1420);
  const [registersIdentified, setRegistersIdentified] = useState(65);
  const [duplicatesRemoved, setDuplicatesRemoved] = useState(310);
  const [screened, setScreened] = useState(1175);
  const [screenExcluded, setScreenExcluded] = useState(940);
  const [sought, setSought] = useState(235);
  const [notRetrieved, setNotRetrieved] = useState(18);
  const [assessed, setAssessed] = useState(217);
  const [excludedEligibility, setExcludedEligibility] = useState(175);
  const [included, setIncluded] = useState(42);

  // Arithmetic validation checks
  const totalIdentified = Number(dbIdentified) + Number(registersIdentified);
  const expectedScreened = totalIdentified - Number(duplicatesRemoved);
  const screeningDiff = Number(screened) - expectedScreened;

  const expectedSought = Number(screened) - Number(screenExcluded);
  const soughtDiff = Number(sought) - expectedSought;

  const expectedAssessed = Number(sought) - Number(notRetrieved);
  const assessedDiff = Number(assessed) - expectedAssessed;

  const expectedIncluded = Number(assessed) - Number(excludedEligibility);
  const includedDiff = Number(included) - expectedIncluded;

  const hasMathDiscrepancy =
    screeningDiff !== 0 || soughtDiff !== 0 || assessedDiff !== 0 || includedDiff !== 0;

  const handleDownloadSVG = () => {
    const svgElement = document.getElementById("desktop-prisma-svg");
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "PRISMA_2020_flow_diagram.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6 sm:p-10 text-[#111827]">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <Layers className="w-3.5 h-3.5" />
              <span>PRISMA 2020 Standard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Systematic Review Flow Diagram Generator
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-2xl">
              Calibrate your study identification, screening, and eligibility numbers. Reconciles stage arithmetic automatically and exports publication-ready vector SVGs.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadSVG}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold tracking-wide transition cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>Export SVG Vector</span>
          </button>
        </div>

        {/* Arithmetic Status Banner */}
        {hasMathDiscrepancy ? (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs shadow-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Arithmetic Discrepancy Detected: </span>
              Your input counts do not reconcile between identification and screening stages. Check exclusions to ensure numbers balance.
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>PRISMA counts perfectly reconciled across all 4 evaluation phases.</span>
          </div>
        )}

        {/* Two-Column Workspace: Inputs on Left, Diagram on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Inputs Column */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-4 shadow-xs text-xs">
            <div className="font-bold uppercase tracking-wider text-neutral-500 border-b border-[#E5E7EB] pb-2">
              Phase 1: Identification
            </div>
            <div className="space-y-1">
              <label className="text-neutral-700 font-medium">Databases Identified</label>
              <input
                type="number"
                value={dbIdentified}
                onChange={(e) => setDbIdentified(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-neutral-700 font-medium">Registers Identified</label>
              <input
                type="number"
                value={registersIdentified}
                onChange={(e) => setRegistersIdentified(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-neutral-700 font-medium">Duplicates Removed</label>
              <input
                type="number"
                value={duplicatesRemoved}
                onChange={(e) => setDuplicatesRemoved(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs"
              />
            </div>

            <div className="font-bold uppercase tracking-wider text-neutral-500 border-b border-[#E5E7EB] pb-2 pt-2">
              Phase 2: Screening
            </div>
            <div className="space-y-1">
              <label className="text-neutral-700 font-medium">Records Screened</label>
              <input
                type="number"
                value={screened}
                onChange={(e) => setScreened(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-neutral-700 font-medium">Records Excluded</label>
              <input
                type="number"
                value={screenExcluded}
                onChange={(e) => setScreenExcluded(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs"
              />
            </div>

            <div className="font-bold uppercase tracking-wider text-neutral-500 border-b border-[#E5E7EB] pb-2 pt-2">
              Phase 3: Eligibility &amp; Included
            </div>
            <div className="space-y-1">
              <label className="text-neutral-700 font-medium">Full-Text Assessed</label>
              <input
                type="number"
                value={assessed}
                onChange={(e) => setAssessed(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-neutral-700 font-medium">Excluded Eligibility</label>
              <input
                type="number"
                value={excludedEligibility}
                onChange={(e) => setExcludedEligibility(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-neutral-700 font-medium text-purple-700 font-bold">
                Final Studies Included
              </label>
              <input
                type="number"
                value={included}
                onChange={(e) => setIncluded(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border-2 border-purple-300 bg-purple-50/40 text-xs font-bold text-purple-900"
              />
            </div>
          </div>

          {/* SVG Diagram Column */}
          <div className="lg:col-span-8 p-6 rounded-2xl border border-[#E5E7EB] bg-white shadow-xs overflow-x-auto flex justify-center">
            <svg
              id="desktop-prisma-svg"
              viewBox="0 0 650 620"
              className="w-full max-w-[620px] h-auto font-sans select-none"
              style={{ minWidth: "480px" }}
            >
              {/* Header Box */}
              <rect x="20" y="20" width="610" height="35" rx="8" fill="#F3F4F6" stroke="#E5E7EB" />
              <text x="325" y="42" textAnchor="middle" fill="#111827" fontSize="13" fontWeight="bold">
                Identification of Studies via Databases and Registers
              </text>

              {/* Identification Boxes */}
              <rect x="50" y="75" width="240" height="55" rx="8" fill="#FAF5FF" stroke="#C084FC" strokeWidth="1.5" />
              <text x="170" y="98" textAnchor="middle" fill="#581C87" fontSize="11" fontWeight="bold">
                Records identified from:
              </text>
              <text x="170" y="115" textAnchor="middle" fill="#6B21A8" fontSize="10">
                Databases (n = {dbIdentified})
              </text>

              <rect x="340" y="75" width="240" height="55" rx="8" fill="#FAF5FF" stroke="#C084FC" strokeWidth="1.5" />
              <text x="460" y="98" textAnchor="middle" fill="#581C87" fontSize="11" fontWeight="bold">
                Records identified from:
              </text>
              <text x="460" y="115" textAnchor="middle" fill="#6B21A8" fontSize="10">
                Registers (n = {registersIdentified})
              </text>

              {/* Arrows to Removal */}
              <path d="M 170 130 L 170 160 L 325 160 L 325 180" fill="none" stroke="#94A3B8" strokeWidth="1.5" markerEnd="url(#arrow)" />
              <path d="M 460 130 L 460 160 L 325 160" fill="none" stroke="#94A3B8" strokeWidth="1.5" />

              {/* Duplicates Box */}
              <rect x="360" y="170" width="240" height="45" rx="8" fill="#FFFBEB" stroke="#FCD34D" strokeWidth="1.5" />
              <text x="480" y="190" textAnchor="middle" fill="#92400E" fontSize="10" fontWeight="bold">
                Records removed before screening:
              </text>
              <text x="480" y="204" textAnchor="middle" fill="#B45309" fontSize="10">
                Duplicate records removed (n = {duplicatesRemoved})
              </text>
              <path d="M 325 192 L 360 192" fill="none" stroke="#94A3B8" strokeWidth="1.5" />

              {/* Screened Box */}
              <rect x="180" y="235" width="290" height="45" rx="8" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="1.5" />
              <text x="325" y="255" textAnchor="middle" fill="#14532D" fontSize="11" fontWeight="bold">
                Records screened (n = {screened})
              </text>
              <path d="M 325 180 L 325 235" fill="none" stroke="#94A3B8" strokeWidth="1.5" />

              {/* Excluded Box */}
              <rect x="400" y="300" width="200" height="45" rx="8" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="1.5" />
              <text x="500" y="320" textAnchor="middle" fill="#991B1B" fontSize="10" fontWeight="bold">
                Records excluded
              </text>
              <text x="500" y="334" textAnchor="middle" fill="#B91C1C" fontSize="10">
                (n = {screenExcluded})
              </text>
              <path d="M 325 322 L 400 322" fill="none" stroke="#94A3B8" strokeWidth="1.5" />

              {/* Assessed Box */}
              <rect x="180" y="360" width="290" height="45" rx="8" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="1.5" />
              <text x="325" y="380" textAnchor="middle" fill="#14532D" fontSize="11" fontWeight="bold">
                Reports assessed for eligibility (n = {assessed})
              </text>
              <path d="M 325 280 L 325 360" fill="none" stroke="#94A3B8" strokeWidth="1.5" />

              {/* Eligibility Excluded Box */}
              <rect x="400" y="420" width="200" height="45" rx="8" fill="#FEF2F2" stroke="#FCA5A5" strokeWidth="1.5" />
              <text x="500" y="440" textAnchor="middle" fill="#991B1B" fontSize="10" fontWeight="bold">
                Reports excluded:
              </text>
              <text x="500" y="454" textAnchor="middle" fill="#B91C1C" fontSize="10">
                Criteria unmet (n = {excludedEligibility})
              </text>
              <path d="M 325 442 L 400 442" fill="none" stroke="#94A3B8" strokeWidth="1.5" />

              {/* Included Final Box */}
              <rect x="160" y="490" width="330" height="60" rx="10" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="2" />
              <text x="325" y="516" textAnchor="middle" fill="#4C1D95" fontSize="12" fontWeight="bold">
                Studies Included in Review
              </text>
              <text x="325" y="535" textAnchor="middle" fill="#5B21B6" fontSize="11" fontWeight="bold">
                Total studies included in synthesis (n = {included})
              </text>
              <path d="M 325 405 L 325 490" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
