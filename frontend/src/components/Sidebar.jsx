import React from 'react';
import { Bot, Plus, PanelLeftClose, Sparkles } from 'lucide-react';
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
  const grouped = groupConversationsByDate(conversations);

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 bg-slate-50 border-r border-[#E2E8F0] flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:-ml-72'
        }`}
      >
        {/* Top Header & Branding */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E2E8F0] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-[#172033] tracking-tight">
                Askio
              </span>
              <span className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold tracking-wide uppercase">
                <Sparkles className="w-2.5 h-2.5" />
                AI Assistant
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              // On mobile, close sidebar after starting a new chat
              if (window.innerWidth < 768) {
                onClose();
              }
            }}
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100/80 active:bg-slate-200 border border-[#E2E8F0] text-sm font-semibold text-[#172033] shadow-xs transition-all cursor-pointer hover:border-blue-500/30 group"
          >
            <Plus className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
          <div className="px-2 pt-1 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            Your Conversations
          </div>

          {conversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-slate-400">
              No conversations yet. Start one above!
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2 text-[10px] font-semibold text-slate-400 tracking-wide">
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

        {/* Footer */}
        <div className="p-3 border-t border-[#E2E8F0] bg-white text-[11px] text-slate-500 flex items-center justify-between">
          <span>Askio v1.0</span>
          <span className="text-slate-400">• Groq Llama</span>
        </div>
      </aside>
    </>
  );
}
