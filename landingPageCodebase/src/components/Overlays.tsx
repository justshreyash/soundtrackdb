import React from 'react';

export function Overlays() {
  return (
    <>
      {/* Subtle CRT Scanlines */}
      <div className="scanlines" aria-hidden="true" />
      {/* Fine-grained Noise Texture */}
      <div className="noise" aria-hidden="true" />
    </>
  );
}
