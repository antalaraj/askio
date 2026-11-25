import { useState, useEffect, useCallback, useRef } from 'react';
import { sendChatMessage, checkBackendHealth, uploadDocument } from '../services/chatService';
import { getClientContext } from '../utils/location';

/**
 * Infers a helpful live activity status message based on user prompt and attached document.
 */
function inferLoadingStatus(text, hasDoc) {
  if (hasDoc) return 'Analyzing document...';
  const lower = text.toLowerCase();
  if (/https?:\/\/\S+/.test(lower)) return 'Reading webpage...';
  if (/\b(weather|temperature|forecast|rain|climate)\b/.test(lower)) return 'Checking live weather...';
  if (/\b(latest|news|today|recent|2025|2026|who won|current|search)\b/.test(lower)) return 'Searching the web...';
  if (/\b(calculate|percent|%|sum|mean|sqrt|equation)\b/.test(lower)) return 'Calculating...';
  if (/\b(run python|execute python|python code)\b/.test(lower)) return 'Running Python sandbox...';
  return 'Askio is thinking...';
}

/**
 * Custom hook to manage chat interaction, tool orchestration, file attachments,
 * loading states, and error handling for the currently active conversation.
 */
export function useChat({ activeConversation, updateActiveMessages }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Askio is thinking...');
  const [isUploading, setIsUploading] = useState(false);
  const [attachedDocument, setAttachedDocument] = useState(null);
  const [error, setError] = useState(null);
  const [backendHealth, setBackendHealth] = useState({ status: 'checking', groq_configured: false });

  const lastFailedUserMessageRef = useRef(null);
  const activeConversationIdRef = useRef(activeConversation?.id);

  // Clear errors and transient attachments when active conversation changes
  useEffect(() => {
    if (activeConversationIdRef.current !== activeConversation?.id) {
      activeConversationIdRef.current = activeConversation?.id;
      setError(null);
      setAttachedDocument(null);
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
   * Uploads a document to backend for text extraction and attaches it to current chat session.
   */
  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    setError(null);
    setIsUploading(true);
    try {
      const docData = await uploadDocument(file);
      setAttachedDocument(docData);
    } catch (err) {
      setError({
        message: err.message || 'Failed to upload document.',
        canRetry: false
      });
    } finally {
      setIsUploading(false);
    }
  }, []);

  const removeAttachedDocument = useCallback(() => {
    setAttachedDocument(null);
  }, []);

  /**
   * Internal function to send messages through backend API.
   */
  const executeSendMessage = useCallback(
    async (userText, isRetry = false) => {
      const trimmed = userText.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      setLoadingStatus(inferLoadingStatus(trimmed, Boolean(attachedDocument)));
      setIsLoading(true);

      const userMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'user',
        content: trimmed,
        attachedFileName: attachedDocument?.filename || undefined,
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
        const assistantResponse = await sendChatMessage(
          conversationToSend,
          clientContext,
          attachedDocument
        );

        const assistantMessage = {
          id: `asst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          role: 'assistant',
          content: assistantResponse.content,
          sources: assistantResponse.sources || [],
          toolsUsed: assistantResponse.toolsUsed || [],
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
    [messages, isLoading, attachedDocument, updateActiveMessages]
  );

  const sendMessage = useCallback(
    (text) => executeSendMessage(text, false),
    [executeSendMessage]
  );

  const retryLastMessage = useCallback(() => {
    const lastMsg = lastFailedUserMessageRef.current || (error && error.lastUserMessage);
    if (lastMsg) {
      executeSendMessage(lastMsg, true);
    }
  }, [executeSendMessage, error]);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    loadingStatus,
    isUploading,
    attachedDocument,
    error,
    backendHealth,
    sendMessage,
    retryLastMessage,
    dismissError,
    handleFileUpload,
    removeAttachedDocument
  };
}
