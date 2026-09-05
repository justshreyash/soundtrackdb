import React, { useState } from 'react';
import { SoundTrackLogo, SoundTrackWordmark } from './SoundTrackLogo';

interface HeaderProps {
  variant?: 'hero' | 'dark';
}

export function Header({ variant = 'dark' }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isHero = variant === 'hero';

  return (
    <header className="w-full relative z-50">
      <nav className="max-w-[1200px] mx-auto px-6 sm:px-8 py-3 sm:py-3.5 flex items-center justify-between">
        {/* SoundTrackDB Wordmark Logo */}
        <a 
          href="/" 
          className="flex items-center gap-2 group focus:outline-none" 
          aria-label="SoundTrackDB Home"
        >
          <SoundTrackWordmark dark={isHero} />
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-7">
          <button 
            onClick={() => scrollToSection('live-tester')}
            className={`font-mono text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-100 ${
              isHero ? "text-[#0a0a0a] opacity-80" : "text-[#F0EDE6] opacity-70"
            }`}
          >
            Live Tester
          </button>

          <button 
            onClick={() => scrollToSection('endpoints')}
            className={`font-mono text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-100 ${
              isHero ? "text-[#0a0a0a] opacity-80" : "text-[#F0EDE6] opacity-70"
            }`}
          >
            Endpoints
          </button>

          <button 
            onClick={() => scrollToSection('architecture')}
            className={`font-mono text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-100 ${
              isHero ? "text-[#0a0a0a] opacity-80" : "text-[#F0EDE6] opacity-70"
            }`}
          >
            Architecture
          </button>

          <a 
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className={`font-mono text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-100 ${
              isHero ? "text-[#0a0a0a] opacity-80" : "text-[#F0EDE6] opacity-70"
            }`}
          >
            Docs
          </a>
          
          <button 
            onClick={() => scrollToSection('faq')}
            className={`font-mono text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-100 ${
              isHero ? "text-[#0a0a0a] opacity-80" : "text-[#F0EDE6] opacity-70"
            }`}
          >
            FAQ
          </button>

          <button
            onClick={() => scrollToSection('live-tester')}
            className={`btn-chamfer px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              isHero 
                ? "bg-[#0a0a0a] text-[#F0EDE6] hover:bg-[#1f1f1f]" 
                : "bg-[#ed462d] text-[#0a0a0a] hover:bg-[#f25841]"
            }`}
          >
            <span>API Console</span>
            <span className="text-[10px] opacity-70">LIVE</span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle Menu"
          className="md:hidden p-2 flex flex-col gap-1.5 focus:outline-none"
        >
          <span className={`w-6 h-0.5 transition-all duration-300 ${
            isHero && !mobileOpen ? "bg-[#0a0a0a]" : "bg-[#F0EDE6]"
          } ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`w-6 h-0.5 transition-all duration-300 ${
            isHero && !mobileOpen ? "bg-[#0a0a0a]" : "bg-[#F0EDE6]"
          } ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`w-6 h-0.5 transition-all duration-300 ${
            isHero && !mobileOpen ? "bg-[#0a0a0a]" : "bg-[#F0EDE6]"
          } ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>

        {/* Mobile Fullscreen Drawer Menu */}
        {mobileOpen && (
          <div className="fixed inset-0 bg-[#0a0a0a]/98 backdrop-blur-xl z-50 flex flex-col justify-between p-6 md:hidden">
            <div className="flex items-center justify-between border-b border-[#F0EDE6]/10 pb-4">
              <SoundTrackWordmark dark={false} />
              <button
                onClick={() => setMobileOpen(false)}
                className="w-10 h-10 flex items-center justify-center border border-[#F0EDE6]/20 text-[#F0EDE6] hover:text-[#ed462d] font-mono text-xl"
                aria-label="Close Menu"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center justify-center gap-6 my-auto">
              <button 
                onClick={() => scrollToSection('live-tester')}
                className="text-2xl font-mono font-bold text-[#F0EDE6] hover:text-[#ed462d] transition-colors"
              >
                Live Tester
              </button>
              <button 
                onClick={() => scrollToSection('endpoints')}
                className="text-2xl font-mono font-bold text-[#F0EDE6] hover:text-[#ed462d] transition-colors"
              >
                12 Endpoints
              </button>
              <button 
                onClick={() => scrollToSection('architecture')}
                className="text-2xl font-mono font-bold text-[#F0EDE6] hover:text-[#ed462d] transition-colors"
              >
                Architecture
              </button>
              <button 
                onClick={() => scrollToSection('docs')}
                className="text-2xl font-mono font-bold text-[#F0EDE6] hover:text-[#ed462d] transition-colors"
              >
                Terminal Docs
              </button>
              <button 
                onClick={() => scrollToSection('faq')}
                className="text-2xl font-mono font-bold text-[#F0EDE6] hover:text-[#ed462d] transition-colors"
              >
                FAQ
              </button>
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-[#F0EDE6]/10 text-center">
              <button
                onClick={() => scrollToSection('live-tester')}
                className="btn-chamfer bg-[#ed462d] text-[#0a0a0a] w-full py-3.5 text-sm font-bold uppercase tracking-wider"
              >
                Try Live API Console →
              </button>
              <span className="font-mono text-[10px] text-[#F0EDE6]/40">
                100% Free Public API · No Auth Required
              </span>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
