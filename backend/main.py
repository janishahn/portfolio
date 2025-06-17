from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import orjson
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import yaml
import os
import httpx
import bleach

from services.github_client import get_client

# Logger (configured by start.py)
logger = logging.getLogger("portfolio")

load_dotenv()

# ---------------------------------------------------------------------------
# Constants & paths
# ---------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
CACHE_FILE = STATIC_DIR / "cache.json"
THESIS_FILE = STATIC_DIR / "thesis.yaml"
MEDIA_DIR = STATIC_DIR / "media"
PROFILE_FILE = STATIC_DIR / "profile.yaml"
SUMMARY_FILE = STATIC_DIR / "summaries.json"

CACHE_TTL = timedelta(hours=24)

# Ensure required dirs exist
STATIC_DIR.mkdir(parents=True, exist_ok=True)
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# In-memory store
# ---------------------------------------------------------------------------

_repo_list: List[Dict[str, Any]] = []
_repo_detail: Dict[str, Dict[str, Any]] = {}
_readme_html: Dict[str, str] = {}
_readme_summary: Dict[str, str] = {}
_thesis_meta: Dict[str, Any] = {}
_profile_data: Dict[str, Any] = {}

# Lock for cache updates
_cache_lock = asyncio.Lock()
_summary_lock = asyncio.Lock()

# Preferred order of file extensions when selecting fallback code files
_EXTENSION_PREFERENCE: List[str] = [
    ".py",
    ".js",
    ".ts",
    ".java",
    ".c",
    ".cpp",
    ".cc",
    ".h",
]

# Limit for fallback corpus (tokens)
_CODE_CORPUS_TOKEN_LIMIT = 100_000

# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------

app = FastAPI(default_response_class=JSONResponse, title="Personal Portfolio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"]
)

# Serve media assets
app.mount("/media", StaticFiles(directory=str(MEDIA_DIR)), name="media")


# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------

def _load_thesis() -> None:
    global _thesis_meta
    if THESIS_FILE.is_file():
        with THESIS_FILE.open("r", encoding="utf-8") as fh:
            _thesis_meta = yaml.safe_load(fh) or {}
    else:
        _thesis_meta = {}


def _calculate_age(birth_date_str: str) -> int:
    """Calculate age from birth date string (YYYY-MM-DD format)."""
    from datetime import date
    birth_date = date.fromisoformat(birth_date_str)
    today = date.today()
    age = today.year - birth_date.year
    if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
        age -= 1
    return age


def _load_profile() -> None:
    """Load profile data (e.g., about text, email) from YAML file."""
    global _profile_data
    if PROFILE_FILE.is_file():
        with PROFILE_FILE.open("r", encoding="utf-8") as fh:
            raw_data = yaml.safe_load(fh) or {}
            
        # Calculate age if birth_date is provided
        if "birth_date" in raw_data and "about" in raw_data:
            age = _calculate_age(raw_data["birth_date"])
            raw_data["about"] = raw_data["about"].format(age=age)
            
        _profile_data = raw_data
    else:
        _profile_data = {}


def _load_summaries() -> None:
    """Populate _readme_summary from persistent JSON file if present."""
    global _readme_summary
    if SUMMARY_FILE.is_file():
        try:
            _readme_summary = orjson.loads(SUMMARY_FILE.read_bytes())  # type: ignore[assignment]
        except Exception as exc:
            logger.warning("Failed to load summaries file: %s", exc)
            _readme_summary = {}
    else:
        _readme_summary = {}


def _write_summaries() -> None:
    """Write current _readme_summary to disk."""
    try:
        SUMMARY_FILE.write_bytes(orjson.dumps(_readme_summary, option=orjson.OPT_INDENT_2))
    except Exception as exc:
        logger.warning("Failed to write summaries file: %s", exc)


def _cache_data() -> Dict[str, Any]:
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "repos": _repo_list,
        "repo_detail": _repo_detail,
        "readmes": _readme_html,
        "summaries": _readme_summary,
    }


def _write_cache() -> None:
    with CACHE_FILE.open("wb") as fh:
        fh.write(orjson.dumps(_cache_data()))


def _read_cache() -> Optional[Dict[str, Any]]:
    if not CACHE_FILE.is_file():
        return None
    data = orjson.loads(CACHE_FILE.read_bytes())
    return data  # type: ignore[return-value]


def _cache_fresh(cache_ts_str: str) -> bool:
    try:
        ts = datetime.fromisoformat(cache_ts_str)
    except ValueError:
        return False
    return datetime.now(timezone.utc) - ts < CACHE_TTL


