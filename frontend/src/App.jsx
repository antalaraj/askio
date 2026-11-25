import React, { useRef, useEffect } from 'react';
import { useChat } from './hooks/useChat';
import ChatHeader from './components/ChatHeader';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import TypingIndicator from './components/TypingIndicator';
import WelcomeScreen from './components/WelcomeScreen';
import ErrorMessage from './components/ErrorMessage';

export default function App() {
  const {
    messages,
    isLoading,
    error,
    backendHealth,
    sendMessage,
    retryLastMessage,
    clearChat,
    dismissError
  } = useChat();

  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message or indicator
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, error]);

  return (
    <div className="flex flex-col h-screen min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <ChatHeader onNewChat={clearChat} backendHealth={backendHealth} />

      {/* Main Conversation Area */}
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

      {/* Sticky Bottom Input Area */}
      <ChatInput onSendMessage={sendMessage} isLoading={isLoading} />
    </div>
  );
}
