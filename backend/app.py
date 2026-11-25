import os
import time
import logging
from collections import defaultdict, deque
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from groq import RateLimitError, AuthenticationError, APIConnectionError, APITimeoutError, APIError
from services.groq_service import generate_chat_response, DEFAULT_MODEL, MissingApiKeyError
from services.document_service import extract_document_text

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("Askio")

app = Flask(__name__)
# Hard limit on incoming HTTP request payload (6 MB)
app.config["MAX_CONTENT_LENGTH"] = 6 * 1024 * 1024

# Configure CORS cleanly (avoid credentials=True with wildcard '*')
frontend_env = os.getenv("FRONTEND_URL", "").strip()
if frontend_env and frontend_env != "*":
    allowed_origins = [origin.strip() for origin in frontend_env.split(",") if origin.strip()]
    use_credentials = True
else:
    allowed_origins = "*"
    use_credentials = False

CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=use_credentials)

# Lightweight per-IP sliding-window rate limiter (35 req/min)
RATE_LIMIT_WINDOW = 60
RATE_LIMIT_MAX_REQUESTS = 35
_rate_limit_buckets = defaultdict(deque)

def _get_client_ip() -> str:
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.remote_addr or "unknown"

def _is_rate_limited(ip: str) -> bool:
    # Skip rate limiting during local unit testing
    if app.testing:
        return False
    now = time.time()
    bucket = _rate_limit_buckets[ip]
    while bucket and now - bucket[0] > RATE_LIMIT_WINDOW:
        bucket.popleft()
    if len(bucket) >= RATE_LIMIT_MAX_REQUESTS:
        return True
    bucket.append(now)
    return False

@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

@app.errorhandler(413)
def handle_payload_too_large(_err):
    return jsonify({"error": "Request payload or uploaded file exceeds the 6 MB limit."}), 413

@app.errorhandler(404)
def handle_not_found(_err):
    return jsonify({"error": "Requested API endpoint was not found."}), 404

@app.errorhandler(405)
def handle_method_not_allowed(_err):
    return jsonify({"error": "HTTP method not allowed for this endpoint."}), 405

@app.route("/api/health", methods=["GET"])
def health_check():
    """
    Health check endpoint returning application status, model, and available tools.
    """
    api_key_configured = bool(os.getenv("GROQ_API_KEY", "").strip())
    model = os.getenv("GROQ_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL

    return jsonify({
        "status": "healthy",
        "service": "Askio – AI Chat Assistant API",
        "groq_configured": api_key_configured,
        "model": model,
        "tools_enabled": [
            "web_search",
            "calculate",
            "execute_python",
            "fetch_webpage",
            "get_weather",
            "get_current_datetime",
            "document_upload"
        ]
    }), 200

@app.route("/api/chat", methods=["POST"])
def chat():
    """
    Chat endpoint accepting conversation history and returning the assistant response.
    """
    client_ip = _get_client_ip()
    if _is_rate_limited(client_ip):
        return jsonify({
            "error": "Too many requests. Please wait a moment before sending another message."
        }), 429

    if not request.is_json:
        return jsonify({"error": "Request body must be valid JSON."}), 400

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Malformed request payload."}), 400

    messages = data.get("messages")
    if not isinstance(messages, list) or len(messages) == 0:
        return jsonify({"error": "The 'messages' field is required and must be a non-empty array."}), 400

    # Validate latest message
    latest_msg = messages[-1]
    if not isinstance(latest_msg, dict) or not str(latest_msg.get("content", "")).strip():
        return jsonify({"error": "User message content cannot be empty."}), 400

    client_info = data.get("client_info", {})
    if not isinstance(client_info, dict):
        client_info = {}
    client_info["client_ip"] = client_ip

    document_context = data.get("document_context")
    if document_context is not None and not isinstance(document_context, dict):
        document_context = None

    try:
        response_payload, status_code = generate_chat_response(messages, client_info, document_context)
        return jsonify(response_payload), status_code

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

@app.route("/api/upload", methods=["POST"])
def upload_document():
    """
    Document upload endpoint for extracting text from PDF, TXT, MD, CSV, and JSON files.
    """
    if _is_rate_limited(_get_client_ip()):
        return jsonify({"error": "Too many upload requests. Please wait a moment."}), 429

    if "file" not in request.files:
        return jsonify({"error": "No file part in the request."}), 400

    file = request.files["file"]
    if not file or not file.filename:
        return jsonify({"error": "No file selected."}), 400

    file_bytes = file.read()
    result = extract_document_text(file.filename, file_bytes)
    if result.get("error"):
        return jsonify({"error": result["error"]}), 400

    return jsonify(result), 200

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1")
    logger.info("Starting Askio backend on port %d...", port)
    app.run(host="0.0.0.0", port=port, debug=debug)
