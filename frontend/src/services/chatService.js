/**
 * Chat service for backend communication with Flask API & Groq.
 */

// Read and normalize base URL from Vite environment variable (supports Render host-only strings)
function resolveApiBaseUrl() {
  const raw = (import.meta.env.VITE_API_URL || '').trim();
  if (!raw) return 'http://localhost:5000';
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, '');
}

const API_BASE_URL = resolveApiBaseUrl();
const DEFAULT_TIMEOUT_MS = 45000; // 45-second timeout for multi-step tool calls

/**
 * Custom error class for API errors.
 */
export class ChatApiError extends Error {
  constructor(message, status = 500, canRetry = true, isAborted = false) {
    super(message);
    this.name = 'ChatApiError';
    this.status = status;
    this.canRetry = canRetry;
    this.isAborted = isAborted;
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
export async function sendChatMessage(
  messages,
  clientInfo = null,
  documentContext = null,
  externalSignal = null
) {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, DEFAULT_TIMEOUT_MS);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
      throw new ChatApiError('Generation stopped by user.', 499, false, true);
    }
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    // Only send role and content to the backend API
    const sanitizedMessages = messages.map(({ role, content }) => ({
      role,
      content: content.trim()
    }));

    const payload = {
      messages: sanitizedMessages,
      client_info: clientInfo
    };
    if (documentContext && documentContext.text) {
      payload.document_context = {
        filename: documentContext.filename,
        text: documentContext.text
      };
    }

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }

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
      content: data.content,
      sources: Array.isArray(data.sources) ? data.sources : [],
      toolsUsed: Array.isArray(data.tools_used) ? data.tools_used : []
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }

    if (err instanceof ChatApiError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      if (!timedOut && externalSignal?.aborted) {
        throw new ChatApiError('Generation stopped by user.', 499, false, true);
      }
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

/**
 * Upload a PDF, TXT, MD, CSV, or JSON document for text extraction.
 * @param {File} file
 * @returns {Promise<{ filename: string, text: string, char_count: number, page_count: number }>}
 */
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new ChatApiError(data?.error || 'Failed to process uploaded document.', response.status, false);
  }

  return data;
}
