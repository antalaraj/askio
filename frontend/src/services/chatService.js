/**
 * Chat service for backend communication with Flask API & Groq.
 */

// Read base URL from Vite environment variable or default to local backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const DEFAULT_TIMEOUT_MS = 30000; // 30-second timeout

/**
 * Custom error class for API errors.
 */
export class ChatApiError extends Error {
  constructor(message, status = 500, canRetry = true) {
    super(message);
    this.name = 'ChatApiError';
    this.status = status;
    this.canRetry = canRetry;
  }
}

/**
 * Check backend health status.
 * @returns {Promise<{ status: string, groq_configured: boolean, model: string }>}
 */
export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Health check returned status ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.warn('Backend health check error:', err.message);
    return { status: 'offline', groq_configured: false };
  }
}

/**
 * Send conversation messages to backend Groq chat endpoint.
 * @param {Array<{ role: string, content: string }>} messages
 * @returns {Promise<{ role: string, content: string }>}
 */
export async function sendChatMessage(messages) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    // Only send role and content to the backend API
    const sanitizedMessages = messages.map(({ role, content }) => ({
      role,
      content: content.trim()
    }));

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ messages: sanitizedMessages }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errorMsg = data?.error || getDefaultErrorMessage(response.status);
      throw new ChatApiError(errorMsg, response.status, response.status !== 400 && response.status !== 401);
    }

    if (!data || !data.content) {
      throw new ChatApiError('Received an invalid or empty response from AI service.', 502, true);
    }

    return {
      role: 'assistant',
      content: data.content
    };
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ChatApiError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw new ChatApiError(
        'The response is taking longer than expected. Please try again.',
        504,
        true
      );
    }

    // Network failure / server offline
    throw new ChatApiError(
      'Unable to connect. Please check your internet connection or backend server status.',
      503,
      true
    );
  }
}

function getDefaultErrorMessage(status) {
  switch (status) {
    case 400:
      return 'Invalid request format or empty message.';
    case 401:
      return 'Backend authentication failed. Please check the Groq API key configuration.';
    case 429:
      return 'Groq API rate limit reached. Please wait a moment and try again.';
    case 503:
    case 504:
      return 'The AI service is temporarily unavailable. Please try again.';
    default:
      return 'Sorry, something went wrong while generating your response.';
  }
}
