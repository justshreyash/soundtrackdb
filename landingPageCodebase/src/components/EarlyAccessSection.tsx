import React, { useState } from 'react';

export function EarlyAccessSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const baseUrl = "https://soundtrackdb.vercel.app";

  const handleCopyBaseUrl = () => {
    navigator.clipboard.writeText(baseUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid developer email');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'early_access_section' }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to subscribe');
      }
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="early-access" className="w-full border-b border-[#F0EDE6]/10 py-16 md:py-24 px-6 md:px-12 bg-[#0a0a0a] text-[#F0EDE6] relative">
      <div className="max-w-[820px] mx-auto text-center flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#F0EDE6]/10 font-mono text-[11px] uppercase tracking-wider text-[#ed462d] mb-6">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>
          <span>Developer Access</span>
        </div>

        <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] text-[#F0EDE6] leading-[1.05]">
          Start querying now.
        </h2>

        <p className="mt-6 text-base sm:text-lg md:text-xl text-[#F0EDE6]/60 leading-relaxed font-normal max-w-xl">
          Zero registration barriers. Use our live global edge URL directly in your applications or subscribe for new movie soundtrack updates.
        </p>

        {/* Instant Base URL Copy Card */}
        <div className="w-full max-w-lg mt-10 p-4 sm:p-5 border border-[#F0EDE6]/15 bg-[#0d0d0d] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="text-left font-mono text-xs">
            <div className="text-[#F0EDE6]/40 uppercase text-[10px] tracking-wider mb-1">Production Base URL</div>
            <div className="text-[#ed462d] font-bold text-xs sm:text-sm select-all break-all">{baseUrl}</div>
          </div>
          <button
            onClick={handleCopyBaseUrl}
            className="btn-chamfer bg-[#141414] hover:bg-[#ed462d] text-[#F0EDE6] hover:text-[#0a0a0a] border border-[#F0EDE6]/20 px-5 py-2.5 font-mono text-xs uppercase font-bold tracking-wider transition-colors shrink-0 text-center justify-center"
          >
            {copiedUrl ? "✓ Copied" : "Copy URL"}
          </button>
        </div>

        {/* Newsletter Form for Movie Additions */}
        <div className="w-full max-w-md mt-10">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email for soundtrack ingestion alerts"
                  className="flex-1 px-4 py-3.5 bg-[#121212] border border-[#F0EDE6]/20 text-[#F0EDE6] placeholder-[#F0EDE6]/30 font-mono text-xs focus:outline-none focus:border-[#ed462d] transition-colors"
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-chamfer bg-[#ed462d] text-[#0a0a0a] px-7 py-3.5 text-xs font-bold uppercase tracking-wider hover:bg-[#f25841] disabled:opacity-50 whitespace-nowrap"
                >
                  {loading ? "Subscribing..." : "Get Updates"}
                </button>
              </div>

              {error && (
                <div className="font-mono text-xs text-[#ed462d] text-left">
                  {error}
                </div>
              )}

              <p className="font-mono text-[11px] text-[#F0EDE6]/40 mt-2">
                We only send alerts when major cinema catalogs, endpoints, or SDKs drop. Zero spam.
              </p>
            </form>
          ) : (
            <div className="p-6 border border-[#22c55e]/40 bg-[#0e1710] text-left space-y-3">
              <div className="flex items-center gap-2 text-[#22c55e] font-mono text-sm font-bold">
                <span>✓</span>
                <span>You're subscribed to SoundTrackDB updates!</span>
              </div>
              <p className="text-xs text-[#F0EDE6]/70 leading-relaxed">
                You'll be notified whenever new films are catalogued and verified on Spotify.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
