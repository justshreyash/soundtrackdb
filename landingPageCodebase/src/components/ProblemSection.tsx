import React, { useEffect, useRef, useState, useCallback } from 'react';

export function ProblemSection() {
  const eyeRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pupil, setPupil] = useState({ x: 240, y: 240, r: 14, glow: 0.8 });
  const [isBlinking, setIsBlinking] = useState(false);
  const [glitchStyle, setGlitchStyle] = useState<React.CSSProperties>({});
  
  // Animation and physics state stored in refs for 60/120fps fluid tracking
  const targetPos = useRef({ x: 240, y: 240 });
  const currentPos = useRef({ x: 240, y: 240 });
  const currentRadius = useRef(14);
  const targetRadius = useRef(14);
  const currentGlow = useRef(0.8);
  const targetGlow = useRef(0.8);
  const rafId = useRef<number | null>(null);
  const lastMouseTime = useRef<number>(Date.now());

  // Mouse move listener across window with physics normalization
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!eyeRef.current) return;
      lastMouseTime.current = Date.now();
      const rect = eyeRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist === 0) return;

      // Elliptical boundary constraint matching eye shape
      const angle = Math.atan2(dy, dx);
      // Eye aperture is wider horizontally than vertically
      const maxRangeX = 25; // max horizontal pupil displacement
      const maxRangeY = 15; // max vertical pupil displacement
      
      // Proportional travel based on distance
      const distanceFactor = Math.min(dist / 240, 1);
      
      targetPos.current = {
        x: 240 + Math.cos(angle) * maxRangeX * distanceFactor,
        y: 240 + Math.sin(angle) * maxRangeY * distanceFactor,
      };

      // Dilate pupil & boost luminescence when cursor comes close
      if (dist < 180) {
        targetRadius.current = 15.5;
        targetGlow.current = 1.2;
      } else {
        targetRadius.current = 13.5;
        targetGlow.current = 0.8;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Continuous LERP (Linear Interpolation) loop for ultra-smooth 60/120fps tracking
  useEffect(() => {
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const animate = () => {
      // Natural subtle idle micro-saccades if mouse hasn't moved for a bit
      const timeSinceMouse = Date.now() - lastMouseTime.current;
      let targetX = targetPos.current.x;
      let targetY = targetPos.current.y;

      if (timeSinceMouse > 3000) {
        const t = Date.now() * 0.0012;
        targetX += Math.sin(t * 1.5) * 1.8;
        targetY += Math.cos(t * 2.1) * 0.9;
      }

      // Smooth dampening towards target
      currentPos.current.x = lerp(currentPos.current.x, targetX, 0.12);
      currentPos.current.y = lerp(currentPos.current.y, targetY, 0.12);
      currentRadius.current = lerp(currentRadius.current, targetRadius.current, 0.1);
      currentGlow.current = lerp(currentGlow.current, targetGlow.current, 0.1);

      setPupil({
        x: currentPos.current.x,
        y: currentPos.current.y,
        r: currentRadius.current,
        glow: currentGlow.current,
      });

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Realistic organic blinking & chromatic scan twitch
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const triggerBlink = () => {
      // Subtle chromatic glitch twitch
      const glitchActive = Math.random() < 0.35;
      if (glitchActive) {
        setGlitchStyle({
          filter: `hue-rotate(${Math.random() * 30 - 15}deg) brightness(1.2)`,
          transform: `translate(${(Math.random() - 0.5) * 2}px, ${(Math.random() - 0.5) * 1.5}px)`,
        });
        setTimeout(() => setGlitchStyle({}), 180);
      }

      // Primary eyelid close & open
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 150);

      // Occasional double-blink
      if (Math.random() < 0.28) {
        setTimeout(() => {
          setIsBlinking(true);
          setTimeout(() => setIsBlinking(false), 130);
        }, 320);
      }

      // Next blink in 4 to 8 seconds
      const nextDelay = 4000 + Math.random() * 4500;
      timeoutId = setTimeout(triggerBlink, nextDelay);
    };

    timeoutId = setTimeout(triggerBlink, 3500);
    return () => clearTimeout(timeoutId);
  }, []);

  const cards = [
    {
      label: "DASHBOARD GATEKEEPING",
      num: "001",
      title: "Mandatory app reviews & quotas.",
      mobileBody: "Wait weeks for developer permissions, quota limits, and licensing blocks before testing queries.",
      body: "Want to search music? Wait weeks for Spotify developer approval, restricted scopes, and commercial licensing hurdles before you can even query track metadata.",
    },
    {
      label: "AUTHENTICATION CHAOS",
      num: "002",
      title: "Complex OAuth workflows.",
      mobileBody: "Commercial credentials expire frequently, crashing servers without complex refresh logic.",
      body: "Complex OAuth client credentials workflows break production setups. Constant token refresh loops, secrets rotation, and unexpected permission crashes.",
    },
    {
      label: "DATA FRAGMENTATION",
      num: "003",
      title: "Films and tracks live in silos.",
      mobileBody: "IMDb and TMDB track films, Spotify hosts audio. No unified API existed to bridge them.",
      body: "IMDb and TMDB track the movies; Spotify hosts the audio. There has been no unified, programmatic bridge to resolve a film to its exact verified soundtrack without manual scraping.",
    },
    {
      label: "HARSH RATE LIMITS",
      num: "004",
      title: "They throttle your launches.",
      mobileBody: "Traffic spikes trigger sudden 429 Too Many Requests errors that freeze production.",
      body: "A single traffic spike on Product Hunt triggers instant 429 Too Many Requests errors. Your app freezes because upstream commercial APIs decide you've had enough.",
    },
  ];

  return (
    <section id="problem" className="w-full border-b border-[#F0EDE6]/10 bg-[#0a0a0a] text-[#F0EDE6] relative">
      {/* Top Header inside box - Compact & proportional to reference image */}
      <div className="py-7 px-6 sm:py-9 sm:px-8 md:py-10 md:px-12 border-b border-[#F0EDE6]/10 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#161616] border border-[#F0EDE6]/10 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[#ed462d] mb-3 sm:mb-4">
          <span className="text-xs">✕</span>
          <span>The Problem</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold tracking-[-0.04em] text-[#F0EDE6] leading-[1.04]">
          Commercial music APIs are locked down.
          <br className="hidden sm:inline" />
          {" "}And developer access is choked.
        </h2>
      </div>

      {/* 3-Column Architecture: 1-column Eye radar (left) + 2x2 cards (right) exactly matching Image 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#F0EDE6]/10">
        {/* Left Column: Surveillance Telemetry & Acoustic Radar (tight padding, no blank top/bottom space) */}
        <div 
          ref={containerRef}
          className="lg:col-span-1 flex items-center justify-center p-3 sm:p-6 lg:p-6 relative overflow-hidden bg-[#0a0a0a] min-h-[260px] sm:min-h-[360px] lg:min-h-[420px]"
        >
          {/* Ambient subtle background glow */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(237,70,45,0.04)_0%,transparent_70%)]" />

          <div className="relative w-full max-w-[270px] sm:max-w-[350px] lg:max-w-[390px] aspect-square flex items-center justify-center">
            <svg
              ref={eyeRef}
              viewBox="0 0 480 480"
              className="w-full h-full select-none"
              style={glitchStyle}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Immersive radial glow filter for the eye pupil */}
                <radialGradient id="pupilGlowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FF4D30" stopOpacity="0.9" />
                  <stop offset="40%" stopColor="#ED462D" stopOpacity="0.5" />
                  <stop offset="70%" stopColor="#ED462D" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#ED462D" stopOpacity="0" />
                </radialGradient>

                {/* Pupil drop shadow */}
                <filter id="eyeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Surveillance Radar Linework Group */}
              <g opacity="0.28" className="transition-opacity duration-300">
                {/* Concentric Sonar Rings */}
                <circle cx="240" cy="240" r="220" stroke="#F0EDE6" strokeWidth="0.5" />
                <circle cx="240" cy="240" r="180" stroke="#F0EDE6" strokeWidth="0.5" strokeDasharray="5 5" />
                <circle cx="240" cy="240" r="140" stroke="#F0EDE6" strokeWidth="0.5" />
                <circle cx="240" cy="240" r="100" stroke="#F0EDE6" strokeWidth="0.5" strokeDasharray="4 4" />
                <circle cx="240" cy="240" r="60" stroke="#F0EDE6" strokeWidth="0.5" />

                {/* Continuous Rotating Radar Sector Beam */}
                <g className="origin-center animate-[spin_10s_linear_infinite]">
                  <path d="M240 240 L240 60 A180 180 0 0 1 380 145 Z" fill="#F0EDE6" opacity="0.04" />
                </g>

                {/* Primary Crosshairs */}
                <line x1="240" y1="0" x2="240" y2="480" stroke="#F0EDE6" strokeWidth="0.35" />
                <line x1="0" y1="240" x2="480" y2="240" stroke="#F0EDE6" strokeWidth="0.35" />
                
                {/* Diagonal Crosshairs */}
                <line x1="70" y1="70" x2="410" y2="410" stroke="#F0EDE6" strokeWidth="0.3" strokeDasharray="4 4" />
                <line x1="410" y1="70" x2="70" y2="410" stroke="#F0EDE6" strokeWidth="0.3" strokeDasharray="4 4" />

                {/* Outer Perimeter Ticks */}
                <g stroke="#F0EDE6" strokeWidth="0.4">
                  <line x1="240" y1="20" x2="240" y2="35" />
                  <line x1="295" y1="27" x2="289" y2="41" />
                  <line x1="343" y1="55" x2="332" y2="66" />
                  <line x1="460" y1="240" x2="445" y2="240" />
                  <line x1="343" y1="425" x2="332" y2="414" />
                  <line x1="295" y1="453" x2="289" y2="439" />
                  <line x1="240" y1="460" x2="240" y2="445" />
                  <line x1="185" y1="453" x2="191" y2="439" />
                  <line x1="137" y1="425" x2="148" y2="414" />
                  <line x1="20" y1="240" x2="35" y2="240" />
                  <line x1="137" y1="55" x2="148" y2="66" />
                  <line x1="185" y1="27" x2="191" y2="41" />
                </g>

                {/* Outer HUD Corner Brackets */}
                <g stroke="#F0EDE6" strokeWidth="0.75" fill="none">
                  <polyline points="40,70 40,40 70,40" />
                  <polyline points="410,40 440,40 440,70" />
                  <polyline points="440,410 440,440 410,440" />
                  <polyline points="70,440 40,440 40,410" />
                </g>

                {/* Dashed Rays with Target Anchor Points */}
                <g stroke="#F0EDE6" strokeWidth="0.25" strokeDasharray="3 6">
                  <line x1="240" y1="205" x2="110" y2="90" />
                  <line x1="240" y1="205" x2="370" y2="90" />
                  <line x1="240" y1="275" x2="110" y2="390" />
                  <line x1="240" y1="275" x2="370" y2="390" />
                  <line x1="205" y1="240" x2="60" y2="180" />
                  <line x1="275" y1="240" x2="420" y2="180" />
                  <line x1="205" y1="240" x2="60" y2="300" />
                  <line x1="275" y1="240" x2="420" y2="300" />
                </g>

                {/* Coordinate Nodes */}
                <g fill="#F0EDE6" opacity="0.6">
                  <circle cx="110" cy="90" r="2.5" />
                  <circle cx="370" cy="90" r="2.5" />
                  <circle cx="110" cy="390" r="2.5" />
                  <circle cx="370" cy="390" r="2.5" />
                  <circle cx="60" cy="180" r="2" />
                  <circle cx="420" cy="180" r="2" />
                  <circle cx="60" cy="300" r="2" />
                  <circle cx="420" cy="300" r="2" />
                </g>

                {/* Technical Radar Typography */}
                <text
                  x="240"
                  y="472"
                  textAnchor="middle"
                  fill="#F0EDE6"
                  opacity="0.75"
                  fontFamily="'Chivo Mono', monospace"
                  fontSize="6.5"
                  letterSpacing="0.25em"
                >
                  429 RATE LIMIT BLOCKED
                </text>
                <text
                  x="465"
                  y="240"
                  textAnchor="middle"
                  fill="#F0EDE6"
                  opacity="0.55"
                  fontFamily="'Chivo Mono', monospace"
                  fontSize="5.5"
                  letterSpacing="0.2em"
                  transform="rotate(90, 465, 240)"
                >
                  AUDIO SILOS
                </text>
              </g>

              {/* Acoustic Eyelid Aperture (Blinks dynamically) */}
              <g
                className="transition-transform duration-100 origin-center"
                style={{
                  transform: isBlinking ? 'scaleY(0.06)' : 'scaleY(1)',
                  transformOrigin: '240px 240px'
                }}
              >
                {/* Outer Eye Lens */}
                <path
                  d="M120 240 C120 240 180 170 240 170 C300 170 360 240 360 240 C360 240 300 310 240 310 C180 310 120 240 120 240Z"
                  stroke="#F0EDE6"
                  strokeWidth="1.1"
                  opacity="0.8"
                  fill="none"
                />
                
                {/* Concentric Iris Scope */}
                <circle
                  cx="240"
                  cy="240"
                  r="36"
                  stroke="#F0EDE6"
                  strokeWidth="0.75"
                  strokeDasharray="4 3"
                  opacity="0.45"
                  fill="none"
                />
              </g>

              {/* Glowing Dynamic Tracking Pupil */}
              <g
                className="origin-center"
                style={{
                  transform: isBlinking ? 'scaleY(0.08)' : 'scaleY(1)',
                  transformOrigin: `${pupil.x}px ${pupil.y}px`,
                  transition: 'transform 90ms ease-out'
                }}
              >
                {/* 1. Large Ambient Radiant Halo */}
                <circle
                  cx={pupil.x}
                  cy={pupil.y}
                  r={pupil.r * 2.8}
                  fill="url(#pupilGlowGrad)"
                  opacity={pupil.glow}
                />

                {/* 2. Iris Orbit Ring */}
                <circle
                  cx={pupil.x}
                  cy={pupil.y}
                  r={pupil.r * 1.5}
                  stroke="#ED462D"
                  strokeWidth="0.6"
                  strokeDasharray="2 3"
                  opacity={pupil.glow * 0.7}
                  fill="none"
                />

                {/* 3. Solid Vibrant Glowing Pupil Core */}
                <circle
                  cx={pupil.x}
                  cy={pupil.y}
                  r={pupil.r}
                  fill="#ED462D"
                  filter="url(#eyeGlow)"
                />

                {/* 4. Internal Iris Micro-Aperture */}
                <circle
                  cx={pupil.x}
                  cy={pupil.y}
                  r={pupil.r * 0.45}
                  fill="#0a0a0a"
                  opacity="0.35"
                />
                
                {/* 5. Crisp Specular Reflection Highlight */}
                <circle
                  cx={pupil.x - pupil.r * 0.3}
                  cy={pupil.y - pupil.r * 0.3}
                  r={pupil.r * 0.22}
                  fill="#FFFFFF"
                  opacity="0.75"
                />
              </g>
            </svg>
          </div>
        </div>

        {/* Right 2 Columns: 2x2 Feature Problem Cards (compact & balanced with the eye) */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#F0EDE6]/10">
          {cards.map((card, i) => (
            <div 
              key={card.num} 
              className={`p-5 sm:p-7 md:p-8 flex flex-col justify-between transition-colors hover:bg-[#111111] ${
                i >= 2 ? "sm:border-t sm:border-[#F0EDE6]/10" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between font-mono text-[10px] sm:text-[11px] mb-3 sm:mb-5">
                  <span className="text-[#ed462d] font-bold tracking-widest uppercase">
                    {card.label}
                  </span>
                  <span className="text-[#F0EDE6]/25 tracking-widest font-mono">
                    {card.num}
                  </span>
                </div>

                <h3 className="text-base sm:text-xl md:text-[22px] font-extrabold tracking-tight text-[#F0EDE6] leading-snug mb-2 sm:mb-3">
                  {card.title}
                </h3>

                <p className="text-xs sm:text-sm md:text-[15px] text-[#F0EDE6]/85 leading-relaxed font-medium">
                  <span className="sm:hidden">{card.mobileBody}</span>
                  <span className="hidden sm:inline">{card.body}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

