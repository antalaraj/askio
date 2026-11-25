import ast
import os
import sys
import subprocess
import tempfile
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

MAX_EXECUTION_SECONDS = 5
MAX_OUTPUT_CHARS = 3000

BLOCKED_MODULES = {
    "os", "sys", "subprocess", "shutil", "socket", "http", "urllib", "requests",
    "httpx", "ctypes", "importlib", "multiprocessing", "threading", "pty", "fcntl",
    "pathlib", "glob", "signal", "pickle"
}

BLOCKED_CALLS = {"open", "eval", "exec", "compile", "__import__", "input", "breakpoint"}

def _validate_python_ast(code: str) -> None:
    """Reject unsafe imports and built-in calls before spawning subprocess."""
    tree = ast.parse(code)
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                root_mod = alias.name.split(".")[0]
                if root_mod in BLOCKED_MODULES:
                    raise SecurityError(f"Import of '{root_mod}' is restricted in sandbox.")
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                root_mod = node.module.split(".")[0]
                if root_mod in BLOCKED_MODULES:
                    raise SecurityError(f"Import from '{root_mod}' is restricted in sandbox.")
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id in BLOCKED_CALLS:
                raise SecurityError(f"Call to '{node.func.id}()' is restricted in sandbox.")

class SecurityError(Exception):
    pass

def execute_python_code(code: str) -> Dict[str, Any]:
    """
    Execute Python code in an isolated, time-limited subprocess inside a temporary directory.
    """
    if not code or not isinstance(code, str) or not code.strip():
        return {"error": "No Python code provided."}

    try:
        _validate_python_ast(code)
    except SyntaxError as e:
        return {"error": f"SyntaxError: {e.msg} (line {e.lineno})"}
    except SecurityError as e:
        return {"error": f"Sandbox restriction: {str(e)}"}

    try:
        with tempfile.TemporaryDirectory() as tmp_dir:
            script_path = os.path.join(tmp_dir, "sandbox_script.py")
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(code)

            # Minimal stripped environment
            safe_env = {
                "PYTHONIOENCODING": "utf-8",
                "PYTHONDONTWRITEBYTECODE": "1",
                "PATH": os.environ.get("PATH", ""),
                "SYSTEMROOT": os.environ.get("SYSTEMROOT", ""),
            }

            proc = subprocess.run(
                [sys.executable, "-I", script_path],
                cwd=tmp_dir,
                env=safe_env,
                capture_output=True,
                text=True,
                timeout=MAX_EXECUTION_SECONDS
            )

            stdout = (proc.stdout or "")[:MAX_OUTPUT_CHARS]
            stderr = (proc.stderr or "")[:MAX_OUTPUT_CHARS]

            return {
                "exit_code": proc.returncode,
                "stdout": stdout.strip(),
                "stderr": stderr.strip(),
                "success": proc.returncode == 0
            }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": f"Execution timed out after {MAX_EXECUTION_SECONDS} seconds."
        }
    except Exception as e:
        logger.error("Sandbox execution failure: %s", str(e))
        return {"success": False, "error": f"Execution error: {str(e)}"}
