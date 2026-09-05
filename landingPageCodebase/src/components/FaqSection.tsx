import React, { useState } from 'react';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      num: "01",
      question: "Is this really free?",
      answer: "Yes, during public beta — no API key, no sign-up, no cost. We'll introduce optional API keys later for higher limits, but the beta tier will stay free."
    },
    {
      num: "02",
      question: "What if a movie isn't in your catalog?",
      answer: "We're actively expanding coverage. You can request a title and we'll prioritize adding it within 24 hours."
    },
    {
      num: "03",
      question: "Why not just use TMDB or OMDb?",
      answer: "TMDB and OMDb give you metadata — cast, posters, ratings. They don't give you a resolved, verified Spotify soundtrack link. That's the one thing we do."
    },
    {
      num: "04",
      question: "Is there a rate limit?",
      answer: "Yes — 100 requests/minute per IP, no key required. Limit and remaining requests are returned in transparent response headers on every call."
    },
    {
      num: "05",
      question: "How do I authenticate my requests?",
      answer: "You do not need any API key, client secret, or Authorization header to query SoundTrackDB endpoints. Just make a standard HTTP GET request from your browser, server, or script directly to the endpoint URL."
    },
    {
      num: "06",
      question: "What does the confidence score in the response signify?",
      answer: "The confidence metric is a float between 0.0 and 1.0. A score of 1.0 represents an official, studio-verified soundtrack album or playlist. Scores of 0.8 signify curated community playlists."
    },
  ];

  return (
    <section id="faq" className="w-full border-b border-[#F0EDE6]/10 py-16 md:py-24 px-6 md:px-12 bg-[#0a0a0a] text-[#F0EDE6] relative">
      <div className="w-full">
        {/* Badge & Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] border border-[#F0EDE6]/10 font-mono text-[11px] uppercase tracking-wider text-[#ed462d] mb-6">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm1.07-7.75l-.9.92C12.45 11.9 12 12.5 12 14h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
            </svg>
            <span>FAQ</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-[-0.035em] text-[#F0EDE6] leading-[1.05]">
            Frequently asked questions.
          </h2>
        </div>

        {/* Accordions */}
        <div className="border-t border-[#F0EDE6]/10 divide-y divide-[#F0EDE6]/10">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={faq.num} className="transition-colors">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full py-4 sm:py-7 flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-3 sm:gap-6 pr-3">
                    <span className="font-mono text-xs text-[#ed462d] font-bold">
                      {faq.num}
                    </span>
                    <span className="text-base sm:text-xl font-bold text-[#F0EDE6] group-hover:text-white transition-colors">
                      {faq.question}
                    </span>
                  </div>

                  <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-[#F0EDE6]/15 group-hover:border-[#ed462d] transition-colors flex-shrink-0">
                    <span className={`text-sm transition-transform duration-200 ${isOpen ? "rotate-45 text-[#ed462d]" : "text-[#F0EDE6]/60"}`}>
                      +
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="pb-6 pl-6 sm:pl-12 pr-2 text-sm sm:text-lg text-[#F0EDE6]/85 leading-relaxed font-medium">
                    {faq.answer}
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
