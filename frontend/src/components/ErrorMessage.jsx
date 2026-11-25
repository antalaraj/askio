import React from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';

export default function ErrorMessage({ error, onRetry, onDismiss }) {
  if (!error) return null;

  return (
    <div className="my-4 px-4 py-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-200 flex items-start justify-between gap-3 shadow-xs animate-fadeIn">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
            Something went wrong
          </h4>
          <p className="text-xs sm:text-sm text-red-800 dark:text-red-200 mt-0.5 leading-relaxed">
            {error.message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {error.canRetry && (
          <button
            onClick={onRetry}
            type="button"
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-[#282A2C] border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 hover:bg-red-100/60 dark:hover:bg-red-900/40 active:scale-95 transition-all cursor-pointer shadow-2xs"
            title="Retry last message"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        )}

        <button
          onClick={onDismiss}
          type="button"
          className="p-1.5 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-200/50 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
