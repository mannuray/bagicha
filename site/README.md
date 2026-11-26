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
