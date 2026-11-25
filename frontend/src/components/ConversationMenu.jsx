import React, { useEffect, useRef } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export default function ConversationMenu({ isOpen, onClose, onRename, onDelete }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-7 z-50 w-36 py-1 bg-white dark:bg-[#282A2C] rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fadeIn text-xs font-medium"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onClose();
          onRename();
        }}
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
      >
        <Edit2 className="w-3.5 h-3.5" />
        <span>Rename</span>
      </button>

      <button
        onClick={() => {
          onClose();
          onDelete();
        }}
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete</span>
      </button>
    </div>
  );
}
