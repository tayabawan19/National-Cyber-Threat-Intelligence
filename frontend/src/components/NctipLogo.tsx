import React from 'react';

export const NctipLogo: React.FC<{ className?: string }> = ({ className = 'w-12 h-14' }) => {
  return (
    <svg
      viewBox="0 0 120 140"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Glow filter */}
      <defs>
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#05271a" />
          <stop offset="100%" stopColor="#02140d" />
        </linearGradient>
      </defs>

      {/* Main Shield Outline */}
      <path
        d="M60 5 L110 25 V65 C110 95 60 130 60 130 C60 130 10 95 10 65 V25 L60 5 Z"
        fill="url(#shieldGrad)"
        stroke="#00ffaa"
        strokeWidth="3"
        filter="url(#neon-glow)"
      />

      {/* Inner Shield Accent Border */}
      <path
        d="M60 12 L102 30 V63 C102 88 60 120 60 120 C60 120 18 88 18 63 V30 L60 12 Z"
        stroke="#00ffaa"
        strokeWidth="1"
        strokeDasharray="4 2"
        opacity="0.7"
      />

      {/* Eagle Wings Header */}
      {/* Left Wing */}
      <path
        d="M60 30 Q40 18 22 28 Q35 38 48 40 Q32 46 25 54 Q40 54 55 48 Z"
        fill="#00ffaa"
        opacity="0.9"
      />
      {/* Right Wing */}
      <path
        d="M60 30 Q80 18 98 28 Q85 38 72 40 Q88 46 95 54 Q80 54 65 48 Z"
        fill="#00ffaa"
        opacity="0.9"
      />

      {/* Eagle Head & Beak */}
      <path
        d="M60 24 L56 34 L60 38 L64 34 Z"
        fill="#ffffff"
      />

      {/* NCTIP Banner Text */}
      <rect x="35" y="16" width="50" height="12" rx="3" fill="#02140d" stroke="#00ffaa" strokeWidth="1.5" />
      <text
        x="60"
        y="25"
        fill="#00ffaa"
        fontSize="9"
        fontWeight="900"
        fontFamily="monospace"
        textAnchor="middle"
        letterSpacing="1"
      >
        NCTIP
      </text>

      {/* Central Cyber Radar / Grid Shield Emblem */}
      <circle cx="60" cy="72" r="18" fill="#031e13" stroke="#00ffaa" strokeWidth="2" />
      <circle cx="60" cy="72" r="12" stroke="#00ffaa" strokeWidth="1" strokeDasharray="3 2" />
      <circle cx="60" cy="72" r="5" fill="#00ffaa" />

      {/* Radar Crosshair lines */}
      <line x1="60" y1="50" x2="60" y2="94" stroke="#00ffaa" strokeWidth="1" opacity="0.6" />
      <line x1="38" y1="72" x2="82" y2="72" stroke="#00ffaa" strokeWidth="1" opacity="0.6" />

      {/* Laurel Wreath Accent Leaves at Bottom */}
      <path
        d="M32 85 Q28 100 45 110 M88 85 Q92 100 75 110"
        stroke="#00ffaa"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
