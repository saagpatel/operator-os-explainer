#!/usr/bin/env python3
"""Focused fail-closed tests for the local release approval pilot."""

from __future__ import annotations

import copy
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
SCRIPT = HERE / "release-approval.py"
POLICY_SOURCE = HERE.parent / "release-approval-policy.json"
NOW = "2026-08-11T12:00:00Z"
PROVIDER = os.environ.get("PROOF_PR_ROOT")


def stable_json(value: object) -> bytes:
    return (json.dumps(value, sort_keys=True, indent=2) + "\n").encode()


def sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def run(command: list[str], cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


@unittest.skipUnless(PROVIDER, "PROOF_PR_ROOT is required")
class ReleaseApprovalTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.base = Path(self.temp.name)
        self.repo = self.base / "repo"
        self.repo.mkdir()
        shutil.copy2(POLICY_SOURCE, self.repo / "release-approval-policy.json")
        run(["git", "init", "-b", "main"], self.repo)
        run(["git", "config", "user.name", "release-approval-test"], self.repo)
        run(["git", "config", "user.email", "noreply@operator-os-explainer.local"], self.repo)
        (self.repo / "pnpm-lock.yaml").write_text("lockfileVersion: '9.0'\n")
        (self.repo / "app.txt").write_text("base\n")
        run(["git", "add", "release-approval-policy.json", "pnpm-lock.yaml", "app.txt"], self.repo)
        run(["git", "commit", "-m", "base"], self.repo)
        self.base_sha = run(["git", "rev-parse", "HEAD"], self.repo).stdout.strip()
        run(["git", "branch", "base", self.base_sha], self.repo)
        policy = json.loads((self.repo / "release-approval-policy.json").read_text())
        policy["base_ref"] = "base"
        policy["base_commit"] = self.base_sha
        (self.repo / "release-approval-policy.json").write_bytes(stable_json(policy))
        run(["git", "add", "release-approval-policy.json"], self.repo)
        run(["git", "commit", "-m", "pin base"], self.repo)
        (self.repo / "app.txt").write_text("candidate\n")
        run(["git", "add", "app.txt"], self.repo)
        run(["git", "commit", "-m", "candidate"], self.repo)
        self.head_sha = run(["git", "rev-parse", "HEAD"], self.repo).stdout.strip()
        self.evidence_dir = self.base / "evidence"
        (self.evidence_dir / "logs").mkdir(parents=True)
        self.policy_raw = (self.repo / "release-approval-policy.json").read_bytes()
        self.policy = json.loads(self.policy_raw)
        self.receipt_path = self.evidence_dir / "proof-pr.json"
        self.approval_path = self.evidence_dir / "release-approval.json"
        self.receipt = self.make_receipt()
        self.write_bundle(self.receipt, self.make_approval(self.receipt))

    def tearDown(self) -> None:
        self.temp.cleanup()

    def make_receipt(self) -> dict[str, object]:
        evidence = []
        artifacts = []
        for check_id in self.policy["required_evidence"]:
            relative = f"logs/{check_id}.log"
            body = f"{check_id}: pass\n".encode()
            (self.evidence_dir / relative).write_bytes(body)
            artifact_id = f"log-{check_id}"
            evidence.append(
                {
                    "id": check_id,
                    "kind": "test",
                    "status": "passed",
                    "required": True,
                    "summary": f"{check_id} passed.",
                    "artifact_ids": [artifact_id],
                    "freshness_hours": 1,
                }
            )
            artifacts.append(
                {
                    "id": artifact_id,
                    "kind": "log",
                    "path_or_url": relative,
                    "description": f"{check_id} log",
                    "sha256": sha(body),
                    "required": True,
                    "external": False,
                }
            )
        return {
            "schema_version": "proof-pr.v1",
            "receipt_id": "test-release-approval",
            "generated_at": NOW,
            "subject": {
                "repo": "saagpatel/operator-os-explainer",
                "base_ref": "base",
                "base_sha": self.base_sha,
                "head_ref": "main",
                "head_sha": self.head_sha,
                "head_sha_status": "exact",
            },
            "producer": {"tool": "proof-pr", "version": "0.2.14", "agent": "manual", "mode": "local"},
            "risk": {"tier": "T3", "reasons": ["release"], "changed_surfaces": ["release tooling"]},
            "change": {
                "summary": "test approval",
                "files_touched": ["app.txt", "release-approval-policy.json"],
                "diff_stats": {"files": 1, "additions": 1, "deletions": 1},
            },
            "evidence": evidence,
            "security": {
                "secrets_scan": {"status": "passed", "summary": "passed"},
                "permission_diff": {"status": "not_applicable", "summary": "unchanged"},
                "redaction": {"status": "passed", "summary": "passed"},
            },
            "rollback": {"status": "documented", "path": "revert"},
            "artifacts": artifacts,
            "limitations": [],
            "overall": {"status": "passed", "review_decision": "ready"},
        }

    def make_approval(self, receipt: dict[str, object]) -> dict[str, object]:
        receipt_raw = stable_json(receipt)
        evidence = []
        for check_id in self.policy["required_evidence"]:
            path = f"logs/{check_id}.log"
            evidence.append(
                {
                    "id": check_id,
                    "path": path,
                    "sha256": sha((self.evidence_dir / path).read_bytes()),
                    "status": "passed",
                }
            )
        lock_sha = sha((self.repo / "pnpm-lock.yaml").read_bytes())
        return {
            "schema_version": "operator-os-explainer.release-approval.v1",
            "decision": "approve_local_merge_review",
            "generated_at": NOW,
            "expires_at": "2026-08-11T12:15:00Z",
            "source": {"branch": "main", "head_sha": self.head_sha},
            "base": {"ref": "base", "head_sha": self.base_sha},
            "proof_pr": {
                "provider_commit": "13a38bde216cdef83273c0cad25a87306e798d4e",
                "provider_version": "0.2.14",
                "receipt": "proof-pr.json",
                "receipt_sha256": sha(receipt_raw),
            },
            "dependencies": {"lockfile_sha256": lock_sha, "installed_lockfile_sha256": lock_sha},
            "policy_sha256": sha(self.policy_raw),
            "required_evidence": self.policy["required_evidence"],
            "evidence": evidence,
            "ignored_paths": self.policy["ignored_paths"],
            "candidate_tree_sha": run(
                ["git", "rev-parse", "HEAD^{tree}"], self.repo
            ).stdout.strip(),
            "claim_ceiling": self.policy["claim_ceiling"],
        }

    def write_bundle(self, receipt: dict[str, object], approval: dict[str, object]) -> None:
        self.receipt_path.write_bytes(stable_json(receipt))
        self.approval_path.write_bytes(stable_json(approval))

    def verify(self) -> tuple[subprocess.CompletedProcess[str], dict[str, object]]:
        result = run(
            [
                sys.executable,
                "-B",
                str(SCRIPT),
                "verify",
                "--proof-pr-root",
                str(PROVIDER),
                "--approval",
                str(self.approval_path),
                "--now",
                NOW,
            ],
            self.repo,
        )
        return result, json.loads(result.stdout)

    def issue(self, dependencies: Path) -> tuple[subprocess.CompletedProcess[str], dict[str, object]]:
        result = run(
            [
                sys.executable,
                "-B",
                str(SCRIPT),
                "run",
                "--proof-pr-root",
                str(PROVIDER),
                "--node-modules",
                str(dependencies),
                "--output-dir",
                str(self.base / "run-output"),
                "--now",
                NOW,
            ],
            self.repo,
        )
        return result, json.loads(result.stdout)

    def test_valid_bundle_is_go(self) -> None:
        result, decision = self.verify()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(decision["decision"], "GO")
        self.assertFalse(decision["publication_authorized"])

    def test_missing_receipt_fails_closed(self) -> None:
        self.receipt_path.unlink()
        result, decision = self.verify()
        self.assertEqual(result.returncode, 2)
        self.assertEqual(decision["decision"], "NO_GO")

    def test_malformed_receipt_fails_closed(self) -> None:
        self.receipt_path.write_text("{")
        result, decision = self.verify()
        self.assertEqual(result.returncode, 2)
        self.assertIn("malformed", decision["reasons"][0])

    def test_stale_approval_fails_closed(self) -> None:
        approval = json.loads(self.approval_path.read_text())
        approval["generated_at"] = "2026-08-11T11:00:00Z"
        approval["expires_at"] = "2026-08-11T11:15:00Z"
        self.approval_path.write_bytes(stable_json(approval))
        result, decision = self.verify()
        self.assertEqual(result.returncode, 2)
        self.assertIn("stale", decision["reasons"][0])

    def test_contradictory_source_sha_fails_closed(self) -> None:
        approval = json.loads(self.approval_path.read_text())
        approval["source"]["head_sha"] = "0" * 40
        self.approval_path.write_bytes(stable_json(approval))
        result, decision = self.verify()
        self.assertEqual(result.returncode, 2)
        self.assertIn("source SHA", decision["reasons"][0])

    def test_missing_required_evidence_fails_closed(self) -> None:
        receipt = copy.deepcopy(self.receipt)
        receipt["evidence"] = receipt["evidence"][:-1]
        approval = self.make_approval(receipt)
        self.write_bundle(receipt, approval)
        result, decision = self.verify()
        self.assertEqual(result.returncode, 2)
        self.assertIn("evidence IDs", decision["reasons"][0])

    def test_bypass_field_is_rejected(self) -> None:
        approval = json.loads(self.approval_path.read_text())
        approval["allow_stale"] = True
        self.approval_path.write_bytes(stable_json(approval))
        result, decision = self.verify()
        self.assertEqual(result.returncode, 2)
        self.assertIn("extra=allow_stale", decision["reasons"][0])

    def test_symlink_evidence_is_rejected(self) -> None:
        target = self.base / "outside.log"
        target.write_text("typecheck: pass\n")
        path = self.evidence_dir / "logs/typecheck.log"
        path.unlink()
        path.symlink_to(target)
        approval = json.loads(self.approval_path.read_text())
        approval["evidence"][0]["sha256"] = sha(target.read_bytes())
        self.approval_path.write_bytes(stable_json(approval))
        result, decision = self.verify()
        self.assertEqual(result.returncode, 2)
        self.assertIn("symlink", decision["reasons"][0])

    def test_provider_pin_mismatch_is_rejected(self) -> None:
        policy = json.loads((self.repo / "release-approval-policy.json").read_text())
        policy["proof_pr"]["commit"] = "0" * 40
        policy_raw = stable_json(policy)
        (self.repo / "release-approval-policy.json").write_bytes(policy_raw)
        approval = json.loads(self.approval_path.read_text())
        approval["policy_sha256"] = sha(policy_raw)
        self.approval_path.write_bytes(stable_json(approval))
        result, decision = self.verify()
        self.assertEqual(result.returncode, 2)
        self.assertIn("provider commit", decision["reasons"][0])

    def test_dependency_lock_mismatch_is_rejected(self) -> None:
        dependencies = self.base / "dependencies"
        (dependencies / ".pnpm").mkdir(parents=True)
        (dependencies / ".pnpm/lock.yaml").write_text("wrong lock\n")
        result, decision = self.issue(dependencies)
        self.assertEqual(result.returncode, 2)
        self.assertIn("do not match", decision["reasons"][0])

    def test_dependency_symlink_escape_is_rejected(self) -> None:
        dependencies = self.base / "dependencies"
        (dependencies / ".pnpm").mkdir(parents=True)
        shutil.copy2(self.repo / "pnpm-lock.yaml", dependencies / ".pnpm/lock.yaml")
        outside = self.base / "outside-dependency"
        outside.mkdir()
        (dependencies / "escape").symlink_to(outside, target_is_directory=True)
        result, decision = self.issue(dependencies)
        self.assertEqual(result.returncode, 2)
        self.assertIn("escapes", decision["reasons"][0])


if __name__ == "__main__":
    unittest.main()
