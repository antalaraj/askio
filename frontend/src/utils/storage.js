/**
 * LocalStorage utility for AskAnything chat history persistence.
 */

const STORAGE_KEY = 'askanything_chat_history';

/**
 * Loads and validates chat history from localStorage.
 * @returns {Array<{ id: string, role: 'user' | 'assistant', content: string, timestamp: string }>}
 */
export function loadChatHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('Invalid chat history format in storage, resetting.');
      return [];
    }

    // Filter valid message objects
    return parsed.filter(
      (msg) =>
        msg &&
        typeof msg === 'object' &&
        (msg.role === 'user' || msg.role === 'assistant') &&
        typeof msg.content === 'string' &&
        msg.content.trim().length > 0
    );
  } catch (err) {
    console.error('Failed to parse chat history from localStorage:', err);
    return [];
  }
}

/**
 * Saves chat history to localStorage.
 * Ensures temporary or failed entries are not persisted.
 * @param {Array<Object>} messages
 */
export function saveChatHistory(messages) {
  try {
    if (!Array.isArray(messages)) return;

    // Filter out any temporary states or empty messages
    const validMessages = messages.filter(
      (msg) =>
        msg &&
        (msg.role === 'user' || msg.role === 'assistant') &&
        typeof msg.content === 'string' &&
        msg.content.trim().length > 0 &&
        !msg.isTemporary
    );

    localStorage.setItem(STORAGE_KEY, JSON.stringify(validMessages));
  } catch (err) {
    console.error('Failed to save chat history to localStorage:', err);
  }
}

/**
 * Clears the chat history from localStorage.
 */
export function clearChatHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear chat history from localStorage:', err);
  }
}
