import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';

export default function ChatInput({ onSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea based on input content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    // Enter without Shift submits the form
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDisabled = !input.trim() || isLoading;

  return (
    <div className="sticky bottom-0 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/95 to-transparent pt-4 pb-4 sm:pb-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="relative bg-white border border-[#E2E8F0] focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-500/15 rounded-2xl shadow-sm transition-all overflow-hidden flex flex-col"
        >
          <div className="flex items-end px-3 py-2 sm:px-4 sm:py-3 gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={isLoading ? 'Askio is thinking...' : 'Ask a question or type a message...'}
              className="w-full resize-none bg-transparent text-[#172033] placeholder-[#64748B] text-sm sm:text-base focus:outline-hidden max-h-44 py-1 leading-relaxed"
            />

            <button
              type="submit"
              disabled={isDisabled}
              className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${
                isDisabled
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-sm shadow-blue-500/30 cursor-pointer'
              }`}
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>

          <div className="hidden sm:flex items-center justify-between px-4 pb-2 pt-0 text-[11px] text-[#64748B] border-t border-slate-50">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono">
                Enter
              </kbd>
              <span>to send</span>
              <span className="mx-1">•</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono">
                Shift + Enter
              </kbd>
              <span>for new line</span>
            </span>
            <span>Askio powered by Groq Llama</span>
          </div>
        </form>
      </div>
    </div>
  );
}
