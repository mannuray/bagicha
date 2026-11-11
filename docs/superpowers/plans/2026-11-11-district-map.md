# District Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One full Indian district list, owned by the backend, that sets the region. Plus detection of the district from the phone's location using real district boundaries.

**Architecture:**
- **New backend `regions` module:**
  - `domain/districts.ts`: the curated list, the matcher and the region rules;
  - `data/district-boundaries.json`: simplified shapes, built once by `scripts/build-district-map.mjs`;
  - `DistrictLocator`: bounding boxes plus a hand-written ray-casting check;
  - endpoints `GET /regions/districts` and `GET /regions/locate`.
- **Seasonal:** `resolveRegionCluster` delegates to the new matcher.
- **Web:** drops its own place list, fetches the districts and gets type-ahead and location detect on `RegionScreen`.

**Tech Stack:** NestJS 11, jest and supertest; React 19, TanStack Query 5, Vitest + MSW, Playwright. Build only: `npx mapshaper` (not a dependency).

**Spec:** `docs/superpowers/specs/2026-11-11-district-map-design.md` (§2.5 overrides earlier sections)

## Global Constraints
- **Source data:** geoBoundaries `IND` ADM2 release `9469f09`, simplified GeoJSON, ODbL 1.0. The downloaded copy is at `$SCRATCH/geo-dl/adm2s.geojson`, which is treated as data. The ADM1 file from the same release is used only to assign each shape's state during the build.
- **Size:** the committed boundary JSON is ≤ 1.5 MB, with coordinates rounded to 4 decimals.
- **The seven regions and their rules** are exactly spec §2.1 plus §2.5.
- **Shared names** (Aurangabad, Bilaspur, Hamirpur, Pratapgarh, Balrampur, Bijapur, Raigarh) are saved as "Name, State".
- **The "DATA NOT AVAILABLE" shape is treated as India** (§2.5.4).
- **No new runtime dependency.** Coordinates aren't logged.
- **Checks:** backend `npm run lint`, `npx jest`, e2e, `node scripts/check-module-imports.js`; web `npx vitest run`, `npx tsc -b`, lint (baseline 15), boundaries, cycles.

## Review Focus
1. **A district name that appears inside another** ("Sagar" in "Jagarnathpur", "East" in "East Godavari") never matches loosely. Task 1 has a test.
2. **A point exactly on a shared border, or in a hole** (an enclave) resolves to one district, not two and not none. Task 3 has a test.
3. **An old profile with a bare shared name** ("Aurangabad") keeps its stored region, and is never re-guessed into the wrong state. Task 3 has a test.
4. **Location denied, or outside India,** leaves what the user typed untouched. Task 4 has a test.
5. **The first call to `/regions/locate` after a cold start** loads the boundaries once; repeated calls don't reload them. Task 3 has a test.

---

### Task 1: Backend — the district list and matcher
**Files:**
- Create in `backend/src/modules/regions/domain/`: `districts.ts` (data plus `DISTRICTS`), `district-match.ts` and their specs.
- Create `backend/scripts/draft-district-list.mjs` (one-off helper that prints a draft from the geoBoundaries names plus ADM1 state; the output is hand-cleaned into `districts.ts`).

**Interfaces:**
- **Produces:**
  - `type District = { name: string; state: string; region: RegionCluster; aliases: string[]; parent?: string; selectable?: boolean }`;
  - `DISTRICTS: readonly District[]`;
  - `matchDistrict(text: string): District | null`:
    - whole-word, case- and accent-insensitive, on the name or an alias;
    - "Name, State" picks that state's entry;
    - a bare shared name returns null;
  - `regionForDistrict(text): RegionCluster | null`;
  - `districtLabel(d): string` ("Name" or, for shared names, "Name, State").
- **Steps:**
  - [ ] **Failing specs:**
    - all 36 states and UTs are present;
    - every entry has a region;
    - no duplicate (name, state);
    - no alias collides across entries, except the seven shared names;
    - about 780 entries (assert ≥ 770);
    - **spot checks:** Gaya → EAST; Varanasi → EAST; Meerut → NORTH; Nagpur → CENTRAL; Udupi → COASTAL; Darjeeling → HILLS; Mumbai → WEST; Chennai → SOUTH_DECCAN; Dehradun → HILLS; Haridwar → NORTH; Rajouri → HILLS; Jammu → NORTH; Hyderabad and "Hydrabad" → SOUTH_DECCAN;
    - **matching:** "gurgaon" → Gurugram; "Prayagraj" or "Allahabad" → Prayagraj; "Aurangabad, Bihar" → Bihar's entry; "Aurangabad" → null; "Jagarnathpur" doesn't match Sagar; "East" alone → null, and "East, Delhi" → Delhi's East.
  - [ ] Run them: FAIL.
  - [ ] **Implement:** run the draft script, then hand-clean the list:
    - official spellings, with the source spelling as an alias;
    - Telangana and Ladakh entries split out of the 2011 states;
    - Dadra and Nagar Haveli and Daman and Diu merged;
    - the post-2021 districts added with `parent`;
    - the two §2.5.4 entries added with `selectable: false`.
  - [ ] Run the specs: PASS. Commit `feat(backend): full Indian district list with regions`.

