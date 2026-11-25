import React, { useState, useRef, useEffect } from 'react';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
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
    error,
    backendHealth,
    sendMessage,
    retryLastMessage,
    dismissError
  } = useChat({
    activeConversation,
    updateActiveMessages
  });

  // Sidebar visibility (open by default on desktop, closed on mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });

  // Modal dialog states
  const [renameTarget, setRenameTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message or typing indicator
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, error]);

  const handleNewChat = () => {
    createNewConversation();
  };

  return (
    <div className="flex h-screen min-h-screen bg-[#F8FAFC] overflow-hidden text-[#172033]">
      {/* Collapsible Sidebar */}
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

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Header */}
        <ChatHeader
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
          onNewChat={handleNewChat}
          backendHealth={backendHealth}
          activeTitle={activeConversation?.title}
        />

        {/* Conversation Message Stream */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          <div className="max-w-4xl mx-auto flex flex-col min-h-full">
            {messages.length === 0 ? (
              <WelcomeScreen onSelectPrompt={(prompt) => sendMessage(prompt)} />
            ) : (
              <div className="flex-1 flex flex-col justify-start">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}

                {isLoading && <TypingIndicator />}
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

            {/* Dummy element for auto-scroll */}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        </main>

        {/* Sticky Message Input Composer */}
        <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
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