async def _refresh_cache(force: bool = False) -> None:
    global _repo_list, _repo_detail, _readme_html, _readme_summary

    async with _cache_lock:
        # Skip if not forced and existing cache is fresh
        if not force and _repo_list and _repo_detail:
            return

        gh = await get_client()
        repo_list = await gh.fetch_repos()

        simplified: List[Dict[str, Any]] = []
        detail_map: Dict[str, Dict[str, Any]] = {}
        readme_map: Dict[str, str] = {}

        # Keep a copy of current READMEs to detect changes
        previous_readmes = _readme_html.copy()

        # Build basic structures first (without summaries)
        for repo in repo_list:
            name = repo["name"]
            simplified.append(
                {
                    "name": name,
                    "html_url": repo["html_url"],
                    "description": repo["description"],
                    "language": repo["language"],
                    "stargazers_count": repo["stargazers_count"],
                    "updated_at": repo["updated_at"],
                }
            )

            # Store detail and README
            detail_map[name] = repo
            readme_map[name] = await gh.fetch_readme_html(name)

        # ------------------------------------------------------------------
        # Summaries – keep existing, generate missing in background
        # ------------------------------------------------------------------
        _repo_list = simplified
        _repo_detail = detail_map
        _readme_html = readme_map

        # Determine repos that need (re-)generation of summaries.
        missing: List[str] = []
        for name, html in readme_map.items():
            # 1. No summary exists yet
            if not _readme_summary.get(name):
                missing.append(name)
                continue

            # 2. README has changed compared to previous cache ➜ invalidate summary
            if html != previous_readmes.get(name):
                _readme_summary.pop(name, None)  # remove stale summary
                missing.append(name)

        _write_cache()
        # Persist removal of stale summaries if any
        if missing:
            _write_summaries()

        # Schedule background summarization without blocking refresh
        if missing:
            asyncio.create_task(_generate_missing_summaries(missing))


async def _load_or_refresh_cache() -> None:
    data = _read_cache()
    if data and _cache_fresh(data.get("timestamp", "")):
        global _repo_list, _repo_detail, _readme_html
        _repo_list = data.get("repos", [])
        _repo_detail = data.get("repo_detail", {})
        _readme_html = data.get("readmes", {})
        # Summaries are loaded separately at startup
    else:
        await _refresh_cache(force=True)


# ---------------------------------------------------------------------------
# Lifespan events
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup_event() -> None:
    _load_thesis()
    _load_profile()
    _load_summaries()
    await _load_or_refresh_cache()

    # Trigger background summary generation for any repositories that are
    # missing summaries (e.g., on first boot or when new repos were added
    # while the server was down).
    missing = [name for name in _readme_html.keys() if not _readme_summary.get(name)]
    if missing:
        asyncio.create_task(_generate_missing_summaries(missing))

    # Schedule a background task to refresh after 24h if server stays up
    async def periodic_refresh() -> None:
        while True:
            await asyncio.sleep(CACHE_TTL.total_seconds())
            await _refresh_cache(force=True)

    asyncio.create_task(periodic_refresh())


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/repos")
async def list_repos() -> List[Dict[str, Any]]:
    return _repo_list


@app.get("/api/repos/{name}")
async def get_repo(name: str) -> Dict[str, Any]:
    repo = _repo_detail.get(name)
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    readme_html = _readme_html.get(name, "")
    summary = _readme_summary.get(name)

    # If summary is missing, schedule background generation instead of
    # blocking the request.
    if summary is None and readme_html:
        asyncio.create_task(_generate_missing_summaries([name]))
        summary = ""

    return {**repo, "readme_summary": summary or "", "readme_html": readme_html}


@app.get("/api/thesis")
async def thesis_metadata() -> Dict[str, Any]:
    return _thesis_meta


@app.get("/api/profile")
async def profile_data() -> Dict[str, Any]:
    """Return basic profile information such as about text and email."""
    return _profile_data 


async def _generate_summary(readme_html: str, *, max_retries: int = 3, base_delay: float = 2.0) -> str:
    """Return a concise summary of a README using OpenRouter with retry logic."""
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not api_key or not readme_html:
        return ""

    # Convert HTML to plain text for cleaner summarisation
    plain_text = bleach.clean(readme_html, tags=[], strip=True)

    prompt = (
        "Provide a concise summary of the following GitHub repository README. "
        "Respond with 3-5 bullet points highlighting the purpose, key features, "
        "and usage if relevant. **DO NOT** include any other text in your response other than the summary."
        "\n\n<readme>\n" + plain_text + "\n</readme>"
    )

    model_slug = os.getenv("OPENROUTER_SUMMARY_MODEL", "google/gemma-3-27b-it:free")
    payload = {
        "model": model_slug,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant that summarises README files."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
    }

    for attempt in range(1, max_retries + 1):
        try:
            logger.debug("Making OpenRouter request (attempt %s/%s)", attempt, max_retries)
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                if resp.status_code >= 400:
                    logger.warning("OpenRouter error (%s): %s", resp.status_code, resp.text[:500])
                resp.raise_for_status()
                data = resp.json()
                logger.debug("OpenRouter request successful (status: %s)", resp.status_code)
                summary = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if summary:
                    return summary
        except Exception as exc:
            logger.warning(
                "Summary generation attempt %s/%s failed: %s", attempt, max_retries, exc
            )

        if attempt < max_retries:
            # Exponential backoff
            await asyncio.sleep(base_delay * (2 ** (attempt - 1)))

    # Give up – return empty summary
    return "" 


