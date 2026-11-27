# VendID MCP server

Lets an AI assistant (Claude Code, Claude Desktop, Cursor, Windsurf, VS Code, any MCP client) read passports and ID
cards with the [VendID MRZ API](https://vend-id.com/sdk) and look up VendID's prices and implementation docs while it
writes your integration.

| Tool | Input | Returns |
|---|---|---|
| `scan_mrz` | `image_path` (local JPEG / PNG / WebP) or `image_base64` (plain or `data:` URL) | The API's JSON: `surname`, `given_names`, `document_number`, `nationality`, `birth_date`, `expiry_date`, `sex`, `issuing_state`, `document_type`, `optional_data`, `check_digits`, `mrz`. On failure: the HTTP status and error code (`no_document`, `blurry`, `quota_exceeded`, …) as a tool error |
| `get_pricing` | — | Current prices of the MRZ API and the Passport SDK |
| `get_docs` | `topic` (optional), e.g. `react`, `errors`, `mrz.js`, `next.js`, `ses.hospedajes`, `migrating` | That section of [vend-id.com/llms-full.txt](https://vend-id.com/llms-full.txt); without a topic, the list of sections |

`scan_mrz` needs a key: free at [vend-id.com/sdk](https://vend-id.com/sdk#get-key), 500 scans a month, no card.
`get_pricing` and `get_docs` work without one. Test image: the ICAO specimen at
[`../examples/specimen.jpg`](../examples/specimen.jpg) (free, never counted).

> [!WARNING]
> **Free / development tier: the first `scan_mrz` after a quiet spell takes ~7–10 s** while the reading engine
> starts (it scales to zero when idle and stays warm ~15 minutes after the last request); then ~0.5 s per scan. The
> server waits up to 30 s per scan. Paid and volume plans: always-warm engine.

## Install

Node 20 or newer. The server is not on npm; build it from this repository:

```sh
git clone https://github.com/kaza/vendid-passport-sdk.git
cd vendid-passport-sdk/mcp
npm install          # also builds dist/
```

### Claude Code

```sh
claude mcp add vendid -e VENDID_API_KEY=vid_... -- node "$PWD/dist/index.js"
```

Add `--scope user` to have it in every project. Then ask: *"Scan ../examples/specimen.jpg with VendID"* or
*"Add VendID passport scanning to my check-in form, use get_docs for the React recipe"*.

### Cursor

`~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (this project):

```json
{
  "mcpServers": {
    "vendid": {
      "command": "node",
      "args": ["/absolute/path/to/vendid-passport-sdk/mcp/dist/index.js"],
      "env": { "VENDID_API_KEY": "vid_..." }
    }
  }
}
```

### Claude Desktop, VS Code, Windsurf and others

Same `command`, `args` and `env` as for Cursor, in that client's MCP settings (Claude Desktop:
`claude_desktop_config.json`; VS Code: `.vscode/mcp.json` with `"servers"` instead of `"mcpServers"`).

## Privacy

`scan_mrz` sends the image to `https://vend-id.com/v1/mrz` (EU, Belgium), where it is read in memory and dropped:
nothing stored. `get_pricing` and `get_docs` fetch `https://vend-id.com/llms-full.txt` once per session. Nothing else
leaves your machine.

## Develop

```sh
npm test                                   # unit tests, no network
VENDID_API_KEY=vid_... npm run test:live   # the real server over stdio against vend-id.com
```

MIT, like the rest of this repository.
