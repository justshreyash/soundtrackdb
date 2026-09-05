import React, { useState } from 'react';

type LangTab = 'curl' | 'typescript' | 'python' | 'swift';

interface CodeSnippet {
  tab: LangTab;
  label: string;
  lang: string;
  code: string;
}

export function TerminalSection() {
  const [activeTab, setActiveTab] = useState<LangTab>('curl');
  const [copied, setCopied] = useState(false);

  const snippets: Record<LangTab, CodeSnippet> = {
    curl: {
      tab: 'curl',
      label: 'cURL',
      lang: 'bash',
      code: `curl -s "https://soundtrackdb.vercel.app/v1/titles/imdb/tt13070038/music" \\
  -H "Accept: application/json"`,
    },
    typescript: {
      tab: 'typescript',
      label: 'TypeScript',
      lang: 'ts',
      code: `// Direct client-side fetch without backend proxy or secrets
const res = await fetch("https://soundtrackdb.vercel.app/v1/titles/imdb/tt13070038/music");
const { data, confidence } = await res.json();
console.log(data.title, data.soundtrack.spotify_url);`,
    },
    python: {
      tab: 'python',
      label: 'Python',
      lang: 'py',
      code: `import requests

r = requests.get("https://soundtrackdb.vercel.app/v1/titles/imdb/tt13070038/music")
movie = r.json()
print(f"{movie['title']}: {movie['soundtrack']['spotify_id']}")`,
    },
    swift: {
      tab: 'swift',
      label: 'Swift',
      lang: 'swift',
      code: `let url = URL(string: "https://soundtrackdb.vercel.app/v1/titles/imdb/tt13070038/music")!
let (data, _) = try await URLSession.shared.data(from: url)
let soundtrack = try JSONDecoder().decode(SoundtrackResponse.self, from: data)`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="docs" className="w-full border-b border-[#F0EDE6]/10 py-16 md:py-24 px-4 sm:px-6 md:px-12 bg-[#0a0a0a] text-[#F0EDE6] relative overflow-hidden">
      {/* Background blueprint grid accents */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(#F0EDE6 1px, transparent 1px)`,
          backgroundSize: '28px 28px'
        }}
      />

      <div className="w-full relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 md:mb-24 text-center mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#F0EDE6]/10 font-pixel text-[11px] uppercase tracking-wider text-[#ed462d] mb-6">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6h16v12H4z M2 4v16h20V4H2zm6 5l4 3-4 3V9zm6 5h4v1h-4v-1z"/>
            </svg>
            <span>Developer Integration</span>
          </div>

          <h2 className="text-4xl sm:text-6xl md:text-7xl font-normal tracking-[-0.035em] text-[#F0EDE6] leading-[1.05] font-display">
            Designed for real frontends.
          </h2>

          <p className="mt-6 text-base sm:text-lg md:text-xl text-[#F0EDE6]/65 leading-relaxed font-normal max-w-2xl">
            Clean JSON payloads. Transparent confidence scores. Zero authentication headers.
          </p>
        </div>

        {/* Blueprint Artifact Architecture */}
        <div className="relative max-w-[680px] lg:max-w-[1080px] mx-auto">
          {/* DESKTOP BLUEPRINT CALLOUTS - LEFT WING (lg:flex) */}
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[210px] pointer-events-none select-none z-20">
            {/* Annotation 1: Multi-Source Confidence Engine */}
            <div className="absolute right-0 top-[22%] -translate-y-1/2 flex items-center">
              <div className="text-right">
                <div className="font-pixel text-[11px] text-white tracking-wide uppercase">
                  CONFIDENCE SCORE
                </div>
                <div className="font-mono text-[10px] text-[#F0EDE6]/45 tracking-tight">
                  Multi-Source Heuristics
                </div>
              </div>
              <div className="w-10 h-[1px] bg-[#F0EDE6]/25 ml-3" />
              <div className="w-2 h-2 border border-[#ed462d] bg-[#ed462d]/20 rounded-sm -mr-1" />
            </div>

            {/* Annotation 2: Turso libSQL Edge */}
            <div className="absolute right-0 top-[50%] -translate-y-1/2 flex items-center">
              <div className="text-right">
                <div className="font-pixel text-[11px] text-white tracking-wide uppercase">
                  TURSO EDGE
                </div>
                <div className="font-mono text-[10px] text-[#F0EDE6]/45 tracking-tight">
                  Sub-120ms global SQLite
                </div>
              </div>
              <div className="w-10 h-[1px] bg-[#F0EDE6]/25 ml-3" />
              <div className="w-2 h-2 border border-[#ed462d] bg-[#ed462d]/20 rounded-sm -mr-1" />
            </div>

            {/* Annotation 3: Zero Secrets Leak */}
            <div className="absolute right-0 top-[78%] -translate-y-1/2 flex items-center">
              <div className="text-right">
                <div className="font-pixel text-[11px] text-white tracking-wide uppercase">
                  ZERO SECRETS
                </div>
                <div className="font-mono text-[10px] text-[#F0EDE6]/45 tracking-tight">
                  Safe in client-side bundles
                </div>
              </div>
              <div className="w-10 h-[1px] bg-[#F0EDE6]/25 ml-3" />
              <div className="w-2 h-2 border border-[#ed462d] bg-[#ed462d]/20 rounded-sm -mr-1" />
            </div>
          </div>

          {/* DESKTOP BLUEPRINT CALLOUTS - RIGHT WING (lg:flex) */}
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[210px] pointer-events-none select-none z-20">
            {/* Annotation 4: Exact Soundtrack Match */}
            <div className="absolute left-0 top-[22%] -translate-y-1/2 flex items-center">
              <div className="w-2 h-2 border border-[#ed462d] bg-[#ed462d]/20 rounded-sm -ml-1" />
              <div className="w-10 h-[1px] bg-[#F0EDE6]/25 mr-3" />
              <div className="text-left">
                <div className="font-pixel text-[11px] text-white tracking-wide uppercase">
                  CONFIDENCE METRIC
                </div>
                <div className="font-mono text-[10px] text-[#F0EDE6]/45 tracking-tight">
                  0.0 to 1.0 official ranking
                </div>
              </div>
            </div>

            {/* Annotation 5: Universal CORS */}
            <div className="absolute left-0 top-[50%] -translate-y-1/2 flex items-center">
              <div className="w-2 h-2 border border-[#ed462d] bg-[#ed462d]/20 rounded-sm -ml-1" />
              <div className="w-10 h-[1px] bg-[#F0EDE6]/25 mr-3" />
              <div className="text-left">
                <div className="font-pixel text-[11px] text-white tracking-wide uppercase">
                  UNIVERSAL CORS
                </div>
                <div className="font-mono text-[10px] text-[#F0EDE6]/45 tracking-tight">
                  Direct browser fetch enabled
                </div>
              </div>
            </div>

            {/* Annotation 6: 100% Free Public API */}
            <div className="absolute left-0 top-[78%] -translate-y-1/2 flex items-center">
              <div className="w-2 h-2 border border-[#ed462d] bg-[#ed462d]/20 rounded-sm -ml-1" />
              <div className="w-10 h-[1px] bg-[#F0EDE6]/25 mr-3" />
              <div className="text-left">
                <div className="font-pixel text-[11px] text-white tracking-wide uppercase">
                  100% FREE TO USE
                </div>
                <div className="font-mono text-[10px] text-[#F0EDE6]/45 tracking-tight">
                  No paywalls or credit cards
                </div>
              </div>
            </div>
          </div>

          {/* HARDWARE CRT MONITOR CASING (Centered) */}
          <div className="max-w-[660px] mx-auto">
            <div className="relative rounded-2xl bg-gradient-to-b from-[#1c1c1c] via-[#131313] to-[#0c0c0c] p-3 sm:p-5 border border-[#F0EDE6]/15 shadow-[0_2px_0_rgba(240,237,230,0.06),0_25px_60px_rgba(0,0,0,0.85)]">
              {/* Monitor Top Precision Heat Vents */}
              <div className="flex gap-1.5 mb-3 px-2">
                {[...Array(9)].map((_, i) => (
                  <div 
                    key={i} 
                    className="h-1 flex-1 bg-[#F0EDE6]/[0.08] rounded-[1px]" 
                  />
                ))}
              </div>

              {/* Monitor Screen Bezel */}
              <div className="border border-[#F0EDE6]/15 rounded-xl overflow-hidden bg-[#070707] shadow-[inset_0_2px_14px_rgba(0,0,0,0.95)]">
                {/* Terminal Titlebar & Tabs */}
                <div className="px-3 sm:px-4 py-2.5 bg-[#121212] border-b border-[#F0EDE6]/10 flex items-center justify-between gap-3 flex-wrap">
                  {/* Traffic light dots */}
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ed462d]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                  </div>

                  {/* Language Selector Switcher */}
                  <div className="flex items-center bg-[#0a0a0a] p-0.5 rounded border border-[#F0EDE6]/10">
                    {(['curl', 'typescript', 'python', 'swift'] as LangTab[]).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-2.5 py-1 text-[11px] font-mono transition-all rounded-[3px] ${
                          activeTab === tab
                            ? 'bg-[#ed462d] text-[#0a0a0a] font-bold shadow-sm'
                            : 'text-[#F0EDE6]/60 hover:text-[#F0EDE6]'
                        }`}
                      >
                        {snippets[tab].label}
                      </button>
                    ))}
                  </div>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    className="font-pixel text-[10px] uppercase tracking-wider text-[#F0EDE6]/70 hover:text-white px-2 py-1 bg-[#1a1a1a] hover:bg-[#222] border border-[#F0EDE6]/10 rounded flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? (
                      <>
                        <span className="text-[#22c55e]">✓</span>
                        <span className="text-[#22c55e]">COPIED</span>
                      </>
                    ) : (
                      <>
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Terminal Screen Body with Scanline Grid Effect */}
                <div className="p-4 sm:p-6 font-mono text-xs text-[#F0EDE6]/90 space-y-4 bg-[#080808] relative">
                  {/* System Header Status Telemetry */}
                  <div className="pb-3 border-b border-[#F0EDE6]/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2 text-[#22c55e]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                      <span>soundtrackdb://api.edge · 200 OK</span>
                    </div>
                    <div className="text-[#F0EDE6]/40 font-mono text-[10px]">
                      AUTH: NONE REQUIRED · CORS: *
                    </div>
                  </div>

                  {/* Command Input Area */}
                  <div className="space-y-1">
                    <div className="text-[#F0EDE6]/40 text-[11px]"># Request snippet ({snippets[activeTab].label})</div>
                    <pre className="text-xs sm:text-[13px] leading-relaxed text-[#ed462d] font-bold bg-[#0e0e0e] p-3 rounded border border-[#F0EDE6]/5 overflow-x-auto custom-scrollbar">
                      {snippets[activeTab].code}
                    </pre>
                  </div>

                  {/* Live JSON Output Area */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-[#F0EDE6]/40">
                      <span># Output response (application/json)</span>
                      <span className="text-[#22c55e]">Latency: 64ms</span>
                    </div>
                    <pre className="text-[11px] sm:text-xs leading-relaxed text-[#F0EDE6]/80 bg-[#050505] p-3 sm:p-4 rounded border border-[#F0EDE6]/10 overflow-x-auto max-h-[220px] custom-scrollbar">
{`{
  `}<span className="text-[#ed462d]">"imdb_id"</span>{`: `}<span className="text-[#22c55e]">"tt13070038"</span>{`,
  `}<span className="text-[#ed462d]">"title"</span>{`: `}<span className="text-[#22c55e]">"The Electric State"</span>{`,
  `}<span className="text-[#ed462d]">"year"</span>{`: `}<span className="text-[#f59e0b]">2025</span>{`,
  `}<span className="text-[#ed462d]">"soundtrack"</span>{`: {
    `}<span className="text-[#ed462d]">"spotify_id"</span>{`: `}<span className="text-[#22c55e]">"37i9dQZF1DXcBWIGoYBM5M"</span>{`,
    `}<span className="text-[#ed462d]">"type"</span>{`: `}<span className="text-[#22c55e]">"official_soundtrack"</span>{`,
    `}<span className="text-[#ed462d]">"confidence"</span>{`: `}<span className="text-[#f59e0b]">0.98</span>{`,
    `}<span className="text-[#ed462d]">"tracks_count"</span>{`: `}<span className="text-[#f59e0b]">22</span>{`
  },
  `}<span className="text-[#ed462d]">"edge_cache"</span>{`: `}<span className="text-[#22c55e]">"HIT_TURSO_REPLICA"</span>{`
}`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Monitor Lower Molded Bezel */}
              <div className="flex items-center justify-between mt-3 pt-2 px-2 border-t border-[#F0EDE6]/[0.08] font-mono text-[10px] uppercase tracking-widest text-[#F0EDE6]/40">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ed462d] shadow-[0_0_6px_rgba(237,70,45,0.8)] animate-pulse" />
                  <span>SYS: TURSO LIBSQL EDGE</span>
                </div>
                <div className="px-2 py-0.5 rounded bg-[#161616] text-[#ed462d] font-pixel text-[9px] border border-[#F0EDE6]/10">
                  STDB-MK1
                </div>
                <div>
                  GLOBAL LATENCY &lt; 120ms
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE & TABLET RESPONSIVE FEATURE GRID (Visible below lg) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4 mt-12">
          <div className="p-4 rounded-lg bg-[#0e0e0e] border border-[#F0EDE6]/10">
            <div className="font-pixel text-xs text-[#ed462d] uppercase tracking-wider mb-1">
              • CONFIDENCE ENGINE
            </div>
            <div className="text-sm font-semibold text-white mb-1">Multi-Source Verification</div>
            <p className="text-xs text-[#F0EDE6]/60 leading-relaxed">
              Transparent multi-source heuristics and match confidence scores on every cinema soundtrack mapping.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0e0e0e] border border-[#F0EDE6]/10">
            <div className="font-pixel text-xs text-[#ed462d] uppercase tracking-wider mb-1">
              • TURSO EDGE
            </div>
            <div className="text-sm font-semibold text-white mb-1">Sub-120ms Global SQLite</div>
            <p className="text-xs text-[#F0EDE6]/60 leading-relaxed">
              Global libSQL database replicas guaranteeing sub-120ms query resolution worldwide.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0e0e0e] border border-[#F0EDE6]/10">
            <div className="font-pixel text-xs text-[#ed462d] uppercase tracking-wider mb-1">
              • ZERO SECRETS
            </div>
            <div className="text-sm font-semibold text-white mb-1">No Frontend Leaks</div>
            <p className="text-xs text-[#F0EDE6]/60 leading-relaxed">
              Safe to call directly from browser SPAs, React Native, or mobile app bundles.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[#0e0e0e] border border-[#F0EDE6]/10">
            <div className="font-pixel text-xs text-[#ed462d] uppercase tracking-wider mb-1">
              • 100% FREE TO USE
            </div>
            <div className="text-sm font-semibold text-white mb-1">Zero Paywalls Ever</div>
            <p className="text-xs text-[#F0EDE6]/60 leading-relaxed">
              Free public developer API with transparent rate limit headers and zero subscriptions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
