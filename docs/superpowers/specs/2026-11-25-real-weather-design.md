# Real weather: design

Status: draft for owner approval (2026-11-25)

## Why

The weather code returns random numbers (32–47 °C) for a fixed Patna pincode, so the home card has been hidden. For launch, gardeners should see real local weather, a gardening tip when the weather calls for one, and reminders on their plants when heat, heavy rain or cold is coming.

## Goals

- Real weather for each user's own place on the home card: now, today's high and low, chance of rain.
- One gardening tip when the weather matters (heatwave, heavy rain due, cold night), in English and Hindi.
- Reminders on growing plants for those same events (for example, "Water deeply this evening" before a heatwave day).
- **Providers can be swapped and combined by config.** Open-Meteo first. Adding OpenWeatherMap (or IMD later) means writing one adapter, with no changes elsewhere.

## Non-goals

- Push notifications (there is no FCM yet). Reminders appear in the app's task list.
- Multi-day forecast screens, radar, or hourly charts.
- Weather history or analytics.

## Anti-goals (a failure even if it technically works)

- Showing made-up or stale weather as if it were current. If no provider answers, the card is hidden and no reminders are made that day.
- Reminders that pile up: at most one weather reminder per plant per event per day, and re-runs create nothing new.
- Logging or sending a user's exact location. Lookups use a rounded grid cell.
- Thresholds or advice that haven't been checked: the tip text and the trigger values go through the playbook's source check and owner review.

## How it works

### Providers (owner's requirement: configurable, several)

- A `WeatherProvider` port with one method, `forecast(cell)`. It returns our own `Forecast` type: current temperature and condition, today's max and min, rain probability and rain in mm for today and tomorrow, and the max/min for the next 48 hours. Condition is our own enum (CLEAR, PARTLY_CLOUDY, CLOUDY, FOG, DRIZZLE, RAIN, HEAVY_RAIN, THUNDERSTORM, SNOW), so nothing downstream sees a provider's codes.
- An adapter per provider maps its response to `Forecast`: `OpenMeteoProvider` now, others later. Each adapter validates the response with a strict zod schema; a malformed answer counts as a failure.
- **Config:** `WEATHER_PROVIDERS=open-meteo` takes an ordered list, for example `open-meteo,openweathermap`. The first is used; on a timeout or error the next is tried. Provider keys are separate env vars (`OPEN_METEO_API_KEY`, which switches to Open-Meteo's paid commercial endpoint; `OPENWEATHERMAP_API_KEY`). Startup refuses an unknown provider name, or a listed provider whose required key is missing. An empty list means weather is off: the card is hidden and no reminders are made.
- A `WeatherService` holds the fallback chain, a timeout per call, and the cache. Only it knows about providers.

### Location

- If the user saved "Use my location", that point is used. Otherwise the centre of their district, computed once from the district boundaries we already have. The district is matched with the existing district matcher; names shared by two states are stored with their state ("Aurangabad, Bihar"), and an old bare ambiguous name that cannot be resolved gives no weather rather than a guess. With neither, there is no weather.
- Lookups are snapped to a 0.1° grid cell (about 11 km). The cache key is the cell, so neighbours share one call, and logs show the cell, never the user's point.

### Cache and call volume

- Forecast cached per cell in Redis for 1 hour, read-through when the card loads.
- The daily reminder run fetches once per cell that has users, so calls grow with the number of places, not the number of users.

### Home card API

- `GET weather` (new; the old `GET seasonal/weather` ignores the user, uses a fixed Patna pincode and nothing calls it, so it is deleted) returns `{ weather: {...} | null, tip: string | null, source: "Open-Meteo" }` (the tip already in the request's language) for the signed-in user's place. `null` means hidden, never a fake.
- The card shows the source credit; Open-Meteo's licence (CC BY 4.0) requires attribution.

### Tips and reminders

- **Rules** are pure functions over `Forecast`, identical for every provider. A day's low comes around dawn, so a cold low on day D is dated D-1 (the evening to cover plants); today's own low is ignored. Events before IST today are dropped (a cached forecast can start a day early). A reminder keeps the figure first seen for its date, even if a later forecast softens. HEAT (tomorrow's or today's max at or above a threshold), HEAVY_RAIN (rain due above a threshold in mm), COLD_NIGHT (min below a threshold). Thresholds may differ for the hills; values come from the source check (for example, IMD's heatwave definition).
- **Tip** text is a catalogue advice entry (the bilingual advice kind shipped in R5b), so English and Hindi go through the same review.
- **Reminders:** a daily job (05:00 IST) evaluates the rules per cell and adds one task per growing plant per event, with source `WEATHER` and key `weather:<event>:<plantId>:<event date>`. The key holds the **date of the weather event**, not the run date, so heat seen coming on day D and seen again on D+1 gives one reminder. Due date: the event day (for heat, the task says to water that evening). Before creating, the job checks for a task with that key **in any status**: the database unique index only covers pending tasks, so a completed or skipped reminder must not come back.
- **Schedule:** this is the app's first repeating job. It uses BullMQ's `upsertJobScheduler` with a fixed scheduler id; the schedule lives in Redis, so it runs once per day however many instances or deploys there are.
- **Who gets reminders:** plants not ended (`ended_at` null), crops not PLANNED or RESTING. Cold night goes to young trees (SAPLING, JUVENILE), every growing crop and every flower (source check lists vegetables generally; owner confirmed 2026-11-25). "Hills" means the user's region is HILLS_COOL (the existing `regionFor(user)`), not the grid cell's elevation. Which plants get which event is part of the reviewed content; for example, heavy rain gets "skip watering, check drainage" but no water task, and cold night gets "cover seedlings" for young crops only.
- Weather-generated reminders that are still pending expire after their day: they're cancelled by the next run.

## Decided by the owner

- Open-Meteo first; the card shows today, a tip, and reminders.
- Providers pluggable and configurable, with more than one allowed.

## My calls (please check)

- Fallback chain in config order, rather than calling all providers and merging their answers.
- 0.1° grid and 1-hour cache.
- Reminders only for event days, not daily "weather is fine" notes.
- The existing random-weather queue and processor are replaced by the daily reminder job.

## Left to the builder

- Exact Open-Meteo request fields and the mapping from WMO weather codes to our condition enum.
- Whether the HEAT reminder reuses the existing DRYNESS overlay templates or gets its own.
- Card layout within the existing Stitch dashboard design (no card code exists yet; it is built new).

## Delivery in two slices

1. Providers, config, location, cache, `GET weather` and the web card (no tip). Ships without content review.
2. Rules, tips and reminders, after the thresholds and text are approved.

## Decided: free Open-Meteo for now

- Owner, 2026-11-25: launch on Open-Meteo's free API. Switch to the paid key (`OPEN_METEO_API_KEY`) when real paying users arrive, which is also when payments go live. Production startup logs a warning while the key is missing.

## Gates

- A migration if `TaskSource.WEATHER` is new, applied per docs/deploy.md.
- Thresholds and tip and reminder text: source check, then the owner's yes, before they're written (add-plant playbook).
