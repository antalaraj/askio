import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Paperclip, FileText, X, Loader2 } from 'lucide-react';

export default function ChatInput({
  onSendMessage,
  isLoading,
  isUploading,
  attachedDocument,
  onFileUpload,
  onRemoveDocument
}) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || isUploading) return;

    onSendMessage(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    e.target.value = '';
  };

  const isDisabled = !input.trim() || isLoading || isUploading;

  return (
    <div className="sticky bottom-0 z-20 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#131314] dark:via-[#131314]/95 pt-3 pb-3 sm:pb-5 px-3 sm:px-6 transition-colors">
      <div className="max-w-3xl mx-auto">
        {/* Attached Document Pill */}
        {(attachedDocument || isUploading) && (
          <div className="mb-2.5 flex items-center gap-2 px-1 animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-medium shadow-2xs">
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                  <span>Extracting document text...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate max-w-[200px] sm:max-w-xs font-semibold">
                    {attachedDocument.filename}
                  </span>
                  {attachedDocument.page_count > 1 && (
                    <span className="text-[10px] opacity-80">
                      ({attachedDocument.page_count} pages)
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={onRemoveDocument}
                    className="p-0.5 rounded-md hover:bg-blue-200/60 dark:hover:bg-blue-500/30 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ChatGPT / Gemini Floating Pill Composer */}
        <form
          onSubmit={handleSubmit}
          className="relative bg-[#F4F4F5] dark:bg-[#1E1F20] border border-slate-200/80 dark:border-slate-700/60 focus-within:bg-white dark:focus-within:bg-[#282A2C] focus-within:border-slate-300 dark:focus-within:border-slate-600 focus-within:shadow-lg focus-within:shadow-slate-900/5 dark:focus-within:shadow-black/30 rounded-3xl transition-all duration-200 px-3.5 py-2.5 sm:px-4 sm:py-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.csv,.json"
            onChange={handleFileChange}
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              isLoading
                ? 'Askio is thinking...'
                : attachedDocument
                ? `Ask about ${attachedDocument.filename}...`
                : 'Message Askio...'
            }
            className="w-full resize-none bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 text-sm sm:text-[15px] focus:outline-hidden max-h-44 px-1 py-1 leading-relaxed"
          />

          {/* Bottom Composer Action Bar */}
          <div className="flex items-center justify-between pt-1.5 mt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload PDF, TXT, MD, CSV, or JSON"
              >
                <Paperclip className="w-4 h-4" />
                <span className="hidden xs:inline">Attach</span>
              </button>

              <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-slate-500">
                Web Search • Math • Python • Docs
              </span>
            </div>

            <button
              type="submit"
              disabled={isDisabled}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
                isDisabled
                  ? 'bg-slate-300/70 dark:bg-slate-700/60 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-slate-900 dark:bg-white hover:bg-blue-600 dark:hover:bg-blue-400 active:scale-95 text-white dark:text-slate-900 shadow-sm cursor-pointer'
              }`}
              title="Send message (Enter)"
            >
              <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.25]" />
            </button>
          </div>
        </form>

        {/* Minimal Disclaimer */}
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-2">
          Askio can make mistakes and uses live tools. Check important info.
        </p>
      </div>
    </div>
  );
}
