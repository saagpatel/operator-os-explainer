# Frozen Codename Pool (audited 2026-07-11)

These are the ONLY project names the synthetic data may use. Audited once against npm / PyPI / crates.io / GitHub / general web for exact-name collisions with well-known real products, companies, or repos. Rejected during audit: **Vossen** (wheel + textile brands), **Dravin** (live "Dravin AI" dev platform). Six soft-flagged names held in reserve (Cindral, Halcort, Iskren, Marnic, Storwick, Marlott), not used. The 24 below are all CLEAN (no exact real-world collision found).

**Canonical hero-mission codename: `Corveth`.** The SPEC's illustrative "Project Meridian" is BANNED (Meridian is a real product); every place the cold open / finale references the hero mission uses **Corveth**.

```ts
// src/data/vocab.ts
export const CODENAMES = [
  'Corveth', 'Elstra', 'Faltrin', 'Grevan', 'Halvane', 'Jorvel',
  'Kestrine', 'Lorvath', 'Nevrell', 'Oquist', 'Pelloran', 'Quorven',
  'Rhessin', 'Tavrin', 'Ulcaster', 'Vandrel', 'Brindal', 'Thessom',
  'Belweather', 'Dwennon', 'Ferrun', 'Gomarr', 'Ilvane', 'Josker',
] as const;
export type Codename = typeof CODENAMES[number];
```

**Slug rule:** `slug(name) = name.toLowerCase()`. Branches `feat/<slug>` / `fix/<slug>`; paths `~/workspace/<slug>` only (never `/Users/...`).

**Audit provenance:** collision check performed 2026-07-11 via live web/registry search (see session log). Re-audit is NOT required at build time — Phase 1 imports this frozen file. If the pool is ever extended, add members only from re-audited coinages; never open the field to free text.
