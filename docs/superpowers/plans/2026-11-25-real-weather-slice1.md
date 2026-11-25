# Real weather, slice 1: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (owner chose native execution). Steps use checkbox (`- [ ]`) syntax.

**Goal:** Real, per-user weather on the home card from configurable providers (Open-Meteo first). No tips or reminders yet.

**Architecture:** A new `weather` module. It holds a `WeatherProvider` port and per-provider adapters, a provider chain built from `WEATHER_PROVIDERS`, a Redis read-through cache keyed by a 0.1° grid cell, and a place resolver (the user's saved point, otherwise their district centre). `GET weather` returns `{ weather | null, source }`. The old fake weather (service, processor, queue, `GET seasonal/weather`, postal-area) is deleted.

**Tech stack:** NestJS 11, zod, Redis (RedisService), Jest; React with TanStack Query, Vitest and MSW.

**Spec:** `docs/superpowers/specs/2026-11-25-real-weather-design.md`

## Global constraints

- docs/coding-principles.md §8.
- No user point in logs, spans or cache keys: only the grid cell.
- Never show made-up weather: if every provider fails, the response is `weather: null`.
- Provider responses are parsed with strict zod schemas; a parse failure counts as a provider failure.
- Startup refuses an unknown provider name, or a provider whose required key is missing. In production, a missing `OPEN_METEO_API_KEY` only logs a warning (the owner's open question).

## Review focus

1. A provider that hangs: a per-call timeout (4 s), then the next provider.
2. A user with an old, ambiguous, bare district name ("Aurangabad"): no weather, never the wrong state's.
3. A Redis outage: weather still served by calling the provider directly; no 500.
4. Open-Meteo returning nulls in arrays (polar or missing data): treated as failure, not NaN on the card.
5. The empty `WEATHER_PROVIDERS` list: weather off, card hidden, no outbound calls.

---

### Task 1: Domain (forecast type, conditions, grid cell)
- `weather/domain/forecast.ts`: the `Forecast` type and the `WeatherCondition` union. `conditionFromWmo(code: number): WeatherCondition` maps WMO codes: 0 → CLEAR; 1–2 → PARTLY_CLOUDY; 3 → CLOUDY; 45, 48 → FOG; 51–57 → DRIZZLE; 61, 63, 66, 80, 81 → RAIN; 65, 67, 82 → HEAVY_RAIN; 71–77, 85, 86 → SNOW; 95–99 → THUNDERSTORM; unknown → CLOUDY.
- `weather/domain/grid-cell.ts`: `gridCell(lat, lng) → { lat, lng, key }` snapped to the 0.1° centre, with key `"25.6,85.1"`.
- Tests: mapping table edges; snapping, including negatives and the cell boundary.

### Task 2: Open-Meteo adapter
- `weather/providers/open-meteo.provider.ts`, implementing `WeatherProvider { name; forecast(cell): Promise<Forecast> }`.
- Endpoint: `api.open-meteo.com/v1/forecast`, or `customer-api.open-meteo.com` with `apikey` when a key is set.
- Request: current `temperature_2m,weather_code`; daily `weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max`; `timezone=Asia/Kolkata`; `forecast_days=3`.
- Fetch is injected; a strict zod parse.
- Tests: maps a fixture; a null value means failure; the key switches the host; a non-200 response throws `UpstreamError`.

### Task 3: Provider config and chain
- `weather/providers/provider-config.ts`: `parseProviderNames(env)` and `buildProviders(env, fetch)`. Throws `InvariantError` on an unknown name or a missing key. Wired through env.validation.
- `weather/weather-forecasts.ts`: `ProviderChain.forecast(cell)` tries each provider in order with a 4 s timeout and returns `{ forecast, source } | null`.
- Tests: order, fallback, all-fail returns null, timeout.

### Task 4: Cache and service
- `WeatherService.forCell(cell)`: read-through Redis `weather:v1:<key>` with a 1 h TTL. Redis errors bypass the cache. Logs carry only the cell key.
- Tests: hit, miss and store, Redis down, chain null (nothing stored).

### Task 5: Place
- `DistrictLocator.centreOf(name, state)` uses `interiorPoint`.
- `weatherPlace(user, locator)`: the saved lat/lng, else `matchDistrict(district)` → centre, else null.
- Tests: point wins; district centre is inside the district; ambiguous bare name gives null; neither gives null.

### Task 6: API and clean-up
- `GET weather` returns `{ weather: { now: {temp, condition}, today: {max, min, rain_chance, rain_mm} } | null, source: string | null }`.
- Delete the old seasonal weather service, processor, queue, route and postal-area, plus their specs and metrics registration.
- e2e: a user with a district gets weather (fake provider via DI override); no place gives null; `seasonal/weather` returns 404.

### Task 7: Web card
- `features/weather`: an API hook, and a `WeatherCard` on the dashboard that is hidden on null or error.
- Shows the temperature, condition, today's high and low, the chance of rain, and "Weather: Open-Meteo".
- en strings; hi strings proposed for owner review (English fallback until approved).
- Tests: renders, hidden on null, hidden on error.
