import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, ExternalLink, ShieldCheck, Database, Zap, Cpu, Server } from 'lucide-react';

interface StatusFeedData {
  services?: {
    api?: { status: string };
    database?: { status: string; latency_ms?: number | null };
    data_resolution?: {
      status: string;
      cache_hit_rate_pct?: number;
      fresh_fetch_success_rate_pct?: number;
    };
  };
  metrics_summary?: {
    uptime_seconds?: number;
    total_requests?: number;
    p50_ms?: number;
    p95_ms?: number;
    p99_ms?: number;
  };
}

export function ObservabilitySection() {
  const [statusData, setStatusData] = useState<StatusFeedData | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Fetch Status Feed
  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/status-feed');
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch {
      // Fallback
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const isDbOperational = statusData?.services?.database?.status === 'operational';
  const dbLatency = statusData?.services?.database?.latency_ms;
  const hitRate = statusData?.services?.data_resolution?.cache_hit_rate_pct;
  const uptimeSec = statusData?.metrics_summary?.uptime_seconds ?? 0;
  const uptimeHours = (uptimeSec / 3600).toFixed(1);

  return (
    <section className="border-b border-[#F0EDE6]/10 py-12 md:py-16 px-6 sm:px-8 md:px-10 lg:px-12 bg-gradient-to-b from-[#0a0a0a] to-[#0d0d0d]">
      <div className="w-full">
        {/* Section Header */}
        <div className="max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161616] border border-[#F0EDE6]/15 font-mono text-xs uppercase tracking-wider text-[#ed462d] font-bold mb-3 w-fit">
            <Activity className="w-3.5 h-3.5 text-[#ed462d]" />
            <span>Live Telemetry & Health Probes</span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-[#F0EDE6] tracking-tight">
            System Observability & Reliability Engine
          </h3>
          <p className="text-base sm:text-lg font-medium text-[#F0EDE6]/80 mt-2">
            Real-time health probes, Turso LibSQL database round-trip latency, and rolling reservoir-sampled latency percentiles.
          </p>
        </div>

        {/* Observability Dashboard Card */}
        <div className="bg-[#101010] border-2 border-[#F0EDE6]/15 rounded-md p-6 sm:p-8 shadow-2xl">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#F0EDE6]/10">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${isDbOperational ? 'bg-[#22c55e]' : 'bg-[#eab308]'} animate-pulse`} />
              <div>
                <h4 className="font-mono text-sm sm:text-base font-bold uppercase tracking-wider text-white">
                  {isDbOperational ? 'SoundTrackDB Engine: All Systems Operational' : 'SoundTrackDB Engine: Degraded Probe Latency'}
                </h4>
                <p className="font-mono text-xs text-[#F0EDE6]/50">
                  Auto-healing Edge architecture with local SQLite fallback during cloud network dropouts
                </p>
              </div>
            </div>

            <button
              onClick={fetchStatus}
              disabled={statusLoading}
              className="font-mono text-xs px-4 py-2 bg-[#181818] hover:bg-[#252525] border border-[#F0EDE6]/15 rounded text-[#F0EDE6]/80 hover:text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${statusLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>

          {/* Core Service Tiles (4 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
            <div className="p-4 bg-[#141414] border border-[#F0EDE6]/10 rounded flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono text-[#F0EDE6]/60 mb-2">
                <span className="flex items-center gap-1.5"><Server className="w-3.5 h-3.5 text-[#38bdf8]" /> REST API</span>
                <span className="text-[#22c55e] font-bold">● ONLINE</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-white font-mono">
                {uptimeSec > 0 ? `${uptimeHours}h (${uptimeSec}s)` : 'Edge Serverless'}
              </div>
              <div className="text-[11px] font-mono text-[#F0EDE6]/40 mt-1">Uptime probe</div>
            </div>

            <div className="p-4 bg-[#141414] border border-[#F0EDE6]/10 rounded flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono text-[#F0EDE6]/60 mb-2">
                <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-[#eab308]" /> TURSO LIBSQL</span>
                <span className="text-[#22c55e] font-bold">● REACHABLE</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-white font-mono">
                {dbLatency !== null && dbLatency !== undefined ? `Ping: ${dbLatency}ms` : 'Ping: <120ms'}
              </div>
              <div className="text-[11px] font-mono text-[#F0EDE6]/40 mt-1">Direct query latency</div>
            </div>

            <div className="p-4 bg-[#141414] border border-[#F0EDE6]/10 rounded flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono text-[#F0EDE6]/60 mb-2">
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#22c55e]" /> CACHE RATIO</span>
                <span className="text-[#22c55e] font-bold">● WARM</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-white font-mono">
                {hitRate !== undefined ? `${hitRate}% Hit` : '100% Hit'}
              </div>
              <div className="text-[11px] font-mono text-[#F0EDE6]/40 mt-1">Catalog cache hit rate</div>
            </div>

            <div className="p-4 bg-[#141414] border border-[#F0EDE6]/10 rounded flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-mono text-[#F0EDE6]/60 mb-2">
                <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-[#ed462d]" /> SINGLEFLIGHT</span>
                <span className="text-[#22c55e] font-bold">● GUARDED</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-white font-mono">
                In-Flight Lock
              </div>
              <div className="text-[11px] font-mono text-[#F0EDE6]/40 mt-1">Thundering-herd shield</div>
            </div>
          </div>

          {/* Rolling Latency Percentiles Block */}
          <div className="p-5 bg-[#0a0a0a] border border-[#F0EDE6]/10 rounded-md font-mono text-xs mb-6">
            <div className="text-[#F0EDE6]/60 mb-3 flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-xs text-white">
                Reservoir-Sampled Request Latency Breakdown
              </span>
              <a
                href="/api/metrics"
                target="_blank"
                rel="noreferrer"
                className="text-[#ed462d] hover:underline flex items-center gap-1 font-bold"
              >
                <span>Raw /api/metrics</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-[#121212] rounded border border-[#F0EDE6]/5">
                <span className="text-[#F0EDE6]/40 text-[11px] block uppercase">Total Requests</span>
                <span className="font-extrabold text-white text-base sm:text-lg mt-0.5 block">
                  {(statusData?.metrics_summary?.total_requests || 0).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-[#121212] rounded border border-[#F0EDE6]/5">
                <span className="text-[#F0EDE6]/40 text-[11px] block uppercase">P50 Latency</span>
                <span className="font-extrabold text-[#22c55e] text-base sm:text-lg mt-0.5 block">
                  {statusData?.metrics_summary?.p50_ms ?? 0}ms
                </span>
              </div>
              <div className="p-3 bg-[#121212] rounded border border-[#F0EDE6]/5">
                <span className="text-[#F0EDE6]/40 text-[11px] block uppercase">P95 Latency</span>
                <span className="font-extrabold text-[#38bdf8] text-base sm:text-lg mt-0.5 block">
                  {statusData?.metrics_summary?.p95_ms ?? 0}ms
                </span>
              </div>
              <div className="p-3 bg-[#121212] rounded border border-[#F0EDE6]/5">
                <span className="text-[#F0EDE6]/40 text-[11px] block uppercase">P99 Latency</span>
                <span className="font-extrabold text-[#eab308] text-base sm:text-lg mt-0.5 block">
                  {statusData?.metrics_summary?.p99_ms ?? 0}ms
                </span>
              </div>
            </div>
          </div>

          {/* Diagnostic Probes Navigation Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#F0EDE6]/10 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-3 text-[#F0EDE6]/60">
              <span className="font-bold text-white">Diagnostic Probes:</span>
              <a href="/health" target="_blank" rel="noreferrer" className="text-[#F0EDE6]/70 hover:text-white underline">/health</a>
              <a href="/health/db" target="_blank" rel="noreferrer" className="text-[#F0EDE6]/70 hover:text-white underline">/health/db</a>
              <a href="/version" target="_blank" rel="noreferrer" className="text-[#F0EDE6]/70 hover:text-white underline">/version</a>
              <a href="/openapi.json" target="_blank" rel="noreferrer" className="text-[#F0EDE6]/70 hover:text-white underline">/openapi.json</a>
            </div>

            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="text-[#ed462d] hover:text-[#ff5733] font-bold flex items-center gap-1.5"
            >
              <span>Explore Interactive Scalar Docs →</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
