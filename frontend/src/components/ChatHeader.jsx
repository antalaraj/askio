import React from 'react';
import { Bot, Plus, Sparkles } from 'lucide-react';

export default function ChatHeader({ onNewChat, backendHealth }) {
  const isOnline = backendHealth?.status === 'healthy';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 py-3 sm:px-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight">
                AskAnything
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                <Sparkles className="w-3 h-3" />
                AI Assistant
              </span>
            </div>
            {/* Status indicator */}
            <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
              <span className="relative flex h-2 w-2">
                {isOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isOnline ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                ></span>
              </span>
              <span>{isOnline ? 'Active & Ready' : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        {/* Action Button: New Chat */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNewChat}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#172033] bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-[#E2E8F0] px-3 sm:px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            title="Start a new conversation"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>New Chat</span>
          </button>
        </div>
      </div>
    </header>
  );
}
