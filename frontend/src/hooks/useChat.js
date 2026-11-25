import { useState, useEffect, useCallback, useRef } from 'react';
import { loadChatHistory, saveChatHistory, clearChatHistory } from '../utils/storage';
import { sendChatMessage, checkBackendHealth } from '../services/chatService';

/**
 * Custom hook to manage chat state, persistence, network communication, and error handling.
 */
export function useChat() {
  const [messages, setMessages] = useState(() => loadChatHistory());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendHealth, setBackendHealth] = useState({ status: 'checking', groq_configured: false });

  // Store the last sent user message for retry functionality
  const lastFailedUserMessageRef = useRef(null);

  // Check backend health on mount
  useEffect(() => {
    let mounted = true;
    checkBackendHealth().then((health) => {
      if (mounted) {
        setBackendHealth(health);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  /**
   * Internal function to send messages through backend API.
   */
  const executeSendMessage = useCallback(
    async (userText, isRetry = false) => {
      const trimmed = userText.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      setIsLoading(true);

      const userMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString()
      };

      // If it's a retry, we don't append a new duplicate user message to history
      let updatedConversation;
      if (isRetry) {
        updatedConversation = [...messages];
      } else {
        updatedConversation = [...messages, userMessage];
        setMessages(updatedConversation);
      }

      lastFailedUserMessageRef.current = trimmed;

      try {
        const assistantResponse = await sendChatMessage(updatedConversation);

        const assistantMessage = {
          id: `asst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          role: 'assistant',
          content: assistantResponse.content,
          timestamp: new Date().toISOString()
        };

        setMessages((prev) => [...prev, assistantMessage]);
        lastFailedUserMessageRef.current = null;
        setError(null);
      } catch (err) {
        console.error('Chat error:', err);
        setError({
          message: err.message || 'An unexpected error occurred.',
          canRetry: err.canRetry !== false,
          lastUserMessage: trimmed
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  /**
   * Public function to send a new message.
   */
  const sendMessage = useCallback(
    (text) => {
      return executeSendMessage(text, false);
    },
    [executeSendMessage]
  );

  /**
   * Retries the last failed message.
   */
  const retryLastMessage = useCallback(() => {
    const lastMsg = lastFailedUserMessageRef.current || (error && error.lastUserMessage);
    if (lastMsg) {
      executeSendMessage(lastMsg, true);
    }
  }, [executeSendMessage, error]);

  /**
   * Resets the entire conversation.
   */
  const clearChat = useCallback(() => {
    clearChatHistory();
    setMessages([]);
    setError(null);
    lastFailedUserMessageRef.current = null;
  }, []);

  /**
   * Dismiss the error banner.
   */
  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    backendHealth,
    sendMessage,
    retryLastMessage,
    clearChat,
    dismissError
  };
}
