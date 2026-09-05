import React from 'react';

export function StatsStrip() {
  const stats = [
    { value: "0", label: "API Keys Needed", sub: "COMPLETELY KEYLESS ACCESS" },
    { value: "100", label: "Req / Minute", sub: "TRANSPARENT BETA HEADERS" },
    { value: "<120ms", label: "Global Latency", sub: "TURSO LIBSQL EDGE CACHED" },
    { value: "100%", label: "Free Public Beta", sub: "NO SIGN-UP · NO PAYWALLS" },
  ];

  return (
    <div className="w-full bg-[#0a0a0a] border-b border-[#F0EDE6]/10">
      <div className="w-full grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#F0EDE6]/10">
        {stats.map((stat, i) => (
          <div key={i} className="p-8 sm:p-10 flex flex-col items-center text-center">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F0EDE6] font-display">
              {stat.value}
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#ed462d] mt-2">
              {stat.label}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#F0EDE6]/40 mt-1">
              {stat.sub}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
