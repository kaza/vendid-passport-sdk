# Changelog

## 2026-11-28

- Free plan: past the 500 free scans a month the key keeps working; we contact you about a plan. `429 quota_exceeded` now only at the abuse cap (10,000 calls a month on one key); its `limit` and `used` count calls.

## 2026-11-27 (night)

- `POST /v1/warmup`: wakes the reading engine (free tier scales to zero when idle; the first read after a quiet spell takes ~7–10 s, then ~0.5 s). Same key, free. Cold-start warning in README, AGENTS.md, llms.txt, docs/api.md, OpenAPI, mcp/README.

## 2026-11-27 (evening)

- `POST /v1/mrz`: bytes that are not a JPEG, PNG or WebP image now answer 415 `unsupported_image` instead of 502 `engine_unavailable`, so clients do not retry them.

## 2026-11-27 (later)

- `AGENTS.md` and `llms.txt` for AI coding assistants; the full reference is https://vend-id.com/llms-full.txt.
- `mcp/`: MCP server (stdio) with `scan_mrz`, `get_pricing`, `get_docs`.
- Docs: 413 `body_too_large`; 502 also for bytes that are not an image; Starter now €29 incl. 5,000.

## 2026-11-27

- VendID MRZ API `POST /v1/mrz` with self-serve API keys, free plan of 500 successful reads a month.
- `mrz.js` browser drop-in: `VendIdMrz.open()`, `scanImage()`, `close()`.
- This repository: web check-in, curl, Node and Python examples; API reference and response JSON Schema.
