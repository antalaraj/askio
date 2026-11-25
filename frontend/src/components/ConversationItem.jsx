import React, { useState } from 'react';
import { MessageSquare, MoreVertical } from 'lucide-react';
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
      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
        isActive
          ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/70 shadow-xs'
          : 'text-[#334155] hover:bg-slate-100 hover:text-[#0F172A]'
      }`}
      onClick={onSelect}
      title={conversation.title}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <MessageSquare
          className={`w-4 h-4 shrink-0 transition-colors ${
            isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
          }`}
        />
        <span className="truncate text-xs sm:text-sm font-normal select-none">
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
          className={`p-1 rounded-md transition-opacity ${
            isActive || isMenuOpen
              ? 'opacity-100 text-slate-600 hover:bg-blue-100/60'
              : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700'
          }`}
          title="More actions"
        >
          <MoreVertical className="w-3.5 h-3.5" />
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
