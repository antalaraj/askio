import React from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';

export default function ErrorMessage({ error, onRetry, onDismiss }) {
  if (!error) return null;

  return (
    <div className="my-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start justify-between gap-3 shadow-xs animate-fadeIn">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-red-700">
            Request Failed
          </h4>
          <p className="text-xs sm:text-sm text-red-800 mt-0.5 leading-relaxed">
            {error.message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {error.canRetry && (
          <button
            onClick={onRetry}
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-red-200 text-red-700 hover:bg-red-100/60 active:scale-95 transition-all cursor-pointer shadow-xs"
            title="Retry last message"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        )}

        <button
          onClick={onDismiss}
          type="button"
          className="p-1 rounded-md text-red-500 hover:bg-red-200/50 hover:text-red-700 transition-colors cursor-pointer"
          title="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
