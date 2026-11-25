import React from 'react';
import { Sparkles } from 'lucide-react';

export default function TypingIndicator({ statusText = 'Askio is thinking...' }) {
  return (
    <div className="flex gap-3.5 sm:gap-4 my-5 w-full justify-start items-center animate-fadeIn">
      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
        <Sparkles className="w-4 h-4 animate-pulseSoft" />
      </div>

      <div className="flex items-center gap-3 py-1.5">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-bounce"></span>
        </div>
        <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
          {statusText}
        </span>
      </div>
    </div>
  );
}
