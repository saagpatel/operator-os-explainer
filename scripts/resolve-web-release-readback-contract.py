#!/usr/bin/env python3
"""Emit immutable WebReleaseReadbackV1 checkout coordinates for CI."""

from __future__ import annotations

import json
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
LOCK_PATH = REPO_ROOT / ".github" / "contracts" / "web-release-readback.lock.json"
GIT_REVISION_RE = re.compile(r"^[0-9a-f]{40}$")


def main() -> int:
    lock = json.loads(LOCK_PATH.read_text(encoding="utf-8"))
    producer = lock.get("producer", {})
    repository = producer.get("repository")
    commit = producer.get("commit")
    if repository != "saagpatel/mcp-trust":
        raise SystemExit("web release readback lock names an unexpected producer")
    if not isinstance(commit, str) or GIT_REVISION_RE.fullmatch(commit) is None:
        raise SystemExit("web release readback lock has an invalid producer commit")
    print(f"repository={repository}")
    print(f"commit={commit}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
