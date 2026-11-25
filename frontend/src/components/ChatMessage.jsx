import React, { useState } from 'react';
import { Bot, User, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
