import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import RateLimitError, AuthenticationError, APIConnectionError, APITimeoutError, APIError
from services.groq_service import generate_chat_response, DEFAULT_MODEL, MissingApiKeyError

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("AskAnything")

app = Flask(__name__)

# Configure CORS
frontend_env = os.getenv("FRONTEND_URL", "").strip()
if frontend_env and frontend_env != "*":
    allowed_origins = [origin.strip() for origin in frontend_env.split(",") if origin.strip()]
else:
    allowed_origins = "*"

CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)

@app.route("/api/health", methods=["GET"])
def health_check():
    """
    Health check endpoint returning application status and Groq configuration status.
    """
    api_key_configured = bool(os.getenv("GROQ_API_KEY", "").strip())
    model = os.getenv("GROQ_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL

    return jsonify({
        "status": "healthy",
        "service": "AskAnything – AI Chat Assistant API",
        "groq_configured": api_key_configured,
        "model": model
    }), 200

@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Chat endpoint accepting conversation history and returning the assistant response.
    """
    if not request.is_json:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    data = request.get_json()
    if not isinstance(data, dict):
        return jsonify({"error": "Malformed request payload."}), 400

    messages = data.get("messages")
    if not isinstance(messages, list) or len(messages) == 0:
        return jsonify({"error": "The 'messages' field is required and must be a non-empty array."}), 400

    # Validate latest message
    latest_msg = messages[-1]
    if not isinstance(latest_msg, dict) or not latest_msg.get("content", "").strip():
        return jsonify({"error": "User message content cannot be empty."}), 400

    try:
        reply_content, status_code = generate_chat_response(messages)
        return jsonify({
            "role": "assistant",
            "content": reply_content
        }), status_code

    except MissingApiKeyError as e:
        logger.error("Missing API Key: %s", str(e))
        return jsonify({
            "error": "Backend configuration error: GROQ_API_KEY is not set on the server. Please add your Groq API key to the backend environment variables."
        }), 500

    except ValueError as e:
        logger.warning("Validation error: %s", str(e))
        return jsonify({"error": str(e)}), 400

    except AuthenticationError:
        return jsonify({
            "error": "Authentication failed: Invalid or missing Groq API key on server."
        }), 401

    except RateLimitError:
        return jsonify({
            "error": "Groq API rate limit exceeded. Please wait a few seconds and try again."
        }), 429

    except APITimeoutError:
        return jsonify({
            "error": "The response is taking longer than expected. Please try again."
        }), 504

    except APIConnectionError:
        return jsonify({
            "error": "Unable to connect to AI provider. Please check your internet connection."
        }), 503

    except APIError as e:
        logger.error("Groq API error encountered: %s", str(e))
        return jsonify({
            "error": "Sorry, something went wrong while generating your response."
        }), 502

    except Exception as e:
        logger.exception("Unexpected server error: %s", str(e))
        return jsonify({
            "error": "An internal server error occurred. Please try again later."
        }), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1")
    logger.info("Starting AskAnything backend on port %d...", port)
    app.run(host="0.0.0.0", port=port, debug=debug)
