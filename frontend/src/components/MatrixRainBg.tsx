import React, { useEffect, useRef } from 'react';

interface MatrixRainBgProps {
  opacity?: number;
  className?: string;
}

export const MatrixRainBg: React.FC<MatrixRainBgProps> = ({
  opacity = 0.25,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Matrix characters: Binary, Hex, and Cyber Symbol Set
    const chars = '0123456789ABCDEF01010101<>[]{}/\\*&^%$#@!~+=-_';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);

    // Drop Y positions for each column
    const drops: number[] = new Array(columns).fill(1).map(() => Math.floor(Math.random() * -50));

    const render = () => {
      // Semi-transparent fade trail with deep matrix green tint
      ctx.fillStyle = 'rgba(3, 20, 6, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Random character
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Leading character is bright green white-glow, body is phosphor matrix green
        if (Math.random() > 0.85) {
          ctx.fillStyle = '#b3ffc6'; // Bright glow head
        } else {
          ctx.fillStyle = '#00ff41'; // Standard phosphor green
        }

        ctx.fillText(text, x, y);

        // Reset drop to top with random delay when it reaches screen bottom
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    />
  );
};
