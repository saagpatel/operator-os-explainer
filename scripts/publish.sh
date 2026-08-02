#!/usr/bin/env bash
#
# Publish the dev lineage onto the release lineage (see RELEASE.md).
#
# The two lineages share no merge base and never will: the release branch is
# rooted at its own orphan commit so that the dev history -- which carries
# prep/ and SPEC.md build docs full of real-looking paths -- can never be
# reached from anything published. This script preserves that invariant by
# copying a filtered TREE across, never by merging or rebasing.
#
# Default mode is --dry-run: everything happens inside a scratch directory and
# neither the real release branch nor any remote is touched.
#
#   scripts/publish.sh --dry-run [DIR]   materialize + verify, touch nothing
#   scripts/publish.sh --publish         commit onto the local release branch
#
# --publish still does NOT push. Pushing is the operator's call, and only the
# release branch may be pushed (see RELEASE.md).

set -euo pipefail

# Files that exist to build the thing but must never ship. Kept in sync with
# .vercelignore; the guard scan is the backstop if they ever drift apart.
# .github is deliberately NOT excluded: CI has to travel to the release
# lineage or the workflow's `main` trigger can never fire.
EXCLUDE=(prep SPEC.md evidence .serena)

RELEASE_BRANCH=release
PUBLISH_IDENTITY_NAME=operator-os-explainer
PUBLISH_IDENTITY_EMAIL=noreply@operator-os-explainer.local

MODE=dry-run
DRY_RUN_DIR=""
while [ $# -gt 0 ]; do
	case "$1" in
		--dry-run) MODE=dry-run; shift; if [ $# -gt 0 ] && [ "${1#--}" = "$1" ]; then DRY_RUN_DIR="$1"; shift; fi ;;
		--publish) MODE=publish; shift ;;
		-h|--help) sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
		*) echo "unknown argument: $1" >&2; exit 64 ;;
	esac
done

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

if [ -n "$(git status --porcelain)" ]; then
	echo "FATAL: working tree is dirty. Publish from a clean, committed state." >&2
	exit 1
fi

SOURCE_REF=$(git rev-parse HEAD)
SOURCE_DESC=$(git log -1 --format='%h %s' HEAD)

if [ "$MODE" = dry-run ]; then
	if [ -z "$DRY_RUN_DIR" ]; then
		DRY_RUN_DIR=$(mktemp -d)
	fi
	mkdir -p "$DRY_RUN_DIR"
	WORK="$DRY_RUN_DIR/publish-tree"
	rm -rf "$WORK"
	# A local clone of the release branch only: the dry run gets the real
	# release history to commit onto, with zero risk to the real branch.
	git clone --quiet --branch "$RELEASE_BRANCH" --single-branch "$REPO_ROOT" "$WORK"
else
	echo "FATAL: --publish is deliberately not automated in this revision." >&2
	echo "Follow the numbered procedure in RELEASE.md; it is short, and a" >&2
	echo "publish should be read and understood rather than triggered." >&2
	exit 2
fi

cd "$WORK"
git config user.name "$PUBLISH_IDENTITY_NAME"
git config user.email "$PUBLISH_IDENTITY_EMAIL"

# --- replace the tree wholesale: added, changed AND deleted files all carry --
git ls-files -z | xargs -0 rm -f --
git -C "$REPO_ROOT" archive --format=tar "$SOURCE_REF" | tar -x -C "$WORK"
for path in "${EXCLUDE[@]}"; do
	rm -rf "${WORK:?}/$path"
done

git add -A
if git diff --cached --quiet; then
	echo "publish tree is already identical to $RELEASE_BRANCH; nothing to commit"
else
	git commit --quiet -m "release: sync from $SOURCE_DESC"
fi

# --- verification: the tree that would ship, checked as bytes ---------------
echo "--- verifying publish tree at $WORK"

for path in "${EXCLUDE[@]}"; do
	if git ls-files --error-unmatch "$path" >/dev/null 2>&1; then
		echo "FATAL: excluded path is tracked in the publish tree: $path" >&2
		exit 1
	fi
done

if [ -n "$(git log --all --format=%H -- prep SPEC.md)" ]; then
	echo "FATAL: publish history touches prep/ or SPEC.md" >&2
	exit 1
fi

grep -q 'sourcemap: false' vite.config.ts || {
	echo "FATAL: vite.config.ts no longer pins build.sourcemap false" >&2
	exit 1
}

pnpm install --frozen-lockfile --silent
pnpm build >/dev/null

if find dist -name '*.map' -print -quit | grep -q .; then
	echo "FATAL: source maps present in dist/ (they bake build-machine paths)" >&2
	exit 1
fi

# Scans src/, scripts/, root config AND the freshly built dist/, then --git
# re-scans the full history of THIS branch, which is release-only by
# construction. A stale dist/ is why the build above is not optional.
node scripts/guard-scan.ts --git

echo
echo "PUBLISH TREE VERIFIED"
echo "  location:   $WORK"
echo "  source:     $SOURCE_DESC"
echo "  files:      $(git ls-files | wc -l | tr -d ' ') tracked"
echo "  history:    $(git rev-list --count HEAD) commit(s), root $(git rev-list --max-parents=0 HEAD | cut -c1-8)"
echo "  identity:   $(git log -1 --format='%an <%ae>')"
if [ "$MODE" = dry-run ]; then
	echo
	echo "Dry run only. The real release branch and all remotes are untouched."
fi
