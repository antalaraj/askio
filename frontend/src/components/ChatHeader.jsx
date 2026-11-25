import React from 'react';
import { Bot, Plus, PanelLeftOpen, Menu } from 'lucide-react';

export default function ChatHeader({
  onToggleSidebar,
  isSidebarOpen,
  onNewChat,
  backendHealth,
  activeTitle
}) {
  const isOnline = backendHealth?.status === 'healthy';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-3 sm:px-6 py-2.5">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Left side: Sidebar Toggle & App Title / Active Conversation Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            type="button"
            className="p-1.5 sm:p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isSidebarOpen ? 'Collapse sidebar' : 'Open conversations sidebar'}
          >
            <Menu className="w-5 h-5 md:hidden" />
            <PanelLeftOpen className="w-5 h-5 hidden md:block" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 hidden sm:flex items-center justify-center text-white shadow-xs shrink-0">
              <Bot className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-[#172033] tracking-tight truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                  {activeTitle || 'Askio'}
                </h1>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
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
        </div>

        {/* Right side: New Chat Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNewChat}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[#172033] bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-[#E2E8F0] px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            title="Start a new conversation"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span className="hidden xs:inline">New Chat</span>
          </button>
        </div>
      </div>
    </header>
  );
}
