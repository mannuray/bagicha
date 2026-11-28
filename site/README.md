# Budtale website

The public site at budtale.vercel.app: the landing page, the privacy policy and the
terms of use. Plain HTML and CSS, no build and no server; Vercel serves this folder
as it is (its own Vercel project, root directory `site`).

| Page | File |
|---|---|
| `/` | `index.html` |
| `/privacy` | `privacy/index.html` |
| `/terms` | `terms/index.html` |

The app itself lives at bagicha-web.vercel.app (`web/`); "Open the app" and
"Delete your account" link there. Fonts are self-hosted copies of the app's
(`fonts/`, OFL); colours follow `web/src/styles/theme.css`.

Preview locally: `npx serve site` (or any static server), then open the printed address.

## App live updates (`app-updates/`)

`app-updates/android.json` tells the Android app (versionCode 3 and later) the
oldest app version still allowed and the latest screens bundle; `files/` holds
that bundle's files, named by SHA-256. Both are written by
`cd web && npm run publish-update` (`-- --force` for an urgent fix,
`-- --min-native N` to block older apps), never by hand, and go live when this
site is deployed. Design: `docs/superpowers/plans/2026-11-28-live-updates.md`.
