# Explainer comprehension study protocol

Status: `BLOCKED_ON_EXTERNAL_PARTICIPANT_AUTHORITY`

This protocol is the complete preparation artifact for a future, explicitly
authorized comprehension run. It does not authorize outreach, enrollment,
tracking, or collection. The explainer remains synthetic and browser-only.

## Admission gate

Do not schedule or contact anyone unless one study owner can verify all of the
following:

- An authorized roster of exactly 12 participants across 4 organizations.
- Six participants are hiring/referral owners and six are DevRel/partnership
  owners.
- Every participant has a legitimate contact route and an applicable consent
  basis.
- The run has an approved data-retention period and a named person responsible
  for deleting raw notes.
- The frozen stimulus record below is complete and passes live parity.

Missing or unverifiable fields fail closed. Zero enrolled participants is
`BLOCKED_ON_EXTERNAL_PARTICIPANT_AUTHORITY`, not a conversion result.

## Frozen stimulus record

Create one run record outside this public repository immediately before the
first session. Record:

- source commit SHA;
- Vercel deployment ID and immutable deployment URL;
- UTC capture time;
- SHA-256 for the HTML returned by `/`, `/fleet`, `/spine`, `/safety`,
  `/finale`, `/hub`, `/coda`, and an unknown-route fallback;
- SHA-256 for every versioned JavaScript and CSS asset plus `/og.png`;
- the canonical, Open Graph, and Twitter URL values; and
- the three public-proof destinations shown in the coda.

Before freezing the record, run:

```sh
VERCEL_TEAM_SCOPE=<team-slug> EXPECTED_DEPLOYMENT_ID=<deployment-id> pnpm verify:live
```

Both public aliases must resolve to the recorded READY deployment. A route,
asset, metadata, or deployment mismatch invalidates the run; never mix results
from different stimuli.

## Session tasks

Use the same neutral script and task order for every participant. Do not coach
the participant after a task begins.

1. Starting at the opening, explain what the product is and who controls the
   replay.
2. Find and describe one safety mechanism and one delivery/coordination
   mechanism.
3. State which on-screen operational data is synthetic and which linked public
   material is authentic evidence.
4. Reach the coda, continue into one useful public proof item, and return to the
   explainer without using a supplied URL.

## Measurement contract

For each task, the facilitator records only a random participant code, role
class, organization code, and these bounded outcomes:

- `task_completion`: completed without coaching (`yes` or `no`);
- `comprehension`: accurate explanation (`accurate`, `partial`, or
  `incorrect`);
- `synthetic_real_distinction`: correctly distinguished (`yes` or `no`);
- `proof_continuation`: opened a relevant proof item and preserved a return
  path (`yes` or `no`); and
- one short, de-identified observation when an outcome is not successful.

The safety threshold is 12 of 12 correct synthetic-versus-real distinctions.
Treat any miss as a release-language or disclosure problem to investigate
before adding new workflows. Report task, comprehension, and continuation
counts by role class; do not infer demand, adoption, or conversion from this
small cohort.

## Decision rules

- Consider EPE-03 (`/ask` cited intent trails) only when multiple participants
  can navigate the explainer but still cannot reliably locate or synthesize
  the existing cited material.
- This study cannot by itself authorize EPE-05 (public guestbook). That lane
  also requires demonstrated demand and an approved moderation, abuse,
  privacy, retention, and security operating model.
- If failures cluster around the study script, browser setup, or stale
  fingerprints, invalidate the affected sessions instead of scoring the
  product down.

## Privacy and operating boundary

Do not add analytics, pixels, passive event capture, form endpoints, or live
operational wiring. Do not commit roster data, contact details, consent records,
raw notes, or participant-level results. Store any authorized run material only
in its approved private system, retain it for the approved period, and publish
only de-identified aggregate findings.
