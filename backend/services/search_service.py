import os
import re
import logging
import xml.etree.ElementTree as ET
from urllib.parse import quote_plus
from typing import Dict, Any, List
import httpx

logger = logging.getLogger(__name__)

def _google_news_rss_search(query: str, max_results: int = 5) -> List[Dict[str, str]]:
    """Fetch real-time news articles from Google News RSS (zero-config, highly reliable)."""
    encoded = quote_plus(query)
    url = f"https://news.google.com/rss/search?q={encoded}&hl=en-US&gl=US&ceid=US:en"
    with httpx.Client(timeout=5.0, follow_redirects=True) as client:
        resp = client.get(url, headers={"User-Agent": "AskioAssistant/1.0"})
        if resp.status_code != 200:
            return []
        root = ET.fromstring(resp.text)
        results: List[Dict[str, str]] = []
        for item in root.findall(".//item")[:max_results]:
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            pub_date = (item.findtext("pubDate") or "").strip()
            source_el = item.find("source")
            source_name = source_el.text.strip() if source_el is not None and source_el.text else ""
            if title and link:
                snippet = f"Published: {pub_date}" + (f" | Source: {source_name}" if source_name else "")
                results.append({
                    "title": title,
                    "url": link,
                    "snippet": snippet
                })
        return results

def _wikipedia_search(query: str, max_results: int = 3) -> List[Dict[str, str]]:
    """Fallback factual search via Wikipedia API."""
    # Strip temporal words that confuse Wikipedia's exact search
    cleaned = re.sub(r"\b(latest|news|recent|today|current|2025|2026|update|updates)\b", "", query, flags=re.IGNORECASE).strip()
    target = cleaned if len(cleaned) >= 2 else query
    with httpx.Client(timeout=5.0) as client:
        resp = client.get(
            "https://en.wikipedia.org/w/api.php",
            params={
                "action": "query",
                "list": "search",
                "srsearch": target,
                "format": "json",
                "srlimit": max_results
            },
            headers={"User-Agent": "AskioAssistant/1.0"}
        )
        if resp.status_code != 200:
            return []
        items = resp.json().get("query", {}).get("search", [])
        return [
            {
                "title": item.get("title", ""),
                "url": f"https://en.wikipedia.org/wiki/{item.get('title', '').replace(' ', '_')}",
                "snippet": re.sub(r"<[^>]+>", "", item.get("snippet", ""))
            }
            for item in items
        ]

def web_search(query: str, max_results: int = 5) -> Dict[str, Any]:
    """
    Perform real-time web search.
    Uses Tavily if configured; otherwise combines DuckDuckGo, Google News RSS, and Wikipedia.
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
                    if results:
                        return {"provider": "Tavily", "results": results}
                logger.warning("Tavily returned status %d or empty results.", resp.status_code)
        except Exception as e:
            logger.warning("Tavily search failed (%s), using fallback.", str(e))

    # Primary zero-config web search: DuckDuckGo
    try:
        from ddgs import DDGS
        ddgs = DDGS(timeout=6)
        raw_results = list(ddgs.text(cleaned_query, max_results=max_results))
        if not raw_results:
            raw_results = list(ddgs.news(cleaned_query, max_results=max_results))

        if raw_results:
            results = [
                {
                    "title": r.get("title", "Untitled"),
                    "url": r.get("href", "") or r.get("url", ""),
                    "snippet": (r.get("body", "") or r.get("snippet", ""))[:600]
                }
                for r in raw_results
            ]
            return {"provider": "DuckDuckGo", "results": results}
    except Exception as e:
        logger.warning("DuckDuckGo search error (%s), trying Google News RSS.", str(e))

    # Secondary zero-config live news fallback: Google News RSS
    try:
        news_results = _google_news_rss_search(cleaned_query, max_results=max_results)
        if news_results:
            return {"provider": "Google News", "results": news_results}
    except Exception as e:
        logger.warning("Google News RSS failed (%s), trying Wikipedia.", str(e))

    # Tertiary fallback: Wikipedia factual search
    try:
        wiki_results = _wikipedia_search(cleaned_query, max_results=min(3, max_results))
        if wiki_results:
            return {"provider": "Wikipedia", "results": wiki_results}
    except Exception as e:
        logger.error("All search providers failed: %s", str(e))

    return {"error": "Web search returned no results or is temporarily unavailable.", "results": []}
