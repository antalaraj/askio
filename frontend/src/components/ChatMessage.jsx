import React, { useState } from 'react';
import {
  Bot,
  User,
  Copy,
  Check,
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

export default function ChatMessage({ message }) {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
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

  return (
    <div
      className={`group flex gap-3 sm:gap-4 my-4 w-full transition-all ${
        isAssistant ? 'justify-start' : 'justify-end'
      }`}
    >
      {/* Assistant Avatar */}
      {isAssistant && (
        <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Message Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-sm sm:text-base leading-relaxed break-words ${
          isAssistant
            ? 'bg-white text-[#172033] border border-[#E2E8F0] shadow-xs'
            : 'bg-blue-600 text-white shadow-xs rounded-br-xs'
        }`}
      >
        {/* Attached Document Badge (User Message) */}
        {!isAssistant && message.attachedFileName && (
          <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/40 border border-blue-400/50 text-[11px] font-medium text-blue-50">
            <FileText className="w-3.5 h-3.5" />
            <span className="truncate max-w-[200px]">{message.attachedFileName}</span>
          </div>
        )}

        {/* Tool Activity Badges (Assistant Message) */}
        {isAssistant && toolsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {toolsUsed.map((toolKey) => {
              const meta = TOOL_LABELS[toolKey] || { label: toolKey, icon: Globe };
              const Icon = meta.icon;
              return (
                <span
                  key={toolKey}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold tracking-wide"
                >
                  <Icon className="w-3 h-3 text-blue-600" />
                  {meta.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Message Content */}
        <div className="select-text font-normal">
          {isAssistant ? (
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-[#0F172A]">{children}</strong>,
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {children}
                  </a>
                ),
                code: ({ inline, children }) =>
                  inline ? (
                    <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                  ) : (
                    <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto text-xs font-mono my-2">{children}</pre>
                  ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>

        {/* Clickable Source Citations */}
        {isAssistant && sources.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-100">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Sources
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((src, idx) => (
                <a
                  key={idx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-[11px] text-slate-700 hover:text-blue-700 transition-colors max-w-[240px]"
                  title={src.url}
                >
                  <ExternalLink className="w-3 h-3 shrink-0 text-blue-500" />
                  <span className="truncate">{src.title || src.url}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer info: Timestamp & Copy action */}
        <div
          className={`flex items-center justify-between gap-3 mt-2 pt-1 text-[11px] font-medium ${
            isAssistant
              ? 'text-[#64748B] border-t border-slate-100'
              : 'text-blue-100/80 border-t border-blue-500/50'
          }`}
        >
          <span>{formattedTime}</span>

          {isAssistant && (
            <button
              onClick={handleCopy}
              type="button"
              className="inline-flex items-center gap-1 text-[11px] hover:text-blue-600 transition-colors p-1 rounded-sm cursor-pointer"
              title="Copy message to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {!isAssistant && (
        <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shadow-xs mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
