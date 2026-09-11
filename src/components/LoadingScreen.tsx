import React from "react";

const loadingSvg = "/loading.svg";

interface LoadingScreenProps {
  /** Optional title or primary message */
  title?: string;
  /** Optional dynamic step or status message (e.g. during scans) */
  step?: string;
  /** Optional description or subtext */
  subtext?: string;
  /** Whether this is a full-screen overlay or embedded within a container */
  fullScreen?: boolean;
  /** Size variant for the animated loader SVG */
  size?: "sm" | "md" | "lg";
  /** Optional additional classes for wrapper */
  className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  title,
  step,
  subtext,
  fullScreen = true,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-40 sm:w-48 max-w-[200px]",
    md: "w-56 sm:w-64 max-w-[280px]",
    lg: "w-72 sm:w-80 max-w-[340px]",
  }[size];

  const content = (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* Animated Glass Blob Loader */}
      <div className={`relative ${sizeClasses} aspect-[4/3] flex items-center justify-center animate-in fade-in zoom-in-95 duration-500`}>
        {/* Soft background ambient halo glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/15 via-purple-600/15 to-indigo-600/10 rounded-full blur-2xl pointer-events-none transform -translate-y-1" />
        
        {/* SVG Image executing native SMIL multi-hue sweep & blob deformation */}
        <img
          src={loadingSvg}
          alt="Loading animation"
          className="w-full h-full object-contain relative z-10 drop-shadow-[0_8px_30px_rgba(37,99,235,0.25)] dark:drop-shadow-[0_8px_35px_rgba(59,130,246,0.35)]"
        />
      </div>

      {/* Dynamic Title / Status Information */}
      {(title || step || subtext) && (
        <div className="mt-2 space-y-1.5 max-w-sm px-4">
          {title && (
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {title}
            </h3>
          )}
          {step && (
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 animate-pulse tracking-wide">
              {step}
            </p>
          )}
          {subtext && (
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {subtext}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07090E]/90 backdrop-blur-2xl animate-in fade-in duration-300">
        {content}
      </div>
    );
  }

  return content;
};
