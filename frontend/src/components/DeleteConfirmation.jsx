import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function DeleteConfirmation({ isOpen, conversationTitle, onConfirm, onCancel }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-[#E2E8F0]">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172033]">
              Delete conversation?
            </h3>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              This will permanently delete{' '}
              <span className="font-semibold text-slate-800">
                "{conversationTitle}"
              </span>{' '}
              and all of its messages. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 text-xs mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl border border-[#E2E8F0] text-slate-700 hover:bg-slate-50 transition-colors font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-95 transition-all cursor-pointer shadow-xs shadow-red-500/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
