/**
 * Utilities for conversation identifiers, automatic title generation, and date grouping.
 */

/**
 * Generates a unique identifier for conversations or messages.
 * @param {string} prefix
 * @returns {string}
 */
export function generateId(prefix = 'conv') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Automatically generates a concise, clean conversation title from the first user message.
 * Extracts 3-7 words, removes unnecessary punctuation, and limits length.
 * @param {string} userMessageText
 * @returns {string}
 */
export function generateConversationTitle(userMessageText) {
  if (!userMessageText || typeof userMessageText !== 'string') {
    return 'New Conversation';
  }

  // Normalize whitespace and clean up
  const clean = userMessageText.replace(/\s+/g, ' ').trim();
  if (!clean) return 'New Conversation';

  // Strip common conversational prompts/fillers
  let processed = clean
    .replace(/^(can you please|could you please|can you|could you|please|i want to|how do i|how to|what is|what are|tell me about|help me to|help me with|help me|give me|write a|write an|explain to me)\s+/i, '')
    .trim();

  // If stripping left it empty or too short, fallback to clean
  if (processed.length < 3) {
    processed = clean;
  }

  // Handle "Explain X" -> "X Explained"
  if (/^explain\s+/i.test(processed)) {
    const afterExplain = processed.replace(/^explain\s+/i, '').trim();
    const wordsAfter = afterExplain.split(' ');
    if (wordsAfter.length <= 4) {
      processed = `${afterExplain} Explained`;
    } else {
      processed = afterExplain;
    }
  }

  // Split into words, pick 3 to 6 words
  const words = processed.split(' ');
  const selectedWords = words.slice(0, Math.min(words.length, 6));
  let title = selectedWords.join(' ');

  // Clean trailing punctuation
  title = title.replace(/[.,/#!$%^&*;:{}=\-_`~()?]+$/g, '').trim();

  // Convert to Title Case (capitalize key words)
  const minorWords = new Set(['and', 'or', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'of', 'by']);
  title = title
    .split(' ')
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && minorWords.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');

  // Max character length
  const MAX_CHARS = 45;
  if (title.length > MAX_CHARS) {
    title = title.substring(0, MAX_CHARS).trim() + '...';
  }

  return title || 'New Conversation';
}

/**
 * Groups a sorted array of conversations by relative calendar date.
 * @param {Array<Object>} conversations
 * @returns {Array<{ label: string, conversations: Array<Object> }>}
 */
export function groupConversationsByDate(conversations) {
  if (!Array.isArray(conversations)) return [];

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const startOfYesterday = startOfToday - ONE_DAY_MS;
  const startOf7Days = startOfToday - 6 * ONE_DAY_MS;

  const groups = {
    today: [],
    yesterday: [],
    previous7Days: [],
    older: []
  };

  conversations.forEach((conv) => {
    const time = new Date(conv.updatedAt || conv.createdAt || Date.now()).getTime();

    if (time >= startOfToday) {
      groups.today.push(conv);
    } else if (time >= startOfYesterday) {
      groups.yesterday.push(conv);
    } else if (time >= startOf7Days) {
      groups.previous7Days.push(conv);
    } else {
      groups.older.push(conv);
    }
  });

  const result = [];
  if (groups.today.length > 0) {
    result.push({ label: 'Today', conversations: groups.today });
  }
  if (groups.yesterday.length > 0) {
    result.push({ label: 'Yesterday', conversations: groups.yesterday });
  }
  if (groups.previous7Days.length > 0) {
    result.push({ label: 'Previous 7 Days', conversations: groups.previous7Days });
  }
  if (groups.older.length > 0) {
    result.push({ label: 'Older', conversations: groups.older });
  }

  return result;
}
