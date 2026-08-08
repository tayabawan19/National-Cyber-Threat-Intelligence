import React from 'react';

export const NctipLogo: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Shield Outline */}
      <path
        d="M50 8 L88 24 V52 C88 74 50 94 50 94 C50 94 12 74 12 52 V24 L50 8 Z"
        stroke="#00ff88"
        strokeWidth="3.5"
        strokeLinejoin="round"
        fill="#08140e"
      />
      {/* Inner Accent Line */}
      <path
        d="M50 15 L81 29 V50 C81 68 50 85 50 85 C50 85 19 68 19 50 V29 L50 15 Z"
        stroke="#00ff88"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      {/* Checkmark inside Shield */}
      <path
        d="M38 50 L46 58 L64 38"
        stroke="#00ff88"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* NCTIP Monogram Text */}
      <text
        x="50"
        y="75"
        fill="#00ff88"
        fontSize="10"
        fontWeight="bold"
        fontFamily="monospace"
        textAnchor="middle"
        letterSpacing="1"
      >
        NCTIP
      </text>
    </svg>
  );
};
