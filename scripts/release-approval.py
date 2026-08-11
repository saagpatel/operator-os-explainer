#!/usr/bin/env python3
"""Issue and verify a freshness-bound proof-pr release approval.

This is a local pilot. It never pushes, deploys, changes aliases, installs
packages, or enables the intentionally disabled ``publish.sh --publish`` path.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterator


POLICY_FILE = "release-approval-policy.json"
APPROVAL_FILE = "release-approval.json"
RECEIPT_FILE = "proof-pr.json"
APPROVAL_SCHEMA = "operator-os-explainer.release-approval.v1"
DECISION_SCHEMA = "operator-os-explainer.release-approval-decision.v1"
POLICY_SCHEMA = "operator-os-explainer.release-approval-policy.v1"
HEX40 = re.compile(r"^[0-9a-f]{40}$")


class ApprovalError(RuntimeError):
    """A stable, operator-actionable release approval refusal."""


def stable_json(value: Any) -> str:
    return json.dumps(value, sort_keys=True, indent=2, ensure_ascii=True) + "\n"


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def read_bytes(path: Path, label: str) -> bytes:
    if path.is_symlink():
        raise ApprovalError(f"{label} must not be a symlink")
    try:
        before = path.stat()
        value = path.read_bytes()
        after = path.stat()
    except OSError as exc:
        raise ApprovalError(f"{label} is unreadable: {exc.strerror or exc}") from exc
    if (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns) != (
        after.st_dev,
        after.st_ino,
        after.st_size,
        after.st_mtime_ns,
    ):
        raise ApprovalError(f"{label} changed while being read")
    return value


def load_json(path: Path, label: str) -> tuple[dict[str, Any], bytes]:
    raw = read_bytes(path, label)
    try:
        value = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ApprovalError(f"{label} is malformed JSON") from exc
    if not isinstance(value, dict):
        raise ApprovalError(f"{label} must be a JSON object")
    return value, raw


def atomic_write(path: Path, value: bytes) -> None:
    path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    if path.exists() and path.is_symlink():
        raise ApprovalError(f"refusing to replace symlink output: {path.name}")
    temporary = path.with_name(f".{path.name}.tmp")
    try:
        with temporary.open("wb") as handle:
            os.fchmod(handle.fileno(), 0o600)
            handle.write(value)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()


def exact_keys(value: dict[str, Any], expected: set[str], label: str) -> None:
    missing = sorted(expected - set(value))
    extra = sorted(set(value) - expected)
    if missing or extra:
        parts: list[str] = []
        if missing:
            parts.append(f"missing={','.join(missing)}")
        if extra:
            parts.append(f"extra={','.join(extra)}")
        raise ApprovalError(f"{label} keys are invalid ({'; '.join(parts)})")


def git(root: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(root), *args],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={**os.environ, "GIT_OPTIONAL_LOCKS": "0"},
        check=False,
    )
    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip() or "git command failed"
        raise ApprovalError(detail)
    return result.stdout.strip()


def repo_root() -> Path:
    return Path(git(Path.cwd(), "rev-parse", "--show-toplevel")).resolve()


def parse_utc(value: Any, label: str) -> datetime:
    if not isinstance(value, str) or not value.endswith("Z"):
        raise ApprovalError(f"{label} must be an ISO 8601 UTC timestamp ending in Z")
    try:
        parsed = datetime.fromisoformat(value[:-1] + "+00:00")
    except ValueError as exc:
        raise ApprovalError(f"{label} is not a valid timestamp") from exc
    if parsed.tzinfo != timezone.utc:
        raise ApprovalError(f"{label} must be UTC")
    return parsed


def format_utc(value: datetime) -> str:
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace(
        "+00:00", "Z"
    )


def load_policy(root: Path) -> tuple[dict[str, Any], bytes]:
    policy, raw = load_json(root / POLICY_FILE, "release approval policy")
    exact_keys(
        policy,
        {
            "schema_version",
            "proof_pr",
            "max_age_seconds",
            "base_ref",
            "base_commit",
            "required_evidence",
            "ignored_paths",
            "claim_ceiling",
        },
        "release approval policy",
    )
    if policy["schema_version"] != POLICY_SCHEMA:
        raise ApprovalError("unsupported release approval policy schema")
    if not isinstance(policy["proof_pr"], dict):
        raise ApprovalError("policy proof_pr must be an object")
    exact_keys(policy["proof_pr"], {"commit", "version"}, "policy proof_pr")
    if not HEX40.fullmatch(str(policy["proof_pr"]["commit"])):
        raise ApprovalError("policy proof_pr commit must be a full lowercase SHA")
    if not isinstance(policy["max_age_seconds"], int) or not 1 <= policy["max_age_seconds"] <= 3600:
        raise ApprovalError("policy max_age_seconds must be between 1 and 3600")
    if not isinstance(policy["base_ref"], str) or not policy["base_ref"]:
        raise ApprovalError("policy base_ref must be non-empty")
    if not HEX40.fullmatch(str(policy["base_commit"])):
        raise ApprovalError("policy base_commit must be a full lowercase SHA")
    for key in ("required_evidence", "ignored_paths"):
        values = policy[key]
        if (
            not isinstance(values, list)
            or not values
            or not all(isinstance(item, str) and item for item in values)
            or len(values) != len(set(values))
        ):
            raise ApprovalError(f"policy {key} must contain unique non-empty strings")
    if policy["ignored_paths"] != sorted(policy["ignored_paths"]):
        raise ApprovalError("policy ignored_paths must be sorted")
    if not isinstance(policy["claim_ceiling"], str) or not policy["claim_ceiling"]:
        raise ApprovalError("policy claim_ceiling must be non-empty")
    return policy, raw


def validate_provider(provider: Path, policy: dict[str, Any]) -> tuple[str, str]:
    provider = provider.resolve()
    if not provider.is_dir():
        raise ApprovalError("proof-pr root is not a directory")
    provider_head = git(provider, "rev-parse", "HEAD")
    if provider_head != policy["proof_pr"]["commit"]:
        raise ApprovalError("proof-pr provider commit does not match the pinned policy")
    if git(provider, "status", "--porcelain"):
        raise ApprovalError("proof-pr provider checkout is dirty")
    pyproject = read_bytes(provider / "pyproject.toml", "proof-pr pyproject").decode("utf-8")
    match = re.search(r'^version = "([^"]+)"$', pyproject, re.MULTILINE)
    if not match or match.group(1) != policy["proof_pr"]["version"]:
        raise ApprovalError("proof-pr provider version does not match the pinned policy")
    cli = provider / "scripts" / "proof_pr.py"
    if not cli.is_file() or cli.is_symlink():
        raise ApprovalError("proof-pr source-checkout CLI is unavailable or unsafe")
    return provider_head, match.group(1)


def run_proof_pr_validate(provider: Path, receipt: Path) -> None:
    result = subprocess.run(
        [sys.executable, "-B", str(provider / "scripts" / "proof_pr.py"), "validate", str(receipt)],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={**os.environ, "PYTHONDONTWRITEBYTECODE": "1"},
        check=False,
    )
    if result.returncode != 0:
        detail = (result.stderr.strip() or result.stdout.strip() or "no diagnostic").splitlines()[-1]
        raise ApprovalError(f"proof-pr rejected the receipt: {detail[:240]}")


def validate_dependency_tree(root: Path, dependencies: Path) -> tuple[str, str]:
    dependencies = dependencies.resolve()
    if not dependencies.is_dir() or dependencies.is_symlink():
        raise ApprovalError("dependency tree must be a real directory")
    for candidate in dependencies.rglob("*"):
        if not candidate.is_symlink():
            continue
        try:
            resolved = candidate.resolve(strict=True)
        except OSError as exc:
            raise ApprovalError("dependency tree contains a broken symlink") from exc
        if not resolved.is_relative_to(dependencies):
            raise ApprovalError("dependency tree contains a symlink that escapes its root")
    source_lock = read_bytes(root / "pnpm-lock.yaml", "source dependency lock")
    installed_lock = read_bytes(
        dependencies / ".pnpm" / "lock.yaml", "installed dependency lock"
    )
    if source_lock != installed_lock:
        raise ApprovalError("pre-provisioned dependencies do not match pnpm-lock.yaml")
    return sha256_bytes(source_lock), sha256_bytes(installed_lock)


@contextmanager
def linked_dependencies(root: Path, dependencies: Path) -> Iterator[None]:
    link = root / "node_modules"
    if link.exists() or link.is_symlink():
        raise ApprovalError("worktree node_modules must be absent before the isolated run")
    link.symlink_to(dependencies, target_is_directory=True)
    try:
        yield
    finally:
        if not link.is_symlink() or link.resolve() != dependencies.resolve():
            raise ApprovalError("managed node_modules link changed during the run")
        link.unlink()


def ensure_output_directory(path: Path) -> Path:
    if path.exists():
        if path.is_symlink() or not path.is_dir():
            raise ApprovalError("output directory must be a real directory")
        if any(path.iterdir()):
            raise ApprovalError("output directory must be empty")
    else:
        path.mkdir(mode=0o700, parents=True)
    os.chmod(path, 0o700)
    return path.resolve()


def run_check(
    root: Path,
    output: Path,
    check_id: str,
    command: list[str],
    env: dict[str, str] | None = None,
) -> dict[str, Any]:
    result = subprocess.run(
        command,
        cwd=root,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env={**os.environ, **(env or {})},
        check=False,
    )
    relative = Path("logs") / f"{check_id}.log"
    body = (
        f"command: {json.dumps(command)}\n"
        f"exit_code: {result.returncode}\n"
        f"--- output ---\n{result.stdout}"
    ).encode("utf-8")
    atomic_write(output / relative, body)
    return {
        "id": check_id,
        "kind": {
            "typecheck": "typecheck",
            "tests": "test",
            "build": "build",
            "guard-scan": "security",
            "dataset-determinism": "test",
        }[check_id],
        "command": command,
        "status": "passed" if result.returncode == 0 else "failed",
        "required": True,
        "summary": f"{check_id} exited {result.returncode}.",
        "artifact_ids": [f"log-{check_id}"],
        "freshness_hours": 1,
        "artifact": {
            "id": f"log-{check_id}",
            "kind": "log",
            "path_or_url": relative.as_posix(),
            "description": f"Captured {check_id} output and exit code.",
            "sha256": sha256_bytes(body),
            "required": True,
            "external": False,
        },
    }


def run_dataset_check(root: Path, output: Path, node: str) -> dict[str, Any]:
    dataset = root / "src/data/dataset.json"
    original = read_bytes(dataset, "committed dataset")
    command = [node, "scripts/generate-dataset.ts"]
    result = subprocess.run(
        command,
        cwd=root,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env=os.environ,
        check=False,
    )
    generated = read_bytes(dataset, "generated dataset")
    matches = generated == original
    if not matches:
        dataset.write_bytes(original)
    relative = Path("logs/dataset-determinism.log")
    body = (
        f"command: {json.dumps(command)}\n"
        f"exit_code: {result.returncode}\n"
        f"matches_committed_bytes: {str(matches).lower()}\n"
        f"--- output ---\n{result.stdout}"
    ).encode("utf-8")
    atomic_write(output / relative, body)
    passed = result.returncode == 0 and matches
    return {
        "id": "dataset-determinism",
        "kind": "test",
        "command": command,
        "status": "passed" if passed else "failed",
        "required": True,
        "summary": "dataset generator exited cleanly and reproduced committed bytes."
        if passed
        else "dataset generator failed or drifted from committed bytes.",
        "artifact_ids": ["log-dataset-determinism"],
        "freshness_hours": 1,
        "artifact": {
            "id": "log-dataset-determinism",
            "kind": "log",
            "path_or_url": relative.as_posix(),
            "description": "Captured generator output and byte comparison.",
            "sha256": sha256_bytes(body),
            "required": True,
            "external": False,
        },
    }


def diff_details(root: Path, base: str) -> tuple[list[str], dict[str, int]]:
    names = [
        line
        for line in git(root, "diff", "--name-only", f"{base}...HEAD").splitlines()
        if line
    ]
    numstat = git(root, "diff", "--numstat", f"{base}...HEAD")
    additions = 0
    deletions = 0
    for line in numstat.splitlines():
        fields = line.split("\t", 2)
        if len(fields) >= 2 and fields[0].isdigit() and fields[1].isdigit():
            additions += int(fields[0])
            deletions += int(fields[1])
    return sorted(names), {"files": len(names), "additions": additions, "deletions": deletions}


def reject_ignored_changes(files: list[str], ignored: list[str]) -> None:
    collisions = sorted(
        path
        for path in files
        if any(path == prefix or path.startswith(f"{prefix}/") for prefix in ignored)
    )
    if collisions:
        raise ApprovalError(f"candidate changes ignored paths: {','.join(collisions)}")


def issue(args: argparse.Namespace) -> int:
    root = repo_root()
    policy, policy_raw = load_policy(root)
    provider = Path(args.proof_pr_root).resolve()
    provider_head, provider_version = validate_provider(provider, policy)
    dependencies = Path(args.node_modules).resolve()
    source_lock_sha, installed_lock_sha = validate_dependency_tree(root, dependencies)
    if git(root, "status", "--porcelain"):
        raise ApprovalError("release approval must run from a clean committed worktree")
    source_head = git(root, "rev-parse", "HEAD")
    if not HEX40.fullmatch(source_head):
        raise ApprovalError("source HEAD is not a full SHA")
    source_branch = git(root, "symbolic-ref", "--short", "HEAD")
    base_ref = str(policy["base_ref"])
    base_head = git(root, "rev-parse", base_ref)
    if base_head != policy["base_commit"]:
        raise ApprovalError("base ref does not match the pinned policy commit")
    ancestor = subprocess.run(
        ["git", "-C", str(root), "merge-base", "--is-ancestor", base_head, source_head],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        env={**os.environ, "GIT_OPTIONAL_LOCKS": "0"},
        check=False,
    )
    if ancestor.returncode == 1:
        raise ApprovalError("candidate does not descend from the pinned base")
    if ancestor.returncode != 0:
        raise ApprovalError("candidate ancestry could not be verified")
    files_touched, stats = diff_details(root, base_ref)
    reject_ignored_changes(files_touched, policy["ignored_paths"])
    now = parse_utc(args.now, "--now")
    output = ensure_output_directory(Path(args.output_dir))
    node = shutil.which("node")
    if node is None:
        raise ApprovalError("node executable is unavailable")

    checks: list[dict[str, Any]] = []
    with linked_dependencies(root, dependencies):
        checks.append(
            run_check(root, output, "typecheck", [node, str(dependencies / "typescript/bin/tsc"), "-b"])
        )
        checks.append(
            run_check(root, output, "tests", [node, str(dependencies / "vitest/vitest.mjs"), "run"])
        )
        checks.append(
            run_check(root, output, "build", [node, str(dependencies / "vite/bin/vite.js"), "build"])
        )
        checks.append(run_check(root, output, "guard-scan", [node, "scripts/guard-scan.ts"]))
        checks.append(run_dataset_check(root, output, node))
    if git(root, "status", "--porcelain"):
        raise ApprovalError("required checks left tracked worktree changes")

    evidence = [{key: value for key, value in item.items() if key != "artifact"} for item in checks]
    artifacts = [item["artifact"] for item in checks]
    all_passed = all(item["status"] == "passed" for item in evidence)
    receipt = {
        "schema_version": "proof-pr.v1",
        "receipt_id": f"operator-release-{source_head[:12]}-{now.strftime('%Y%m%dT%H%M%SZ')}",
        "generated_at": format_utc(now),
        "subject": {
            "repo": "saagpatel/operator-os-explainer",
            "base_ref": base_ref,
            "base_sha": base_head,
            "head_ref": source_branch,
            "head_sha": source_head,
            "head_sha_status": "exact",
        },
        "producer": {
            "tool": "proof-pr",
            "version": provider_version,
            "agent": "manual",
            "mode": "local",
        },
        "risk": {
            "tier": "T3",
            "reasons": ["public merge and release approval", "fresh base binding"],
            "changed_surfaces": ["release approval tooling", "proof receipt"],
        },
        "change": {
            "summary": "Bind operator-os-explainer merge and release review to current local proof.",
            "files_touched": files_touched,
            "diff_stats": stats,
            "scope_notes": "Local pilot only; no push, deployment, alias promotion, or production claim.",
        },
        "evidence": evidence,
        "security": {
            "secrets_scan": {
                "status": "passed" if all_passed else "failed",
                "summary": "The repository guard scan is required and remains visible as evidence.",
                "artifact_ids": ["log-guard-scan"],
            },
            "permission_diff": {
                "status": "not_applicable",
                "summary": "This pilot does not change workflow or deployment permissions.",
            },
            "redaction": {
                "status": "passed" if all_passed else "failed",
                "summary": "The repository guard is required; approval logs remain local.",
                "artifact_ids": ["log-guard-scan"],
            },
        },
        "rollback": {
            "status": "documented",
            "path": "Revert the local pilot commit; the existing review procedure remains unchanged.",
            "notes": "Deleting an unconsumed local receipt revokes no remote or runtime state.",
        },
        "artifacts": artifacts,
        "limitations": [] if all_passed else ["One or more required local checks failed."],
        "overall": {
            "status": "passed" if all_passed else "failed",
            "review_decision": "ready" if all_passed else "reject",
        },
    }
    receipt_path = output / RECEIPT_FILE
    atomic_write(receipt_path, stable_json(receipt).encode("utf-8"))
    run_proof_pr_validate(provider, receipt_path)
    receipt_raw = read_bytes(receipt_path, "proof-pr receipt")
    approval_evidence = [
        {
            "id": item["id"],
            "path": item["artifact"]["path_or_url"],
            "sha256": item["artifact"]["sha256"],
            "status": item["status"],
        }
        for item in checks
    ]
    candidate_tree = git(root, "rev-parse", "HEAD^{tree}")
    approval = {
        "schema_version": APPROVAL_SCHEMA,
        "decision": "approve_local_merge_review" if all_passed else "reject",
        "generated_at": format_utc(now),
        "expires_at": format_utc(now + timedelta(seconds=policy["max_age_seconds"])),
        "source": {"branch": source_branch, "head_sha": source_head},
        "base": {"ref": base_ref, "head_sha": base_head},
        "proof_pr": {
            "provider_commit": provider_head,
            "provider_version": provider_version,
            "receipt": RECEIPT_FILE,
            "receipt_sha256": sha256_bytes(receipt_raw),
        },
        "dependencies": {
            "lockfile_sha256": source_lock_sha,
            "installed_lockfile_sha256": installed_lock_sha,
        },
        "policy_sha256": sha256_bytes(policy_raw),
        "required_evidence": list(policy["required_evidence"]),
        "evidence": approval_evidence,
        "ignored_paths": list(policy["ignored_paths"]),
        "candidate_tree_sha": candidate_tree,
        "claim_ceiling": policy["claim_ceiling"],
    }
    approval_path = output / APPROVAL_FILE
    atomic_write(approval_path, stable_json(approval).encode("utf-8"))
    decision = verify_approval(root, provider, approval_path, now)
    print(stable_json(decision), end="")
    return 0 if decision["decision"] == "GO" else 2


def safe_child(root: Path, relative: Any, label: str) -> Path:
    if not isinstance(relative, str) or not relative:
        raise ApprovalError(f"{label} must be a non-empty relative path")
    rel = Path(relative)
    if rel.is_absolute() or ".." in rel.parts:
        raise ApprovalError(f"{label} must stay inside the approval directory")
    candidate = root / rel
    resolved_parent = candidate.parent.resolve()
    if resolved_parent != root and root not in resolved_parent.parents:
        raise ApprovalError(f"{label} escapes the approval directory")
    return candidate


def verify_approval(
    root: Path, provider: Path, approval_path: Path, now: datetime
) -> dict[str, Any]:
    policy, policy_raw = load_policy(root)
    provider_head, provider_version = validate_provider(provider, policy)
    approval, _ = load_json(approval_path, "release approval")
    exact_keys(
        approval,
        {
            "schema_version",
            "decision",
            "generated_at",
            "expires_at",
            "source",
            "base",
            "proof_pr",
            "dependencies",
            "policy_sha256",
            "required_evidence",
            "evidence",
            "ignored_paths",
            "candidate_tree_sha",
            "claim_ceiling",
        },
        "release approval",
    )
    if approval["schema_version"] != APPROVAL_SCHEMA:
        raise ApprovalError("unsupported release approval schema")
    if approval["decision"] != "approve_local_merge_review":
        raise ApprovalError("release approval decision is not an approval")
    generated = parse_utc(approval["generated_at"], "approval generated_at")
    expires = parse_utc(approval["expires_at"], "approval expires_at")
    if expires - generated != timedelta(seconds=policy["max_age_seconds"]):
        raise ApprovalError("approval expiry does not match policy")
    if now < generated:
        raise ApprovalError("approval is from the future")
    if now > expires:
        raise ApprovalError("approval is stale")
    if approval["policy_sha256"] != sha256_bytes(policy_raw):
        raise ApprovalError("approval policy digest does not match current policy")
    if approval["claim_ceiling"] != policy["claim_ceiling"]:
        raise ApprovalError("approval claim ceiling does not match policy")
    if approval["required_evidence"] != policy["required_evidence"]:
        raise ApprovalError("approval required evidence does not match policy")
    if approval["ignored_paths"] != policy["ignored_paths"]:
        raise ApprovalError("approval ignored paths do not match policy")

    for key, expected in (("source", {"branch", "head_sha"}), ("base", {"ref", "head_sha"})):
        if not isinstance(approval[key], dict):
            raise ApprovalError(f"approval {key} must be an object")
        exact_keys(approval[key], expected, f"approval {key}")
    if approval["source"]["head_sha"] != git(root, "rev-parse", "HEAD"):
        raise ApprovalError("approval source SHA does not match current HEAD")
    if approval["source"]["branch"] != git(root, "symbolic-ref", "--short", "HEAD"):
        raise ApprovalError("approval source branch does not match current branch")
    if approval["base"]["ref"] != policy["base_ref"]:
        raise ApprovalError("approval base ref does not match policy")
    current_base = git(root, "rev-parse", policy["base_ref"])
    if current_base != policy["base_commit"]:
        raise ApprovalError("current base ref does not match the pinned policy commit")
    if approval["base"]["head_sha"] != current_base:
        raise ApprovalError("approval base SHA does not match current base ref")
    ancestor = subprocess.run(
        [
            "git",
            "-C",
            str(root),
            "merge-base",
            "--is-ancestor",
            current_base,
            approval["source"]["head_sha"],
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        env={**os.environ, "GIT_OPTIONAL_LOCKS": "0"},
        check=False,
    )
    if ancestor.returncode != 0:
        raise ApprovalError("approval source does not descend from the pinned base")
    current_files, _ = diff_details(root, policy["base_ref"])
    reject_ignored_changes(current_files, policy["ignored_paths"])

    if not isinstance(approval["proof_pr"], dict):
        raise ApprovalError("approval proof_pr must be an object")
    exact_keys(
        approval["proof_pr"],
        {"provider_commit", "provider_version", "receipt", "receipt_sha256"},
        "approval proof_pr",
    )
    if approval["proof_pr"]["provider_commit"] != provider_head:
        raise ApprovalError("approval proof-pr commit does not match provider")
    if approval["proof_pr"]["provider_version"] != provider_version:
        raise ApprovalError("approval proof-pr version does not match provider")
    approval_dir = approval_path.parent.resolve()
    receipt_path = safe_child(approval_dir, approval["proof_pr"]["receipt"], "proof-pr receipt")
    receipt, receipt_raw = load_json(receipt_path, "proof-pr receipt")
    if approval["proof_pr"]["receipt_sha256"] != sha256_bytes(receipt_raw):
        raise ApprovalError("proof-pr receipt digest mismatch")
    run_proof_pr_validate(provider, receipt_path)
    if receipt.get("generated_at") != approval["generated_at"]:
        raise ApprovalError("proof-pr receipt time does not match approval")
    subject = receipt.get("subject")
    if not isinstance(subject, dict):
        raise ApprovalError("proof-pr receipt subject is missing")
    if subject.get("head_sha") != approval["source"]["head_sha"]:
        raise ApprovalError("proof-pr receipt head does not match approval")
    if subject.get("base_sha") != approval["base"]["head_sha"]:
        raise ApprovalError("proof-pr receipt base does not match approval base")
    if subject.get("head_sha_status") != "exact":
        raise ApprovalError("proof-pr receipt head binding is not exact")
    change = receipt.get("change")
    if not isinstance(change, dict) or change.get("files_touched") != current_files:
        raise ApprovalError("proof-pr receipt changed paths do not match the current diff")
    overall = receipt.get("overall")
    if not isinstance(overall, dict) or overall != {"status": "passed", "review_decision": "ready"}:
        raise ApprovalError("proof-pr receipt is not finalized ready")
    if receipt.get("limitations"):
        raise ApprovalError("proof-pr receipt has unresolved limitations")

    required = policy["required_evidence"]
    receipt_evidence = receipt.get("evidence")
    if not isinstance(receipt_evidence, list):
        raise ApprovalError("proof-pr evidence must be an array")
    by_id = {item.get("id"): item for item in receipt_evidence if isinstance(item, dict)}
    if sorted(by_id) != sorted(required):
        raise ApprovalError("proof-pr evidence IDs do not match policy")
    for check_id in required:
        item = by_id[check_id]
        if item.get("required") is not True or item.get("status") != "passed":
            raise ApprovalError(f"required evidence is not passing: {check_id}")

    envelope_evidence = approval["evidence"]
    if not isinstance(envelope_evidence, list):
        raise ApprovalError("approval evidence must be an array")
    envelope_by_id: dict[str, dict[str, Any]] = {}
    for index, item in enumerate(envelope_evidence):
        if not isinstance(item, dict):
            raise ApprovalError(f"approval evidence {index} must be an object")
        exact_keys(item, {"id", "path", "sha256", "status"}, f"approval evidence {index}")
        if not isinstance(item["id"], str) or item["id"] in envelope_by_id:
            raise ApprovalError("approval evidence IDs must be unique strings")
        envelope_by_id[item["id"]] = item
    if sorted(envelope_by_id) != sorted(required):
        raise ApprovalError("approval evidence IDs do not match policy")
    for check_id in required:
        item = envelope_by_id[check_id]
        if item["status"] != "passed":
            raise ApprovalError(f"approval evidence is not passing: {check_id}")
        artifact = safe_child(approval_dir, item["path"], f"evidence {check_id}")
        if sha256_bytes(read_bytes(artifact, f"evidence {check_id}")) != item["sha256"]:
            raise ApprovalError(f"evidence digest mismatch: {check_id}")

    dependencies = approval["dependencies"]
    if not isinstance(dependencies, dict):
        raise ApprovalError("approval dependencies must be an object")
    exact_keys(
        dependencies,
        {"lockfile_sha256", "installed_lockfile_sha256"},
        "approval dependencies",
    )
    current_lock = sha256_bytes(read_bytes(root / "pnpm-lock.yaml", "source dependency lock"))
    if dependencies["lockfile_sha256"] != current_lock:
        raise ApprovalError("approval dependency lock does not match source")
    if dependencies["installed_lockfile_sha256"] != current_lock:
        raise ApprovalError("approval installed dependency lock was not lock-matched")
    candidate_tree = approval["candidate_tree_sha"]
    if not isinstance(candidate_tree, str) or not HEX40.fullmatch(candidate_tree):
        raise ApprovalError("approval candidate tree SHA is missing or invalid")
    if candidate_tree != git(root, "rev-parse", "HEAD^{tree}"):
        raise ApprovalError("approval candidate tree does not match current HEAD")
    return {
        "schema_version": DECISION_SCHEMA,
        "decision": "GO",
        "binding": {
            "source_sha": approval["source"]["head_sha"],
            "base_sha": approval["base"]["head_sha"],
            "candidate_tree_sha": candidate_tree,
            "receipt_sha256": approval["proof_pr"]["receipt_sha256"],
            "policy_sha256": approval["policy_sha256"],
        },
        "expires_at": approval["expires_at"],
        "claim_ceiling": approval["claim_ceiling"],
        "publication_authorized": False,
    }


def verify(args: argparse.Namespace) -> int:
    root = repo_root()
    now = parse_utc(args.now, "--now")
    try:
        decision = verify_approval(root, Path(args.proof_pr_root), Path(args.approval), now)
        code = 0
    except ApprovalError as exc:
        decision = {
            "schema_version": DECISION_SCHEMA,
            "decision": "NO_GO",
            "reasons": [str(exc)],
            "publication_authorized": False,
        }
        code = 2
    print(stable_json(decision), end="")
    return code


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__)
    subparsers = result.add_subparsers(dest="command", required=True)
    run_parser = subparsers.add_parser("run", help="run local checks and issue an approval")
    run_parser.add_argument("--proof-pr-root", required=True)
    run_parser.add_argument("--node-modules", required=True)
    run_parser.add_argument("--output-dir", required=True)
    run_parser.add_argument("--now", required=True)
    run_parser.set_defaults(func=issue)
    verify_parser = subparsers.add_parser("verify", help="verify an existing approval")
    verify_parser.add_argument("--proof-pr-root", required=True)
    verify_parser.add_argument("--approval", required=True)
    verify_parser.add_argument("--now", required=True)
    verify_parser.set_defaults(func=verify)
    return result


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    try:
        return int(args.func(args))
    except ApprovalError as exc:
        print(
            stable_json(
                {
                    "schema_version": DECISION_SCHEMA,
                    "decision": "NO_GO",
                    "reasons": [str(exc)],
                    "publication_authorized": False,
                }
            ),
            end="",
        )
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
