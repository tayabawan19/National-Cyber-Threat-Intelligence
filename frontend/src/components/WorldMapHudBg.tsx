import React from 'react';

export const WorldMapHudBg: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none p-4 sm:p-8 z-0">
      {/* Large Outer HUD Window Box matching reference screenshot */}
      <div className="relative w-full max-w-5xl h-[680px] border border-[#00ffaa]/40 rounded-2xl bg-[#041209]/40 backdrop-blur-[2px] shadow-[0_0_50px_rgba(0,255,170,0.15)] flex flex-col justify-between p-4 overflow-hidden">
        
        {/* Top HUD Window Bar */}
        <div className="w-full flex items-center justify-between border-b border-[#00ffaa]/20 pb-2 px-2 text-[10px] font-mono text-[#00ffaa]/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ffaa] animate-pulse" />
            <span className="font-bold tracking-wider">NCTIP // GLOBAL CYBER THREAT RADAR</span>
          </div>
          {/* Top Right Window Control Icons */}
          <div className="flex items-center gap-1.5 opacity-80">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00ffaa]/30 border border-[#00ffaa]/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#00ffaa]/30 border border-[#00ffaa]/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#00ffaa]/30 border border-[#00ffaa]/60" />
          </div>
        </div>

        {/* Detailed Vector World Map Graphic & HUD Coordinate Grid */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
          <svg
            className="w-full h-full opacity-35"
            viewBox="0 0 1000 500"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Green HUD Grid Pattern */}
              <pattern id="map-grid" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#00ffaa" strokeWidth="0.5" opacity="0.25" />
              </pattern>
            </defs>

            {/* Grid Overlay */}
            <rect width="1000" height="500" fill="url(#map-grid)" />

            {/* North America */}
            <path
              d="M 150 120 Q 200 100 280 130 Q 320 180 280 230 Q 220 250 180 210 Q 130 180 150 120 Z"
              fill="#00ffaa"
              opacity="0.12"
              stroke="#00ffaa"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            {/* South America */}
            <path
              d="M 270 270 Q 330 280 340 340 Q 310 420 270 410 Q 240 350 270 270 Z"
              fill="#00ffaa"
              opacity="0.12"
              stroke="#00ffaa"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            {/* Europe */}
            <path
              d="M 460 110 Q 540 100 560 150 Q 520 190 470 170 Q 440 140 460 110 Z"
              fill="#00ffaa"
              opacity="0.12"
              stroke="#00ffaa"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            {/* Africa */}
            <path
              d="M 460 200 Q 560 210 560 300 Q 510 370 470 340 Q 440 280 460 200 Z"
              fill="#00ffaa"
              opacity="0.12"
              stroke="#00ffaa"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            {/* Asia */}
            <path
              d="M 580 100 Q 780 90 850 170 Q 800 260 680 240 Q 580 180 580 100 Z"
              fill="#00ffaa"
              opacity="0.12"
              stroke="#00ffaa"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            {/* Australia */}
            <path
              d="M 760 310 Q 840 310 850 370 Q 800 420 750 390 Q 730 350 760 310 Z"
              fill="#00ffaa"
              opacity="0.12"
              stroke="#00ffaa"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />

            {/* Glowing Active Threat Node Hotspots matching reference image */}
            {/* US West Node */}
            <circle cx="190" cy="170" r="14" fill="#00ffaa" opacity="0.15" className="animate-ping" />
            <circle cx="190" cy="170" r="5" fill="#00ffaa" />
            
            {/* US East Node */}
            <circle cx="270" cy="160" r="14" fill="#00ffaa" opacity="0.15" className="animate-ping" />
            <circle cx="270" cy="160" r="5" fill="#00ffaa" />

            {/* Europe Node */}
            <circle cx="500" cy="140" r="16" fill="#00ffaa" opacity="0.2" className="animate-ping" />
            <circle cx="500" cy="140" r="6" fill="#00ffaa" />

            {/* East Asia / Japan Node */}
            <circle cx="810" cy="180" r="16" fill="#00ffaa" opacity="0.2" className="animate-ping" />
            <circle cx="810" cy="180" r="6" fill="#00ffaa" />

            {/* Southeast Asia Node */}
            <circle cx="730" cy="240" r="12" fill="#00ffaa" opacity="0.15" className="animate-ping" />
            <circle cx="730" cy="240" r="4" fill="#00ffaa" />
          </svg>
        </div>

        {/* Telemetry Text Widget on Left (from reference screenshot) */}
        <div className="relative z-10 p-3 rounded-lg bg-[#020b05]/80 border border-[#00ffaa]/30 text-[9px] font-mono text-[#00ffaa]/80 max-w-[150px] space-y-1">
          <p className="font-bold text-[#00ffaa]">SYSTEM ONLINE</p>
          <p className="text-[#00ffaa]/60">PORT 57 1004</p>
          <p className="text-[#00ffaa]/60">GATE 9700 OS</p>
          <div className="h-0.5 bg-[#00ffaa]/30 my-1" />
          <p className="text-[8px] opacity-70">LATENCY: 12ms</p>
        </div>

        {/* Bottom HUD Telemetry Line */}
        <div className="w-full flex items-center justify-between border-t border-[#00ffaa]/20 pt-2 px-2 text-[9px] font-mono text-[#00ffaa]/50 z-10">
          <span>COORDINATES: 38.8951° N, 77.0364° W</span>
          <span>CYBER DEFENSE CELL // LEVEL 5 CLASSIFIED</span>
        </div>

      </div>
    </div>
  );
};
