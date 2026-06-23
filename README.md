# Ketchikan Creek — Salmon AR

WebAR demo that overlays animated salmon on a printed image marker.
Built with A-Frame + MindAR (image tracking). No app install required.

## Files
- `loading-test.html` — guaranteed-to-load test using MindAR's hosted example
  card + model. Deploy this first to confirm the pipeline works. Point the
  camera at the MindAR example card image.
- `index.html` — the real salmon template. Needs these next to it:
  - `targets.mind` — compiled from your marker image (MindAR compiler tool)
  - `salmon.glb`  — a rigged salmon model with a swim animation
  - `vendor/` — bundled A-Frame, MindAR and aframe-extras libraries (so the app
    does not depend on any external CDN)

## IMPORTANT
WebAR needs the camera, which browsers only allow over **https://** (any host)
or **http://localhost**. Do NOT open these by double-clicking the file —
`file://` is blocked because the camera is unavailable there.

The pages now detect this and show a clear on-screen message explaining the
cause (instead of hanging on the loading spinner forever).

## Troubleshooting — "the app isn't loading"
The most common reasons the page sits on a spinner, in order:
1. **Opened over `file://` or plain `http://`** — the camera is blocked. Serve
   over `https://` (GitHub Pages / Netlify / Vercel) or `http://localhost`.
2. **Camera permission denied/dismissed** — reload and tap **Allow**. If you
   blocked it before, clear the site permission in your browser and reload.
3. **CDN blocked / offline** — the libraries (A-Frame, MindAR, aframe-extras)
   are bundled locally in `vendor/` and load from the same origin as the page,
   so no external CDN is required. A CDN is used only as a last-resort fallback
   if a `vendor/` file is missing. Keep the `vendor/` folder next to the HTML
   when you deploy.
4. **Another app/tab holding the camera** — close it and reload.

If you see the salmon template hang but want to confirm your setup, deploy
`loading-test.html` first — it uses MindAR's own hosted card + model, so if it
works, your environment is fine and the issue is your local assets.

## Deploy
1. Push this folder to GitHub.
2. Connect the repo to Netlify or Vercel (free) — every push auto-deploys to https.
3. Open the https URL on your phone.
