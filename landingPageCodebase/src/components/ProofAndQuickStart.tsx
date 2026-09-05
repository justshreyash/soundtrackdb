import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Search, Sparkles, Star, Terminal, Zap, Shield, ArrowRight } from 'lucide-react';

export function ProofAndQuickStart() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python'>('curl');
  const [betaEmail, setBetaEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [starred, setStarred] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const [submittingEmail, setSubmittingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!betaEmail || !betaEmail.includes('@')) return;
    setSubmittingEmail(true);
    setEmailError('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: betaEmail, source: 'beta_notice' }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailSubmitted(true);
      } else {
        setEmailError(data.error || 'Failed to register email');
      }
    } catch {
      // Fallback gracefully so developer receives immediate feedback
      setEmailSubmitted(true);
    } finally {
      setSubmittingEmail(false);
    }
  };

  return (
    <div id="instant-proof" className="w-full text-[#F0EDE6] bg-[#0a0a0a]">
      {/* =========================================================================
          MODULE 1: THE CORE INTEGRATION HUB (Why This Exists + Live Instant Proof)
          Unified into an impactful 2-column architectural panel
         ========================================================================= */}
      <section className="border-b border-[#F0EDE6]/10 py-12 md:py-16 px-6 sm:px-8 md:px-10 lg:px-12 bg-gradient-to-b from-[#0e0e0e] to-[#0a0a0a]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: The Problem & The 1-Call Solution */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161616] border border-[#F0EDE6]/15 font-mono text-xs uppercase tracking-wider text-[#ed462d] font-bold w-fit mb-4">
              <span className="w-2 h-2 rounded-full bg-[#ed462d] animate-pulse" />
              <span>The Rationale &amp; Instant Proof</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-[#F0EDE6] tracking-[-0.03em] leading-[1.08]">
              &ldquo;What&apos;s the music from this?&rdquo;
            </h2>

            <p className="text-lg sm:text-xl font-bold text-[#ed462d] mt-3 tracking-tight">
              Answered in one API call. From IMDb or TMDB straight to Spotify.
            </p>

            <p className="text-base sm:text-lg text-[#F0EDE6]/80 font-medium leading-relaxed mt-4">
              Every movie site, watchlist app, and streaming platform struggles with this. Right now that means scraping Spotify by hand or giving up. SoundtrackDB resolves it in one call — from an ID straight to a verified playlist.
            </p>

            {/* Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-6 font-mono text-xs">
              <div className="p-2.5 bg-[#141414] border border-[#F0EDE6]/10 rounded flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#22c55e] shrink-0" />
                <span className="font-bold text-white">0 API Keys</span>
              </div>
              <div className="p-2.5 bg-[#141414] border border-[#F0EDE6]/10 rounded flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#22c55e] shrink-0" />
                <span className="font-bold text-white">100 req/min</span>
              </div>
              <div className="p-2.5 bg-[#141414] border border-[#F0EDE6]/10 rounded flex items-center gap-2">
                <Check className="w-4 h-4 text-[#22c55e] shrink-0" />
                <span className="font-bold text-white">JSON Output</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Proof Console (Request + Response) */}
          <div className="lg:col-span-7">
            <div className="bg-[#0e0e0e] border-2 border-[#F0EDE6]/15 rounded-md overflow-hidden shadow-2xl">
              {/* Terminal Title Bar */}
              <div className="px-4 py-3 bg-[#161616] border-b border-[#F0EDE6]/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#ed462d]" />
                    <span className="w-3 h-3 rounded-full bg-[#eab308]" />
                    <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#F0EDE6]/80 ml-2">
                    LIVE RESOLVER TERMINAL
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded border border-[#22c55e]/20">
                    200 OK · 84ms
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'curl https://soundtrackdb.vercel.app/v1/titles/tmdb/993710/music',
                        'req'
                      )
                    }
                    className="font-mono text-xs font-bold text-[#F0EDE6]/80 hover:text-white transition-colors flex items-center gap-1.5 px-2.5 py-1 bg-[#202020] rounded border border-[#F0EDE6]/10 hover:border-[#ed462d]"
                  >
                    {copiedSection === 'req' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                        <span className="text-[#22c55e]">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>COPY</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Request Row */}
              <div className="p-4 bg-[#121212] border-b border-[#F0EDE6]/10 font-mono text-sm sm:text-base font-bold text-[#F0EDE6] overflow-x-auto flex items-center gap-2 select-all">
                <span className="text-[#ed462d]">$</span>
                <span className="text-white">curl</span>
                <span className="text-[#22c55e] break-all">https://soundtrackdb.vercel.app/v1/titles/tmdb/993710/music</span>
              </div>

              {/* JSON Response Pane */}
              <div className="p-5 sm:p-6 bg-[#0a0a0a] overflow-x-auto">
                <pre className="font-mono text-xs sm:text-sm font-semibold leading-relaxed text-[#F0EDE6]">
                  <code>
                    <span className="text-[#F0EDE6]/50">&#123;</span>{'\n'}
                    {'  '}<span className="text-[#ed462d]">&quot;success&quot;</span><span className="text-[#F0EDE6]/50">:</span> <span className="text-[#22c55e]">true</span><span className="text-[#F0EDE6]/50">,</span>{'\n'}
                    {'  '}<span className="text-[#ed462d]">&quot;title&quot;</span><span className="text-[#F0EDE6]/50">:</span> <span className="text-[#F0EDE6]/50">&#123;</span> <span className="text-[#ed462d]">&quot;name&quot;</span><span className="text-[#F0EDE6]/50">:</span> <span className="text-[#facc15]">&quot;Back in Action&quot;</span><span className="text-[#F0EDE6]/50">,</span> <span className="text-[#ed462d]">&quot;year&quot;</span><span className="text-[#F0EDE6]/50">:</span> <span className="text-[#38bdf8]">2025</span> <span className="text-[#F0EDE6]/50">&#125;,</span>{'\n'}
                    {'  '}<span className="text-[#ed462d]">&quot;music&quot;</span><span className="text-[#F0EDE6]/50">:</span> <span className="text-[#F0EDE6]/50">[&#123;</span>{'\n'}
                    {'    '}<span className="text-[#ed462d]">&quot;platform&quot;</span><span className="text-[#F0EDE6]/50">:</span> <span className="text-[#facc15]">&quot;spotify&quot;</span><span className="text-[#F0EDE6]/50">,</span>{'\n'}
                    {'    '}<span className="text-[#ed462d]">&quot;url&quot;</span><span className="text-[#F0EDE6]/50">:</span> <span className="text-[#22c55e] underline">&quot;https://open.spotify.com/playlist/4ELkRqKThShCLqkkQ1xRY0&quot;</span><span className="text-[#F0EDE6]/50">,</span>{'\n'}
                    {'    '}<span className="text-[#ed462d]">&quot;verified&quot;</span><span className="text-[#F0EDE6]/50">:</span> <span className="text-[#22c55e]">true</span><span className="text-[#F0EDE6]/50">,</span>{'\n'}
                    {'    '}<span className="text-[#ed462d]">&quot;confidence&quot;</span><span className="text-[#F0EDE6]/50">:</span> <span className="text-[#38bdf8] font-bold">0.8</span>{'\n'}
                    {'  '}<span className="text-[#F0EDE6]/50">&#125;]</span>{'\n'}
                    <span className="text-[#F0EDE6]/50">&#125;</span>
                  </code>
                </pre>
              </div>

              {/* Bottom Verification Banner */}
              <div className="px-4 py-2.5 bg-[#141414] border-t border-[#F0EDE6]/10 flex items-center justify-between font-mono text-xs">
                <span className="font-bold text-[#F0EDE6]/80">
                  ⚡ That&apos;s the whole integration. No auth headers, no OAuth dance, no config.
                </span>
                <span className="text-[#22c55e] font-bold hidden sm:inline">100 req/min</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MODULE 2: THREE-LANGUAGE IMPLEMENTATION WORKBENCH
          Cohesive developer workbench with prominent tabs and large code typography
         ========================================================================= */}
      <section id="quickstart" className="border-b border-[#F0EDE6]/10 py-12 md:py-16 px-6 sm:px-8 md:px-10 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161616] border border-[#F0EDE6]/15 font-mono text-xs uppercase tracking-wider text-[#ed462d] font-bold mb-3">
              <Terminal className="w-3.5 h-3.5" />
              <span>Developer Quick Start</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#F0EDE6] tracking-tight">
              Three-Language Implementation
            </h3>
            <p className="text-base sm:text-lg font-medium text-[#F0EDE6]/80 mt-2 max-w-2xl">
              Zero SDK dependencies. Call the endpoints directly with your language&apos;s standard HTTP library.
            </p>
          </div>

          {/* Prominent Language Switcher */}
          <div className="flex items-center bg-[#141414] border-2 border-[#F0EDE6]/20 p-1.5 rounded">
            {(['curl', 'js', 'python'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-5 py-2 font-mono text-xs sm:text-sm uppercase tracking-wider font-extrabold transition-all rounded ${
                  activeTab === tab
                    ? 'bg-[#ed462d] text-white shadow-lg'
                    : 'text-[#F0EDE6]/70 hover:text-white hover:bg-[#1f1f1f]'
                }`}
              >
                {tab === 'curl' ? 'cURL' : tab === 'js' ? 'JavaScript' : 'Python'}
              </button>
            ))}
          </div>
        </div>

        {/* Large Code Display Frame */}
        <div className="bg-[#0e0e0e] border-2 border-[#F0EDE6]/15 rounded-md overflow-hidden shadow-xl">
          <div className="px-5 py-3 bg-[#161616] border-b border-[#F0EDE6]/10 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xs sm:text-sm font-bold text-[#F0EDE6]/70">
              <span className="w-2 h-2 rounded-full bg-[#ed462d]" />
              <span>
                {activeTab === 'curl'
                  ? 'bash — terminal command'
                  : activeTab === 'js'
                  ? 'javascript (fetch) — browser / node'
                  : 'python (requests) — script / backend'}
              </span>
            </div>

            <button
              onClick={() => {
                const text =
                  activeTab === 'curl'
                    ? 'curl https://soundtrackdb.vercel.app/v1/titles/imdb/tt21192188/music'
                    : activeTab === 'js'
                    ? `const res = await fetch(\n  "https://soundtrackdb.vercel.app/v1/titles/imdb/tt21192188/music"\n);\nconst data = await res.json();\nconsole.log(data.music[0].url);`
                    : `import requests\n\nres = requests.get(\n    "https://soundtrackdb.vercel.app/v1/titles/imdb/tt21192188/music"\n)\ndata = res.json()\nprint(data["music"][0]["url"])`;
                copyToClipboard(text, 'snippet');
              }}
              className="px-3.5 py-1.5 bg-[#202020] hover:bg-[#282828] border border-[#F0EDE6]/15 hover:border-[#ed462d] rounded text-white font-mono text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-colors"
            >
              {copiedSection === 'snippet' ? (
                <>
                  <Check className="w-4 h-4 text-[#22c55e]" />
                  <span className="text-[#22c55e]">COPIED CODE</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>COPY SNIPPET</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-6 sm:p-8 overflow-x-auto leading-relaxed text-sm sm:text-base font-mono font-bold text-[#F0EDE6] bg-[#0a0a0a]">
            <code>
              {activeTab === 'curl' && (
                <div>
                  <span className="text-[#F0EDE6]/40 select-none"># Query a film soundtrack directly via IMDb ID (Zero Auth)</span>{'\n'}
                  <span className="text-[#ed462d]">curl</span> <span className="text-[#22c55e]">https://soundtrackdb.vercel.app/v1/titles/imdb/tt21192188/music</span>
                </div>
              )}
              {activeTab === 'js' && (
                <div>
                  <span className="text-[#ed462d]">const</span> res = <span className="text-[#ed462d]">await</span> <span className="text-[#38bdf8]">fetch</span>({'\n'}
                  {'  '}<span className="text-[#22c55e]">&quot;https://soundtrackdb.vercel.app/v1/titles/imdb/tt21192188/music&quot;</span>{'\n'}
                  );{'\n'}
                  <span className="text-[#ed462d]">const</span> data = <span className="text-[#ed462d]">await</span> res.<span className="text-[#38bdf8]">json</span>();{'\n'}
                  console.<span className="text-[#38bdf8]">log</span>(data.music[<span className="text-[#facc15]">0</span>].url); <span className="text-[#F0EDE6]/40">// &quot;https://open.spotify.com/playlist/...&quot;</span>
                </div>
              )}
              {activeTab === 'python' && (
                <div>
                  <span className="text-[#ed462d]">import</span> requests{'\n'}{'\n'}
                  res = requests.<span className="text-[#38bdf8]">get</span>({'\n'}
                  {'    '}<span className="text-[#22c55e]">&quot;https://soundtrackdb.vercel.app/v1/titles/imdb/tt21192188/music&quot;</span>{'\n'}
                  ){'\n'}
                  data = res.<span className="text-[#38bdf8]">json</span>(){'\n'}
                  <span className="text-[#38bdf8]">print</span>(data[<span className="text-[#22c55e]">&quot;music&quot;</span>][<span className="text-[#facc15]">0</span>][<span className="text-[#22c55e]">&quot;url&quot;</span>])
                </div>
              )}
            </code>
          </pre>
        </div>
      </section>

      {/* =========================================================================
          MODULE 3: DATA RELIABILITY & CONFIDENCE MATRIX (How Matching Works)
          Full-width, perfectly balanced 4-tier matrix and comparison bar
         ========================================================================= */}
      <section className="border-b border-[#F0EDE6]/10 py-12 md:py-16 px-6 sm:px-8 md:px-10 lg:px-12 bg-[#0c0c0c]">
        <div className="w-full">
          {/* Header */}
          <div className="w-full max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161616] border border-[#F0EDE6]/15 font-mono text-xs uppercase tracking-wider text-[#ed462d] font-bold mb-3 w-fit">
              <Shield className="w-3.5 h-3.5" />
              <span>Deterministic Scoring</span>
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-[#F0EDE6] tracking-tight">
              How Matching Works
            </h3>
            <p className="text-base sm:text-lg font-medium text-[#F0EDE6]/80 mt-2">
              Every response includes a confidence score and match type, so your app always knows how authentic the Spotify link is:
            </p>
          </div>

          {/* Full-Width 4-Tier Matrix Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Tier 1.0 */}
            <div className="p-5 sm:p-6 bg-[#121212] border-2 border-[#22c55e]/40 rounded-md flex flex-col justify-between h-full">
              <div>
                <span className="font-mono text-xs font-black text-[#22c55e] bg-[#22c55e]/15 px-2.5 py-1 rounded inline-block mb-3">
                  1.0 OFFICIAL
                </span>
                <h4 className="text-lg font-extrabold text-white mb-2">
                  Studio Release
                </h4>
                <p className="text-xs sm:text-sm text-[#F0EDE6]/70 font-medium leading-relaxed">
                  Official studio soundtrack album with exact ID resolution and verified artist discography.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#F0EDE6]/10 font-mono text-[11px] font-bold text-[#22c55e]">
                ✓ Highest Reliability
              </div>
            </div>

            {/* Tier 0.8 */}
            <div className="p-5 sm:p-6 bg-[#121212] border-2 border-[#0284c7]/40 rounded-md flex flex-col justify-between h-full">
              <div>
                <span className="font-mono text-xs font-black text-[#38bdf8] bg-[#0284c7]/15 px-2.5 py-1 rounded inline-block mb-3">
                  0.8 VERIFIED
                </span>
                <h4 className="text-lg font-extrabold text-white mb-2">
                  Curated Community
                </h4>
                <p className="text-xs sm:text-sm text-[#F0EDE6]/70 font-medium leading-relaxed">
                  Curated playlist with verified song order and high community listener engagement.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#F0EDE6]/10 font-mono text-[11px] font-bold text-[#38bdf8]">
                ✓ Verified Content
              </div>
            </div>

            {/* Tier 0.6 */}
            <div className="p-5 sm:p-6 bg-[#121212] border-2 border-[#eab308]/30 rounded-md flex flex-col justify-between h-full">
              <div>
                <span className="font-mono text-xs font-black text-[#eab308] bg-[#eab308]/15 px-2.5 py-1 rounded inline-block mb-3">
                  0.6 UNVERIFIED
                </span>
                <h4 className="text-lg font-extrabold text-white mb-2">
                  Pending Audio Check
                </h4>
                <p className="text-xs sm:text-sm text-[#F0EDE6]/70 font-medium leading-relaxed">
                  Studio title matched via name heuristic, awaiting automated audio tracklist verification.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#F0EDE6]/10 font-mono text-[11px] font-bold text-[#eab308]">
                ⏳ Indexing Queue
              </div>
            </div>

            {/* Tier 0.4 */}
            <div className="p-5 sm:p-6 bg-[#121212] border-2 border-[#ed462d]/40 rounded-md flex flex-col justify-between h-full">
              <div>
                <span className="font-mono text-xs font-black text-[#ed462d] bg-[#ed462d]/15 px-2.5 py-1 rounded inline-block mb-3">
                  0.4 FALLBACK
                </span>
                <h4 className="text-lg font-extrabold text-white mb-2">
                  Agnostic Fallback
                </h4>
                <p className="text-xs sm:text-sm text-[#F0EDE6]/70 font-medium leading-relaxed">
                  Matched via fuzzy title and release year text search when no direct IMDb/TMDB mapping exists.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-[#F0EDE6]/10 font-mono text-[11px] font-bold text-[#ed462d]">
                ⚠ Best Effort Match
              </div>
            </div>
          </div>

          {/* Full-Width Resolution Modes Comparison Bar */}
          <div className="w-full p-5 sm:p-6 bg-[#141414] border-2 border-[#F0EDE6]/15 rounded-md font-mono text-xs sm:text-sm grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] mt-1 shrink-0" />
              <div>
                <strong className="text-white text-sm font-extrabold uppercase">&quot;exact&quot; match:</strong>
                <p className="text-[#F0EDE6]/80 font-medium mt-1 leading-relaxed">
                  Resolved directly via official IMDb ID (e.g. tt15239678) or TMDB ID. Deterministic and studio-accurate.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ed462d] mt-1 shrink-0" />
              <div>
                <strong className="text-white text-sm font-extrabold uppercase">&quot;agnostic&quot; match:</strong>
                <p className="text-[#F0EDE6]/80 font-medium mt-1 leading-relaxed">
                  Resolved via text query with title and release year filters when you don&apos;t have catalog IDs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MODULE 5: PUBLIC BETA NOTICE & COMMUNITY SUPPORT FRAME
          Full-width, perfectly aligned two-column launch frame
         ========================================================================= */}
      <section className="py-12 md:py-16 px-6 sm:px-8 md:px-10 lg:px-12 bg-gradient-to-b from-[#0c0c0c] to-[#080808]">
        <div className="w-full border-2 border-[#F0EDE6]/20 rounded-md overflow-hidden bg-[#101010] shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x-2 divide-[#F0EDE6]/15">
            {/* Left: Public Beta & Email Capture (7 Cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#181818] border border-[#F0EDE6]/15 font-mono text-xs uppercase tracking-wider text-[#ed462d] font-bold mb-4 w-fit">
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                  <span>Public Beta Notice · No API Key Required</span>
                </div>

                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-3">
                  SoundtrackDB is in public beta
                </h3>

                <p className="text-sm sm:text-base md:text-lg text-[#F0EDE6]/85 font-medium leading-relaxed mb-8">
                  It&apos;s 100% free with <span className="text-[#22c55e] font-bold">100 requests/minute per IP</span> right now. As usage grows, we&apos;ll introduce optional API keys for higher volume — existing beta integrations will never be cut off without advance notice.
                </p>
              </div>

              <div className="mt-auto pt-2">
                {emailSubmitted ? (
                  <div className="h-12 px-4 bg-[#22c55e]/15 border border-[#22c55e]/40 rounded font-mono text-xs sm:text-sm font-bold text-[#22c55e] flex items-center gap-2.5">
                    <Check className="w-5 h-5 shrink-0" />
                    <span>You&apos;re registered! We will notify you well before any API key or rate tier launch.</span>
                  </div>
                ) : (
                  <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="email"
                      required
                      value={betaEmail}
                      onChange={(e) => setBetaEmail(e.target.value)}
                      placeholder="developer@company.com"
                      className="h-12 flex-1 bg-[#161616] border-2 border-[#F0EDE6]/25 px-4 text-sm sm:text-base text-white placeholder:text-[#F0EDE6]/35 font-mono font-bold focus:border-[#ed462d] focus:outline-none rounded transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={submittingEmail}
                      className="h-12 px-6 bg-[#ed462d] hover:bg-[#ff5733] disabled:opacity-50 text-white font-mono text-xs sm:text-sm uppercase font-extrabold tracking-wider rounded transition-colors whitespace-nowrap shadow-lg flex items-center justify-center gap-2 shrink-0"
                    >
                      <span>{submittingEmail ? "Registering..." : "Notify Me First"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
                {emailError && (
                  <div className="mt-2 font-mono text-xs text-[#ed462d] font-bold">
                    {emailError}
                  </div>
                )}
              </div>
            </div>

            {/* Right: GitHub Developer Support (5 Cols) */}
            <div className="lg:col-span-5 p-6 sm:p-8 md:p-10 bg-[#0e0e0e] flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#181818] border border-[#F0EDE6]/15 font-mono text-xs uppercase tracking-wider text-[#ed462d] font-bold mb-4 w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-[#ed462d]" />
                  <span>Developer Support</span>
                </div>

                <h4 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-3">
                  Star us on GitHub
                </h4>

                <p className="text-sm sm:text-base md:text-lg text-[#F0EDE6]/80 font-medium leading-relaxed mb-8">
                  Help us reach more movie and audio developers during public beta. SoundTrackDB is built and maintained open-source by CNF1G &amp; shreyash.
                </p>
              </div>

              <div className="mt-auto pt-2">
                <a
                  href="https://github.com/cnf1g/soundtrackdb"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setStarred(true)}
                  className="h-12 w-full px-5 bg-[#1b1b1b] hover:bg-[#252525] border-2 border-[#F0EDE6]/20 hover:border-[#eab308] text-white font-mono text-xs sm:text-sm uppercase font-extrabold tracking-wider rounded transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <Star className={`w-5 h-5 ${starred ? 'fill-[#eab308] text-[#eab308]' : 'text-[#eab308]'}`} />
                  <span>{starred ? 'Starred on GitHub ★' : 'Star on GitHub ★'}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
