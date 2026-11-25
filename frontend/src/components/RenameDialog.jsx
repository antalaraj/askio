import React, { useState, useEffect, useRef } from 'react';
import { Edit2, X } from 'lucide-react';

export default function RenameDialog({ isOpen, currentTitle, onSave, onCancel }) {
  const [title, setTitle] = useState(currentTitle || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle || '');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, currentTitle]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed) {
      onSave(trimmed);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-[#E2E8F0]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#172033]">
            <Edit2 className="w-4 h-4 text-blue-600" />
            <span>Rename Conversation</span>
          </div>
          <button
            onClick={onCancel}
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Conversation title..."
            maxLength={60}
            className="w-full px-3.5 py-2 border border-[#E2E8F0] rounded-xl text-sm text-[#172033] focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 mb-4"
          />

          <div className="flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-slate-700 hover:bg-slate-50 transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs shadow-blue-500/30"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
