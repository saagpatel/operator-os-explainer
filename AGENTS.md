# Operator OS Explainer instructions

## Cursor Cloud specific instructions

This repository is a public, fixture-backed web explainer and is safe to work on in
an isolated Ubuntu cloud checkout. Setup is defined in `.cursor/environment.json`
and must remain reproducible from the committed `pnpm-lock.yaml` without secrets,
local absolute paths, or sibling repositories.

Use Node 22.22 or 24 and the pinned pnpm version. For ordinary changes, verify:

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm guard
pnpm generate && git diff --exit-code -- src/data/dataset.json
pnpm diagrams && git diff --exit-code -- public/diagrams docs/mechanisms.md
```

Run `pnpm test:e2e` only when browser behavior changes. Keep every displayed
timeline, project, person, and metric synthetic or explicitly public; do not copy
private machine state, local portfolio output, credentials, or personal data into
the repository.
