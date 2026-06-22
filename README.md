# Ketchikan Creek — Salmon AR

WebAR demo that overlays animated salmon on a printed image marker.
Built with A-Frame + MindAR (image tracking). No app install required.

## Files
- `loading-test.html` — guaranteed-to-load test using MindAR's hosted example
  card + model. Deploy this first to confirm the pipeline works. Point the
  camera at the MindAR example card image.
- `index.html` — the real salmon template. Needs two local files next to it:
  - `targets.mind` — compiled from your marker image (MindAR compiler tool)
  - `salmon.glb`  — a rigged salmon model with a swim animation

## IMPORTANT
WebAR needs the camera, which browsers only allow over **https://** (any host)
or **http://localhost**. Do NOT open these by double-clicking the file —
`file://` is blocked and the page will hang on the loading spinner forever.

## Deploy
1. Push this folder to GitHub.
2. Connect the repo to Netlify or Vercel (free) — every push auto-deploys to https.
3. Open the https URL on your phone.
