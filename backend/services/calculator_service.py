import ast
import math
import operator
import re
import statistics
from typing import Dict, Any

# Safe binary and unary operators
SAFE_OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

# Safe mathematical functions and constants
SAFE_FUNCTIONS = {
    "abs": abs,
    "round": round,
    "min": min,
    "max": max,
    "sum": sum,
    "sqrt": math.sqrt,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "asin": math.asin,
    "acos": math.acos,
    "atan": math.atan,
    "log": math.log,
    "log10": math.log10,
    "log2": math.log2,
    "exp": math.exp,
    "ceil": math.ceil,
    "floor": math.floor,
    "factorial": math.factorial,
    "pow": pow,
    "mean": statistics.mean,
    "median": statistics.median,
    "stdev": statistics.stdev,
}

SAFE_CONSTANTS = {
    "pi": math.pi,
    "e": math.e,
    "tau": math.tau,
}

def _preprocess_expression(expr: str) -> str:
    """Normalize common human math notations like '25% of 80,000' or '^'."""
    s = expr.strip()
    # Remove commas inside numbers (e.g. 80,000 -> 80000)
    s = re.sub(r"(?<=\d),(?=\d)", "", s)
    # Replace 'X% of Y' -> '(X/100)*Y'
    s = re.sub(r"(\d+(?:\.\d+)?)\s*%\s*of\s*", r"(\1/100)*", s, flags=re.IGNORECASE)
    # Replace standalone 'X%' -> '(X/100)'
    s = re.sub(r"(\d+(?:\.\d+)?)\s*%", r"(\1/100)", s)
    # Replace caret power '^' with '**'
    s = s.replace("^", "**")
    return s

def _eval_ast(node: ast.AST) -> Any:
    if isinstance(node, ast.Expression):
        return _eval_ast(node.body)
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError(f"Unsupported constant: {node.value}")
    if isinstance(node, ast.Name):
        if node.id in SAFE_CONSTANTS:
            return SAFE_CONSTANTS[node.id]
        raise ValueError(f"Unknown identifier: {node.id}")
    if isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type not in SAFE_OPERATORS:
            raise ValueError(f"Unsupported operator: {op_type.__name__}")
        left = _eval_ast(node.left)
        right = _eval_ast(node.right)
        if op_type is ast.Pow and isinstance(right, (int, float)) and abs(right) > 1000:
            raise ValueError("Exponent too large (max 1000).")
        return SAFE_OPERATORS[op_type](left, right)
    if isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type not in SAFE_OPERATORS:
            raise ValueError(f"Unsupported unary operator: {op_type.__name__}")
        return SAFE_OPERATORS[op_type](_eval_ast(node.operand))
    if isinstance(node, ast.Call):
        if not isinstance(node.func, ast.Name) or node.func.id not in SAFE_FUNCTIONS:
            raise ValueError("Unsupported function call.")
        args = [_eval_ast(arg) for arg in node.args]
        return SAFE_FUNCTIONS[node.func.id](*args)
    if isinstance(node, (ast.List, ast.Tuple)):
        return [_eval_ast(el) for el in node.elts]
    raise ValueError(f"Unsupported syntax element: {type(node).__name__}")

def calculate_expression(expression: str) -> Dict[str, Any]:
    """Safely evaluate a mathematical expression using Python's AST."""
    if not expression or not isinstance(expression, str):
        return {"error": "Expression must be a non-empty string."}

    normalized = _preprocess_expression(expression)
    try:
        tree = ast.parse(normalized, mode="eval")
        result = _eval_ast(tree)
        if isinstance(result, float) and result.is_integer():
            result = int(result)
        elif isinstance(result, float):
            result = round(result, 10)
        return {
            "expression": expression,
            "normalized": normalized,
            "result": result
        }
    except ZeroDivisionError:
        return {"expression": expression, "error": "Division by zero is undefined."}
    except Exception as e:
        return {"expression": expression, "error": f"Calculation error: {str(e)}"}
