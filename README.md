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

## Troubleshooting — "I don't see the salmon (no fish swimming)"
The page loads and the camera works, but no fish appear on the marker:
1. **Is the marker actually detected?** The status pill at the top changes from
   "Point your phone at the salmon sign" to **"The salmon are running"** when the
   printed image is recognised. If it never changes, the camera isn't matching
   `targets.mind` — improve lighting, hold the phone steady and fill the frame
   with the sign, and make sure the printed image matches the one `targets.mind`
   was compiled from.
2. **Fish too small / too large?** The salmon are sized in *marker units* (marker
   width = 1). They're tuned to ~⅓ of the marker via the `scale` on each
   `<a-gltf-model>` in `index.html`. Raise/lower those values to taste.
3. **Fish facing the wrong way?** Change `rotation="0 0 0"` to `rotation="0 180 0"`
   on the models.
4. **No tail motion?** The bundled `salmon.glb` has **no baked animation clip**,
   so the swim (tail-wag + bob) is generated procedurally in `index.html`. If you
   swap in a rigged model that *does* contain a clip, you can instead add
   `animation-mixer` back to the `<a-gltf-model>` to play it.

## Deploy

### Railway (recommended)
This repo is set up to run on [Railway](https://railway.app) as a tiny static
server. Railway serves the app over **https://**, which the camera (and therefore
WebAR) requires — opening the files over `file://` or plain `http://` blocks the
camera and is the usual reason the app "won't run".

How it works:
- `server.js` — a zero-dependency Node static server that serves `index.html`
  and the assets on the `$PORT` Railway provides.
- `package.json` — `npm start` runs the server (Node 18+).
- `railway.json` — tells Railway to build with Nixpacks and run `npm start`.

Steps:
1. Go to [railway.app](https://railway.app) → **New Project** →
   **Deploy from GitHub repo** → pick this repo.
2. Railway auto-detects Node, installs, and runs `npm start`. No env vars needed
   (`PORT` is injected automatically).
3. In the service's **Settings → Networking**, click **Generate Domain** to get
   a public `https://…up.railway.app` URL.
4. Open that URL on your phone and tap **Allow** when asked for the camera.

Every push to the connected branch redeploys automatically.

#### Run it locally
```
npm start            # serves on http://localhost:8080
# or pick a port:
PORT=3000 npm start
```
`http://localhost` is treated as a secure context, so the camera works locally
too.

### Alternative (Netlify / Vercel)
Connect the repo to Netlify or Vercel (free) — every push auto-deploys to https.
Then open the https URL on your phone.
