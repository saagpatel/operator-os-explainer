# CLAUDE.md

Two disjoint git lineages by design: `main` is the release lineage (what the public site serves) and the dev branches share no merge base with it. Publishing copies a tree. Never merge, rebase, or cherry-pick between the lineages, and do not read the missing merge base as a broken repo. Whether the dormant dev branches stay on the public remote is the operator's decision; do not resolve it. Details in RELEASE.md; design sources live in the sibling operator-os-explainer-design directory.
