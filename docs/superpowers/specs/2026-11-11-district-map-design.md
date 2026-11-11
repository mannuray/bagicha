# District Map (full list and location lookup) — Design

**Date:** 2026-11-11
**Builds on:** the district-first region choice (onboarding and profile `RegionScreen`, `knownRegion`, backend `resolveRegionCluster`), branch `backend-cleanup`.

**User rules for this work:**
- "Think general, not my garden": every Indian gardener.
- The list is approved as proposed.
- We also need a geographical map, so the district can be detected from the current location.
- **User's choice:** detect with real district boundaries (point-in-polygon on our server), not nearest centre and not an online service.

## 1. Why

Today the app knows 21 city names (`malda`, `patna`, `delhi`…). It matches them as substrings, and every other district silently becomes North India, which then picks the wrong sowing windows, bloom months and care months. The list exists twice (web `regions.ts` and backend `region-cluster.ts`, kept equal by a test). The "Use my location" button stores coordinates but never works out a district.

## 2. What we build

### 2.1 The district list (one source, in the backend)
- **About 780 districts across all 36 states and UTs**, each with:
  - `name` (official spelling);
  - `state`;
  - `region` (one of the seven clusters);
  - `aliases`: older or common names, e.g. Gurgaon/Gurugram, Bangalore/Bengaluru Urban, Allahabad/Prayagraj, Bombay/Mumbai, Calcutta/Kolkata, Banaras/Varanasi, Faizabad/Ayodhya, plus Hindi spellings for the larger ones where common.
- **Matching:** case- and accent-insensitive, on the whole name or an alias. Text like "Gaya, Bihar" also matches. It is never a loose substring, so "Sagar" doesn't match "Jagarnathpur".
- **Region rules,** assigned by state, with district overrides:

| Region | Covers |
|---|---|
| North India | Punjab, Haryana, Delhi, Chandigarh, west and central Uttar Pradesh, the Jammu plains (Jammu, Kathua, Samba) |
| East India | Bihar, Jharkhand, West Bengal plains, Odisha, east UP (Purvanchal: Varanasi, Gorakhpur, Ballia, Deoria, Azamgarh, Jaunpur, Ghazipur, Mau, Kushinagar, Maharajganj, Basti, Siddharthnagar, Sant Kabir Nagar, Mirzapur, Sonbhadra, Chandauli, Bhadohi), Assam, Tripura |
| West India | Gujarat, Rajasthan, Maharashtra except Konkan and Vidarbha, Dadra and Nagar Haveli and Daman and Diu |
| Central India | Madhya Pradesh, Chhattisgarh, Vidarbha (Nagpur, Amravati, Akola, Yavatmal, Wardha, Chandrapur, Gadchiroli, Bhandara, Gondia, Washim, Buldhana) |
| South Deccan | Telangana, Andhra Pradesh, Tamil Nadu, Karnataka except its coast |
| Coastal & humid | Kerala, Goa, coastal Karnataka (Udupi, Dakshina Kannada, Uttara Kannada), Konkan (Ratnagiri, Sindhudurg, Raigad, Palghar, Thane), Puducherry, Andaman and Nicobar, Lakshadweep |
| Hills & cool | Himachal Pradesh, Uttarakhand hill districts (all but Haridwar and Udham Singh Nagar, which stay North), Kashmir valley districts, the Jammu hill districts (see §2.5), Ladakh, Darjeeling and Kalimpong, Sikkim, Meghalaya, Nagaland, Mizoram, Manipur, Arunachal Pradesh |

  Mumbai (city and suburban) stays West and Chennai stays South Deccan, matching the region examples the app already shows. Dehradun city is Hills, per the existing example.

### 2.2 The boundary map and location lookup
- **Source:** geoBoundaries `IND` ADM2, release `9469f09`. It is the 2021 district boundaries, from the government's LGD directory via Pathways Data, with 735 shapes. Licence: **ODbL 1.0**. Each shape carries only `shapeName`; there is no state field.
- **A one-time build script** (`backend/scripts/build-district-map`, run by a developer, output committed):
  - reads the downloaded GeoJSON;
  - simplifies it with `mapshaper` (run through `npx`; not a project dependency) to **≤ 1.5 MB** of JSON;
  - rounds coordinates to 4 decimals (about 11 m);
  - links each shape to a list entry by name or alias, which gives it its state and region;
  - writes `backend/src/modules/regions/data/district-boundaries.json`.

  **It fails if a shape doesn't match a list entry,** listing the names to add as aliases. It must also handle duplicate district names across states (Aurangabad in Bihar and Maharashtra, Bilaspur in Himachal and Chhattisgarh, Hamirpur in UP and Himachal, Pratapgarh in UP and Rajasthan, Balrampur in UP and Chhattisgarh): it resolves them with the shape's centroid falling inside the right state's area. The script carries a bounding box per state for this.
- **The server lookup:**
  1. load the JSON once at startup, with a bounding box per shape;
  2. narrow to the shapes whose box contains the point;
  3. run a ray-casting point-in-polygon check (hand-written, no new dependency; MultiPolygons and holes handled).

  It returns `{ district, state, region }`, or `null` outside India or at sea.
