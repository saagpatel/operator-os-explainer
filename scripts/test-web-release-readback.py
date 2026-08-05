#!/usr/bin/env python3
"""Verify the pinned readback contract against the built explainer shell."""

from __future__ import annotations

import copy
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
LOCK_PATH = REPO_ROOT / ".github" / "contracts" / "web-release-readback.lock.json"
MANIFEST_PATH = REPO_ROOT / "scripts" / "operator-os-explainer-release-readback.json"
VERIFIER_PATH = REPO_ROOT / "scripts" / "web_release_readback.py"
DIST_INDEX_PATH = REPO_ROOT / "dist" / "index.html"
EXPECTED_ROUTES = ["/", "/safety", "/scene-that-does-not-exist"]


def _sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _producer_path(root: Path, relative_path: object) -> Path:
    if not isinstance(relative_path, str) or not relative_path:
        raise AssertionError("producer path must be a non-empty string")
    candidate = (root / relative_path).resolve()
    if candidate == root or root not in candidate.parents:
        raise AssertionError(f"producer path escapes checkout: {relative_path}")
    return candidate


class _ShellHandler(BaseHTTPRequestHandler):
    shell = b""
    unsafe_requests = 0

    def log_message(self, format: str, *args: object) -> None:  # noqa: A002
        return

    def _send(self, status: int, body: bytes) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        if self.path in EXPECTED_ROUTES:
            self._send(200, type(self).shell)
        else:
            self._send(404, b"not found\n")

    def do_POST(self) -> None:  # noqa: N802
        type(self).unsafe_requests += 1
        self._send(500, b"unsafe request reached fixture\n")


@contextmanager
def _server(shell: bytes) -> Iterator[str]:
    _ShellHandler.shell = shell
    _ShellHandler.unsafe_requests = 0
    server = ThreadingHTTPServer(("127.0.0.1", 0), _ShellHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    host, port = server.server_address
    try:
        yield f"http://{host}:{port}"
    finally:
        server.shutdown()
        thread.join(timeout=5)
        server.server_close()


def _run_verifier(manifest: Path, target_url: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            sys.executable,
            str(VERIFIER_PATH),
            "--manifest",
            str(manifest),
            "--target-url",
            target_url,
        ],
        cwd=REPO_ROOT,
        check=False,
        capture_output=True,
        text=True,
    )


def _verify_lock() -> tuple[dict[str, object], dict[str, object]]:
    lock = json.loads(LOCK_PATH.read_text(encoding="utf-8"))
    assert lock["schema"] == "WebReleaseReadbackConsumerLockV1"
    assert lock["contract_version"] == "1.0.0"
    assert lock["consumer_profile"] == "spa-preview"
    assert lock["consumer_repository"] == "saagpatel/operator-os-explainer"

    producer = lock["producer"]
    assert isinstance(producer, dict)
    assert producer["repository"] == "saagpatel/mcp-trust"
    commit = producer["commit"]
    assert isinstance(commit, str) and len(commit) == 40

    adapter = lock["adapter"]
    assert isinstance(adapter, dict)
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    assert _sha256(VERIFIER_PATH.read_bytes()) == producer["artifacts"][
        "reference_verifier"
    ]["sha256"]
    assert _sha256(MANIFEST_PATH.read_bytes()) == adapter["route_manifest_sha256"]

    producer_root_raw = os.environ.get("WEB_RELEASE_READBACK_CONTRACT_ROOT")
    if producer_root_raw:
        producer_root = Path(producer_root_raw).resolve()
        assert producer_root.is_dir()
        artifacts = producer["artifacts"]
        assert isinstance(artifacts, dict)
        for artifact in artifacts.values():
            assert isinstance(artifact, dict)
            source = _producer_path(producer_root, artifact["path"])
            assert source.is_file()
            assert _sha256(source.read_bytes()) == artifact["sha256"]
        reference = _producer_path(
            producer_root, artifacts["reference_verifier"]["path"]
        )
        assert reference.read_bytes() == VERIFIER_PATH.read_bytes()

    return lock, manifest


def _verify_manifest(manifest: dict[str, object]) -> None:
    assert manifest["schema"] == "WebReleaseSentinelManifestV1"
    assert manifest["contract_version"] == "1.0.0"
    assert manifest["denied_methods"] == [
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "CONNECT",
        "TRACE",
    ]
    routes = manifest["routes"]
    assert isinstance(routes, list)
    assert [route["route"] for route in routes] == EXPECTED_ROUTES
    assert all(route["method"] == "GET" for route in routes)
    assert all(route["expected_status"] == 200 for route in routes)


def _verify_existing_checks_remain() -> None:
    parity = (REPO_ROOT / "scripts" / "check-live-parity.ts").read_text(
        encoding="utf-8"
    )
    assert "export const ROUTES" in parity
    assert "EXPECTED_DEPLOYMENT_ID" in parity
    assert "inspectDeployment" in parity
    assert "metadataErrors" in parity
    assert "assetHashes" in parity

    guard = (REPO_ROOT / "scripts" / "guard-scan.ts").read_text(encoding="utf-8")
    assert '".py"' in guard
    publish = (REPO_ROOT / "scripts" / "publish.sh").read_text(encoding="utf-8")
    assert "node scripts/guard-scan.ts --git" in publish
    assert "EXCLUDE=(prep SPEC.md evidence .serena)" in publish
    assert 'RELEASE_REF="${RELEASE_REF:-origin/main}"' in publish
    assert 'git merge-base "$SOURCE_REF" "$RELEASE_REF_SHA"' in publish
    assert 'fetch --quiet --no-tags "$REPO_ROOT" "$RELEASE_REF_SHA"' in publish


def main() -> int:
    _lock, manifest = _verify_lock()
    _verify_manifest(manifest)
    _verify_existing_checks_remain()
    assert DIST_INDEX_PATH.is_file(), "run pnpm build before the readback test"
    shell = DIST_INDEX_PATH.read_bytes()

    with _server(shell) as target_url:
        completed = _run_verifier(MANIFEST_PATH, target_url)
        assert completed.returncode == 0, completed.stdout + completed.stderr
        receipt = json.loads(completed.stdout)
        assert receipt["state"] == "passed"
        assert receipt["summary"] == {"total": 3, "passed": 3, "failed": 0}
        assert _ShellHandler.unsafe_requests == 0

        denied = copy.deepcopy(manifest)
        denied["routes"][0]["method"] = "POST"
        with tempfile.TemporaryDirectory() as tmp:
            denied_path = Path(tmp) / "denied.json"
            denied_path.write_text(json.dumps(denied), encoding="utf-8")
            rejected = _run_verifier(denied_path, target_url)
        assert rejected.returncode == 2
        assert rejected.stdout == ""
        assert "only GET and HEAD are implemented" in rejected.stderr
        assert _ShellHandler.unsafe_requests == 0

    print(
        "Operator OS Explainer WebReleaseReadbackV1 passed: three SPA routes, "
        "pinned producer bytes, denied-method preflight, and existing release checks."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
