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
 * Custom hook to manage chat interaction, tool orchestration, message editing,
 * response regeneration, stop generation, and file attachments.
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
  const abortControllerRef = useRef(null);

  // Abort active generation & reset transient states when switching conversations
  useEffect(() => {
    if (activeConversationIdRef.current !== activeConversation?.id) {
      activeConversationIdRef.current = activeConversation?.id;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsLoading(false);
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
   * Stops the active AI generation cleanly.
   */
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  /**
   * Core helper to execute a chat completion against a specific conversation snapshot.
   */
  const runInference = useCallback(
    async (conversationSnapshot, lastUserText) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setError(null);
      setLoadingStatus(inferLoadingStatus(lastUserText, Boolean(attachedDocument)));
      setIsLoading(true);
      lastFailedUserMessageRef.current = lastUserText;

      try {
        const clientContext = getClientContext();
        const assistantResponse = await sendChatMessage(
          conversationSnapshot,
          clientContext,
          attachedDocument,
          controller.signal
        );

        const assistantMessage = {
          id: `asst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          role: 'assistant',
          content: assistantResponse.content,
          sources: assistantResponse.sources || [],
          toolsUsed: assistantResponse.toolsUsed || [],
          timestamp: new Date().toISOString()
        };

        const finalConversation = [...conversationSnapshot, assistantMessage];
        updateActiveMessages(finalConversation);

        lastFailedUserMessageRef.current = null;
        setError(null);
      } catch (err) {
        if (err.isAborted) {
          // User pressed Stop: exit silently without error banner
          return;
        }
        console.error('Chat error:', err);
        setError({
          message: err.message || 'An unexpected error occurred.',
          canRetry: err.canRetry !== false,
          lastUserMessage: lastUserText
        });
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
          setIsLoading(false);
        }
      }
    },
    [attachedDocument, updateActiveMessages]
  );

  /**
   * Send a new user message.
   */
  const sendMessage = useCallback(
    async (userText) => {
      const trimmed = userText.trim();
      if (!trimmed || isLoading) return;

      const userMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        role: 'user',
        content: trimmed,
        attachedFileName: attachedDocument?.filename || undefined,
        timestamp: new Date().toISOString()
      };

      const updatedConversation = [...messages, userMessage];
      updateActiveMessages(updatedConversation);

      await runInference(updatedConversation, trimmed);
    },
    [messages, isLoading, attachedDocument, updateActiveMessages, runInference]
  );

  /**
   * Edit an existing user message, branch from that point, and regenerate the response.
   */
  const editUserMessage = useCallback(
    async (messageId, newContent) => {
      const trimmed = (newContent || '').trim();
      if (!trimmed || isLoading) return;

      const idx = messages.findIndex((m) => m.id === messageId && m.role === 'user');
      if (idx === -1) return;

      const updatedMsg = {
        ...messages[idx],
        content: trimmed,
        editedAt: new Date().toISOString()
      };

      const branchedConversation = [...messages.slice(0, idx), updatedMsg];
      updateActiveMessages(branchedConversation);

      await runInference(branchedConversation, trimmed);
    },
    [messages, isLoading, updateActiveMessages, runInference]
  );

  /**
   * Regenerate an assistant response from the preceding user prompt.
   */
  const regenerateResponse = useCallback(
    async (assistantMessageId) => {
      if (isLoading) return;

      const idx = messages.findIndex((m) => m.id === assistantMessageId && m.role === 'assistant');
      if (idx <= 0) return;

      const truncatedConversation = messages.slice(0, idx);
      const lastUserMsg = [...truncatedConversation].reverse().find((m) => m.role === 'user');
      if (!lastUserMsg) return;

      updateActiveMessages(truncatedConversation);
      await runInference(truncatedConversation, lastUserMsg.content);
    },
    [messages, isLoading, updateActiveMessages, runInference]
  );

  /**
   * Retry the last failed request.
   */
  const retryLastMessage = useCallback(() => {
    const lastMsg = lastFailedUserMessageRef.current || (error && error.lastUserMessage);
    if (lastMsg && !isLoading) {
      runInference(messages, lastMsg);
    }
  }, [messages, isLoading, error, runInference]);

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
    stopGeneration,
    editUserMessage,
    regenerateResponse,
    retryLastMessage,
    dismissError,
    handleFileUpload,
    removeAttachedDocument
  };
}
