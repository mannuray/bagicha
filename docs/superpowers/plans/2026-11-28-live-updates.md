# Live updates and forced updates (Android, version 3)

Approved by the owner in chat 2026-11-28: "do it in version 3, I don't want
any fixes or change to be stuck because people are not updating".

**Goal:** screen changes reach every phone without a Play release; the app
can force a Play update when a native change is required.

## Design (as agreed)

- One control file, `https://budtale.vercel.app/app-updates/android.json`,
  served from `site/app-updates/` (Vercel project `budtale`):
  ```json
  { "min_native": 3,
    "bundle": { "version": 7, "min_native": 3, "force": false,
                "files": [{ "file_name": "index.html", "file_hash": "<sha256>",
                            "download_url": "https://budtale.vercel.app/app-updates/files/<sha256>" }] } }
  ```
  `min_native` = oldest allowed Android versionCode. `bundle.min_native` =
  the versionCode the screens were built against; older apps ignore it.
- Files are content-addressed (`files/<sha256>`), so Capgo's multi-file
  download fetches only changed files and reuses ones already in the APK.
- `web/src/app-bundle.json` holds the screens version baked into each build;
  the running code compares it with `bundle.version`.
- **App** (`web/src/features/app-updates/`): on launch and on resume, read the
  file (no-store). Below `min_native` → Play immediate in-app update, and a
  blocking "Update Budtale" screen (button: Play update or Play listing).
  Newer compatible bundle → download; `force` → "Updating Budtale…" then
  apply now; otherwise apply at next background/launch. Any failure or no
  internet → carry on with the current version. `notifyAppReady()` on start;
  the plugin rolls back a bundle that never reports ready.
- Capgo in manual mode, every Capgo cloud URL blanked (no stats leave the phone).
- `npm run publish-update [-- --force] [-- --min-native N]` bumps the version,
  builds, copies changed files into `site/app-updates/files/`, rewrites
  `android.json` and prunes files no longer referenced. Going live = site
  deploy, only on the owner's say-so.
- `site/vercel.json`: `android.json` no-cache; CORS `*` for `/app-updates/`.

## Tasks (test-first)

1. `decide(manifest, { native, bundle })` + zod schema — pure, unit tested.
2. `buildManifest(files, opts)` — pure, unit tested; script wraps it.
3. `UpdateGate` with an `UpdaterPort` (fake in tests, Capgo/App/AppUpdate on
   the phone, no-op on the website): blocked screen, forced overlay, quiet
   download, resume re-check, failure tolerance.
4. Wire into `App.tsx`, Capacitor config, `site/vercel.json`, strings
   (Hindi pending review), first publish of the current screens.
5. versionCode 3, new `google-services.json` (from the owner), release AAB.
