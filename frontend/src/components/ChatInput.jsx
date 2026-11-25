import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, FileText, X, Loader2 } from 'lucide-react';

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

  // Auto-resize textarea based on input content
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
    // Reset input so same file can be re-selected if removed
    e.target.value = '';
  };

  const isDisabled = !input.trim() || isLoading || isUploading;

  return (
    <div className="sticky bottom-0 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/95 to-transparent pt-3 pb-4 sm:pb-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Attached Document Pill */}
        {(attachedDocument || isUploading) && (
          <div className="mb-2 flex items-center gap-2 animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium shadow-xs">
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Extracting document text...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate max-w-[200px] sm:max-w-xs font-semibold">
                    {attachedDocument.filename}
                  </span>
                  {attachedDocument.page_count > 1 && (
                    <span className="text-[10px] text-blue-500">
                      ({attachedDocument.page_count} pages)
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={onRemoveDocument}
                    className="p-0.5 rounded-md hover:bg-blue-200/60 text-blue-600 transition-colors cursor-pointer"
                    title="Remove attached document"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="relative bg-white border border-[#E2E8F0] focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-500/15 rounded-2xl shadow-sm transition-all overflow-hidden flex flex-col"
        >
          <div className="flex items-end px-2.5 py-2 sm:px-3.5 sm:py-2.5 gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.csv,.json"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach PDF, TXT, MD, CSV, or JSON document"
            >
              <Paperclip className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

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
                  ? `Ask a question about ${attachedDocument.filename}...`
                  : 'Ask anything — web search, math, code, weather, or upload a file...'
              }
              className="w-full resize-none bg-transparent text-[#172033] placeholder-[#64748B] text-sm sm:text-base focus:outline-hidden max-h-44 py-1.5 leading-relaxed"
            />

            <button
              type="submit"
              disabled={isDisabled}
              className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${
                isDisabled
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-sm shadow-blue-500/30 cursor-pointer'
              }`}
              title="Send message (Enter)"
            >
              <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>

          <div className="hidden sm:flex items-center justify-between px-4 pb-2 pt-0 text-[11px] text-[#64748B] border-t border-slate-50">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono">
                Enter
              </kbd>
              <span>to send</span>
              <span className="mx-1">•</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-100 border border-slate-200 rounded text-slate-600 font-mono">
                Shift + Enter
              </kbd>
              <span>for new line</span>
            </span>
            <span>Askio • Tools & Groq AI</span>
          </div>
        </form>
      </div>
    </div>
  );
}
