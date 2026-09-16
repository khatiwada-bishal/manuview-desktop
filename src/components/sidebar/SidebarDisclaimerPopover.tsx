import React, { useState, useRef, useEffect } from "react";
import { AlertTriangle, Info } from "lucide-react";

export function SidebarDisclaimerPopover() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const disclaimerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (disclaimerRef.current && !disclaimerRef.current.contains(e.target as Node)) {
        setShowDisclaimer(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="pb-1 pt-1 border-t border-black/[0.04] dark:border-white/[0.04]">
      <div ref={disclaimerRef} className="relative group">
        <button
          type="button"
          onClick={() => setShowDisclaimer((prev) => !prev)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-amber-500/10 hover:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20 transition cursor-pointer shadow-2xs"
          title="View AI Advisory & Publication Disclaimer"
        >
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Disclaimer &amp; Usage</span>
          </div>
          <Info className="w-3.5 h-3.5 text-amber-500/80 dark:text-amber-400/80 shrink-0" />
        </button>

        {/* macOS Liquid Glass Tooltip Popover (Positioned directly above the pill, matching sidebar width) */}
        <div
          className={`absolute bottom-full mb-2.5 left-0 right-0 w-full rounded-2xl p-3.5 bg-white/95 dark:bg-[#151D2A]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-[0_20px_45px_-10px_rgba(0,0,0,0.22),0_0_0_1px_rgba(255,255,255,0.7)_inset] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.12)_inset] z-50 text-left space-y-2.5 transition-all duration-200 ${
            showDisclaimer
              ? "opacity-100 pointer-events-auto translate-y-0"
              : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 translate-y-1"
          }`}
        >
          {/* macOS Popover Pointer Notch (pointing down to the pill) */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] w-2.5 h-2.5 rotate-45 bg-white/95 dark:bg-[#151D2A]/95 border-r border-b border-black/[0.08] dark:border-white/[0.12]" />

          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[11px] font-bold text-[#0F172A] dark:text-white truncate">
                AI Advisory &amp; Disclaimer
              </h4>
              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 font-medium block truncate">
                Scholarly Decision Support
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="space-y-2 text-[10.5px] leading-relaxed text-neutral-600 dark:text-neutral-300">
            <div className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1" />
              <p>
                <strong className="text-[#0F172A] dark:text-white font-semibold">Caution:</strong> Generative AI can make errors or hallucinate. Independently verify all citations, methodological critiques, and findings.
              </p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1" />
              <p>
                <strong className="text-[#0F172A] dark:text-white font-semibold">Supporting Only:</strong> Assistive pre-submission diagnostic simulation; does not replace domain expertise or ethical review.
              </p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1" />
              <p>
                <strong className="text-[#0F172A] dark:text-white font-semibold">No Guarantee:</strong> No automated system guarantees manuscript acceptance; editorial decisions rest solely with journal editors and reviewers.
              </p>
            </div>
          </div>

          {/* Footer badge */}
          <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-[9.5px] text-neutral-400 dark:text-neutral-500">
            <span>COPE &amp; ICMJE</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Local</span>
          </div>
        </div>
      </div>
    </div>
  );
}
