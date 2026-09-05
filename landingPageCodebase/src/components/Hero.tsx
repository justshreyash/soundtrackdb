import React from 'react';
import { Header } from './Header';
import { SoundTrackLogo, SoundTrackEmblemSVG } from './SoundTrackLogo';

export function Hero() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const tickerItems = [
    "100 REQ/MIN RATE LIMIT",
    "PUBLIC BETA · FREE ACCESS",
    "ZERO API KEYS REQUIRED",
    "NO SIGN-UP NEEDED",
    "IMDB & TMDB SOUNDTRACK RESOLUTION",
    "VERIFIED SPOTIFY PLAYLISTS",
    "SUB-120MS EDGE SPEED",
    "HTTPS & JSON RESPONSES",
    "BUILT BY CNF1G & SHREYASH",
  ];

  return (
    <section className="relative w-full bg-[#ED462D] text-[#0a0a0a] overflow-hidden flex flex-col justify-between">
      {/* Background Watermark SVG - Cinema & Equalizer Emblem */}
      <div 
        className="absolute right-[-6%] sm:right-[-2%] md:right-[1%] lg:right-[3%] xl:right-[5%] top-1/2 -translate-y-1/2 pointer-events-none select-none z-0 overflow-hidden" 
        aria-hidden="true"
      >
        <SoundTrackEmblemSVG
          color="#0a0a0a"
          strokeWidth={8}
          showOutline={true}
          className="w-[320px] sm:w-[440px] md:w-[560px] lg:w-[680px] xl:w-[760px] aspect-square opacity-[0.08] transition-opacity"
        />
      </div>

      {/* Top Header */}
      <Header variant="hero" />

      {/* Hero Content - Snug padding & aligned exactly to 1200px frame */}
      <div className="relative z-10 max-w-[1200px] w-full mx-auto px-6 sm:px-8 pt-4 pb-6 sm:pt-6 sm:pb-8 md:pt-8 md:pb-10 flex-1 flex flex-col justify-center">
        <div className="max-w-3xl lg:max-w-4xl">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#0a0a0a] text-[#F0EDE6] font-mono text-[10px] sm:text-[11px] uppercase tracking-wider mb-3 sm:mb-4 shadow-sm">
            <span>🚧</span>
            <span>PUBLIC BETA — Free, no API key required</span>
          </div>

          <h1 className="text-[2.6rem] sm:text-[3.6rem] md:text-[4.4rem] lg:text-[5rem] xl:text-[5.5rem] leading-[0.94] tracking-[-0.04em] font-bold text-[#0a0a0a] mb-3 sm:mb-4">
            Give us a movie or show.
            <br className="hidden sm:inline" />
            {" "}We give you its Spotify soundtrack.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#0a0a0a] max-w-2xl font-medium leading-snug tracking-tight mb-5 sm:mb-6">
            One API call, using an IMDb ID, TMDB ID, or slug — get back a verified Spotify
            playlist for any movie or TV show. No API key. No sign-up. Free during public beta.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-0.5">
            <button
              onClick={() => scrollTo('instant-proof')}
              className="btn-chamfer bg-[#0a0a0a] text-[#F0EDE6] px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-extrabold uppercase tracking-wider hover:bg-[#1f1f1f] transition-all shadow-xl flex items-center justify-center gap-2"
            >
              <span>Try it live ↓</span>
            </button>

            <button
              onClick={() => scrollTo('endpoints')}
              className="btn-chamfer bg-transparent text-[#0a0a0a] border-2 border-[#0a0a0a] px-7 sm:px-8 py-3.5 sm:py-4 text-xs sm:text-sm font-extrabold uppercase tracking-wider hover:bg-[#0a0a0a] hover:text-[#F0EDE6] transition-all text-center justify-center"
            >
              Read the docs
            </button>
          </div>

          {/* Trust Row under CTAs */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm font-mono font-bold text-[#0a0a0a] pt-4 sm:pt-5">
            <span className="flex items-center gap-1.5">✓ No API Key</span>
            <span className="flex items-center gap-1.5">✓ No Sign-Up</span>
            <span className="flex items-center gap-1.5 bg-[#0a0a0a] text-[#F0EDE6] px-2 py-0.5 rounded font-mono font-bold">✓ 100 req/min</span>
            <span className="flex items-center gap-1.5">✓ HTTPS</span>
            <span className="flex items-center gap-1.5">✓ JSON</span>
          </div>
        </div>
      </div>

      {/* Bottom Continuous Marquee Ticker with continuous border structure */}
      <div className="relative z-10 w-full border-t border-[#0a0a0a]/15 bg-[#ED462D] py-2 sm:py-2.5 overflow-hidden select-none shrink-0">
        <div className="max-w-[1200px] mx-auto border-x border-[#0a0a0a]/15 px-2">
          <div className="animate-ticker flex items-center gap-6 sm:gap-8 whitespace-nowrap">
            {[...tickerItems, ...tickerItems, ...tickerItems].map((item, idx) => (
              <React.Fragment key={idx}>
                <span className="font-pixel text-[10px] sm:text-[11px] uppercase tracking-[0.14em] text-[#0a0a0a]/90">
                  {item}
                </span>
                <span className="text-[#0a0a0a]/40 text-xs">•</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
