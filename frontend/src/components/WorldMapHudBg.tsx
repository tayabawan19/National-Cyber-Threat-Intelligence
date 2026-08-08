import React from 'react';

export const WorldMapHudBg: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 flex items-center justify-between px-4 sm:px-8 overflow-hidden select-none">
      
      {/* LEFT MAP PANEL */}
      <div className="hidden lg:flex flex-col justify-between w-[340px] xl:w-[420px] h-[580px] border border-[#00ff88]/25 rounded-2xl bg-[#08120d]/50 p-4 relative backdrop-blur-[2px] shadow-[0_0_30px_rgba(0,255,136,0.08)]">
        {/* Top Panel HUD Header */}
        <div className="flex items-center justify-between border-b border-[#00ff88]/20 pb-2 text-[10px] font-mono text-[#00ff88]/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="font-bold tracking-wider">WESTERN RADAR // NODE_01</span>
          </div>
          <span className="text-[#5a8a6e]">SEC.L5</span>
        </div>

        {/* Western Hemisphere World Map Vector Outline (Americas) */}
        <div className="relative flex-1 w-full h-full my-2 overflow-hidden">
          <svg className="w-full h-full opacity-40" viewBox="0 0 400 350" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-left" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#00ff88" strokeWidth="0.5" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="400" height="350" fill="url(#grid-left)" />

            {/* North America Dotted Pixel Outline */}
            <path
              d="M 60 60 Q 120 40 220 70 Q 260 140 210 200 Q 140 220 100 180 Q 50 140 60 60 Z"
              fill="#00ff88"
              opacity="0.15"
              stroke="#00ff88"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            {/* South America Outline */}
            <path
              d="M 190 220 Q 250 230 260 290 Q 230 340 190 330 Q 160 280 190 220 Z"
              fill="#00ff88"
              opacity="0.15"
              stroke="#00ff88"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />

            {/* Connecting Graph Lines */}
            <line x1="110" y1="120" x2="200" y2="100" stroke="#00ff88" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
            <line x1="200" y1="100" x2="220" y2="250" stroke="#00ff88" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />

            {/* Glowing Threat Pulse Nodes */}
            <circle cx="110" cy="120" r="12" fill="#00ff88" opacity="0.2" className="animate-ping" />
            <circle cx="110" cy="120" r="4" fill="#00ff88" />

            <circle cx="200" cy="100" r="14" fill="#00ff88" opacity="0.25" className="animate-ping" />
            <circle cx="200" cy="100" r="5" fill="#00ff88" />

            <circle cx="220" cy="250" r="10" fill="#00ff88" opacity="0.2" className="animate-ping" />
            <circle cx="220" cy="250" r="3.5" fill="#00ff88" />
          </svg>
        </div>

        {/* Corner HUD Overlay Readout Box */}
        <div className="border border-[#00ff88]/30 bg-[#040b07]/80 rounded-lg p-2.5 font-mono text-[9px] text-[#5a8a6e] space-y-1">
          <div className="flex justify-between text-[#00ff88] font-bold">
            <span>[SYS_TELEMETRY]</span>
            <span>PORT 57 1004</span>
          </div>
          <p>STATUS: ACTIVE THREAT MONITOR</p>
          <p>BOOT: 7800 OS // LAT: 38.8951 N</p>
        </div>
      </div>

      {/* RIGHT MAP PANEL */}
      <div className="hidden lg:flex flex-col justify-between w-[340px] xl:w-[420px] h-[580px] border border-[#00ff88]/25 rounded-2xl bg-[#08120d]/50 p-4 relative backdrop-blur-[2px] shadow-[0_0_30px_rgba(0,255,136,0.08)]">
        {/* Top Panel HUD Header */}
        <div className="flex items-center justify-between border-b border-[#00ff88]/20 pb-2 text-[10px] font-mono text-[#00ff88]/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="font-bold tracking-wider">EASTERN RADAR // NODE_02</span>
          </div>
          {/* Top Right Controls */}
          <div className="flex items-center gap-1.5 opacity-60">
            <span className="w-2 h-2 rounded-full border border-[#00ff88]" />
            <span className="w-2 h-2 rounded-full border border-[#00ff88]" />
            <span className="w-2 h-2 rounded-full border border-[#00ff88]" />
          </div>
        </div>

        {/* Eastern Hemisphere World Map Vector Outline (Europe/Asia/Africa/Australia) */}
        <div className="relative flex-1 w-full h-full my-2 overflow-hidden">
          <svg className="w-full h-full opacity-40" viewBox="0 0 400 350" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid-right" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#00ff88" strokeWidth="0.5" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="400" height="350" fill="url(#grid-right)" />

            {/* Europe */}
            <path
              d="M 60 60 Q 130 50 150 100 Q 110 140 70 120 Q 40 90 60 60 Z"
              fill="#00ff88"
              opacity="0.15"
              stroke="#00ff88"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            {/* Africa */}
            <path
              d="M 60 140 Q 150 150 150 240 Q 100 300 60 270 Q 30 220 60 140 Z"
              fill="#00ff88"
              opacity="0.15"
              stroke="#00ff88"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            {/* Asia */}
            <path
              d="M 170 50 Q 340 40 370 130 Q 310 220 220 200 Q 150 130 170 50 Z"
              fill="#00ff88"
              opacity="0.15"
              stroke="#00ff88"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            {/* Australia */}
            <path
              d="M 280 250 Q 350 250 360 300 Q 310 340 270 320 Q 250 280 280 250 Z"
              fill="#00ff88"
              opacity="0.15"
              stroke="#00ff88"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />

            {/* Connecting Graph Lines */}
            <line x1="90" y1="90" x2="250" y2="100" stroke="#00ff88" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
            <line x1="250" y1="100" x2="330" y2="120" stroke="#00ff88" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />

            {/* Glowing Threat Pulse Nodes */}
            <circle cx="90" cy="90" r="14" fill="#00ff88" opacity="0.25" className="animate-ping" />
            <circle cx="90" cy="90" r="5" fill="#00ff88" />

            <circle cx="250" cy="100" r="16" fill="#00ff88" opacity="0.25" className="animate-ping" />
            <circle cx="250" cy="100" r="6" fill="#00ff88" />

            <circle cx="330" cy="120" r="12" fill="#00ff88" opacity="0.2" className="animate-ping" />
            <circle cx="330" cy="120" r="4" fill="#00ff88" />
          </svg>
        </div>

        {/* Corner HUD Overlay Readout Box */}
        <div className="border border-[#00ff88]/30 bg-[#040b07]/80 rounded-lg p-2.5 font-mono text-[9px] text-[#5a8a6e] space-y-1">
          <div className="flex justify-between text-[#00ff88] font-bold">
            <span>[RADAR_TRACE_02]</span>
            <span>GATE 9700 OS</span>
          </div>
          <p>STATUS: ONLINE // ZERO BREACHES</p>
          <p>ENCRYPTION: AES-256 GCM ACTIVE</p>
        </div>
      </div>

    </div>
  );
};
