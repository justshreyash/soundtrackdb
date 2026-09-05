import React from 'react';
import { SoundTrackLogo, SoundTrackWordmark, SoundTrackEmblemSVG } from './SoundTrackLogo';

export function Footer() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-[#070707] text-[#F0EDE6] border-t border-[#F0EDE6]/10 pt-20 pb-12 px-6 md:px-12 overflow-hidden">
      {/* Background faint giant watermark - Cinema & Equalizer Emblem */}
      <div className="absolute right-[-30px] bottom-[-30px] pointer-events-none opacity-[0.04] overflow-hidden select-none" aria-hidden="true">
        <SoundTrackEmblemSVG
          color="#ED462D"
          strokeWidth={8}
          className="w-[320px] sm:w-[420px] md:w-[480px] aspect-square"
        />
      </div>

      <div className="max-w-[1200px] mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#F0EDE6]/10">
          {/* Brand Info */}
          <div className="md:col-span-6 space-y-3">
            <SoundTrackWordmark />

            <p className="text-sm text-[#F0EDE6]/70 max-w-sm leading-relaxed font-sans">
              SoundtrackDB — Free Spotify soundtrack API for movies &amp; TV, in public beta.
              <br />
              Built by <span className="text-[#F0EDE6] font-medium">cnf1g &amp; shreyash</span> · India 🇮🇳
            </p>

            <div className="pt-2 flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#121212] border border-[#F0EDE6]/10 font-mono text-[10px] text-[#22c55e]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                100 REQ/MIN · PUBLIC BETA
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#121212] border border-[#F0EDE6]/10 font-mono text-[10px] text-[#ed462d]">
                FREE PUBLIC API
              </span>
            </div>
          </div>

          {/* Links Column: Launch Navigation */}
          <div className="md:col-span-6 flex flex-wrap items-center md:justify-end gap-x-6 gap-y-3 font-mono text-xs">
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="text-[#F0EDE6]/70 hover:text-white transition-colors"
            >
              [ Docs ]
            </a>
            <a
              href="https://github.com/cnf1g/soundtrackdb"
              target="_blank"
              rel="noreferrer"
              className="text-[#F0EDE6]/70 hover:text-white transition-colors"
            >
              [ GitHub ]
            </a>
            <button
              onClick={() => scrollTo('live-tester')}
              className="text-[#F0EDE6]/70 hover:text-white transition-colors"
            >
              [ Live Console ]
            </button>
            <button
              onClick={() => scrollTo('instant-proof')}
              className="text-[#ed462d] hover:text-[#ff5733] font-semibold transition-colors"
            >
              [ Get notified: API keys launch ]
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-[#F0EDE6]/40">
          <div>
            MIT Licensed · © 2026 CNF1G
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[#22c55e] font-semibold">100% OPERATIONAL · SUB-120MS EDGE SPEED</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
