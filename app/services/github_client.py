from __future__ import annotations

import asyncio
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings


class GitHubClient:
    """Minimal async GitHub REST v3 client using httpx."""

    _BASE_URL = "https://api.github.com"

    def __init__(self, username: str) -> None:
        self._headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "personal-portfolio-app",
        }
        self._client: Optional[httpx.AsyncClient] = None
        self._username = username

    async def _ensure_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self._BASE_URL, headers=self._headers, timeout=20
            )
        return self._client

    async def fetch_repos(self) -> List[Dict[str, Any]]:
        """Return public repos for the configured GitHub user (max 100)."""
        client = await self._ensure_client()
        params = {"per_page": 100, "type": "public", "sort": "updated"}
        resp = await client.get(f"/users/{self._username}/repos", params=params)
        resp.raise_for_status()
        return resp.json()

    async def fetch_repo(self, name: str) -> Dict[str, Any]:
        client = await self._ensure_client()
        resp = await client.get(f"/repos/{self._username}/{name}")
        resp.raise_for_status()
        return resp.json()

    async def fetch_readme_html(self, name: str) -> str:
        """Return GitHub-rendered README HTML without stripping heading and formatting tags."""
        client = await self._ensure_client()
        headers = {**self._headers, "Accept": "application/vnd.github.v3.html"}
        resp = await client.get(
            f"/repos/{self._username}/{name}/readme", headers=headers
        )
        if resp.status_code == 404:
            return ""
        resp.raise_for_status()
        return resp.text

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    # ------------------------------------------------------------------
    # Additional helpers for repository content
    # ------------------------------------------------------------------

    async def fetch_repo_tree(
        self, name: str, ref: str | None = None
    ) -> List[Dict[str, Any]]:
        """Return a recursive tree listing (all files) for *name*.

        Parameters
        ----------
        name
            Repository name.
        ref
            Branch name, tag, or commit SHA. If *None*, the repository's default
            branch is used.
        """
        client = await self._ensure_client()

        # Resolve ref lazily to avoid extra request when caller already knows it.
        if ref is None:
            # Fetch repo details (small cost; cached by caller most of the time)
            repo_resp = await client.get(f"/repos/{self._username}/{name}")
            repo_resp.raise_for_status()
            ref = repo_resp.json().get("default_branch", "main")

        params = {"recursive": 1}
        resp = await client.get(
            f"/repos/{self._username}/{name}/git/trees/{ref}", params=params
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("tree", [])  # type: ignore[return-value]

    async def fetch_file_raw(self, name: str, path: str) -> str:
        """Return raw (text) contents of a file in the given repository.

        Binary files are ignored – an empty string will be returned if the
        content type cannot be decoded as UTF-8.
        """
        client = await self._ensure_client()

        headers = {**self._headers, "Accept": "application/vnd.github.v3.raw"}
        resp = await client.get(
            f"/repos/{self._username}/{name}/contents/{path}", headers=headers
        )
        if resp.status_code == 404:
            return ""
        resp.raise_for_status()

        try:
            return resp.text
        except Exception:
            # Binary or undecodable content – skip
            return ""


# Convenience function for module-level usage

_client_lock = asyncio.Lock()
_cached_client: Optional[GitHubClient] = None


async def get_client() -> GitHubClient:
    """Return a singleton GitHubClient instance."""
    global _cached_client
    async with _client_lock:
        if _cached_client is None:
            _cached_client = GitHubClient(username=settings.github_username)
        return _cached_client
