import React from 'react';
import { AskioLogoIcon } from './AskioLogo';

export default function TypingIndicator({ statusText = 'Askio is thinking...' }) {
  return (
    <div className="flex gap-3.5 sm:gap-4 my-5 w-full justify-start items-start animate-messageIn">
      {/* Animated Askio Avatar with Orbital Halo */}
      <div className="relative shrink-0 mt-0.5">
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 opacity-50 blur-[3px] animate-orbitSpin pointer-events-none" />
        <AskioLogoIcon className="relative w-8 h-8 rounded-lg shadow-xs" animated />
      </div>

      {/* Gemini-Style Shimmer & Status Indicator */}
      <div className="flex-1 max-w-lg space-y-2.5 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-medium askio-gradient-text">
            {statusText}
          </span>
        </div>

        {/* Sleek Shimmer Bars */}
        <div className="space-y-2">
          <div className="h-2.5 w-4/5 rounded-full gemini-shimmer-bar" />
          <div className="h-2.5 w-3/5 rounded-full gemini-shimmer-bar [animation-delay:0.2s]" />
        </div>
      </div>
    </div>
  );
}
