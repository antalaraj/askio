import React, { useEffect, useRef } from 'react';
import { Edit2, Trash2 } from 'lucide-react';

export default function ConversationMenu({ isOpen, onClose, onRename, onDelete }) {
  const menuRef = useRef(null);

  // Close menu on click outside or escape key
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
      className="absolute right-2 top-8 z-50 w-36 py-1 bg-white rounded-xl shadow-lg border border-[#E2E8F0] animate-fadeIn text-xs font-medium text-[#172033]"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onClose();
          onRename();
        }}
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer text-slate-700 hover:text-blue-600"
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
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-red-50 transition-colors cursor-pointer text-red-600"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete</span>
      </button>
    </div>
  );
}
