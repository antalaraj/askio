import React from 'react';
import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 sm:gap-4 my-4 w-full justify-start items-center animate-fadeIn">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
        <Bot className="w-4 h-4 animate-pulse" />
      </div>

      <div className="bg-white border border-[#E2E8F0] shadow-xs rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-3">
        {/* Animated bouncing dots */}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
        </div>
        <span className="text-xs sm:text-sm font-medium text-[#64748B]">
          Askio is thinking...
        </span>
      </div>
    </div>
  );
}
