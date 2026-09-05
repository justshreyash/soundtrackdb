import React from 'react';
import { Hero } from './components/Hero';
import { ProofAndQuickStart } from './components/ProofAndQuickStart';
import { ObservabilitySection } from './components/ObservabilitySection';
import { ProblemSection } from './components/ProblemSection';
import { IntroSection } from './components/IntroSection';
import { LiveTesterSection } from './components/LiveTesterSection';
import { EndpointsSection } from './components/EndpointsSection';
import { OfflineSection } from './components/OfflineSection';
import { CapabilitiesSection } from './components/CapabilitiesSection';
import { StatsStrip } from './components/StatsStrip';
import { TerminalSection } from './components/TerminalSection';
import { EarlyAccessSection } from './components/EarlyAccessSection';
import { FaqSection } from './components/FaqSection';
import { BottomCta } from './components/BottomCta';
import { Footer } from './components/Footer';
import { Overlays } from './components/Overlays';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#F0EDE6] selection:bg-[#ed462d] selection:text-white relative">
      {/* Background CRT and Film Grain Overlays */}
      <Overlays />

      {/* Main Page Layout */}
      <main className="w-full">
        {/* 1. Hero with Orange Canvas, Watermark Logo, Title & Looping Ticker */}
        <Hero />

        {/* Unified Architectural Skeleton Frame (Continuous 2 vertical lines from below Hero ticker to above Footer) */}
        <div className="relative max-w-[1200px] mx-auto border-x border-[#F0EDE6]/10 bg-[#0a0a0a]">
          {/* 2. Instant Proof Block & Quick Start Launch Suite (Must-Have Sections 2-8) */}
          <ProofAndQuickStart />

          {/* 2.5. Live Telemetry & Latency Spectrum Dashboard */}
          <ObservabilitySection />

          {/* 3. The Problem: Audio Telemetry Radar & 4 Commercial API Choke Points */}
          <ProblemSection />

          {/* 4. Introducing SoundTrackDB: Animated Orange Packets & Open Data Pipeline */}
          <IntroSection />

          {/* 5. Interactive Live API Console: Test queries live right in browser */}
          <LiveTesterSection />

          {/* 6. Complete Endpoints Directory: All 12 endpoints with query docs */}
          <EndpointsSection />

          {/* 7. Severed Bureaucracy: Keyless & 100 req/min Beta Architecture */}
          <OfflineSection />

          {/* 8. System Capabilities: 6 Core Engineering Modules */}
          <CapabilitiesSection />

          {/* 9. High-Impact Stats Strip: 0 Keys, <120ms Latency, 100 req/min */}
          <StatsStrip />

          {/* 10. Developer Integration: Blueprint & Animated CRT Terminal */}
          <TerminalSection />

          {/* 11. Developer Access: Direct Base URL & Release Notifications */}
          <EarlyAccessSection />

          {/* 12. Frequently Asked Questions Accordion */}
          <FaqSection />

          {/* 13. Perspective Wireframe Audio Wormhole CTA */}
          <BottomCta />
        </div>
      </main>

      {/* 14. Engineering Footer with CNF1G & Shreyash Credits */}
      <Footer />
    </div>
  );
}
