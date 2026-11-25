import unittest
from unittest.mock import patch, MagicMock
import json
import os
import sys

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from services.groq_service import sanitize_and_truncate_messages, SYSTEM_PROMPT

class AskioApiTestCase(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_health_check(self):
        """Test GET /api/health returns 200 and expected schema."""
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data.get('status'), 'healthy')
        self.assertIn('groq_configured', data)
        self.assertIn('model', data)
        self.assertIn('tools_enabled', data)
        self.assertEqual(response.headers.get('X-Content-Type-Options'), 'nosniff')
        self.assertEqual(response.headers.get('X-Frame-Options'), 'DENY')

    def test_404_returns_json(self):
        """Test unknown API endpoints return clean JSON 404."""
        response = self.client.get('/api/nonexistent')
        self.assertEqual(response.status_code, 404)
        self.assertIn('error', response.get_json())

    def test_chat_non_json(self):
        """Test POST /api/chat with non-JSON request body."""
        response = self.client.post('/api/chat', data="plain text")
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn('error', data)

    def test_chat_empty_messages(self):
        """Test POST /api/chat with empty messages array."""
        response = self.client.post(
            '/api/chat',
            data=json.dumps({"messages": []}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn('error', data)

    def test_chat_empty_user_content(self):
        """Test POST /api/chat with whitespace or empty user message."""
        response = self.client.post(
            '/api/chat',
            data=json.dumps({"messages": [{"role": "user", "content": "   "}]}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn('error', data)

    def test_sanitize_messages(self):
        """Test message sanitization, system prompt injection, and history limits."""
        raw_msgs = [
            {"role": "invalid_role", "content": "ignore this"},
            {"role": "user", "content": "Hello AI"}
        ]
        sanitized = sanitize_and_truncate_messages(raw_msgs)
        self.assertEqual(len(sanitized), 2)
        self.assertEqual(sanitized[0]["role"], "system")
        self.assertEqual(sanitized[0]["content"], SYSTEM_PROMPT)
        self.assertEqual(sanitized[1]["role"], "user")
        self.assertEqual(sanitized[1]["content"], "Hello AI")

    def test_history_truncation(self):
        """Test that conversation history exceeding MAX_HISTORY_MESSAGES is truncated."""
        many_msgs = [{"role": "user" if i % 2 == 0 else "assistant", "content": f"msg {i}"} for i in range(20)]
        many_msgs.append({"role": "user", "content": "latest"})
        sanitized = sanitize_and_truncate_messages(many_msgs)
        # Should contain system prompt + at most 12 messages = 13 messages
        self.assertLessEqual(len(sanitized), 13)
        self.assertEqual(sanitized[-1]["content"], "latest")

    def test_chat_missing_api_key(self):
        """Test POST /api/chat when GROQ_API_KEY is not set."""
        with patch.dict(os.environ, {"GROQ_API_KEY": ""}):
            response = self.client.post(
                '/api/chat',
                data=json.dumps({"messages": [{"role": "user", "content": "Hello"}]}),
                content_type='application/json'
            )
            self.assertEqual(response.status_code, 500)
            data = response.get_json()
            self.assertIn("GROQ_API_KEY is not set", data.get("error", ""))

    @patch('services.groq_service.Groq')
    def test_chat_success_mock(self, mock_groq_class):
        """Test successful chat completion via Groq SDK mock."""
        mock_instance = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "I am Askio AI assistant."
        mock_choice.message.tool_calls = None
        mock_completion = MagicMock()
        mock_completion.choices = [mock_choice]
        mock_instance.chat.completions.create.return_value = mock_completion
        mock_groq_class.return_value = mock_instance

        with patch.dict(os.environ, {"GROQ_API_KEY": "gsk_testkey12345"}):
            response = self.client.post(
                '/api/chat',
                data=json.dumps({"messages": [{"role": "user", "content": "Hi there"}]}),
                content_type='application/json'
            )
            self.assertEqual(response.status_code, 200)
            data = response.get_json()
            self.assertEqual(data.get("role"), "assistant")
            self.assertEqual(data.get("content"), "I am Askio AI assistant.")

    def test_calculator_tool(self):
        """Test safe mathematical calculator."""
        from services.calculator_service import calculate_expression
        res = calculate_expression("25% of 80,000 + sqrt(144)")
        self.assertEqual(res.get("result"), 20012)

    def test_code_executor_sandbox(self):
        """Test safe Python sandbox execution and restriction."""
        from services.code_executor_service import execute_python_code
        ok = execute_python_code("print(2 ** 10)")
        self.assertTrue(ok.get("success"))
        self.assertEqual(ok.get("stdout"), "1024")

        blocked = execute_python_code("import os; print(os.listdir('.'))")
        self.assertIn("Sandbox restriction", blocked.get("error", ""))

    def test_url_ssrf_protection(self):
        """Test that internal/private URLs are blocked."""
        from services.url_service import fetch_webpage
        res = fetch_webpage("http://127.0.0.1:5000/api/health")
        self.assertIn("blocked", res.get("error", "").lower())

    def test_upload_txt_document(self):
        """Test uploading a text document to /api/upload."""
        import io
        data = {
            'file': (io.BytesIO(b"Askio quarterly revenue grew by 42% in Q3."), 'report.txt')
        }
        response = self.client.post('/api/upload', data=data, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 200)
        res_json = response.get_json()
        self.assertEqual(res_json.get("filename"), "report.txt")
        self.assertIn("42%", res_json.get("text", ""))

if __name__ == '__main__':
    unittest.main()
