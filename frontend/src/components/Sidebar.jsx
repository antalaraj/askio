import React, { useState, useMemo } from 'react';
import { SquarePen, PanelLeftClose, Search, X } from 'lucide-react';
import { AskioLogoIcon, AskioWordmark } from './AskioLogo';
import ConversationItem from './ConversationItem';
import { groupConversationsByDate } from '../utils/conversationUtils';

export default function Sidebar({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onOpenRename,
  onOpenDelete
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  const grouped = groupConversationsByDate(filteredConversations);

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* ChatGPT / Gemini style Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 bg-[#F9F9F9] dark:bg-[#1E1F20] border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col transition-all duration-200 ease-in-out shrink-0 ${
          isOpen
            ? 'w-[82vw] max-w-[288px] md:w-72 translate-x-0'
            : 'w-[82vw] max-w-[288px] -translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden md:border-r-0'
        }`}
      >
        {/* Top Row: Brand & Collapse */}
        <div className="flex items-center justify-between px-3.5 py-3">
          <div className="flex items-center gap-2.5 px-1">
            <AskioLogoIcon className="w-7 h-7 rounded-lg shadow-xs shrink-0" />
            <AskioWordmark className="text-base" />
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Action Pill */}
        <div className="px-3 pb-2">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) {
                onClose();
              }
            }}
            type="button"
            className="w-full flex items-center gap-2.5 py-2.5 px-3.5 rounded-xl bg-white dark:bg-[#282A2C] hover:bg-slate-100 dark:hover:bg-[#333537] border border-slate-200/80 dark:border-slate-700/60 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 shadow-2xs transition-all cursor-pointer group"
          >
            <SquarePen className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform" />
            <span>New chat</span>
          </button>
        </div>

        {/* Search Input (shown when user has multiple conversations) */}
        {conversations.length > 2 && (
          <div className="px-3 pb-2">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-7 py-2 md:py-1.5 rounded-lg bg-slate-200/50 dark:bg-[#282A2C]/60 border border-transparent focus:border-slate-300 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-[#282A2C] text-base md:text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Conversation History List */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-5">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-10 px-4 text-xs text-slate-400 dark:text-slate-500">
              {searchQuery ? 'No matching conversations.' : 'Your conversations will appear here.'}
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2.5 pb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.conversations.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === activeConversationId}
                      onSelect={() => {
                        onSelectConversation(conv.id);
                        if (window.innerWidth < 768) {
                          onClose();
                        }
                      }}
                      onRename={() => onOpenRename(conv)}
                      onDelete={() => onOpenDelete(conv)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Minimalist Footer */}
        <div className="px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-200/70 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Askio AI</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-[#282A2C] text-[10px] font-medium text-slate-600 dark:text-slate-300">
            Tools Ready
          </span>
        </div>
      </aside>
    </>
  );
}