### Task 2: Build script — the boundary map
**Files:** create `backend/scripts/build-district-map.mjs` and `backend/src/modules/regions/data/district-boundaries.json`; test `backend/scripts/build-district-map.spec.ts` (link step only).
- **Produces:** JSON `{ source, licence, districts: Array<{ name, state, bbox: [minLng, minLat, maxLng, maxLat], polygons: number[][][][] }> }`.
- **Steps:**
  - [ ] **Failing spec for `linkShapes(features, districts)`:**
    - every feature links to exactly one list entry, with duplicates resolved by state;
    - an unknown name throws, listing it;
    - "DATA NOT AVAILABLE" splits at lng 75.5 into the two §2.5.4 entries.
  - [ ] **Implement and run:**
    - `npx mapshaper` simplifies with `-simplify 8% keep-shapes`, then rounds to 4 decimals;
    - `linkShapes` runs, then the JSON is written;
    - assert the file is ≤ 1.5 MB, and print the count (735 shapes, 737 after the split).
  - [ ] Commit `feat(backend): district boundary map (geoBoundaries 2021, ODbL)`.

### Task 3: Backend — locator, API and region fallback
**Files:**
- Create in `regions/`: `district-locator.ts` (an injectable that loads the JSON lazily, once), `regions.controller.ts`, `regions.module.ts`, `index.ts` and specs.
- Modify `seasonal/domain/region-cluster.ts` (`resolveRegionCluster` uses `regionForDistrict` and falls back to NORTH_INDIA), `app.module.ts`.
- e2e: `test/e2e/regions.e2e-spec.ts`.
- **Produces:**
  - `GET /regions/districts` returns `[{ name, state, region, label }]` for selectable entries;
  - `GET /regions/locate?lat&lng` returns `{ district, state, region, label } | null`; out-of-range coordinates give null; the point is not logged.
- **Steps:**
  - [ ] **Failing tests:**
    - locator unit: Patna city (25.594, 85.137) → Patna/Bihar/EAST; Gaya (24.79, 85.0) → Gaya; Bengaluru (12.97, 77.59) → Bengaluru Urban/SOUTH_DECCAN; Shimla (31.10, 77.17) → Shimla/HILLS; Bay of Bengal (15.0, 88.0) → null; Kathmandu (27.71, 85.32) → null; Gilgit (35.92, 74.31) → the J&K PoK entry/HILLS;
    - a point inside a hole → the enclosing district is not returned;
    - the JSON is loaded once across 100 calls;
    - region-cluster spec: "Aurangabad" with no state → NORTH fallback, and a stored region still wins (`regionFor`);
    - e2e: both endpoints require sign-in; districts returns ≥ 770; locate for Patna.
  - [ ] Run: FAIL. Implement. Run the suites: PASS. Commit `feat(backend): locate a district from coordinates`.

### Task 4: Web — type-ahead, location detect, attribution
**Files:**
- Modify `web/src/features/profile/`: `RegionScreen.tsx`, `regions.ts` (drop `places`, keep labels), new `api.ts` (`useDistricts`, `useLocateDistrict`), `ProfileScreen.tsx` (attribution line), `profile.test.tsx` (drop the parity test), `en.json`.
- **Steps:**
  - [ ] **Failing tests:**
    - typing "ga" lists "Gaya · Bihar";
    - picking it sets district "Gaya" and shows the known-region line for East India;
    - picking Aurangabad · Bihar saves "Aurangabad, Bihar";
    - free text not on the list shows the region chips;
    - "Use my location" with a locate hit fills "Gaya" and shows "Detected Gaya, Bihar · East India";
    - a locate miss shows "We couldn't find your district from your location" and keeps the typed text;
    - location denied → the same message, and the text is kept;
    - the Profile shows "District boundaries: geoBoundaries (ODbL)".
  - [ ] Run: FAIL. Implement. Run the web checks: PASS. Commit `feat(web): district type-ahead and location detect`.

### Task 5: e2e, deploy check, final review
- [ ] **e2e:** onboarding types "Gaya", picks the suggestion, and the region is East India; screenshot `03-region`.
- [ ] Run all suites. Check startup memory locally (`docker run`, then `docker stats`, under 300 MB).
- [ ] Final review per executing-plans.
