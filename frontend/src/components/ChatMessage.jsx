import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Pencil,
  RotateCcw,
  Globe,
  Calculator,
  Terminal,
  CloudSun,
  Clock,
  FileText,
  ExternalLink
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const TOOL_LABELS = {
  web_search: { label: 'Web Search', icon: Globe },
  calculate: { label: 'Calculator', icon: Calculator },
  execute_python: { label: 'Python Sandbox', icon: Terminal },
  fetch_webpage: { label: 'Webpage Reader', icon: Globe },
  get_weather: { label: 'Live Weather', icon: CloudSun },
  get_current_datetime: { label: 'Date & Time', icon: Clock }
};

function CodeBlock({ language, value }) {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {}
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/70 bg-[#0d1117] text-slate-100 shadow-xs">
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#161b22] border-b border-slate-700/60 text-[11px] font-mono text-slate-400">
        <span className="uppercase tracking-wider">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopyCode}
          className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          {copiedCode ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-sans font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="font-sans font-medium">Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs sm:text-[13px] leading-relaxed font-mono">
        <code>{value}</code>
      </pre>
    </div>
  );
}

export default function ChatMessage({
  message,
  onEditMessage,
  onRegenerate,
  isLoading
}) {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const editTextareaRef = useRef(null);

  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      editTextareaRef.current.style.height = 'auto';
      editTextareaRef.current.style.height = `${Math.min(editTextareaRef.current.scrollHeight, 220)}px`;
    }
  }, [isEditing, editText]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleStartEdit = () => {
    setEditText(message.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.content);
  };

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || isLoading) return;
    setIsEditing(false);
    if (onEditMessage && trimmed !== message.content) {
      onEditMessage(message.id, trimmed);
    } else if (onEditMessage && trimmed === message.content) {
      // Even if unchanged, allow re-submitting to re-run from this message
      onEditMessage(message.id, trimmed);
    }
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const formattedTime = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  const toolsUsed = Array.isArray(message.toolsUsed) ? message.toolsUsed : [];
  const sources = Array.isArray(message.sources) ? message.sources : [];

  if (!isAssistant) {
    // User Message: ChatGPT / Gemini style right-aligned soft pill + inline edit mode
    if (isEditing) {
      return (
        <div className="flex justify-end my-4 w-full animate-fadeIn">
          <div className="w-full max-w-2xl rounded-2xl bg-[#F4F4F5] dark:bg-[#282A2C] border border-blue-400/60 dark:border-blue-500/50 p-3.5 shadow-sm">
            <textarea
              ref={editTextareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              rows={2}
              className="w-full resize-none bg-transparent text-slate-900 dark:text-slate-100 text-sm sm:text-[15px] leading-relaxed focus:outline-hidden"
            />
            <div className="flex items-center justify-end gap-2 mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/60">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={!editText.trim() || isLoading}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-blue-600 dark:hover:bg-blue-400 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Save & Submit
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="group flex flex-col items-end my-4 w-full animate-fadeIn">
        <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end gap-1.5">
          {message.attachedFileName && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200/80 dark:border-blue-500/30 text-xs font-medium text-blue-700 dark:text-blue-300">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[220px]">{message.attachedFileName}</span>
            </div>
          )}

          <div className="rounded-3xl rounded-br-md px-5 py-3 bg-[#F3F4F6] dark:bg-[#2F2F2F] text-slate-900 dark:text-slate-100 text-sm sm:text-[15px] leading-relaxed break-words shadow-2xs">
            <div className="whitespace-pre-wrap select-text">{message.content}</div>
          </div>
        </div>

        {/* User Message Hover Actions (Edit & Copy) */}
        <div className="flex items-center gap-1 mt-1 pr-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-slate-400 dark:text-slate-500">
          {message.editedAt && <span className="mr-1 italic">(edited)</span>}

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#282A2C] hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Copy message"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {onEditMessage && (
            <button
              type="button"
              onClick={handleStartEdit}
              disabled={isLoading}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#282A2C] hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Edit message"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Assistant Message: Borderless Editorial Layout like ChatGPT / Gemini
  return (
    <div className="group flex gap-3.5 sm:gap-4 my-5 w-full justify-start animate-fadeIn">
      {/* Assistant Sparkle Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs mt-0.5">
        <Sparkles className="w-4 h-4" />
      </div>

      {/* Editorial Content Area */}
      <div className="flex-1 min-w-0 text-slate-800 dark:text-[#E3E3E3] text-sm sm:text-[15.5px] leading-7 break-words">
        {/* Tool Activity Badges */}
        {toolsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {toolsUsed.map((toolKey) => {
              const meta = TOOL_LABELS[toolKey] || { label: toolKey, icon: Globe };
              const Icon = meta.icon;
              return (
                <span
                  key={toolKey}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E1F20] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 text-[11px] font-medium"
                >
                  <Icon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  {meta.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Markdown Body */}
        <div className="select-text">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-4 mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-3.5 mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-3 mb-1.5">{children}</h3>,
              p: ({ children }) => <p className="mb-3 last:mb-0 leading-7">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1.5">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1.5">{children}</ol>,
              li: ({ children }) => <li className="leading-7">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-slate-950 dark:text-white">{children}</strong>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-3 border-blue-500 pl-4 py-0.5 my-3 text-slate-600 dark:text-slate-300 italic bg-slate-50/70 dark:bg-slate-800/40 rounded-r-lg">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">{children}</table>
                </div>
              ),
              thead: ({ children }) => <thead className="bg-slate-100 dark:bg-[#1E1F20] text-slate-700 dark:text-slate-200">{children}</thead>,
              th: ({ children }) => <th className="px-3 py-2 font-semibold border-b border-slate-200 dark:border-slate-700">{children}</th>,
              td: ({ children }) => <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">{children}</td>,
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {children}
                </a>
              ),
              code: ({ inline, className, children }) => {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');
                if (!inline && (match || codeString.includes('\n'))) {
                  return <CodeBlock language={match?.[1]} value={codeString} />;
                }
                return (
                  <code className="bg-slate-100 dark:bg-[#282A2C] text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded-md text-[13px] font-mono">
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Clickable Source Citations */}
        {sources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Sources
            </div>
            <div className="flex flex-wrap gap-2">
              {sources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1E1F20] hover:bg-blue-50 dark:hover:bg-[#282A2C] border border-slate-200/80 dark:border-slate-700/70 hover:border-blue-300 dark:hover:border-blue-500/40 text-xs text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 transition-colors max-w-[250px]"
                  title={src.url}
                >
                  <ExternalLink className="w-3 h-3 shrink-0 text-blue-500" />
                  <span className="truncate font-medium">{src.title || src.url}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action Toolbar: Copy, Regenerate & Timestamp */}
        <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-400 dark:text-slate-500">
          <button
            onClick={handleCopy}
            type="button"
            className="inline-flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#282A2C] hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Copy response"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {onRegenerate && (
            <button
              onClick={() => onRegenerate(message.id)}
              disabled={isLoading}
              type="button"
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#282A2C] hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title="Regenerate response"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
          )}

          {formattedTime && <span className="text-[11px] ml-1">{formattedTime}</span>}
        </div>
      </div>
    </div>
  );
}
