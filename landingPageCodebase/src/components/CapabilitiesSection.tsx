import React from 'react';

export function CapabilitiesSection() {
  const capabilities = [
    {
      num: "01",
      title: "IMDb & TMDB Soundtrack Resolver.",
      mobileDesc: "Direct film-to-playlist mapping. Pass any IMDb or TMDB ID to get verified Spotify tracklists instantly.",
      desc: "Direct film-to-playlist mapping. Pass any IMDb ID (tt13070038) or TMDB ID (766507) to instantly receive verified Spotify tracklists and soundtrack metadata.",
      tag: "CORE ENDPOINT"
    },
    {
      num: "02",
      title: "Autonomous Dynamic Resolution.",
      mobileDesc: "On-demand resolution pipeline automatically ingests, matches, and caches soundtracks on first query.",
      desc: "Automated multi-source ingestion. Pass a title name or slug, and our heuristic pipeline dynamically parses, matches, and links verified soundtrack audio.",
      tag: "AUTONOMOUS"
    },
    {
      num: "03",
      title: "SingleFlight Concurrency Guard.",
      mobileDesc: "Deduplicates simultaneous requests, collapsing concurrent lookups into a single upstream fetch.",
      desc: "Zero cache stampedes. Multiple simultaneous calls for the same cinema title collapse into a single upstream execution, protecting upstream APIs and latency.",
      tag: "RELIABILITY"
    },
    {
      num: "04",
      title: "Real-time Telemetry & SLA Probes.",
      mobileDesc: "Live percentiles (p50/p95/p99), edge database latency probes, and end-to-end request tracing.",
      desc: "Enterprise observability built-in. Measure production performance with reservoir-sampled percentiles, live Turso DB ping latency, and correlation IDs.",
      tag: "OBSERVABILITY"
    },
    {
      num: "05",
      title: "Confidence Scoring & Verification.",
      mobileDesc: "Every match carries confidence metrics (1.0 for verified OSTs, 0.8 for curated playlists).",
      desc: "Every soundtrack match provides transparent quality metrics: 1.0 for official verified OSTs, 0.8 for verified community curations, and exact title matches.",
      tag: "ACCURACY"
    },
    {
      num: "06",
      title: "Turso libSQL Edge Acceleration.",
      mobileDesc: "Distributed Turso libSQL replicas deliver sub-120ms responses globally with zero cold starts.",
      desc: "Sub-120ms global edge lookups. Backed by distributed Turso libSQL replicas, ensuring zero cold starts and unmetered read concurrency worldwide.",
      tag: "PERFORMANCE"
    },
  ];

  return (
    <section id="capabilities" className="w-full border-b border-[#F0EDE6]/10 py-16 md:py-24 px-6 md:px-12 bg-[#0a0a0a] text-[#F0EDE6] relative">
      <div className="w-full">
        {/* Header */}
        <div className="max-w-3xl mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#F0EDE6]/10 font-mono text-[11px] uppercase tracking-wider text-[#ed462d] mb-6">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" />
            </svg>
            <span>System Capabilities</span>
          </div>

          <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] text-[#F0EDE6] leading-[1.05]">
            Production music data, unlocked.
          </h2>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-[#F0EDE6]/60 leading-relaxed font-normal">
            Engineered for developers building music players, film discovery tools, Discord bots, and web applications.
          </p>
        </div>

        {/* 6 Capabilities Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {capabilities.map((cap) => (
            <div
              key={cap.num}
              className="group p-5 sm:p-8 border border-[#F0EDE6]/10 bg-[#0d0d0d] hover:bg-[#111111] hover:border-[#ed462d]/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4 sm:mb-8">
                  <span className="font-mono text-xs font-bold text-[#ed462d] tracking-widest">
                    [ {cap.num} ]
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-[#141414] border border-[#F0EDE6]/10 text-[#F0EDE6]/60">
                    {cap.tag}
                  </span>
                </div>

                <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-[#F0EDE6] mb-2 sm:mb-4 group-hover:text-white transition-colors">
                  {cap.title}
                </h3>

                <p className="text-xs sm:text-base text-[#F0EDE6]/65 leading-relaxed group-hover:text-[#F0EDE6]/75 transition-colors">
                  <span className="sm:hidden">{cap.mobileDesc}</span>
                  <span className="hidden sm:inline">{cap.desc}</span>
                </p>
              </div>

              <div className="mt-5 sm:mt-8 pt-3 sm:pt-4 border-t border-[#F0EDE6]/5 flex items-center justify-between text-xs font-mono text-[#F0EDE6]/30 group-hover:text-[#F0EDE6]/60 transition-colors">
                <span>OPEN API · NO KEY</span>
                <span className="text-[#22c55e]">VERIFIED</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
