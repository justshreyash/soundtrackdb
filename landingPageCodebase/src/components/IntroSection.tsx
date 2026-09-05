import React from 'react';

export function IntroSection() {
  // Lane configs for the marquee orange rectangles that take birth small and expand smoothly
  const lanesTopLeft = [
    { width: 140, duration: 6, delay: 0 },
    { width: 220, duration: 7.5, delay: 0.8 },
    { width: 180, duration: 5.5, delay: 1.6 },
    { width: 260, duration: 8, delay: 2.4 },
    { width: 120, duration: 6.2, delay: 3.2 },
    { width: 200, duration: 7, delay: 4 },
  ];

  const lanesTopRight = [
    { width: 160, duration: 6.5, delay: 0.5 },
    { width: 90, duration: 5, delay: 1.8 },
    { width: 210, duration: 7.2, delay: 2.9 },
  ];

  const lanesBottomLeft = [
    { width: 190, duration: 6.8, delay: 0.3 },
    { width: 130, duration: 5.4, delay: 1.5 },
    { width: 240, duration: 7.8, delay: 2.7 },
  ];

  const lanesBottomRight = [
    { width: 280, duration: 7, delay: 0.4 },
    { width: 150, duration: 5.8, delay: 2 },
  ];

  return (
    <section id="intro" className="w-full border-b border-[#F0EDE6]/10 py-16 md:py-24 px-6 md:px-12 bg-[#0a0a0a] text-[#F0EDE6] relative overflow-hidden">
      {/* Background radial gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#ed462d]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full relative z-10 flex flex-col items-center">
        {/* Top Centered Headline with animated birth-and-expand orange rectangles */}
        <div className="relative w-full py-8 md:py-16 flex flex-col items-center text-center">
          
          {/* Animated Orange Rectangles (Data Stream Packets Marquee Birth & Expand Effect) */}
          {/* Top-Left Cluster */}
          <div className="absolute top-0 left-0 w-1/3 h-24 hidden md:flex flex-col justify-around overflow-hidden pointer-events-none opacity-90">
            {lanesTopLeft.map((lane, idx) => (
              <div key={`tl-${idx}`} className="w-full relative h-[7px]">
                <div
                  className="absolute left-0 h-full bg-[#ed462d] rounded-[1px] shadow-[0_0_8px_rgba(237,70,45,0.7)]"
                  style={{
                    width: `${lane.width}px`,
                    animation: `birth-expand-move-left ${lane.duration}s cubic-bezier(0.25, 1, 0.5, 1) infinite`,
                    animationDelay: `${lane.delay}s`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Top-Right Cluster */}
          <div className="absolute top-2 right-0 w-1/4 h-20 hidden md:flex flex-col justify-around overflow-hidden pointer-events-none opacity-90">
            {lanesTopRight.map((lane, idx) => (
              <div key={`tr-${idx}`} className="w-full relative h-[7px]">
                <div
                  className="absolute right-0 h-full bg-[#ed462d] rounded-[1px] shadow-[0_0_8px_rgba(237,70,45,0.7)]"
                  style={{
                    width: `${lane.width}px`,
                    animation: `birth-expand-move-right ${lane.duration}s cubic-bezier(0.25, 1, 0.5, 1) infinite`,
                    animationDelay: `${lane.delay}s`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Bottom-Left Cluster */}
          <div className="absolute bottom-4 left-0 w-1/4 h-16 hidden md:flex flex-col justify-around overflow-hidden pointer-events-none opacity-90">
            {lanesBottomLeft.map((lane, idx) => (
              <div key={`bl-${idx}`} className="w-full relative h-[7px]">
                <div
                  className="absolute left-0 h-full bg-[#ed462d] rounded-[1px] shadow-[0_0_8px_rgba(237,70,45,0.7)]"
                  style={{
                    width: `${lane.width}px`,
                    animation: `birth-expand-move-left ${lane.duration}s cubic-bezier(0.25, 1, 0.5, 1) infinite`,
                    animationDelay: `${lane.delay}s`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Bottom-Right Cluster */}
          <div className="absolute bottom-4 right-0 w-1/3 h-14 hidden md:flex flex-col justify-around overflow-hidden pointer-events-none opacity-90">
            {lanesBottomRight.map((lane, idx) => (
              <div key={`br-${idx}`} className="w-full relative h-[7px]">
                <div
                  className="absolute right-0 h-full bg-[#ed462d] rounded-[1px] shadow-[0_0_8px_rgba(237,70,45,0.7)]"
                  style={{
                    width: `${lane.width}px`,
                    animation: `birth-expand-move-right ${lane.duration}s cubic-bezier(0.25, 1, 0.5, 1) infinite`,
                    animationDelay: `${lane.delay}s`,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Mobile responsive orange bar marquee preview */}
          <div className="w-full h-8 flex md:hidden overflow-hidden my-2 pointer-events-none opacity-80">
            <div className="w-24 h-[6px] bg-[#ed462d] rounded-sm mx-2 animate-pulse" />
            <div className="w-40 h-[6px] bg-[#ed462d] rounded-sm mx-2" />
            <div className="w-16 h-[6px] bg-[#ed462d] rounded-sm mx-2" />
          </div>

          {/* Introducing SoundTrackDB Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#F0EDE6]/10 font-mono text-[11px] uppercase tracking-wider text-[#ed462d] mb-6">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Introducing SoundTrackDB</span>
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.04em] text-[#F0EDE6] leading-[1.05] max-w-3xl">
            Cinema meets sound.
            <br />
            Zero barriers.
          </h2>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-[#F0EDE6]/85 max-w-xl font-medium leading-relaxed">
            A high-speed developer bridge connecting movie screens directly to Spotify audio streams. Programmatic soundtrack matching with zero API keys and 100 req/min public beta access.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="w-full max-w-[860px] mt-8 md:mt-12">
          {/* Mobile Compact Pipeline Flow (Clean & readable on small phone screens) */}
          <div className="w-full max-w-sm mx-auto flex flex-col gap-2 md:hidden font-mono text-xs">
            <div className="p-3.5 bg-[#111] border border-[#F0EDE6]/15 rounded flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#F0EDE6]/40" />
                <span className="font-bold text-[#F0EDE6]">1. Film Title Query</span>
              </div>
              <span className="text-[10px] text-[#F0EDE6]/50">IMDb / TMDB</span>
            </div>

            <div className="flex justify-center text-[#22c55e] text-xs">↓</div>

            <div className="p-3.5 bg-[#141414] border border-[#22c55e]/40 rounded flex items-center justify-between shadow-[0_0_20px_rgba(34,197,94,0.12)]">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <div>
                  <div className="font-bold text-white">2. SoundTrackDB Resolver</div>
                  <div className="text-[10px] text-[#22c55e]">Turso Edge + Match Engine</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-[#22c55e]/20 text-[#22c55e] text-[10px] font-bold rounded">EDGE</span>
            </div>

            <div className="flex justify-center text-[#22c55e] text-xs">↓</div>

            <div className="p-3.5 bg-[#111] border border-[#F0EDE6]/15 rounded flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                <span className="font-bold text-[#F0EDE6]">3. Spotify Audio Stream</span>
              </div>
              <span className="text-[10px] text-[#22c55e]">&lt;120ms</span>
            </div>

            <div className="mt-2 p-2.5 bg-[#ed462d]/10 border border-[#ed462d]/25 rounded text-[11px] text-[#ed462d] flex items-center justify-center gap-2 text-center">
              <span>✕ No API Keys</span>
              <span>•</span>
              <span>✓ 100 req/min</span>
            </div>
          </div>

          {/* Desktop & Tablet Full SVG Architecture Diagram */}
          <div className="hidden md:block w-full relative aspect-[560/320] max-h-[460px]">
            <svg
              className="w-full h-full select-none"
              viewBox="0 0 560 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Active Flow Trails */}
                <linearGradient id="trail-h1" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
                  <stop offset="70%" stopColor="#22c55e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="trail-h2" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
                  <stop offset="70%" stopColor="#22c55e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.8" />
                </linearGradient>

                {/* Motion paths */}
                <path id="path-film-engine" d="M130,135 L195,135" />
                <path id="path-engine-audio" d="M355,135 L425,135" />
              </defs>

              {/* System Boundary dashed box */}
              <rect
                x="8"
                y="74"
                width="544"
                height="124"
                fill="none"
                stroke="rgba(240,237,230,0.1)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <rect x="18" y="67" width="134" height="14" fill="#0a0a0a" />
              <text
                x="24"
                y="77"
                fontFamily="'Chivo Mono', monospace"
                fontSize="6"
                letterSpacing="2"
                fill="rgba(240,237,230,0.4)"
              >
                OPEN DATA PIPELINE
              </text>

              {/* FILM METADATA (left) */}
              <g className="cursor-pointer group">
                <rect
                  x="20"
                  y="110"
                  width="110"
                  height="50"
                  fill="rgba(15,15,15,0.95)"
                  stroke="rgba(240,237,230,0.18)"
                  strokeWidth="1"
                />
                <text
                  x="75"
                  y="130"
                  textAnchor="middle"
                  fontFamily="'Chivo Mono', monospace"
                  fontSize="7.5"
                  fontWeight="bold"
                  letterSpacing="1.5"
                  fill="rgba(240,237,230,0.7)"
                >
                  CINEMA TITLES
                </text>
                <text
                  x="75"
                  y="144"
                  textAnchor="middle"
                  fontFamily="'Chivo Mono', monospace"
                  fontSize="5.5"
                  letterSpacing="1"
                  fill="rgba(240,237,230,0.35)"
                >
                  IMDb · TMDB · SLUG
                </text>
              </g>

              {/* Line: FILM -> SOUNDTRACKDB */}
              <line x1="130" y1="135" x2="195" y2="135" stroke="rgba(34,197,94,0.2)" strokeWidth="1" />
              <line x1="130" y1="135" x2="195" y2="135" stroke="url(#trail-h1)" strokeWidth="2.5">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
              </line>
              {/* Shooting star packet */}
              <rect x="-1.5" y="-1.5" width="3.5" height="3.5" fill="#22c55e">
                <animateMotion dur="2s" repeatCount="indefinite" calcMode="linear">
                  <mpath href="#path-film-engine" />
                </animateMotion>
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.8;1" dur="2s" repeatCount="indefinite" />
              </rect>

              {/* SOUNDTRACKDB Core Center */}
              <g className="cursor-pointer group">
                <rect
                  x="195"
                  y="86"
                  width="160"
                  height="98"
                  fill="rgba(14,14,14,0.98)"
                  stroke="rgba(240,237,230,0.25)"
                  strokeWidth="1.5"
                />
                <text
                  x="275"
                  y="116"
                  textAnchor="middle"
                  fontFamily="'Chivo Mono', monospace"
                  fontSize="11"
                  fontWeight="bold"
                  letterSpacing="2"
                  fill="#F0EDE6"
                >
                  SOUNDTRACKDB
                </text>
                <text
                  x="275"
                  y="132"
                  textAnchor="middle"
                  fontFamily="'Chivo Mono', monospace"
                  fontSize="6"
                  fontWeight="bold"
                  letterSpacing="1.5"
                  fill="#22c55e"
                >
                  ✓ TURSO EDGE CACHE
                </text>
                <line x1="210" y1="150" x2="340" y2="150" stroke="rgba(240,237,230,0.1)" strokeWidth="0.5" />
                <text
                  x="235"
                  y="166"
                  textAnchor="middle"
                  fontFamily="'Chivo Mono', monospace"
                  fontSize="5"
                  letterSpacing="0.8"
                  fill="rgba(240,237,230,0.4)"
                >
                  RESOLVER
                </text>
                <text
                  x="275"
                  y="166"
                  textAnchor="middle"
                  fontFamily="'Chivo Mono', monospace"
                  fontSize="5"
                  letterSpacing="0.8"
                  fill="rgba(240,237,230,0.4)"
                >
                  CACHE LAYER
                </text>
                <text
                  x="315"
                  y="166"
                  textAnchor="middle"
                  fontFamily="'Chivo Mono', monospace"
                  fontSize="5"
                  letterSpacing="0.8"
                  fill="rgba(240,237,230,0.4)"
                >
                  CONFIDENCE
                </text>
              </g>

              {/* Line: SOUNDTRACKDB -> SPOTIFY AUDIO */}
              <line x1="355" y1="135" x2="425" y2="135" stroke="rgba(34,197,94,0.2)" strokeWidth="1" />
              <line x1="355" y1="135" x2="425" y2="135" stroke="url(#trail-h2)" strokeWidth="2.5">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" begin="1s" repeatCount="indefinite" />
              </line>
              {/* Shooting star packet */}
              <rect x="-1.5" y="-1.5" width="3.5" height="3.5" fill="#22c55e">
                <animateMotion dur="2s" begin="1s" repeatCount="indefinite" calcMode="linear">
                  <mpath href="#path-engine-audio" />
                </animateMotion>
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.8;1" dur="2s" begin="1s" repeatCount="indefinite" />
              </rect>

              {/* SPOTIFY AUDIO (right) */}
              <g className="cursor-pointer group">
                <rect
                  x="425"
                  y="110"
                  width="120"
                  height="50"
                  fill="rgba(15,15,15,0.95)"
                  stroke="rgba(240,237,230,0.18)"
                  strokeWidth="1"
                />
                <text
                  x="485"
                  y="130"
                  textAnchor="middle"
                  fontFamily="'Chivo Mono', monospace"
                  fontSize="7.5"
                  fontWeight="bold"
                  letterSpacing="1.5"
                  fill="rgba(240,237,230,0.7)"
                >
                  SPOTIFY AUDIO
                </text>
                <text
                  x="485"
                  y="144"
                  textAnchor="middle"
                  fontFamily="'Chivo Mono', monospace"
                  fontSize="5.5"
                  letterSpacing="1"
                  fill="#22c55e"
                >
                  &lt;120ms · VERIFIED OST
                </text>
              </g>

              {/* API KEY GATEKEEPING (top) - Blocked */}
              <g>
                <rect
                  x="200"
                  y="12"
                  width="150"
                  height="34"
                  fill="rgba(15,15,15,0.95)"
                  stroke="rgba(240,237,230,0.12)"
                  strokeWidth="1"
                />
                <text
                  x="275"
                  y="33"
                  textAnchor="middle"
                  fontFamily="'Chivo Mono', monospace"
                  fontSize="7"
                  letterSpacing="1.5"
                  fill="rgba(240,237,230,0.4)"
                >
                  API KEYS &amp; DASHBOARDS
                </text>
              </g>

              {/* Blocked line down from Gatekeeping */}
              <line x1="275" y1="46" x2="275" y2="86" stroke="#ed462d" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.5" />
              {/* Severed X */}
              <g>
                <line x1="268" y1="60" x2="282" y2="74" stroke="#ed462d" strokeWidth="2" />
                <line x1="282" y1="60" x2="268" y2="74" stroke="#ed462d" strokeWidth="2" />
              </g>

              {/* RATE LIMIT THROTTLES (bottom) - Blocked */}
              <g>
                <rect
                  x="200"
                  y="230"
                  width="150"
                  height="34"
                  fill="rgba(15,15,15,0.95)"
                  stroke="rgba(240,237,230,0.12)"
                  strokeWidth="1"
                />
                <text
                  x="275"
                  y="251"
                  textAnchor="middle"
                  fontFamily="'Chivo Mono', monospace"
                  fontSize="7"
                  letterSpacing="1.5"
                  fill="rgba(240,237,230,0.4)"
                >
                  429 RATE LIMIT CHOKES
                </text>
              </g>

              {/* Blocked line down from SoundTrackDB to Rate Limit */}
              <line x1="275" y1="184" x2="275" y2="230" stroke="#ed462d" strokeWidth="0.8" strokeDasharray="3 4" opacity="0.5" />
              {/* Severed X */}
              <g>
                <line x1="268" y1="200" x2="282" y2="214" stroke="#ed462d" strokeWidth="2" />
                <line x1="282" y1="200" x2="268" y2="214" stroke="#ed462d" strokeWidth="2" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
