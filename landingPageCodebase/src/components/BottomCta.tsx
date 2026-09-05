import React, { useEffect, useRef } from 'react';
import { SoundTrackLogo } from './SoundTrackLogo';

export function BottomCta() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scrollToLiveTester = () => {
    const el = document.getElementById('live-tester');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Wireframe perspective audio tunnel animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    let offset = 0;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const rings = 14;

      offset = (offset + 0.004) % 1;

      // Draw concentric perspective audio frames moving outward
      for (let i = 0; i < rings; i++) {
        const progress = (i / rings + offset) % 1;
        const scale = Math.pow(progress, 2.4);
        const ringWidth = width * 0.9 * scale;
        const ringHeight = height * 0.9 * scale;

        const alpha = Math.sin(progress * Math.PI) * 0.45;

        ctx.strokeStyle = `rgba(237, 70, 45, ${alpha})`;
        ctx.lineWidth = 1 + scale * 1.5;

        // Chamfered / rectangular soundstage frame
        ctx.strokeRect(centerX - ringWidth / 2, centerY - ringHeight / 2, ringWidth, ringHeight);
      }

      // Draw perspective sound rays radiating outward from center
      const spokes = 12;
      for (let s = 0; s < spokes; s++) {
        const angle = (s / spokes) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const innerDist = 20;
        const outerDist = Math.max(width, height) * 0.6;

        ctx.strokeStyle = 'rgba(237, 70, 45, 0.15)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(centerX + cos * innerDist, centerY + sin * innerDist);
        ctx.lineTo(centerX + cos * outerDist, centerY + sin * outerDist);
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section className="relative w-full py-28 md:py-40 px-6 md:px-12 bg-[#0a0a0a] text-[#F0EDE6] overflow-hidden flex flex-col items-center justify-center text-center">
      {/* 3D Wireframe Perspective Tunnel Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
      />

      {/* Radial fade on canvas edges */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,#0a0a0a_85%)]" />

      {/* Content */}
      <div className="relative z-10 max-w-3xl flex flex-col items-center">
        {/* Glowing Center SoundTrack Logo Monogram */}
        <div className="w-20 h-20 mb-10 flex items-center justify-center rounded-2xl bg-[#0a0a0a] border border-[#ed462d]/40 shadow-[0_0_50px_rgba(237,70,45,0.4)]">
          <SoundTrackLogo size="lg" variant="orange" />
        </div>

        <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] text-[#F0EDE6] leading-[1.05]">
          Cinema meets sound.
        </h2>

        <p className="mt-6 text-base sm:text-lg md:text-xl text-[#F0EDE6]/60 leading-relaxed max-w-lg font-normal">
          Map films to soundtracks. Ingest live Spotify metadata. Ship music apps faster with zero credentials or rate limits.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={scrollToLiveTester}
            className="btn-chamfer bg-[#ed462d] text-[#0a0a0a] px-9 py-4 text-sm font-bold uppercase tracking-wider hover:bg-[#f25841] transition-all flex items-center gap-2 shadow-[0_0_30px_rgba(237,70,45,0.4)]"
          >
            <span>Try Live API Console</span>
            <span>→</span>
          </button>

          <button
            onClick={() => {
              const el = document.getElementById('endpoints');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-chamfer bg-[#141414] text-[#F0EDE6] border border-[#F0EDE6]/20 px-8 py-4 text-sm font-bold uppercase tracking-wider hover:bg-[#1f1f1f] transition-all"
          >
            Explore 12 Endpoints →
          </button>
        </div>

        <span className="font-mono text-xs text-[#F0EDE6]/40 tracking-wider mt-6">
          100% Free Public API · Built by CNF1G &amp; shreyash
        </span>
      </div>
    </section>
  );
}
