import os
import logging
from typing import Dict, Any, List
import httpx

logger = logging.getLogger(__name__)

def web_search(query: str, max_results: int = 5) -> Dict[str, Any]:
    """
    Perform real-time web search.
    Uses Tavily API if TAVILY_API_KEY is configured, otherwise uses DuckDuckGo (ddgs).
    Returns structured results with title, url, and snippet.
    """
    cleaned_query = (query or "").strip()
    if not cleaned_query:
        return {"error": "Search query cannot be empty.", "results": []}

    tavily_key = os.getenv("TAVILY_API_KEY", "").strip()
    if tavily_key:
        try:
            with httpx.Client(timeout=8.0) as client:
                resp = client.post(
                    "https://api.tavily.com/search",
                    json={
                        "api_key": tavily_key,
                        "query": cleaned_query,
                        "search_depth": "basic",
                        "max_results": max_results,
                        "include_answer": False
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    results = [
                        {
                            "title": r.get("title", "Untitled"),
                            "url": r.get("url", ""),
                            "snippet": r.get("content", "")[:600]
                        }
                        for r in data.get("results", [])
                    ]
                    return {"provider": "Tavily", "results": results}
                logger.warning("Tavily returned status %d, falling back to DuckDuckGo.", resp.status_code)
        except Exception as e:
            logger.warning("Tavily search failed (%s), falling back to DuckDuckGo.", str(e))

    # DuckDuckGo fallback (zero-config)
    try:
        from ddgs import DDGS
        ddgs = DDGS(timeout=8)
        raw_results = list(ddgs.text(cleaned_query, max_results=max_results))
        if not raw_results:
            raw_results = list(ddgs.news(cleaned_query, max_results=max_results))

        results: List[Dict[str, str]] = []
        for r in raw_results:
            results.append({
                "title": r.get("title", "Untitled"),
                "url": r.get("href", "") or r.get("url", ""),
                "snippet": (r.get("body", "") or r.get("snippet", ""))[:600]
            })
        return {"provider": "DuckDuckGo", "results": results}
    except Exception as e:
        logger.warning("DuckDuckGo search failed (%s), trying Wikipedia fallback.", str(e))

    # Wikipedia open search fallback
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": cleaned_query,
                    "format": "json",
                    "srlimit": max_results
                },
                headers={"User-Agent": "AskioAssistant/1.0"}
            )
            if resp.status_code == 200:
                items = resp.json().get("query", {}).get("search", [])
                results = [
                    {
                        "title": item.get("title", ""),
                        "url": f"https://en.wikipedia.org/wiki/{item.get('title', '').replace(' ', '_')}",
                        "snippet": item.get("snippet", "").replace('<span class="searchmatch">', "").replace("</span>", "")
                    }
                    for item in items
                ]
                return {"provider": "Wikipedia", "results": results}
    except Exception as e:
        logger.error("All search providers failed: %s", str(e))

    return {"error": "Web search returned no results or is temporarily unavailable.", "results": []}
