import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square, Paperclip, FileText, X, Loader2, Mic, MicOff } from 'lucide-react';

export default function ChatInput({
  onSendMessage,
  onStopGeneration,
  isLoading,
  isUploading,
  attachedDocument,
  onFileUpload,
  onRemoveDocument
}) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  const supportsSpeech =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  // Global '/' shortcut to focus composer cleanly
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleToggleVoice = () => {
    if (!supportsSpeech) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim();
      if (transcript) {
        setInput((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || isUploading) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

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
    <div className="sticky bottom-0 z-20 bg-white dark:bg-[#131314] pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4 px-2.5 sm:px-6 transition-colors">
      {/* Subtle top fade gradient so scrolled text fades cleanly above composer */}
      <div className="pointer-events-none absolute -top-7 left-0 right-0 h-7 bg-gradient-to-t from-white dark:from-[#131314] to-transparent" />

      <div className="max-w-3xl mx-auto">
        {/* Attached Document Pill */}
        {(attachedDocument || isUploading) && (
          <div className="mb-2.5 flex items-center gap-2 px-1 animate-fadeIn">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-[#282A2C] border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium shadow-2xs">
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600 dark:text-zinc-300" />
                  <span>Extracting document text...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300 shrink-0" />
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
                    className="p-0.5 rounded-md hover:bg-zinc-200/80 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ChatGPT / Gemini / Claude Floating Pill Composer */}
        <form
          onSubmit={handleSubmit}
          className={`relative bg-[#F4F4F5] dark:bg-[#1E1F20] border ${
            isListening
              ? 'border-rose-400 dark:border-rose-500/70 ring-2 ring-rose-500/20'
              : 'border-zinc-200/90 dark:border-zinc-700/60 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-900/5 dark:focus-within:ring-white/10'
          } focus-within:bg-white dark:focus-within:bg-[#282A2C] focus-within:shadow-lg focus-within:shadow-zinc-900/5 dark:focus-within:shadow-black/30 rounded-3xl transition-all duration-200 px-3.5 py-2.5 sm:px-4 sm:py-3`}
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
              isListening
                ? 'Listening... speak now'
                : isLoading
                ? 'Askio is thinking...'
                : attachedDocument
                ? `Ask about ${attachedDocument.filename}...`
                : 'Message Askio...'
            }
            className="w-full resize-none bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 text-base sm:text-[15px] focus:outline-hidden max-h-40 sm:max-h-44 px-1 py-1 leading-relaxed"
          />

          {/* Bottom Composer Action Bar */}
          <div className="flex items-center justify-between pt-1.5 mt-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload or drag-and-drop PDF, TXT, MD, CSV, or JSON"
              >
                <Paperclip className="w-4 h-4" />
                <span className="hidden xs:inline">Attach</span>
              </button>

              <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-slate-500">
                Web • Math • Python • Docs
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {supportsSpeech && !isLoading && (
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse shadow-sm shadow-rose-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={isListening ? 'Stop dictation' : 'Voice input'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}

              {isLoading ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-200 active:scale-95 text-white dark:text-zinc-900 shadow-sm cursor-pointer transition-all"
                  title="Stop generating"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isDisabled}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
                    isDisabled
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                      : 'bg-zinc-900 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-200 active:scale-95 text-white dark:text-zinc-900 shadow-sm cursor-pointer'
                  }`}
                  title="Send message (Enter)"
                >
                  <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.25]" />
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Minimal Disclaimer */}
        <p className="text-center text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
          Askio can make mistakes and uses live tools. Check important info.
        </p>
      </div>
    </div>
  );
}
