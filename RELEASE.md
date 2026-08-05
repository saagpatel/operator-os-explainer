# Release procedure

This repository keeps two lineages that never meet. Knowing which one you are
standing on is the whole job; everything else here follows from that.

## The two lineages

**Dev.** Local `main`, published to the remote as
`recovery/operator-os-explainer-main-20260719`. This is where the work happens:
fourteen commits and counting, plus `prep/` and `SPEC.md`, the build documents
that describe the piece. Those documents are dense with realistic file paths,
names and figures invented to look real. They are the reason this lineage does
not ship.

**Release.** Local `release`, published to the remote as `main`, and the branch
the deployed site builds from. It is a source tree, not a build artifact: the
host runs the build itself, so `src/` and `scripts/` are present and the CI
workflow runs here too. What is absent is `prep/` and `SPEC.md`.

## The invariant

**The two lineages share no merge base, and must never acquire one.**

    git merge-base main release   ->  exits non-zero, always

The release lineage is rooted at its own parentless commit. Nothing published
can reach dev history, so no amount of digging through the published repository
surfaces a build document that was never in it. This is mechanism 6 of SPEC 3.3
and it is a structural guarantee rather than a promise: history that is not an
ancestor cannot be recovered from a clone.

This is why a publish copies a *tree* and never merges, rebases or
cherry-picks. A single merge would weld the histories together permanently and
there is no clean way back.

## Publishing

`scripts/publish.sh --dry-run [DIR]` performs the entire procedure against a
scratch clone and verifies the result. Nothing it does can reach the real
release branch or any remote. Run it first, every time. It exits non-zero and
explains itself if any check below fails.

A real publish is the same sequence, run deliberately by hand:

1. **Start clean.** Commit or stash everything on dev. The tree that ships is
   built from `HEAD`, so uncommitted work simply will not appear.

2. **Check out the release branch.** `git checkout release`. You are now on the
   orphan-rooted lineage. Do not merge anything into it.

3. **Replace the tree.** Delete every tracked file, then extract dev's `HEAD`
   over the top:

       git ls-files -z | xargs -0 rm -f --
       git archive --format=tar <dev-sha> | tar -x
       rm -rf prep SPEC.md evidence .serena

   Deleting first is what makes removals propagate. Copying over the top alone
   would leave a file that dev deleted still sitting on the release branch.

4. **Commit under the neutral identity.** The author must be
   `operator-os-explainer <noreply@operator-os-explainer.local>`, which is the
   only address the guard scanner allows. A personal identity in the commit
   metadata ships with every clone.

       git -c user.name=operator-os-explainer \
           -c user.email=noreply@operator-os-explainer.local \
           commit -m "release: ..."

5. **Verify before pushing, in this order.** The order matters:

       pnpm install --frozen-lockfile
       pnpm typecheck && pnpm test
       pnpm build
       node scripts/guard-scan.ts --git

   `pnpm build` comes before the scan because the scanner only reads `dist/`
   when it exists, and a stale `dist/` is worse than none: it has already
   produced one false failure from a pre-scrub build. Build fresh, then scan.

   `--git` extends the scan across `git log -p HEAD`. That is safe here and
   only here, because this branch's history is release-only. Running it on dev
   fails by design.

6. **Confirm `build.sourcemap` is still `false`.** Source maps embed absolute
   build-machine paths into shipped assets. `vite.config.ts` pins this off; the
   dry run additionally asserts no `.map` file survives the build.

7. **Push only the release branch.** `git push origin release:main`. Never push
   dev to `main`, and never push with `--force`.

8. **Deploy preview-first and prove the exact bytes.** Deploy the filtered
   release tree to a preview, then run:

       VERCEL_TEAM_SCOPE=<team-slug> node scripts/check-live-parity.ts --deployment-url <preview-url>

   The check fails closed unless Vercel can identify a READY deployment and all
   eight routes serve the expected application shell, canonical metadata, and
   fetchable versioned assets. Only after this proof may the two public aliases
   be pointed at that exact preview deployment.

9. **Read back both live aliases.** With the Vercel CLI authenticated, run:

       VERCEL_TEAM_SCOPE=<team-slug> EXPECTED_DEPLOYMENT_ID=<dpl_...> pnpm verify:live

   The command requires `https://operator.saagarpatel.dev/` and
   `https://operator-os-explainer.vercel.app/` to resolve to the same Vercel deployment
   ID and the same route and asset bytes. Missing identity is a failure, never
   an assumed pass. Keep the previous verified deployment URL available for an
   immediate two-alias rollback.

## What the guard scan is and is not

`scripts/guard-scan.ts` is a backstop, not the guarantee. The real protection is
the closure test in `src/data/closure.test.ts`, which proves the generated
dataset draws only from sanctioned vocabulary. The scanner exists to catch
mistakes in the allowlists themselves.

It self-tests before every run: it plants seven violations it is required to
catch, and exits 2 if it misses one. A pass therefore means the scanner is
working, not merely quiet.

Forbidden names are stored as hashes, never plaintext, so the scanner's own
source cannot leak the thing it defends against.

## CI

`.github/workflows/ci.yml` runs typecheck, tests, a fresh build, the guard scan
and a dataset determinism check on both lineages, on push and on pull request.
It travels with the publish, which is why `.github` is not on the exclusion
list. The matrix covers both arms of the supported Node range: `22.22`, the
first release where `node script.ts` runs without a flag, which the `scripts/`
entries in `package.json` depend on, and `24`. Node 23 is excluded because
vitest and jsdom exclude it.