async def _generate_missing_summaries(missing: List[str]) -> None:
    """Background task to generate and persist summaries for the given repo names."""
    async with _summary_lock:
        for name in missing:
            # Double-check still missing (could have been filled while waiting)
            if name in _readme_summary and _readme_summary[name]:
                continue
            html = _readme_html.get(name, "")
            # If README HTML is missing (possibly due to stale cache), attempt to fetch a fresh
            # copy from GitHub before falling back to the code-based summary.
            if not html:
                try:
                    gh = await get_client()
                    html = await gh.fetch_readme_html(name)
                    # Update in-memory cache so subsequent calls can reuse the freshly fetched HTML.
                    _readme_html[name] = html or ""
                    _write_cache()
                except Exception as exc:
                    logger.debug("Failed to fetch README for %s during summary generation: %s", name, exc)
            
            if not html:
                # Attempt code-based fallback when README is missing.
                corpus = await _build_code_corpus(name)
                if corpus:
                    summary = await _generate_code_summary(corpus)
                else:
                    summary = ""
            else:
                summary = await _generate_summary(html)
            _readme_summary[name] = summary or ""
            _write_summaries() 


# ---------------------------------------------------------------------------
# Code fallback utilities
# ---------------------------------------------------------------------------


async def _build_code_corpus(repo_name: str) -> str:
    """Return concatenated code files for *repo_name* up to the token limit.

    Files are selected based on extension preference and file size (descending).
    A readable header is inserted before each file for clarity.
    """

    try:
        import tiktoken  # type: ignore
    except ImportError:
        # tiktoken missing – cannot build corpus reliably
        logger.warning("tiktoken not installed – skipping code corpus generation")
        return ""

    gh = await get_client()
    try:
        tree = await gh.fetch_repo_tree(repo_name)
    except Exception as exc:
        logger.warning("Unable to fetch repo tree for %s: %s", repo_name, exc)
        return ""

    # Collect candidate files
    candidates: List[tuple[int, int, str]] = []  # (pref_index, size, path)
    for item in tree:
        if item.get("type") != "blob":
            continue
        path = item.get("path", "")
        size = int(item.get("size", 0))
        ext = Path(path).suffix.lower()
        if ext in _EXTENSION_PREFERENCE:
            pref_index = _EXTENSION_PREFERENCE.index(ext)
            candidates.append((pref_index, size, path))

    # Sort by preference first, then size descending
    candidates.sort(key=lambda tup: (tup[0], -tup[1]))

    enc = tiktoken.get_encoding("cl100k_base")
    accumulated_tokens = 0
    parts: List[str] = []

    for _, _size, path in candidates:
        try:
            content = await gh.fetch_file_raw(repo_name, path)
        except Exception as exc:
            logger.debug("Skipping file %s due to error: %s", path, exc)
            continue

        if not content:
            continue

        snippet = f"\n===== FILE: {path} =====\n" + content.strip() + "\n"
        token_count = len(enc.encode(snippet))

        if accumulated_tokens + token_count > _CODE_CORPUS_TOKEN_LIMIT:
            # Stop if adding this file would exceed the limit
            break

        parts.append(snippet)
        accumulated_tokens += token_count

    return "\n".join(parts)


async def _generate_code_summary(code_text: str, *, max_retries: int = 3, base_delay: float = 2.0) -> str:
    """Generate a summary for concatenated *code_text* using OpenRouter."""

    api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not api_key or not code_text:
        return ""

    prompt = (
        "Analyze the following concatenated source code files from a GitHub repository. "
        "Respond with 3-5 bullet points highlighting the repository's purpose, key "
        "features, technologies used, and any notable implementation details. **DO NOT** "
        "include any other text in your response other than the summary."
        "\n\n<code>\n" + code_text + "\n</code>"
    )

    model_slug = os.getenv("OPENROUTER_SUMMARY_MODEL", "google/gemma-3-27b-it:free")
    payload = {
        "model": model_slug,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant that summarises codebases."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.7,
    }

    for attempt in range(1, max_retries + 1):
        try:
            logger.debug("Making OpenRouter request for code summary (attempt %s/%s)", attempt, max_retries)
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )
                if resp.status_code >= 400:
                    logger.warning("OpenRouter error (%s): %s", resp.status_code, resp.text[:500])
                resp.raise_for_status()
                data = resp.json()
                summary = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if summary:
                    return summary
        except Exception as exc:
            logger.warning(
                "Code summary generation attempt %s/%s failed: %s", attempt, max_retries, exc
            )

        if attempt < max_retries:
            await asyncio.sleep(base_delay * (2 ** (attempt - 1)))

    return "" 