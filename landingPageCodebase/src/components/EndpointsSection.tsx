import React, { useState } from 'react';
import { SOUNDTRACK_ENDPOINTS, EndpointItem } from '../data/soundtrackDbData';

export function EndpointsSection() {
  const [activeCategory, setActiveCategory] = useState<'all' | 'soundtracks' | 'observability'>('all');
  const [expandedId, setExpandedId] = useState<string | null>('soundtrack-imdb');

  const filteredEndpoints = activeCategory === 'all'
    ? SOUNDTRACK_ENDPOINTS
    : SOUNDTRACK_ENDPOINTS.filter(ep => ep.category === activeCategory);

  const categories = [
    { id: 'all', label: 'All Endpoints' },
    { id: 'soundtracks', label: 'Cinema Soundtracks (V1)' },
    { id: 'observability', label: 'Health & Observability' },
  ];

  return (
    <section id="endpoints" className="w-full border-b border-[#F0EDE6]/10 py-16 md:py-24 px-6 md:px-12 bg-[#0a0a0a] text-[#F0EDE6] relative">
      <div className="w-full">
        {/* Header */}
        <div className="max-w-3xl mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#F0EDE6]/10 font-mono text-[11px] uppercase tracking-wider text-[#ed462d] mb-6">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6h16v12H4z" />
            </svg>
            <span>API Directory</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.035em] text-[#F0EDE6] leading-[1.05]">
            Complete endpoint reference.
          </h2>

          <p className="mt-6 text-base sm:text-lg text-[#F0EDE6]/85 leading-relaxed font-medium">
            Production Base URL: <code className="text-[#22c55e] font-mono font-bold bg-[#141414] px-2.5 py-1 border border-[#F0EDE6]/15">https://soundtrackdb.vercel.app</code>
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 mb-8 pb-2 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all border shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-[#ed462d] text-[#0a0a0a] border-[#ed462d] font-bold shadow-md'
                  : 'bg-[#0e0e0e] text-[#F0EDE6]/70 border-[#F0EDE6]/10 hover:border-[#F0EDE6]/30 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Endpoints List */}
        <div className="border border-[#F0EDE6]/10 bg-[#0d0d0d] divide-y divide-[#F0EDE6]/10">
          {filteredEndpoints.map((ep) => {
            const isExpanded = expandedId === ep.id;
            return (
              <div key={ep.id} className="transition-colors hover:bg-[#111111]/70">
                {/* Endpoint Header Row */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : ep.id)}
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-start md:items-center gap-3 sm:gap-4 flex-1">
                    <span className="px-2.5 py-1 bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 font-mono text-xs font-bold shrink-0">
                      {ep.method}
                    </span>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span className="font-mono text-sm sm:text-base font-bold text-[#F0EDE6] group-hover:text-white">
                        {ep.path}
                        {ep.params && (
                          <span className="text-[#ed462d] font-normal text-xs">{ep.params}</span>
                        )}
                      </span>

                      {ep.tag && (
                        <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#161616] text-[#F0EDE6]/50 border border-[#F0EDE6]/10 uppercase tracking-widest w-max">
                          {ep.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 text-xs font-mono text-[#F0EDE6]/50">
                    <span className="hidden lg:inline text-[#F0EDE6]/60 max-w-sm truncate">
                      {ep.desc}
                    </span>

                    <div className="flex items-center gap-2">
                      <a
                        href="#live-tester"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="px-2.5 py-1 bg-[#141414] hover:bg-[#ed462d] hover:text-[#0a0a0a] text-[#F0EDE6]/70 border border-[#F0EDE6]/15 text-[10px] uppercase font-bold tracking-wider transition-colors"
                      >
                        Try Live →
                      </a>
                      <span className="text-sm text-[#F0EDE6]/40">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="p-6 bg-[#080808] border-t border-[#F0EDE6]/10 space-y-6 text-xs sm:text-sm">
                    <p className="text-[#F0EDE6]/70 leading-relaxed font-normal">
                      {ep.desc}
                    </p>

                    {/* Parameters Table if present */}
                    {ep.parametersDoc && ep.parametersDoc.length > 0 && (
                      <div className="space-y-2">
                        <div className="font-mono text-[11px] uppercase tracking-wider text-[#ed462d] font-bold">
                          Query Parameters:
                        </div>
                        <div className="border border-[#F0EDE6]/10 divide-y divide-[#F0EDE6]/10 bg-[#0d0d0d]">
                          {ep.parametersDoc.map((param) => (
                            <div key={param.name} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#F0EDE6]">{param.name}</span>
                                <span className="text-[#F0EDE6]/40 text-[10px]">({param.type})</span>
                              </div>
                              <div className="text-[#F0EDE6]/60 text-left sm:text-right">
                                {param.desc}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sample cURL & Response */}
                    <div className="space-y-2">
                      <div className="font-mono text-[11px] uppercase tracking-wider text-[#F0EDE6]/50">
                        Sample Response Schema:
                      </div>
                      <div className="p-4 bg-[#050505] border border-[#F0EDE6]/10 font-mono text-xs text-[#22c55e] overflow-x-auto max-h-[220px] custom-scrollbar">
                        <pre className="custom-scrollbar">{JSON.stringify(ep.sampleResponse, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
