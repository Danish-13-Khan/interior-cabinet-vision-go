# Privacy — Gemini Floor-Plan Vision Lab

**Mode:** local-only lab (Phase 5)  
**Branch:** `feat/gemini-floorplan-lab`

## Data handling

| Data | Where it goes |
| --- | --- |
| Floor-plan images / PDF pages | Browser → (optional) local Vite proxy → Google Gemini API |
| API key | Server `.env` via proxy (`GEMINI_API_KEY` or `VITE_GEMINI_API_KEY`). Prefer **not** shipping the key in the client bundle. |
| Offline fixtures | Stay on your machine; no network |
| Accepted drafts | Downloaded `.interior.json` + `sessionStorage` only |

## Protections in this lab

1. **EXIF strip** — raster images are re-encoded to PNG before Vision (`stripImageExif`).
2. **Proxy** — `POST /api/lab/gemini-vision` keeps the key on the Vite server in DEV/preview.
3. **No auto-upload to product `/app`** — Accept is explicit (Phase 4).

## Operator rules

- Do not commit `.env` or paste keys into chat / tickets.
- Do not demo real customer plans on shared or public deployments without a privacy review.
- For shared deploys: set server `GEMINI_API_KEY`, enable `VITE_ENABLE_GEMINI_LAB=true`, keep `VITE_GEMINI_USE_PROXY=true`, and omit client `VITE_GEMINI_API_KEY` when possible.

## Local-only checklist

- [ ] `.env` is gitignored
- [ ] `npm run dev` uses the proxy (default in DEV)
- [ ] Customer PDF/images are disposed after the demo
