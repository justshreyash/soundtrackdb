import React from 'react';

interface SoundTrackLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  variant?: 'orange' | 'dark' | 'white';
  showBackground?: boolean;
  showOutline?: boolean;
}

/**
 * Renders the SoundTrackDB Cinema & Equalizer Emblem matching the brand identity
 */
export function SoundTrackEmblemSVG({
  className = '',
  color = '#ed462d',
  backgroundColor,
  strokeWidth = 9,
  showOutline = true,
}: {
  className?: string;
  color?: string;
  backgroundColor?: string;
  strokeWidth?: number;
  showOutline?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Optional Background fill if explicitly requested */}
      {backgroundColor && (
        <rect width="200" height="200" rx="44" fill={backgroundColor} />
      )}

      {/* Crisp Outline Container - Transparent inside, clean outline */}
      {showOutline && (
        <rect
          x="3"
          y="3"
          width="194"
          height="194"
          rx="42"
          stroke={color}
          strokeWidth="6"
          strokeOpacity={color === '#0a0a0a' ? 0.9 : 0.4}
          fill="none"
        />
      )}

      {/* Inner Screen / IC Chip Frame with Rounded Corners */}
      <rect
        x="36"
        y="32"
        width="128"
        height="136"
        rx="16"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />

      {/* Top Sprocket / Tape Perforation Dashes (2 left, 2 right) */}
      <rect x="52" y="44" width="11" height="6" rx="1.5" fill={color} />
      <rect x="71" y="44" width="11" height="6" rx="1.5" fill={color} />
      <rect x="118" y="44" width="11" height="6" rx="1.5" fill={color} />
      <rect x="137" y="44" width="11" height="6" rx="1.5" fill={color} />

      {/* Bottom Sprocket / Tape Perforation Dashes (2 left, 2 right) */}
      <rect x="52" y="150" width="11" height="6" rx="1.5" fill={color} />
      <rect x="71" y="150" width="11" height="6" rx="1.5" fill={color} />
      <rect x="118" y="150" width="11" height="6" rx="1.5" fill={color} />
      <rect x="137" y="150" width="11" height="6" rx="1.5" fill={color} />

      {/* Audio Waveform Equalizer Bars (5 segmented pixel columns) */}
      <g fill={color}>
        {/* BAR 1 (Leftmost, 5 blocks) */}
        <rect x="52" y="128" width="12" height="7" rx="1" />
        <rect x="52" y="119" width="12" height="7" rx="1" />
        <rect x="52" y="110" width="12" height="7" rx="1" />
        <rect x="52" y="101" width="12" height="7" rx="1" />
        <rect x="52" y="92" width="12" height="7" rx="1" />

        {/* BAR 2 (8 blocks) */}
        <rect x="72" y="128" width="12" height="7" rx="1" />
        <rect x="72" y="119" width="12" height="7" rx="1" />
        <rect x="72" y="110" width="12" height="7" rx="1" />
        <rect x="72" y="101" width="12" height="7" rx="1" />
        <rect x="72" y="92" width="12" height="7" rx="1" />
        <rect x="72" y="83" width="12" height="7" rx="1" />
        <rect x="72" y="74" width="12" height="7" rx="1" />
        <rect x="72" y="65" width="12" height="7" rx="1" />

        {/* BAR 3 (Center Peak - 11 blocks extending top and bottom) */}
        <rect x="94" y="142" width="12" height="7" rx="1" />
        <rect x="94" y="133" width="12" height="7" rx="1" />
        <rect x="94" y="124" width="12" height="7" rx="1" />
        <rect x="94" y="115" width="12" height="7" rx="1" />
        <rect x="94" y="106" width="12" height="7" rx="1" />
        <rect x="94" y="97" width="12" height="7" rx="1" />
        <rect x="94" y="88" width="12" height="7" rx="1" />
        <rect x="94" y="79" width="12" height="7" rx="1" />
        <rect x="94" y="70" width="12" height="7" rx="1" />
        <rect x="94" y="61" width="12" height="7" rx="1" />
        <rect x="94" y="52" width="12" height="7" rx="1" />

        {/* BAR 4 (7 blocks) */}
        <rect x="116" y="128" width="12" height="7" rx="1" />
        <rect x="116" y="119" width="12" height="7" rx="1" />
        <rect x="116" y="110" width="12" height="7" rx="1" />
        <rect x="116" y="101" width="12" height="7" rx="1" />
        <rect x="116" y="92" width="12" height="7" rx="1" />
        <rect x="116" y="83" width="12" height="7" rx="1" />
        <rect x="116" y="74" width="12" height="7" rx="1" />

        {/* BAR 5 (Rightmost, 4 blocks) */}
        <rect x="136" y="128" width="12" height="7" rx="1" />
        <rect x="136" y="119" width="12" height="7" rx="1" />
        <rect x="136" y="110" width="12" height="7" rx="1" />
        <rect x="136" y="101" width="12" height="7" rx="1" />
      </g>
    </svg>
  );
}

export function SoundTrackLogo({
  className = '',
  size = 'md',
  variant = 'orange',
  showBackground = false,
  showOutline = true,
}: SoundTrackLogoProps) {
  const getDims = () => {
    switch (size) {
      case 'sm':
        return { w: 28, h: 28, stroke: 12 };
      case 'md':
        return { w: 40, h: 40, stroke: 10 };
      case 'lg':
        return { w: 56, h: 56, stroke: 9 };
      case 'hero':
        return { w: 84, h: 84, stroke: 9 };
    }
  };

  const { w, h, stroke } = getDims();

  const color =
    variant === 'dark'
      ? '#0a0a0a'
      : variant === 'white'
      ? '#F0EDE6'
      : '#ed462d';

  // No solid white background! If background is requested for dark surfaces, use dark container
  const bgColor = showBackground
    ? variant === 'dark'
      ? undefined // NEVER white on orange!
      : '#0a0a0a'
    : undefined;

  return (
    <div style={{ width: w, height: h }} className={`shrink-0 ${className}`}>
      <SoundTrackEmblemSVG
        color={color}
        backgroundColor={bgColor}
        strokeWidth={stroke}
        showOutline={showOutline}
        className="w-full h-full"
      />
    </div>
  );
}

export function SoundTrackWordmark({
  className = '',
  dark = false,
}: {
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <SoundTrackLogo
        size="md"
        variant={dark ? 'dark' : 'orange'}
        showBackground={false}
        showOutline={true}
      />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`font-display font-normal text-xl sm:text-2xl tracking-[-0.035em] uppercase leading-none ${
              dark ? 'text-[#0a0a0a]' : 'text-[#F0EDE6]'
            }`}
          >
            SOUNDTRACK<span className={dark ? 'text-[#0a0a0a]/80' : 'text-[#ed462d]'}>DB</span>
          </span>
          <span
            className={`font-mono text-[9px] uppercase px-1.5 py-0.5 rounded font-bold tracking-widest leading-none ${
              dark
                ? 'bg-[#0a0a0a]/10 text-[#0a0a0a] border border-[#0a0a0a]/25'
                : 'bg-[#ed462d]/20 text-[#ed462d] border border-[#ed462d]/40'
            }`}
          >
            FREE API
          </span>
        </div>
        <span
          className={`font-mono text-[10px] tracking-wider uppercase mt-1 ${
            dark ? 'text-[#0a0a0a]/65 font-semibold' : 'text-[#F0EDE6]/45'
          }`}
        >
          BY CNF1G & SHREYASH
        </span>
      </div>
    </div>
  );
}