- **Districts created after 2021** (about 45; splits of older districts) are on the list but have no boundary. A point in such a district returns its parent 2021 district. The region is the same, and the gardener can correct the district in the type-ahead.

### 2.3 API (new `regions` module, signed-in users)
- `GET /regions/districts` returns the full list `[{ name, state, region }]` (about 40 KB; the web caches it for the session).
- `GET /regions/locate?lat=..&lng=..` returns `{ district, state, region } | null`. Coordinates are validated (lat 6–38, lng 68–98, otherwise `null`). The point is not logged.
- `resolveRegionCluster(district)` in the seasonal module uses the new list (for old profiles with a district but no region). Unknown text still falls back to North India.

### 2.4 Web
- **District box with type-ahead** (onboarding `RegionScreen` and profile):
  - suggestions as you type: "Gaya · Bihar", "Gadchiroli · Maharashtra";
  - picking one fills the district and sets the region, with the existing "We'll use East India for Gaya" line;
  - free text not on the list shows today's "pick the closest region" chips.
- **"Use my location":** calls `locate`.
  - **On a hit:** fills the district and region, and shows "Detected Gaya, Bihar · East India. Change it if that's wrong."
  - **On a miss** (denied, outside India): says so and leaves the box as it was.
  - It still saves latitude and longitude as today.
- **Removed:** the web `REGIONS.places` list and the parity test. The web asks the server.
- **Attribution:** one line on the Profile screen's about area: "District boundaries: geoBoundaries (ODbL)".

### 2.5 Settled after the builder check
1. **Building the list is part of this work** (the user approved the approach, not a written list). The source is the 735 geoBoundaries 2021 names, cleaned to official spellings, plus the districts created since 2021. Each new district records its `parent` (the 2021 district its land came from), so the list stays consistent with the boundaries. Many source spellings are old or wrong ("Hydrabad", "Punch", "Leh(Ladakh)", "Bangalore", "Gurgaon", "Allahabad"); those become aliases. Delhi's "North", "East"… and Sikkim's "North District"… are matched only together with their state, never alone. "Delhi" is an alias for New Delhi.
2. **Shared district names** (Aurangabad, Bilaspur, Hamirpur, Pratapgarh, Balrampur, Bijapur, Raigarh) are saved in the existing `district` text as "Aurangabad, Bihar". There is no schema change. Picking from the type-ahead always saves "Name, State" for these seven, and the matcher reads the state after the comma. An old profile that says just "Aurangabad" counts as an unknown district: its stored `region_cluster` still decides, and if there is none the fallback stays North India.
3. **Jammu division:** Udhampur, Reasi, Rajouri, Poonch, Doda, Kishtwar and Ramban are **Hills**. Jammu, Kathua and Samba are North. **Dehradun** is Hills as a whole district (the "Dehradun plains stay North" line above is withdrawn).
4. **The "DATA NOT AVAILABLE" shape** (PoK, Gilgit-Baltistan and Aksai Chin) is **treated as India, per India's official position (user's decision).** The build splits it at longitude 75.5: the west part resolves to the J&K district list's "Pakistan-occupied Kashmir (J&K)" entry, the east part to "Gilgit-Baltistan / Aksai Chin (Ladakh)". Both are in the Hills region, so `locate` there never answers "outside India". These two entries can't be picked in the type-ahead.

## 3. Not in this work (parked)
- **Drawing a map** of India or districts. Showing India's outline publicly must follow Survey of India boundaries, which needs its own check.
- **Pincode → district.**
- **Boundaries for the post-2021 districts**, when an updated open source exists.
- **Village or tehsil level.**

## 4. Done means
- **Tests (written first):**
  - list integrity: every state and UT present, each entry has a region, no duplicate (name, state), aliases unique;
  - matching cases: alias, comma text, no loose substring, duplicate names resolved by state;
  - region spot checks: Gaya → East; Varanasi → East; Meerut → North; Nagpur → Central; Udupi → Coastal; Darjeeling → Hills; Mumbai → West; Chennai → South Deccan; Dehradun → Hills; Haridwar → North;
  - `locate` for known points: Patna city, Gaya, Bengaluru, Shimla, a point in the Bay of Bengal → null, a point in Nepal → null;
  - the build script's no-unmatched-shapes rule;
  - web type-ahead and location detect (MSW);
  - e2e: onboarding with a typed district picks the region.
- **Data files:** the boundary JSON is ≤ 1.5 MB, and the API's memory use and startup stay reasonable on Render free (512 MB).
- **Suites:** all of them pass.

## 5. Decisions
- **User:**
  - the list as proposed;
  - detection from the current location using real boundaries.
- **My calls:**
  - geoBoundaries 2021 as the source;
  - post-2021 districts resolve to their parent;
  - the backend owns the list and the web fetches it;
  - mapshaper through npx for the one-time build;
  - hand-written point-in-polygon;
  - east UP in East India;
  - Konkan in Coastal;
  - Vidarbha in Central;
  - the attribution line;
  - no map drawing;
  - the §2.5 calls (list built here, "Name, State" for shared names, the Jammu hill districts, Dehradun as Hills).
- **User (after the builder check):** the PoK, Gilgit-Baltistan and Aksai Chin area is treated as India.
