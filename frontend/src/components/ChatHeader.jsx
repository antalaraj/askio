import React from 'react';
import { SquarePen, PanelLeftOpen, Menu, MapPin, Sun, Moon, Sparkles, Download } from 'lucide-react';

export default function ChatHeader({
  onToggleSidebar,
  isSidebarOpen,
  onNewChat,
  backendHealth,
  activeTitle,
  locationInfo,
  onRequestLocation,
  theme,
  onToggleTheme,
  hasMessages,
  onExportChat
}) {
  const isOnline = backendHealth?.status === 'healthy';
  const hasLocation = Boolean(locationInfo?.location);
  const locationText = locationInfo?.location?.city || (hasLocation ? 'Location On' : 'Location');

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/80 dark:bg-[#131314]/85 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/70 px-3 sm:px-5 flex items-center justify-between transition-colors">
      {/* Left side: Sidebar Toggle & Model/Chat Title Pill */}
      <div className="flex items-center gap-2 min-w-0">
        {!isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            type="button"
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282A2C] transition-colors cursor-pointer"
            title="Open sidebar"
          >
            <Menu className="w-5 h-5 md:hidden" />
            <PanelLeftOpen className="w-5 h-5 hidden md:block" />
          </button>
        )}

        {/* Mobile menu button always accessible when closed */}
        {isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            type="button"
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282A2C] transition-colors cursor-pointer md:hidden"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 min-w-0 px-2 py-1 rounded-xl">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 hidden sm:block" />
          <h1 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 tracking-tight truncate max-w-[160px] sm:max-w-xs md:max-w-md">
            {activeTitle && activeTitle !== 'New Conversation' ? activeTitle : 'Askio'}
          </h1>

          {/* Subtle status dot */}
          <span
            className="relative flex h-2 w-2 shrink-0 ml-1"
            title={isOnline ? 'Askio AI Online' : 'Connecting to backend...'}
          >
            {isOnline && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isOnline ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            ></span>
          </span>
        </div>
      </div>

      {/* Right side: Location, Theme Toggle & Quick New Chat */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Browser Geolocation Permission Button */}
        <button
          onClick={onRequestLocation}
          type="button"
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
            hasLocation
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-500/30'
              : 'bg-slate-50 dark:bg-[#1E1F20] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-[#282A2C]'
          }`}
          title={hasLocation ? `Location active: ${locationText}` : 'Enable browser location for live weather'}
        >
          <MapPin className={`w-3.5 h-3.5 ${hasLocation ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
          <span className="hidden sm:inline max-w-[110px] truncate">{locationText}</span>
        </button>

        {/* Export Conversation Button */}
        {hasMessages && onExportChat && (
          <button
            onClick={onExportChat}
            type="button"
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282A2C] transition-colors cursor-pointer"
            title="Export conversation as Markdown"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          type="button"
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#282A2C] transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Quick New Chat Button (shown when sidebar is collapsed or on mobile) */}
        {!isSidebarOpen && (
          <button
            onClick={onNewChat}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#282A2C] hover:bg-slate-200/70 dark:hover:bg-[#333537] px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
            title="New chat"
          >
            <SquarePen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">New chat</span>
          </button>
        )}
      </div>
    </header>
  );
}
