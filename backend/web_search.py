"""
Web search API backed by Exa (official `exa-py` SDK).

- POST /api/search/web   admin-only → {"query": "...", "results": [...] }

Each result carries the page title, URL, publish date, and Exa "highlights" —
the few most relevant excerpts of the page, so an agent or the admin panel can
read the gist without fetching every page.

The API key is read from EXA_API_KEY in the environment (the project-root .env
is loaded by app.py) and is never echoed back or accepted from a request. The
route is admin-only because every search spends Exa credits.
"""

import os

from exa_py import Exa
from flask import Blueprint, jsonify, request

from admin_auth import require_admin

web_search_bp = Blueprint("web_search", __name__)

DEFAULT_NUM_RESULTS = 5
MAX_NUM_RESULTS = 10
MAX_QUERY_CHARS = 400


class SearchNotConfigured(RuntimeError):
    """EXA_API_KEY is missing — the feature is switched off, not broken."""


def exa_client() -> Exa:
    api_key = (os.environ.get("EXA_API_KEY") or "").strip()
    if not api_key:
        raise SearchNotConfigured(
            "Web search is not configured. Set EXA_API_KEY in the environment "
            "(see .env.example) and restart the server."
        )
    return Exa(api_key=api_key)


def search_web(query: str, num_results: int = DEFAULT_NUM_RESULTS) -> list[dict]:
    """Search the web with Exa and return compact, JSON-ready results."""
    try:
        num_results = int(num_results)
    except (TypeError, ValueError):
        raise ValueError("numResults must be a number.") from None
    num_results = max(1, min(num_results, MAX_NUM_RESULTS))
    response = exa_client().search(
        query,
        type="auto",
        num_results=num_results,
        contents={"highlights": {"max_characters": 400}},
    )

    results = []
    for r in response.results:
        results.append(
            {
                "title": getattr(r, "title", None) or "",
                "url": getattr(r, "url", None) or "",
                "publishedDate": getattr(r, "published_date", None),
                "author": getattr(r, "author", None),
                "highlights": list(getattr(r, "highlights", None) or []),
            }
        )
    return results


@web_search_bp.post("/api/search/web")
@require_admin
def search_web_route():
    body = request.get_json(silent=True) or {}
    query = body.get("query")
    if not isinstance(query, str) or not query.strip():
        return jsonify({"error": "A search query is required."}), 400
    query = query.strip()
    if len(query) > MAX_QUERY_CHARS:
        return jsonify({"error": "Search query is too long."}), 400

    try:
        results = search_web(query, body.get("numResults") or DEFAULT_NUM_RESULTS)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except SearchNotConfigured as e:
        return jsonify({"error": str(e)}), 503
    except Exception as e:  # network / quota / auth failures from Exa
        print(f"[search] Exa request failed: {type(e).__name__}: {e}")
        return jsonify({"error": "Web search failed. Try again shortly."}), 502

    return jsonify({"query": query, "results": results})
