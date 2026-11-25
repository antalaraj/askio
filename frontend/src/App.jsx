import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowDown, UploadCloud } from 'lucide-react';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
import { useTheme } from './hooks/useTheme';
import { getClientContext, requestBrowserLocation, initLocationIfGranted } from './utils/location';
import Sidebar from './components/Sidebar';
import ChatHeader from './components/ChatHeader';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import TypingIndicator from './components/TypingIndicator';
import WelcomeScreen from './components/WelcomeScreen';
import ErrorMessage from './components/ErrorMessage';
import RenameDialog from './components/RenameDialog';
import DeleteConfirmation from './components/DeleteConfirmation';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  const {
    conversations,
    activeConversationId,
    activeConversation,
    createNewConversation,
    selectConversation,
    updateActiveMessages,
    renameConversation,
    deleteConversation
  } = useConversations();

  const {
    messages,
    isLoading,
    loadingStatus,
    isUploading,
    attachedDocument,
    latestAnimatedId,
    error,
    backendHealth,
    sendMessage,
    stopGeneration,
    editUserMessage,
    regenerateResponse,
    retryLastMessage,
    dismissError,
    handleFileUpload,
    removeAttachedDocument
  } = useChat({
    activeConversation,
    updateActiveMessages
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });

  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [clientContext, setClientContext] = useState(() => getClientContext());
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const mainScrollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    initLocationIfGranted();
    const timer = setTimeout(() => {
      setClientContext(getClientContext());
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleRequestLocation = useCallback(async () => {
    await requestBrowserLocation();
    setClientContext(getClientContext());
  }, []);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  }, []);

  useEffect(() => {
    isNearBottomRef.current = true;
    scrollToBottom('smooth');
  }, [messages.length, isLoading, error, scrollToBottom]);

  const handleStreamTick = useCallback(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, []);

  const handleScroll = () => {
    const el = mainScrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 140;
    setShowScrollBottom(distanceFromBottom > 180);
  };

  const handleNewChat = () => {
    createNewConversation();
  };

  const handleExportChat = useCallback(() => {
    if (!activeConversation || messages.length === 0) return;
    const title = activeConversation.title || 'Askio Conversation';
    const lines = [`# ${title}\n`, `_Exported from Askio on ${new Date().toLocaleString()}_\n\n---\n`];
    messages.forEach((m) => {
      const sender = m.role === 'user' ? 'User' : 'Askio';
      lines.push(`### ${sender}\n\n${m.content}\n`);
      if (Array.isArray(m.sources) && m.sources.length > 0) {
        lines.push('**Sources:**\n' + m.sources.map((s) => `- [${s.title || s.url}](${s.url})`).join('\n') + '\n');
      }
      lines.push('---\n');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeConversation, messages]);

  // Global drag-and-drop file attachment handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer?.types?.includes('Files')) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDraggingFile(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingFile(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative flex h-[100dvh] w-full bg-white dark:bg-[#131314] text-slate-900 dark:text-[#E3E3E3] overflow-hidden transition-colors"
    >
      {/* Drag-and-Drop File Upload Overlay */}
      {isDraggingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 dark:bg-black/65 backdrop-blur-sm animate-fadeIn p-4">
          <div className="max-w-sm w-full rounded-3xl bg-white dark:bg-[#1E1F20] border-2 border-dashed border-blue-500 p-8 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 animate-floatSlow">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Drop file to analyze
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supports PDF, TXT, Markdown, CSV, and JSON (up to 5 MB)
            </p>
          </div>
        </div>
      )}

      {/* Collapsible ChatGPT / Gemini / Claude Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onNewChat={handleNewChat}
        onOpenRename={(conv) => setRenameTarget(conv)}
        onOpenDelete={(conv) => setDeleteTarget(conv)}
      />

      {/* Main Chat Workspace */}
      <div className="relative flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <ChatHeader
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
          onNewChat={handleNewChat}
          backendHealth={backendHealth}
          activeTitle={activeConversation?.title}
          locationInfo={clientContext}
          onRequestLocation={handleRequestLocation}
          theme={theme}
          onToggleTheme={toggleTheme}
          hasMessages={messages.length > 0}
          onExportChat={handleExportChat}
        />

        {/* Scrollable Message Stream */}
        <main
          ref={mainScrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-6 pt-3 sm:pt-4 pb-8 sm:pb-10"
        >
          <div className="max-w-3xl mx-auto flex flex-col min-h-full">
            {messages.length === 0 ? (
              <WelcomeScreen onSelectPrompt={(prompt) => sendMessage(prompt)} />
            ) : (
              <div className="flex-1 flex flex-col justify-start pb-6 sm:pb-8">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    onEditMessage={editUserMessage}
                    onRegenerate={regenerateResponse}
                    isLoading={isLoading}
                    isNew={msg.id === latestAnimatedId}
                    onStreamTick={handleStreamTick}
                  />
                ))}

                {isLoading && <TypingIndicator statusText={loadingStatus} />}
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <ErrorMessage
                error={error}
                onRetry={retryLastMessage}
                onDismiss={dismissError}
              />
            )}

            <div ref={messagesEndRef} className="h-4 shrink-0" />
          </div>
        </main>

        {/* Floating Scroll-to-Bottom Button */}
        {showScrollBottom && messages.length > 0 && (
          <div className="absolute bottom-36 sm:bottom-40 left-1/2 -translate-x-1/2 z-20 animate-fadeIn">
            <button
              type="button"
              onClick={() => {
                isNearBottomRef.current = true;
                scrollToBottom('smooth');
              }}
              className="w-9 h-9 rounded-full bg-white dark:bg-[#282A2C] border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 transition-all cursor-pointer"
              title="Scroll to latest"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Floating Pill Composer */}
        <ChatInput
          onSendMessage={sendMessage}
          onStopGeneration={stopGeneration}
          isLoading={isLoading}
          isUploading={isUploading}
          attachedDocument={attachedDocument}
          onFileUpload={handleFileUpload}
          onRemoveDocument={removeAttachedDocument}
        />
      </div>

      {/* Rename Dialog Modal */}
      <RenameDialog
        isOpen={Boolean(renameTarget)}
        currentTitle={renameTarget?.title}
        onSave={(newTitle) => {
          if (renameTarget) {
            renameConversation(renameTarget.id, newTitle);
            setRenameTarget(null);
          }
        }}
        onCancel={() => setRenameTarget(null)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={Boolean(deleteTarget)}
        conversationTitle={deleteTarget?.title}
        onConfirm={() => {
          if (deleteTarget) {
            deleteConversation(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
