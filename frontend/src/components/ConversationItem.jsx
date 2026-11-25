import React, { useState } from 'react';
import { MessageSquare, MoreHorizontal } from 'lucide-react';
import ConversationMenu from './ConversationMenu';

export default function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
        isActive
          ? 'bg-slate-200/80 dark:bg-[#282A2C] text-slate-900 dark:text-white font-medium'
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-[#282A2C]/60 hover:text-slate-900 dark:hover:text-white'
      }`}
      onClick={onSelect}
      title={conversation.title}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <MessageSquare
          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
            isActive
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
          }`}
        />
        <span className="truncate text-[13px] select-none">
          {conversation.title}
        </span>
      </div>

      {/* Three-dots menu trigger */}
      <div className="relative shrink-0 ml-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen((prev) => !prev);
          }}
          type="button"
          className={`p-1 rounded-lg transition-opacity cursor-pointer ${
            isActive || isMenuOpen
              ? 'opacity-100 text-slate-600 dark:text-slate-300 hover:bg-slate-300/60 dark:hover:bg-slate-700'
              : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-white'
          }`}
          title="Options"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>

        <ConversationMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onRename={onRename}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
