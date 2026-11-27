# Changelog

## 2026-11-27 (later)

- `AGENTS.md` and `llms.txt` for AI coding assistants; the full reference is https://vend-id.com/llms-full.txt.
- `mcp/`: MCP server (stdio) with `scan_mrz`, `get_pricing`, `get_docs`.
- Docs: 413 `body_too_large`; 502 also for bytes that are not an image; Starter now €29 incl. 5,000.

## 2026-11-27

- VendID MRZ API `POST /v1/mrz` with self-serve API keys, free plan of 500 successful reads a month.
- `mrz.js` browser drop-in: `VendIdMrz.open()`, `scanImage()`, `close()`.
- This repository: web check-in, curl, Node and Python examples; API reference and response JSON Schema.
