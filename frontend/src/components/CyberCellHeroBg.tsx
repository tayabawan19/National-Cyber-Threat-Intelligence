import React from 'react';

interface CyberCellHeroBgProps {
  variant?: 'full' | 'header';
  align?: 'left' | 'center';
  className?: string;
}

export const CyberCellHeroBg: React.FC<CyberCellHeroBgProps> = ({
  variant = 'full',
  align = 'left',
  className = '',
}) => {
  const isHeader = variant === 'header';
  const centerX = isHeader ? 600 : (align === 'left' ? 580 : 600);

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden z-0 ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial Glow Gradient behind central shield */}
          <radialGradient id="heroGlowGrad" cx="50%" cy="45%" r="45%">
            <stop offset="0%" stopColor="#00ff41" stopOpacity={isHeader ? '0.22' : '0.35'} />
            <stop offset="40%" stopColor="#113318" stopOpacity={isHeader ? '0.12' : '0.20'} />
            <stop offset="100%" stopColor="#050705" stopOpacity="0" />
          </radialGradient>

          {/* Shield Fill Gradient */}
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#33ff66" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#113d1a" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#050705" stopOpacity="0.05" />
          </linearGradient>

          {/* Glowing filter for shield outline */}
          <filter id="greenGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft bloom filter */}
          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Animated line dash */}
          <style>{`
            @keyframes dashPulse {
              0% { stroke-dashoffset: 60; }
              100% { stroke-dashoffset: 0; }
            }
            @keyframes shieldPulse {
              0%, 100% { transform: scale(1); opacity: 0.95; }
              50% { transform: scale(1.02); opacity: 1; }
            }
            @keyframes particleBlink {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 0.9; }
            }
            .anim-dash {
              stroke-dasharray: 8 12;
              animation: dashPulse 6s linear infinite;
            }
            .anim-dash-reverse {
              stroke-dasharray: 6 10;
              animation: dashPulse 8s linear infinite reverse;
            }
            .anim-blink-1 { animation: particleBlink 3s ease-in-out infinite; }
            .anim-blink-2 { animation: particleBlink 4s ease-in-out infinite 1.5s; }
            .anim-blink-3 { animation: particleBlink 5s ease-in-out infinite 0.7s; }
          `}</style>
        </defs>

        {/* 1. Base Dark Background Layer */}
        <rect width="1200" height="600" fill="#050705" />

        {/* 2. Central Glow Aura */}
        <circle cx={centerX} cy="270" r="380" fill="url(#heroGlowGrad)" />

        {/* 3. Layer 1: Distant City Skyline Silhouette (Bottom Edge) */}
        {/* Rendered as dark polygon shapes, slightly darker than base, backlit by glow */}
        <g opacity={isHeader ? '0.4' : '0.55'}>
          {/* Skyline Fill Layer */}
          <path
            d="
              M 0 600
              L 0 490 L 25 490 L 25 510 L 45 510 L 45 470 L 65 470 L 65 520 L 85 520 L 85 450 L 110 450 L 110 430 L 125 430 L 125 530
              L 145 530 L 145 480 L 175 480 L 175 440 L 190 440 L 190 410 L 205 410 L 205 440 L 220 440 L 220 540
              L 245 540 L 245 460 L 270 460 L 270 435 L 290 435 L 290 515 L 320 515 L 320 420 L 335 420 L 335 390 L 350 390 L 350 420 L 370 420 L 370 530
              L 395 530 L 395 475 L 420 475 L 420 450 L 440 450 L 440 500 L 460 500 L 460 410 L 475 410 L 475 370 L 490 370 L 490 410 L 510 410 L 510 540
              L 535 540 L 535 460 L 560 460 L 560 430 L 580 430 L 580 480 L 600 480 L 600 360 L 615 360 L 615 340 L 630 340 L 630 360 L 650 360 L 650 480 L 670 480 L 670 430 L 690 430 L 690 530
              L 715 530 L 715 470 L 740 470 L 740 425 L 760 425 L 760 510 L 785 510 L 785 440 L 800 440 L 800 405 L 815 405 L 815 440 L 835 440 L 835 535
              L 860 535 L 860 480 L 885 480 L 885 450 L 910 450 L 910 510 L 935 510 L 935 430 L 955 430 L 955 385 L 970 385 L 970 430 L 990 430 L 990 530
              L 1015 530 L 1015 465 L 1040 465 L 1040 440 L 1060 440 L 1060 515 L 1085 515 L 1085 480 L 1110 480 L 1110 450 L 1135 450 L 1135 540
              L 1160 540 L 1160 490 L 1180 490 L 1180 460 L 1200 460 L 1200 600 Z
            "
            fill="#030503"
            stroke="#112914"
            strokeWidth="1"
          />

          {/* Window dots / grid highlights on key towers */}
          <g fill="#33ff66" opacity="0.3">
            <rect x="88" y="460" width="3" height="4" />
            <rect x="98" y="460" width="3" height="4" />
            <rect x="88" y="475" width="3" height="4" />
            <rect x="98" y="475" width="3" height="4" />

            <rect x="193" y="420" width="4" height="5" />
            <rect x="193" y="435" width="4" height="5" />
            <rect x="193" y="450" width="4" height="5" />

            <rect x="338" y="400" width="4" height="6" fill="#00ff41" opacity="0.6" />
            <rect x="338" y="415" width="4" height="6" />
            <rect x="338" y="430" width="4" height="6" />

            <rect x="478" y="380" width="4" height="6" fill="#00ff41" opacity="0.8" />
            <rect x="478" y="395" width="4" height="6" />
            <rect x="478" y="410" width="4" height="6" />

            <rect x="618" y="348" width="5" height="7" fill="#00ff41" opacity="0.9" />
            <rect x="618" y="365" width="5" height="7" />
            <rect x="618" y="382" width="5" height="7" />
            <rect x="618" y="399" width="5" height="7" />

            <rect x="803" y="415" width="4" height="6" fill="#00ff41" opacity="0.7" />
            <rect x="803" y="430" width="4" height="6" />

            <rect x="958" y="395" width="4" height="6" />
            <rect x="958" y="410" width="4" height="6" />
          </g>
        </g>

        {/* 4. Layer 2: Network / Particle Constellation Web */}
        <g opacity={isHeader ? '0.3' : '0.45'}>
          {/* Connection Lines (Network Mesh) */}
          <path
            d="
              M 80 180 L 220 110 L 380 190 L 520 120 L 680 190 L 840 110 L 980 180 L 1120 120
              M 220 110 L 290 280 L 380 190 L 460 320 L 520 120 L 600 270 L 680 190 L 760 310 L 840 110 L 910 270 L 980 180
              M 120 340 L 220 290 L 320 390 L 440 330 L 600 420 L 760 330 L 880 390 L 980 290 L 1080 340
              M 220 290 L 380 190 M 440 330 L 520 120 M 600 270 L 760 310 M 760 330 L 840 110
            "
            stroke="#33ff66"
            strokeWidth="1"
            strokeOpacity="0.25"
            fill="none"
          />

          {/* Animated Glowing Signal Pulse Lines */}
          <path
            d="
              M 80 180 L 220 110 L 380 190 L 520 120 L 600 270 L 680 190 L 840 110 L 980 180
              M 120 340 L 290 280 L 440 330 L 600 270 L 760 310 L 910 270 L 1080 340
            "
            stroke="#00ff41"
            strokeWidth="1.5"
            strokeOpacity="0.6"
            fill="none"
            className="anim-dash"
            filter="url(#nodeGlow)"
          />

          <path
            d="
              M 220 290 L 380 190 L 460 320 L 600 420 L 760 330 L 880 390 L 980 290
            "
            stroke="#33ff66"
            strokeWidth="1.2"
            strokeOpacity="0.5"
            fill="none"
            className="anim-dash-reverse"
          />

          {/* Network Nodes (Glowing Dots) */}
          <g filter="url(#nodeGlow)">
            {/* Primary Key Nodes */}
            <circle cx="220" cy="110" r="4.5" fill="#00ff41" className="anim-blink-1" />
            <circle cx="380" cy="190" r="4" fill="#33ff66" className="anim-blink-2" />
            <circle cx="520" cy="120" r="5" fill="#00ff41" className="anim-blink-3" />
            <circle cx="680" cy="190" r="4" fill="#33ff66" className="anim-blink-1" />
            <circle cx="840" cy="110" r="5" fill="#00ff41" className="anim-blink-2" />
            <circle cx="980" cy="180" r="4" fill="#33ff66" className="anim-blink-3" />

            {/* Midground Nodes */}
            <circle cx="290" cy="280" r="3.5" fill="#33ff66" opacity="0.8" />
            <circle cx="460" cy="320" r="4" fill="#00ff41" className="anim-blink-2" />
            <circle cx="600" cy="270" r="6" fill="#00ff41" className="anim-blink-1" />
            <circle cx="760" cy="310" r="4.5" fill="#33ff66" className="anim-blink-3" />
            <circle cx="910" cy="270" r="3.5" fill="#00ff41" opacity="0.8" />

            {/* Outer Nodes */}
            <circle cx="80" cy="180" r="3" fill="#4a7c59" />
            <circle cx="1120" cy="120" r="3" fill="#4a7c59" />
            <circle cx="120" cy="340" r="3" fill="#4a7c59" />
            <circle cx="1080" cy="340" r="3" fill="#4a7c59" />
            <circle cx="600" cy="420" r="4" fill="#33ff66" className="anim-blink-2" />
          </g>
        </g>

        {/* 5. Layer 3: Central Focal Point - Glowing Cyber Shield & Security Lock Emblem */}
        <g
          transform={isHeader ? 'translate(600, 230) scale(0.65)' : `translate(${centerX}, 250) scale(1.05)`}
          style={{ transformOrigin: 'center' }}
          opacity="1"
        >
          {/* Outer Shield Hexagon Ring */}
          <polygon
            points="0,-160 135,-80 135,70 0,165 -135,70 -135,-80"
            fill="none"
            stroke="#33ff66"
            strokeWidth="1.5"
            strokeOpacity="0.3"
            strokeDasharray="6 6"
          />

          {/* Main Glowing Shield Body */}
          <path
            d="
              M 0 -135
              C 45 -135 90 -115 110 -90
              C 110 -10 115 50 0 135
              C -115 50 -110 -10 -110 -90
              C -90 -115 -45 -135 0 -135 Z
            "
            fill="url(#shieldGrad)"
            stroke="#00ff41"
            strokeWidth="3.5"
            filter="url(#greenGlow)"
            className="transition-all duration-700"
          />

          {/* Inner Shield Accent Contour */}
          <path
            d="
              M 0 -110
              C 35 -110 70 -95 85 -75
              C 85 -10 90 40 0 110
              C -90 40 -85 -10 -85 -75
              C -70 -95 -35 -110 0 -110 Z
            "
            fill="none"
            stroke="#33ff66"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />

          {/* Shield Internal Circuit Vector Grid Lines */}
          <path
            d="
              M 0 -110 L 0 110
              M -85 -20 L 85 -20
              M -70 30 L 70 30
              M -60 -60 L 60 -60
              M -40 -85 L 40 60
              M 40 -85 L -40 60
            "
            stroke="#33ff66"
            strokeWidth="1"
            strokeOpacity="0.25"
            fill="none"
          />

          {/* Center Lock Emblem */}
          <g filter="url(#greenGlow)">
            {/* Lock Shackle */}
            <path
              d="M -16 -12 V -28 C -16 -40 16 -40 16 -28 V -12"
              fill="none"
              stroke="#00ff41"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Lock Body */}
            <rect
              x="-24"
              y="-12"
              width="48"
              height="40"
              rx="6"
              fill="#0a0f0a"
              stroke="#00ff41"
              strokeWidth="2.5"
            />
            {/* Keyhole */}
            <circle cx="0" cy="4" r="5" fill="#00ff41" />
            <path d="M 0 4 L 0 16" stroke="#00ff41" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* Outer Rotating Target Reticle Marks */}
          <g stroke="#00ff41" strokeWidth="2" strokeOpacity="0.7">
            <line x1="-150" y1="0" x2="-135" y2="0" />
            <line x1="135" y1="0" x2="150" y2="0" />
            <line x1="0" y1="-175" x2="0" y2="-160" />
            <line x1="0" y1="160" x2="0" y2="175" />
          </g>
        </g>

        {/* 6. Foreground Ambient Dark Vignette Overlay for Crisp UI Readability */}
        <rect
          width="1200"
          height="600"
          fill="url(#vignetteGrad)"
          style={{ mixBlendMode: 'multiply' }}
        />
        <defs>
          <radialGradient id="vignetteGrad" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="#050705" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#050705" stopOpacity="0.75" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
};
