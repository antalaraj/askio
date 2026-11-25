import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  loadConversationsData,
  saveConversationsData,
  createEmptyConversation
} from '../utils/storage.js';
import { generateConversationTitle } from '../utils/conversationUtils.js';

/**
 * Custom hook to manage multi-conversation state, switching, creation, renaming, and deletion.
 */
export function useConversations() {
  const [data, setData] = useState(() => loadConversationsData());

  const conversations = data.conversations;
  const activeConversationId = data.activeConversationId;

  // Persist to localStorage whenever conversations or active ID changes
  useEffect(() => {
    saveConversationsData({ conversations, activeConversationId });
  }, [conversations, activeConversationId]);

  // Derive the active conversation object
  const activeConversation = useMemo(() => {
    return (
      conversations.find((c) => c.id === activeConversationId) ||
      conversations[0] ||
      createEmptyConversation()
    );
  }, [conversations, activeConversationId]);

  /**
   * Starts a new conversation.
   * If the current conversation is already empty, preserves it and avoids duplicates.
   */
  const createNewConversation = useCallback(() => {
    // If the active conversation is already empty, just stay on it
    if (activeConversation && activeConversation.messages.length === 0) {
      return activeConversation.id;
    }

    const newConv = createEmptyConversation();
    setData((prev) => ({
      conversations: [newConv, ...prev.conversations],
      activeConversationId: newConv.id
    }));

    return newConv.id;
  }, [activeConversation]);

  /**
   * Switches to an existing conversation by ID.
   */
  const selectConversation = useCallback((id) => {
    setData((prev) => {
      if (prev.activeConversationId === id) return prev;
      if (!prev.conversations.some((c) => c.id === id)) return prev;
      return {
        ...prev,
        activeConversationId: id
      };
    });
  }, []);

  /**
   * Updates messages in the active conversation and auto-generates a title on first user turn.
   */
  const updateActiveMessages = useCallback(
    (newMessages) => {
      setData((prev) => {
        const now = new Date().toISOString();
        const updatedConversations = prev.conversations.map((conv) => {
          if (conv.id !== prev.activeConversationId) return conv;

          // Check if we should auto-generate title from first user message
          let title = conv.title;
          if (
            (!title || title === 'New Conversation') &&
            Array.isArray(newMessages) &&
            newMessages.length > 0
          ) {
            const firstUserMsg = newMessages.find((m) => m.role === 'user');
            if (firstUserMsg && firstUserMsg.content) {
              title = generateConversationTitle(firstUserMsg.content);
            }
          }

          return {
            ...conv,
            title,
            messages: newMessages,
            updatedAt: now
          };
        });

        // Re-sort so most recently updated is first
        const sorted = [...updatedConversations].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );

        return {
          ...prev,
          conversations: sorted
        };
      });
    },
    []
  );

  /**
   * Renames a conversation by ID.
   */
  const renameConversation = useCallback((id, newTitle) => {
    const trimmed = (newTitle || '').trim();
    if (!trimmed) return false;

    setData((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === id ? { ...c, title: trimmed, updatedAt: new Date().toISOString() } : c
      )
    }));

    return true;
  }, []);

  /**
   * Deletes a conversation by ID.
   * If the deleted conversation is active, safely switches to another conversation or a fresh one.
   */
  const deleteConversation = useCallback((id) => {
    setData((prev) => {
      const remaining = prev.conversations.filter((c) => c.id !== id);

      if (remaining.length === 0) {
        const fresh = createEmptyConversation();
        return {
          conversations: [fresh],
          activeConversationId: fresh.id
        };
      }

      let nextActiveId = prev.activeConversationId;
      if (nextActiveId === id) {
        nextActiveId = remaining[0].id;
      }

      return {
        conversations: remaining,
        activeConversationId: nextActiveId
      };
    });
  }, []);

  return {
    conversations,
    activeConversationId,
    activeConversation,
    createNewConversation,
    selectConversation,
    updateActiveMessages,
    renameConversation,
    deleteConversation
  };
}
