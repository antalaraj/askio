import os
import logging
from typing import List, Dict, Any, Tuple, Optional
from groq import Groq, RateLimitError, AuthenticationError, APIConnectionError, APITimeoutError, APIError
from services.weather_service import detect_and_get_weather_context

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are Askio, a helpful, intelligent, and friendly AI assistant. "
    "Provide accurate, clear, relevant, and well-structured responses. "
    "Adapt your explanations to the user's question. Use examples when helpful. "
    "If you are uncertain, communicate that honestly. "
    "You have access to real-time context provided in the conversation (including live weather, current date, time, and user location). "
    "Always provide accurate, helpful, and friendly answers using this real-time data when asked about current conditions, weather, time, or date."
)

DEFAULT_MODEL = "llama-3.3-70b-versatile"
MAX_HISTORY_MESSAGES = 12
MAX_MESSAGE_LENGTH = 4000

class MissingApiKeyError(Exception):
    """Raised when GROQ_API_KEY is missing."""
    pass

def get_groq_client() -> Tuple[Groq, str]:
    """Retrieve Groq client and selected model identifier."""
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        raise MissingApiKeyError("GROQ_API_KEY environment variable is missing or empty.")
    
    model = os.getenv("GROQ_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL
    client = Groq(api_key=api_key)
    return client, model

def sanitize_and_truncate_messages(raw_messages: List[Dict[str, Any]], client_info: Optional[Dict[str, Any]] = None) -> List[Dict[str, str]]:
    """
    Validate, sanitize, and limit conversation history.
    - Limits context to the most recent MAX_HISTORY_MESSAGES.
    - Truncates individual message length.
    - Injects real-time context (weather, date, time, location) into system instruction.
    """
    allowed_roles = {"system", "user", "assistant"}
    cleaned_messages: List[Dict[str, str]] = []

    # Keep only the most recent messages up to MAX_HISTORY_MESSAGES
    selected_raw = raw_messages[-MAX_HISTORY_MESSAGES:] if len(raw_messages) > MAX_HISTORY_MESSAGES else raw_messages

    for msg in selected_raw:
        if not isinstance(msg, dict):
            continue
        role = msg.get("role", "").strip().lower()
        content = msg.get("content", "")

        if role not in allowed_roles:
            continue
        if not isinstance(content, str) or not content.strip():
            continue

        # Cap length to avoid token abuse
        content_clean = content.strip()[:MAX_MESSAGE_LENGTH]
        cleaned_messages.append({"role": role, "content": content_clean})

    if not cleaned_messages or cleaned_messages[-1]["role"] != "user":
        raise ValueError("The conversation must contain at least one valid user message at the end.")

    # Check for real-time weather information and client metadata
    latest_user_text = cleaned_messages[-1]["content"] if cleaned_messages else ""
    weather_info = detect_and_get_weather_context(latest_user_text, client_info)

    dynamic_system_prompt = SYSTEM_PROMPT
    client_context_parts = []

    if client_info:
        if client_info.get("local_time"):
            client_context_parts.append(f"Current Date & Time: {client_info.get('local_time')}")
        if client_info.get("timezone"):
            client_context_parts.append(f"Timezone: {client_info.get('timezone')}")
        loc = client_info.get("location")
        if loc and isinstance(loc, dict) and loc.get("city"):
            client_context_parts.append(f"User City: {loc.get('city')}")

    if client_context_parts:
        dynamic_system_prompt += "\n\n[USER CONTEXT]\n" + "\n".join(client_context_parts)

    if weather_info:
        dynamic_system_prompt += f"\n\n{weather_info}"

    # Check if first message is a custom system prompt; if not, prepend our system prompt
    final_messages: List[Dict[str, str]] = []
    if cleaned_messages[0]["role"] == "system":
        final_messages.extend(cleaned_messages)
    else:
        final_messages.append({"role": "system", "content": dynamic_system_prompt})
        final_messages.extend(cleaned_messages)

    return final_messages

def find_fallback_model(client: Groq) -> str:
    """Find a supported chat/text model available on the user's Groq account."""
    try:
        available_models = [m.id for m in client.models.list().data]
        logger.info("Discovering available Groq models on account: %s", available_models)
        
        # Priority order of preferred models
        preferred_prefixes = ["llama-3.3", "llama-3.1", "llama3", "qwen", "openai/gpt-oss", "allam"]
        for pref in preferred_prefixes:
            for model_id in available_models:
                if pref in model_id.lower() and "guard" not in model_id.lower() and "whisper" not in model_id.lower():
                    return model_id

        # Any model not whisper or guard
        for model_id in available_models:
            if "whisper" not in model_id.lower() and "guard" not in model_id.lower():
                return model_id
    except Exception as e:
        logger.warning("Could not query available models from Groq: %s", str(e))

    return "qwen/qwen3.8-27b"

def generate_chat_response(messages: List[Dict[str, Any]], client_info: Optional[Dict[str, Any]] = None) -> Tuple[str, int]:
    """
    Generate an AI chat response via Groq API.
    Returns (response_text, http_status_code).
    """
    try:
        client, model = get_groq_client()
    except ValueError as e:
        logger.error("Configuration error: %s", str(e))
        raise

    formatted_messages = sanitize_and_truncate_messages(messages, client_info)

    try:
        chat_completion = client.chat.completions.create(
            messages=formatted_messages,
            model=model,
            temperature=0.7,
            max_tokens=2048,
            top_p=1,
            stream=False
        )
        if not chat_completion.choices:
            raise RuntimeError("Received empty choices list from Groq API.")

        msg = chat_completion.choices[0].message
        reply = msg.content or getattr(msg, 'reasoning', '') or ""
        return reply, 200

    except APIError as e:
        # Check if error is model_not_found (404)
        if "model_not_found" in str(e) or e.status_code == 404:
            fallback = find_fallback_model(client)
            if fallback and fallback != model:
                logger.warning("Configured model '%s' not found. Falling back to '%s'.", model, fallback)
                chat_completion = client.chat.completions.create(
                    messages=formatted_messages,
                    model=fallback,
                    temperature=0.7,
                    max_tokens=2048,
                    top_p=1,
                    stream=False
                )
                if chat_completion.choices:
                    msg = chat_completion.choices[0].message
                    reply = msg.content or getattr(msg, 'reasoning', '') or ""
                    return reply, 200

        logger.error("Groq APIError: %s", str(e))
        raise
        raise
    except Exception as e:
        logger.exception("Unexpected error during Groq API call: %s", str(e))
        raise
