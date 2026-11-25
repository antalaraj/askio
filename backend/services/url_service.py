import ipaddress
import socket
import logging
from urllib.parse import urlparse
from typing import Dict, Any
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

MAX_CONTENT_BYTES = 2 * 1024 * 1024  # 2MB
MAX_EXTRACTED_CHARS = 6000

def _is_safe_url(url: str) -> tuple[bool, str]:
    """Validate scheme and protect against SSRF by blocking private/loopback/reserved IPs."""
    try:
        parsed = urlparse(url.strip())
        if parsed.scheme not in ("http", "https"):
            return False, "Only http:// and https:// URLs are supported."
        hostname = parsed.hostname
        if not hostname:
            return False, "Invalid URL: missing hostname."

        # Resolve hostname and verify all IPs are public
        addr_info = socket.getaddrinfo(hostname, None)
        for info in addr_info:
            ip_str = info[4][0]
            ip_obj = ipaddress.ip_address(ip_str)
            if (
                ip_obj.is_private
                or ip_obj.is_loopback
                or ip_obj.is_link_local
                or ip_obj.is_multicast
                or ip_obj.is_reserved
                or ip_obj.is_unspecified
            ):
                return False, "Access to private or internal network addresses is blocked for security."

        return True, ""
    except socket.gaierror:
        return False, "Could not resolve hostname."
    except Exception as e:
        return False, f"URL validation failed: {str(e)}"

def fetch_webpage(url: str) -> Dict[str, Any]:
    """Safely fetch and extract readable text content from a public webpage."""
    if not url or not isinstance(url, str):
        return {"error": "URL is required."}

    is_safe, reason = _is_safe_url(url)
    if not is_safe:
        return {"url": url, "error": reason}

    try:
        headers = {
            "User-Agent": "AskioAssistant/1.0 (+https://github.com/antalaraj/askio)"
        }
        with httpx.Client(timeout=6.0, follow_redirects=False) as client:
            resp = client.get(url.strip(), headers=headers)

            # Handle safe single redirect if public
            if resp.is_redirect and resp.headers.get("location"):
                next_url = resp.headers["location"]
                safe_next, next_reason = _is_safe_url(next_url)
                if not safe_next:
                    return {"url": url, "error": f"Redirect blocked: {next_reason}"}
                resp = client.get(next_url, headers=headers)

            if resp.status_code >= 400:
                return {"url": url, "error": f"Webpage returned HTTP {resp.status_code}."}

            content_type = resp.headers.get("content-type", "").lower()
            if "text/html" not in content_type and "text/plain" not in content_type:
                return {"url": url, "error": f"Unsupported content type: {content_type}"}

            raw_bytes = resp.content[:MAX_CONTENT_BYTES]
            html_text = raw_bytes.decode(resp.encoding or "utf-8", errors="replace")

        soup = BeautifulSoup(html_text, "html.parser")
        title = soup.title.string.strip() if soup.title and soup.title.string else url

        # Remove scripts, styles, nav, footer
        for tag in soup(["script", "style", "noscript", "nav", "footer", "header", "aside"]):
            tag.decompose()

        text = soup.get_text(separator="\n")
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        cleaned_text = "\n".join(lines)[:MAX_EXTRACTED_CHARS]

        return {
            "url": url,
            "title": title,
            "content": cleaned_text
        }
    except httpx.TimeoutException:
        return {"url": url, "error": "Request timed out while fetching webpage."}
    except Exception as e:
        logger.warning("Failed to fetch URL '%s': %s", url, str(e))
        return {"url": url, "error": f"Could not retrieve webpage: {str(e)}"}
