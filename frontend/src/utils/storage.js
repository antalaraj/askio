/**
 * LocalStorage architecture for multi-conversation chat history management.
 * Key: askanything_conversations_v1
 * Supports automatic migration from legacy single-chat storage (askanything_chat_history).
 */

import { generateId, generateConversationTitle } from './conversationUtils.js';

export const CONVERSATIONS_STORAGE_KEY = 'askanything_conversations_v1';
export const LEGACY_STORAGE_KEY = 'askanything_chat_history';

/**
 * Creates a brand new empty conversation object.
 * @returns {Object}
 */
export function createEmptyConversation() {
  const now = new Date().toISOString();
  return {
    id: generateId('conv'),
    title: 'New Conversation',
    messages: [],
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Migrates legacy single-chat history if present.
 * @returns {{ conversations: Array<Object>, activeConversationId: string } | null}
 */
export function migrateOldChatHistory() {
  try {
    const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!rawLegacy) return null;

    const parsed = JSON.parse(rawLegacy);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    const validMessages = parsed.filter(
      (msg) =>
        msg &&
        (msg.role === 'user' || msg.role === 'assistant') &&
        typeof msg.content === 'string' &&
        msg.content.trim().length > 0
    );

    if (validMessages.length === 0) return null;

    const firstUserMsg = validMessages.find((m) => m.role === 'user');
    const title = firstUserMsg
      ? generateConversationTitle(firstUserMsg.content)
      : 'Previous Conversation';

    const firstTimestamp = validMessages[0]?.timestamp || new Date().toISOString();
    const lastTimestamp = validMessages[validMessages.length - 1]?.timestamp || new Date().toISOString();

    const migratedConversation = {
      id: generateId('conv'),
      title,
      messages: validMessages,
      createdAt: firstTimestamp,
      updatedAt: lastTimestamp
    };

    console.info('Successfully migrated legacy single-chat history to multi-conversation format.');
    return {
      conversations: [migratedConversation],
      activeConversationId: migratedConversation.id
    };
  } catch (err) {
    console.error('Failed to migrate legacy chat history:', err);
    return null;
  }
}

/**
 * Loads all conversations and the active conversation ID.
 * Automatically performs migration or creates an initial conversation if none exists.
 * @returns {{ conversations: Array<Object>, activeConversationId: string }}
 */
export function loadConversationsData() {
  try {
    const raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);

    if (!raw) {
      // Attempt migration from old storage
      const migrated = migrateOldChatHistory();
      if (migrated) {
        saveConversationsData(migrated);
        return migrated;
      }

      // If no data exists, initialize with a fresh empty conversation
      const initialConv = createEmptyConversation();
      const initialData = {
        conversations: [initialConv],
        activeConversationId: initialConv.id
      };
      saveConversationsData(initialData);
      return initialData;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.conversations)) {
      console.warn('Malformed conversations data in localStorage, re-initializing.');
      const initialConv = createEmptyConversation();
      return {
        conversations: [initialConv],
        activeConversationId: initialConv.id
      };
    }

    // Filter and sanitize valid conversations
    const validConversations = parsed.conversations
      .filter((c) => c && typeof c === 'object' && typeof c.id === 'string')
      .map((conv) => ({
        id: conv.id,
        title: typeof conv.title === 'string' && conv.title.trim() ? conv.title.trim() : 'New Conversation',
        messages: Array.isArray(conv.messages)
          ? conv.messages.filter(
              (m) =>
                m &&
                (m.role === 'user' || m.role === 'assistant') &&
                typeof m.content === 'string' &&
                !m.isTemporary
            )
          : [],
        createdAt: conv.createdAt || new Date().toISOString(),
        updatedAt: conv.updatedAt || new Date().toISOString()
      }));

    if (validConversations.length === 0) {
      const initialConv = createEmptyConversation();
      return {
        conversations: [initialConv],
        activeConversationId: initialConv.id
      };
    }

    // Ensure activeConversationId is valid
    let activeId = parsed.activeConversationId;
    if (!validConversations.some((c) => c.id === activeId)) {
      activeId = validConversations[0].id;
    }

    return {
      conversations: validConversations,
      activeConversationId: activeId
    };
  } catch (err) {
    console.error('Failed to load conversations from localStorage:', err);
    const initialConv = createEmptyConversation();
    return {
      conversations: [initialConv],
      activeConversationId: initialConv.id
    };
  }
}

/**
 * Persists all conversations and the active conversation ID to localStorage.
 * @param {{ conversations: Array<Object>, activeConversationId: string }} data
 */
export function saveConversationsData(data) {
  try {
    if (!data || !Array.isArray(data.conversations)) return;

    // Filter temporary states before saving
    const sanitizedData = {
      conversations: data.conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messages: conv.messages.filter((m) => !m.isTemporary && m.content && m.content.trim().length > 0)
      })),
      activeConversationId: data.activeConversationId
    };

    localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(sanitizedData));
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded. Consider cleaning up old conversations.');
    } else {
      console.error('Failed to save conversations to localStorage:', err);
    }
  }
}
