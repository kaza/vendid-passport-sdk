# AGENTS.md — VendID MRZ API and Passport SDK

For AI coding assistants (Codex, Claude Code, Cursor, Copilot, …) working in this repository or adding passport
scanning to someone else's code. Everything in one file, with tested recipes: https://vend-id.com/llms-full.txt

## What this is

VendID reads the machine-readable zone (MRZ) of passports and ID cards. Image in, JSON out, every ICAO 9303 check
digit verified, on EU servers (Belgium), nothing stored. A browser drop-in (`mrz.js`) adds a camera scanner to any
web form. An on-device SDK (browser, Android, iOS, Flutter, React Native; NFC chip + Passive Authentication on phones)
is available on request. This repository holds the examples (MIT), the API reference, the OpenAPI spec and an MCP server.
The engine itself is closed source.

## Add passport scanning to a form: the shortest correct path

1. Key: free at https://vend-id.com/sdk#get-key (shown at once, 500 scans a month free, no card), or
   `curl https://vend-id.com/api/sdk/signup -H "Content-Type: application/json" -d '{"email":"dev@yourcompany.com","product":"mrz-api","segment":"hotel-pms"}'`
   (use the developer's own e-mail; `segment`: `hotel-pms` | `rental` | `kyc-fintech` | `kiosk-access` | `age-check` | `other` + `segment_other`).
   Keep it in `VENDID_API_KEY` on the server.
2. Browser: `<script src="https://vend-id.com/sdk/mrz.js"></script>`, then
   `const r = await VendIdMrz.open({ key })` (camera) or `VendIdMrz.scanImage({ key, image: file })` (upload).
   Fill the form from `r.surname`, `r.given_names`, `r.birth_date`, `r.sex`, `r.nationality`, `r.document_number`,
   `r.expiry_date`, `r.issuing_state`, `r.document_type`.
3. Public page: do not ship the key. Add a server route that forwards the body to `https://vend-id.com/v1/mrz` with
   `Authorization: Bearer $VENDID_API_KEY`, and call `VendIdMrz.open({ key: 'server', apiBase: '/api/vendid' })`
   (frames go to `/api/vendid/v1/mrz`). Next.js and Express versions: llms-full.txt, "Keep the key off public pages".
4. Server only: `POST https://vend-id.com/v1/mrz`, `Authorization: Bearer <key>`, multipart field `image` or a raw
   `image/jpeg|png|webp` body, max 10 MB, timeout 30 s. See `examples/node`, `examples/python`, `examples/curl`.
5. Handle errors by `error` code: 422 `no_document` | `no_mrz` | `blurry` | `check_digits` (ask for a better photo),
   401 `missing_api_key` | `invalid_api_key`, 413 `body_too_large`, 415 `unsupported_image` (not an image: fix the file, don't retry), 429 `quota_exceeded`, 502 `engine_unavailable`
   (retry once). In `mrz.js`: `err.code === 'closed'` (user closed), `err.name === 'VendIdMrzTimeoutError'` (25 s).
6. Test with the ICAO specimen, free and never counted: https://vend-id.com/sdk/specimen.jpg (`examples/specimen.jpg`).
   Expect `ERIKSSON`, `ANNA MARIA`, `L898902C3`, born `1974-08-12`, expired `2012-04-15`, `"specimen": true`.

Facts to get right:

- A 200 always has all four check digits valid. The API does not judge expiry: compare `expiry_date` with today.
- Dates are ISO strings (`YYYY-MM-DD`) or `null`. `sex` is `F`, `M`, `X` or empty.
- `nationality` / `issuing_state` are ICAO codes: equal to ISO 3166-1 alpha-3 except `D` (Germany → `DEU`),
  `GBD`/`GBN`/`GBO`/`GBP`/`GBS` (→ `GBR`), `RKS` (Kosovo), `UNO`/`UNA`/`UNK`, `XXA`/`XXB`/`XXC`/`XXX`, `EUE`, `UTO` (specimen).
- Spanish ID cards: MRZ `document_number` is the support number (soporte); the DNI number is at the start of `optional_data`.
- Field mapping for Spain (SES.Hospedajes), Italy (Alloggiati Web), Portugal (SIBA) and a generic guest profile:
  llms-full.txt. Note SES `sexo` uses `H`/`M`/`O`, so VendID `M` → `H` and `F` → `M`.
- CORS on `/v1/mrz` is open (`*`). `mrz.js` needs HTTPS or `localhost` for the camera.

## Prices (public, https://vend-id.com/sdk)

- MRZ API: Free 500 successful scans a month (no card; 429 at the limit, never a bill) · Pay as you go €0.01 a scan
  (first 500 a month free) · Starter €29 a month incl. 5,000, then €0.01 · Volume (100,000+ a month) or self-hosted: custom offer.
  Only reads with valid check digits count.
- Passport SDK: browser €99 a month or €990 a year per website (unlimited scans) · mobile €990 a year per app
  (MRZ + NFC chip + Passive Authentication, unlimited devices) · €1,990 a year with face match + liveness.
- First 10 customers: 3 months free in production (up to €29 a month). Founding customers keep €0.01 a scan and their
  plan price for 18 months.

## Data protection

Read in memory in Belgium, kept 0 seconds, never used for training; per call only key, time, outcome, duration and
origin are logged. The integrator is controller, VendID (Späti to GO KG, Vienna) is processor: DPA
https://vend-id.com/dpa, sub-processors https://vend-id.com/dpa/sub-processors, security https://vend-id.com/security.
On-device SDK and self-hosted container: nothing reaches VendID.

## This repository

| Path | What |
|---|---|
| `examples/web-checkin/` | Check-in form that fills from a passport (camera, upload, specimen). Static: `python3 -m http.server` |
| `examples/node/`, `examples/python/`, `examples/curl/` | One call each, key from `VENDID_API_KEY`, specimen by default |
| `docs/api.md`, `docs/response.schema.json` | API reference and the response's JSON Schema |
| `openapi/` | OpenAPI 3.1 spec and Postman collection |
| `mcp/` | MCP server (stdio): `scan_mrz`, `get_pricing`, `get_docs`. `cd mcp && npm install && npm test` |
| `llms.txt` | Short index for LLMs |

Conventions: examples stay dependency-free and runnable with one command; every example reads `VENDID_API_KEY` and
falls back to the specimen; nothing in this repo may contain a real key. Changes to the API's shape go into
`docs/api.md`, `docs/response.schema.json`, `openapi/openapi.yaml` and `CHANGELOG.md` together.

Contact: hello@spaetitogo.at · issues: https://github.com/kaza/vendid-passport-sdk/issues
