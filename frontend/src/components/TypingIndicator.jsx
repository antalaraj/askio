import React, { useState, useEffect } from 'react';
import { AskioLogoIcon } from './AskioLogo';

export default function TypingIndicator({ statusText = 'Askio is thinking...' }) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  const phases = [
    statusText,
    'Gathering details & reasoning...',
    'Crafting a clear response...'
  ];

  useEffect(() => {
    setPhaseIndex(0);
    const t1 = setTimeout(() => setPhaseIndex(1), 2400);
    const t2 = setTimeout(() => setPhaseIndex(2), 5200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [statusText]);

  const activeText = phases[phaseIndex] || statusText;

  return (
    <div className="flex gap-2.5 sm:gap-4 my-4 sm:my-5 w-full justify-start items-start animate-messageIn">
      {/* Animated Askio Avatar with Orbital Halo */}
      <div className="relative shrink-0 mt-0.5">
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 opacity-55 blur-[3px] animate-orbitSpin pointer-events-none" />
        <AskioLogoIcon className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg shadow-xs" animated />
      </div>

      {/* Gemini/Claude-Style Shimmer & Dynamic Status */}
      <div className="flex-1 max-w-lg space-y-2.5 pt-1">
        <div className="flex items-center gap-2">
          <span
            key={activeText}
            className="text-xs sm:text-sm font-medium askio-gradient-text animate-statusSwap"
          >
            {activeText}
          </span>
        </div>

        {/* Multi-line Shimmer Skeleton */}
        <div className="space-y-2">
          <div className="h-2.5 w-11/12 rounded-full gemini-shimmer-bar" />
          <div className="h-2.5 w-3/4 rounded-full gemini-shimmer-bar [animation-delay:0.18s]" />
          <div className="h-2.5 w-1/2 rounded-full gemini-shimmer-bar [animation-delay:0.36s]" />
        </div>
      </div>
    </div>
  );
}
