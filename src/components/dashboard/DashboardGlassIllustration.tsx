import React from "react";

interface DashboardGlassIllustrationProps {
  className?: string;
  isDeskReject?: boolean;
}

/**
 * 3D isometric layered glass stack illustration matching the macOS reference screenshot.
 * Features translucent frosted glass plates with glowing refractive borders and depth layering.
 */
export const DashboardGlassIllustration: React.FC<DashboardGlassIllustrationProps> = ({
  className = "",
  isDeskReject = false,
}) => {
  const accentGlow = isDeskReject
    ? "rgba(244, 63, 94, 0.4)"
    : "rgba(59, 130, 246, 0.45)";
  const edgeGlow = isDeskReject ? "#f43f5e" : "#38bdf8";

  return (
    <div className={`relative w-48 h-40 sm:w-64 sm:h-52 flex items-center justify-center select-none pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 280 230"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)]"
      >
        <defs>
          {/* Glass plate gradients */}
          <linearGradient id="glassTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#94A3B8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#334155" stopOpacity="0.35" />
          </linearGradient>

          <linearGradient id="glassEdge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
            <stop offset="30%" stopColor={edgeGlow} stopOpacity="0.8" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#475569" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="glassPlateDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.85" />
          </linearGradient>

          <linearGradient id="glowLayer" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={edgeGlow} stopOpacity="0.4" />
            <stop offset="50%" stopColor={edgeGlow} stopOpacity="0.9" />
            <stop offset="100%" stopColor={edgeGlow} stopOpacity="0.2" />
          </linearGradient>

          {/* Ambient blur filter */}
          <filter id="glassBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>

          <filter id="coreGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* Ambient background glow beneath stack */}
        <ellipse
          cx="140"
          cy="150"
          rx="85"
          ry="38"
          fill={accentGlow}
          filter="url(#coreGlow)"
          opacity="0.75"
        />

        {/* Layer 6 (Bottom-most plate) */}
        <g transform="translate(0, 72)">
          <path
            d="M 50 78 L 140 120 L 230 78 L 140 36 Z"
            fill="url(#glassPlateDark)"
            stroke="url(#glassEdge)"
            strokeWidth="1.2"
          />
          <path
            d="M 50 78 L 50 83 L 140 125 L 230 83 L 230 78 L 140 120 Z"
            fill="#0F172A"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="0.8"
          />
        </g>

        {/* Layer 5 */}
        <g transform="translate(0, 58)">
          <path
            d="M 50 78 L 140 120 L 230 78 L 140 36 Z"
            fill="url(#glassPlateDark)"
            stroke="url(#glassEdge)"
            strokeWidth="1.2"
          />
          <path
            d="M 50 78 L 50 83 L 140 125 L 230 83 L 230 78 L 140 120 Z"
            fill="#1E293B"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.8"
          />
        </g>

        {/* Layer 4 */}
        <g transform="translate(0, 44)">
          <path
            d="M 50 78 L 140 120 L 230 78 L 140 36 Z"
            fill="url(#glassPlateDark)"
            stroke="url(#glassEdge)"
            strokeWidth="1.2"
          />
          <path
            d="M 50 78 L 50 83 L 140 125 L 230 83 L 230 78 L 140 120 Z"
            fill="#1E293B"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.8"
          />
        </g>

        {/* Layer 3 - Glowing Core Plate */}
        <g transform="translate(0, 30)">
          {/* Internal neon edge line */}
          <path
            d="M 50 78 L 140 120 L 230 78 L 140 36 Z"
            fill="url(#glassTop)"
            stroke="url(#glowLayer)"
            strokeWidth="2"
          />
          <path
            d="M 50 78 L 50 84 L 140 126 L 230 84 L 230 78 L 140 120 Z"
            fill={edgeGlow}
            fillOpacity="0.4"
            stroke="url(#glowLayer)"
            strokeWidth="1.5"
          />
        </g>

        {/* Layer 2 */}
        <g transform="translate(0, 15)">
          <path
            d="M 50 78 L 140 120 L 230 78 L 140 36 Z"
            fill="url(#glassTop)"
            stroke="url(#glassEdge)"
            strokeWidth="1.5"
          />
          <path
            d="M 50 78 L 50 84 L 140 126 L 230 84 L 230 78 L 140 120 Z"
            fill="#334155"
            fillOpacity="0.6"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
        </g>

        {/* Layer 1 (Top-most transparent glass plate with light reflection) */}
        <g transform="translate(0, 0)">
          {/* Main top facet */}
          <path
            d="M 50 78 L 140 120 L 230 78 L 140 36 Z"
            fill="url(#glassTop)"
            stroke="url(#glassEdge)"
            strokeWidth="1.8"
          />
          {/* Glass plate thickness edge */}
          <path
            d="M 50 78 L 50 86 L 140 128 L 230 86 L 230 78 L 140 120 Z"
            fill="#475569"
            fillOpacity="0.5"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1"
          />

          {/* Corner bevel highlights */}
          <circle cx="50" cy="78" r="2.5" fill="#FFFFFF" opacity="0.9" />
          <circle cx="140" cy="120" r="3" fill="#FFFFFF" opacity="0.95" />
          <circle cx="230" cy="78" r="2.5" fill="#FFFFFF" opacity="0.9" />
          <circle cx="140" cy="36" r="2" fill="#FFFFFF" opacity="0.8" />

          {/* Specular sheen across the top face */}
          <path
            d="M 90 62 L 170 100 L 150 108 L 70 70 Z"
            fill="#FFFFFF"
            opacity="0.16"
          />
        </g>
      </svg>
    </div>
  );
};
