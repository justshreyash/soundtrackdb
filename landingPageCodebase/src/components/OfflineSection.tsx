import React from 'react';

export function OfflineSection() {
  return (
    <section id="architecture" className="w-full border-b border-[#F0EDE6]/10 bg-[#0a0a0a] text-[#F0EDE6] relative overflow-hidden">
      {/* TOP ROW: Diagram (Left) & Content (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#F0EDE6]/10">
            {/* LEFT COLUMN: Layers Flow Diagram with Spherical Grid Background SVG */}
            <div className="lg:col-span-7 relative flex items-center justify-center min-h-[440px] sm:min-h-[480px] p-6 sm:p-10 overflow-hidden bg-[#0a0a0a]">
              {/* Background Architectural Spherical Wireframe SVG */}
              <svg
                viewBox="0 0 540 380"
                className="absolute inset-0 w-full h-full pointer-events-none select-none opacity-80"
                preserveAspectRatio="xMidYMid slice"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Horizontal Coordinate Latitude Grid Lines */}
                <line x1="0" y1="45" x2="540" y2="45" stroke="rgba(240,237,230,0.04)" strokeWidth="0.8" />
                <line x1="0" y1="95" x2="540" y2="95" stroke="rgba(240,237,230,0.04)" strokeWidth="0.8" />
                <line x1="0" y1="145" x2="540" y2="145" stroke="rgba(240,237,230,0.05)" strokeWidth="0.8" />
                <line x1="0" y1="190" x2="540" y2="190" stroke="rgba(240,237,230,0.07)" strokeWidth="0.8" strokeDasharray="3 3" />
                <line x1="0" y1="235" x2="540" y2="235" stroke="rgba(240,237,230,0.05)" strokeWidth="0.8" />
                <line x1="0" y1="285" x2="540" y2="285" stroke="rgba(240,237,230,0.04)" strokeWidth="0.8" />
                <line x1="0" y1="335" x2="540" y2="335" stroke="rgba(240,237,230,0.04)" strokeWidth="0.8" />

                {/* Vertical Center Axis Guide Line */}
                <line x1="270" y1="15" x2="270" y2="365" stroke="rgba(240,237,230,0.07)" strokeWidth="0.8" strokeDasharray="4 4" />

                {/* 3D Perspective Elliptical Latitude Orbits */}
                <ellipse cx="270" cy="190" rx="240" ry="50" stroke="rgba(240,237,230,0.06)" strokeWidth="0.8" strokeDasharray="6 4" />
                <ellipse cx="270" cy="190" rx="255" ry="95" stroke="rgba(240,237,230,0.05)" strokeWidth="0.7" />
                <ellipse cx="270" cy="190" rx="260" ry="145" stroke="rgba(240,237,230,0.04)" strokeWidth="0.6" strokeDasharray="4 4" />

                {/* Curving Spherical Longitude Lines (Left & Right Wings) */}
                <path d="M270 25 Q180 95 170 190 Q180 285 270 355" stroke="rgba(240,237,230,0.07)" strokeWidth="0.8" strokeDasharray="5 5" />
                <path d="M270 25 Q100 105 85 190 Q100 275 270 355" stroke="rgba(240,237,230,0.05)" strokeWidth="0.6" strokeDasharray="4 6" />
                <path d="M270 25 Q360 95 370 190 Q360 285 270 355" stroke="rgba(240,237,230,0.07)" strokeWidth="0.8" strokeDasharray="5 5" />
                <path d="M270 25 Q440 105 455 190 Q440 275 270 355" stroke="rgba(240,237,230,0.05)" strokeWidth="0.6" strokeDasharray="4 6" />

                {/* Left Equator Disconnected / Severed Node Node */}
                <g transform="translate(105, 190)">
                  <circle cx="0" cy="0" r="18" fill="#0a0a0a" stroke="rgba(240,237,230,0.18)" strokeWidth="1" />
                  <circle cx="0" cy="0" r="23" fill="none" stroke="rgba(237,70,45,0.2)" strokeWidth="0.8" strokeDasharray="2 2" />
                  
                  {/* Severed WiFi / Signal Slash Icon in Red */}
                  <g transform="scale(0.85) translate(-10, -10)">
                    <path d="M3 3 L17 17" stroke="#ed462d" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M13.5 8.5 A8.5 8.5 0 0 1 15.5 10" stroke="#ed462d" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.85" />
                    <path d="M4.5 10 A8.5 8.5 0 0 1 8.5 8" stroke="#ed462d" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.85" />
                    <path d="M8 13 A4.5 4.5 0 0 1 12 13" stroke="#ed462d" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7" />
                    <circle cx="10" cy="15.5" r="0.9" fill="#ed462d" />
                  </g>
                </g>

                {/* Floating Celestial Grid Telemetry Coordinates */}
                <circle cx="160" cy="120" r="1.5" fill="rgba(240,237,230,0.2)" />
                <circle cx="380" cy="110" r="1.5" fill="rgba(240,237,230,0.2)" />
                <circle cx="130" cy="250" r="1.5" fill="rgba(240,237,230,0.15)" />
                <circle cx="410" cy="265" r="2" fill="rgba(240,237,230,0.2)" />
                <circle cx="195" cy="305" r="1.5" fill="rgba(240,237,230,0.12)" />
                <circle cx="345" cy="295" r="1.5" fill="rgba(240,237,230,0.15)" />
              </svg>

              {/* Centered Layers Architecture Flow Cards */}
              <div className="relative z-10 flex flex-col items-center max-w-[340px] sm:max-w-[390px] w-full">
                {/* Layer 1: Spotify App Review & Dashboard (Severed upstream) */}
                <div className="w-full text-center font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#F0EDE6]/50 px-5 py-3 bg-[#0a0a0a]/95 border border-[#F0EDE6]/15 shadow-lg backdrop-blur-xs">
                  SPOTIFY APP REVIEW &amp; DASHBOARD
                </div>

                {/* Severed Connector 1 */}
                <div className="flex flex-col items-center py-2">
                  <div className="w-[1px] h-3.5 border-l border-dashed border-[#ed462d]" />
                  <div className="flex items-center gap-1.5 my-0.5">
                    <span className="text-[#ed462d] text-xs font-bold leading-none">✕</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#ed462d] font-bold">
                      SEVERED
                    </span>
                  </div>
                  <div className="w-[1px] h-3.5 border-l border-dashed border-[#ed462d]" />
                </div>

                {/* Layer 2: Your Client Application (Active Ingestion Core) */}
                <div className="w-full text-center font-mono uppercase tracking-[0.16em] px-6 sm:px-8 py-4 bg-[#0c0c0c] border border-[#F0EDE6]/30 shadow-[0_0_30px_rgba(0,0,0,0.9)] relative">
                  <div className="text-xs sm:text-sm font-bold text-[#F0EDE6] tracking-[0.2em] mb-1">
                    YOUR CLIENT APPLICATION
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-[#22c55e] flex items-center justify-center gap-1.5 font-semibold">
                    <span>✓</span> DIRECT SOUNDTRACKDB INGESTION
                  </div>
                </div>

                {/* Severed Connector 2 */}
                <div className="flex flex-col items-center py-2">
                  <div className="w-[1px] h-3.5 border-l border-dashed border-[#ed462d]" />
                  <div className="flex items-center gap-1.5 my-0.5">
                    <span className="text-[#ed462d] text-xs font-bold leading-none">✕</span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-[#ed462d] font-bold">
                      SEVERED
                    </span>
                  </div>
                  <div className="w-[1px] h-3.5 border-l border-dashed border-[#ed462d]" />
                </div>

                {/* Layer 3: Enterprise Paywalls & Quotas (Severed downstream) */}
                <div className="w-full text-center font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#F0EDE6]/50 px-5 py-3 bg-[#0a0a0a]/95 border border-[#F0EDE6]/15 shadow-lg backdrop-blur-xs">
                  ENTERPRISE PAYWALLS &amp; QUOTAS
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Heading, Frictionless Badge & Value Proposition */}
            <div className="lg:col-span-5 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-[#0a0a0a]">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#141414] border border-[#F0EDE6]/10 font-pixel text-[10px] sm:text-[11px] uppercase tracking-wider text-[#ed462d] mb-6 w-max">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>FRICTIONLESS</span>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.035em] text-[#F0EDE6] leading-[1.05]">
                Cut the red tape.
              </h2>

              <p className="mt-6 text-base sm:text-lg text-[#F0EDE6]/85 leading-relaxed font-medium max-w-md">
                No developer applications. No client secret rotation. No quota anxiety. Plug into clean JSON instantly.
              </p>
            </div>
          </div>

          {/* BOTTOM ROW: 3 Columns Attached Directly to the Above Box */}
          <div className="border-t border-[#F0EDE6]/10 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#F0EDE6]/10">
            {/* Column 1: Rate Limits */}
            <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-between group bg-transparent hover:bg-[#121212] transition-colors duration-200 cursor-default">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#141414] group-hover:bg-[#1a1a1a] border border-[#F0EDE6]/10 group-hover:border-[#F0EDE6]/20 font-pixel text-[10px] uppercase tracking-widest text-[#ed462d] group-hover:text-[#ff5c42] mb-4 sm:mb-6 transition-colors duration-200">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 11 L 22 13 L 20 13 L 20 15 L 18 15 L 18 9 L 20 9 L 20 11 Z M 6 10 L 8 10 L 8 14 L 6 14 Z M 9 10 L 11 10 L 11 14 L 9 14 Z M 12 10 L 14 10 L 14 14 L 12 14 Z M 15 10 L 17 10 L 17 14 L 15 14 Z M 18 7 L 18 9 L 5 9 L 5 15 L 18 15 L 18 17 L 3 17 L 3 7 Z"/>
                  </svg>
                  <span>100 REQ/MIN</span>
                </div>

                <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-[#F0EDE6] group-hover:text-white mb-2 sm:mb-3 transition-colors duration-200">
                  Honest transparent limits
                </h3>

                <p className="text-xs sm:text-[15px] text-[#F0EDE6]/65 group-hover:text-[#F0EDE6]/80 leading-relaxed transition-colors duration-200">
                  <span className="sm:hidden">
                    100 requests/minute per IP with transparent headers. No surprise lockouts.
                  </span>
                  <span className="hidden sm:inline">
                    100 requests/minute per IP with X-RateLimit headers on every call. Build prototypes and production widgets freely during public beta.
                  </span>
                </p>
              </div>
            </div>

            {/* Column 2: Keyless */}
            <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-between group bg-transparent hover:bg-[#121212] transition-colors duration-200 cursor-default">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#141414] group-hover:bg-[#1a1a1a] border border-[#F0EDE6]/10 group-hover:border-[#F0EDE6]/20 font-pixel text-[10px] uppercase tracking-widest text-[#ed462d] group-hover:text-[#ff5c42] mb-4 sm:mb-6 transition-colors duration-200">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                  <span>KEYLESS</span>
                </div>

                <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-[#F0EDE6] group-hover:text-white mb-2 sm:mb-3 transition-colors duration-200">
                  Eliminate secrets
                </h3>

                <p className="text-xs sm:text-[15px] text-[#F0EDE6]/65 group-hover:text-[#F0EDE6]/80 leading-relaxed transition-colors duration-200">
                  <span className="sm:hidden">
                    Zero backend secrets. Safe to consume directly in web SPAs, React Native, and mobile apps.
                  </span>
                  <span className="hidden sm:inline">
                    Zero API keys to safeguard or leak. Safely consume endpoints directly from client-side SPAs, frontend web apps, and mobile codebases.
                  </span>
                </p>
              </div>
            </div>

            {/* Column 3: Edge Latency */}
            <div className="p-6 sm:p-10 lg:p-12 flex flex-col justify-between group bg-transparent hover:bg-[#121212] transition-colors duration-200 cursor-default">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#141414] group-hover:bg-[#1a1a1a] border border-[#F0EDE6]/10 group-hover:border-[#F0EDE6]/20 font-pixel text-[10px] uppercase tracking-widest text-[#ed462d] group-hover:text-[#ff5c42] mb-4 sm:mb-6 transition-colors duration-200">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                  <span>EDGE SPEED</span>
                </div>

                <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-[#F0EDE6] group-hover:text-white mb-2 sm:mb-3 transition-colors duration-200">
                  Sub-120ms response
                </h3>

                <p className="text-xs sm:text-[15px] text-[#F0EDE6]/65 group-hover:text-[#F0EDE6]/80 leading-relaxed transition-colors duration-200">
                  <span className="sm:hidden">
                    Sub-120ms global latency backed by Turso libSQL replicas with zero cold starts.
                  </span>
                  <span className="hidden sm:inline">
                    Globally replicated via Turso libSQL. Fast, consistent edge reads with zero server cold starts.
                  </span>
                </p>
              </div>
            </div>
          </div>
    </section>
  );
}
