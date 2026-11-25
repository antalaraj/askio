import { useState, useEffect, useCallback, useRef } from 'react';
import { sendChatMessage, checkBackendHealth } from '../services/chatService';
import { getClientContext } from '../utils/location';

/**
 * Custom hook to manage chat interaction, network communication, loading states, and error handling
 * for the currently active conversation.
 */
export function useChat({ activeConversation, updateActiveMessages }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendHealth, setBackendHealth] = useState({ status: 'checking', groq_configured: false });

  // Store the last sent user message for retry functionality
  const lastFailedUserMessageRef = useRef(null);
  const activeConversationIdRef = useRef(activeConversation?.id);

  // Clear errors when active conversation changes
  useEffect(() => {
    if (activeConversationIdRef.current !== activeConversation?.id) {
      activeConversationIdRef.current = activeConversation?.id;
      setError(null);
      lastFailedUserMessageRef.current = null;
    }
  }, [activeConversation?.id]);

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

  const messages = activeConversation?.messages || [];

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

      let conversationToSend;
      if (isRetry) {
        conversationToSend = [...messages];
      } else {
        conversationToSend = [...messages, userMessage];
        updateActiveMessages(conversationToSend);
      }

      lastFailedUserMessageRef.current = trimmed;

      try {
        const clientContext = getClientContext();
        const assistantResponse = await sendChatMessage(conversationToSend, clientContext);

        const assistantMessage = {
          id: `asst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          role: 'assistant',
          content: assistantResponse.content,
          timestamp: new Date().toISOString()
        };

        const finalConversation = [...conversationToSend, assistantMessage];
        updateActiveMessages(finalConversation);

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
    [messages, isLoading, updateActiveMessages]
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
   * Retries the last failed message in the current conversation.
   */
  const retryLastMessage = useCallback(() => {
    const lastMsg = lastFailedUserMessageRef.current || (error && error.lastUserMessage);
    if (lastMsg) {
      executeSendMessage(lastMsg, true);
    }
  }, [executeSendMessage, error]);

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
    dismissError
  };
}
