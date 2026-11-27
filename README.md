# VendID MRZ API and Passport SDK: examples

Read passports and ID cards in your app: send a photo or a camera frame, get the machine-readable zone (MRZ) back as
JSON, with every ICAO 9303 check digit verified.

- **VendID MRZ API**: `POST https://vend-id.com/v1/mrz`, image in, JSON out, on our servers in the EU (Belgium).
  Nothing stored. About 0.55 s per read (free tier: the first read after a quiet spell ~7–10 s, see below).
- **`mrz.js`**: one script tag gives any web page a camera scanner that fills your form.
- **VendID Passport SDK**: the reading on the user's device (browser, Android, iOS, Flutter, React Native), on phones
  also the passport's NFC chip with Passive Authentication. See [the SDK section](#passport-sdk-android-ios-flutter-react-native).

> [!WARNING]
> **Free / development tier: the first request takes ~7–10 s (warm-up).** The reading engine scales to zero when
> idle. The first request after a quiet spell takes ~7–10 s; after that ~0.5 s per scan. It stays warm ~15 minutes
> after the last request.
>
> - Call `POST https://vend-id.com/v1/warmup` with your key when your page or app opens (fire and forget; free,
>   never counted): `fetch('https://vend-id.com/v1/warmup', { method: 'POST', headers: { Authorization: 'Bearer ' + key } })`
> - Set client timeouts to **30 s or more**. `mrz.js` waits 25 s per request and shows „Starting the reader…" meanwhile.
> - Paid and volume plans: always-warm engine, no cold start.

This repository holds working examples and the API reference. The reading engine itself is closed source.

**Live demo:** [guest check-in form that fills from a passport](https://kaza.github.io/vendid-passport-sdk/examples/web-checkin/)

## Quick start (60 seconds)

**1. Get a free key** at [vend-id.com/sdk](https://vend-id.com/sdk#get-key). It is shown at once and e-mailed. No card.

**2. Read the ICAO specimen passport** (a fictional person, in this repo as [`examples/specimen.jpg`](examples/specimen.jpg)):

```sh
export VENDID_API_KEY=vid_...
curl -o specimen.jpg https://vend-id.com/sdk/specimen.jpg
curl https://vend-id.com/v1/mrz -H "Authorization: Bearer $VENDID_API_KEY" -F "image=@specimen.jpg"
```

```json
{"format":"TD3","document_type":"P","issuing_state":"UTO","surname":"ERIKSSON","given_names":"ANNA MARIA",
 "document_number":"L898902C3","nationality":"UTO","birth_date":"1974-08-12","sex":"F","expiry_date":"2012-04-15",
 "optional_data":"ZE184226B","check_digits":{"document_number":true,"birth_date":true,"expiry_date":true,"composite":true},
 "mrz":["P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<","L898902C36UTO7408122F1204159ZE184226B<<<<<10"],
 "ms":612,"specimen":true}
```

**3. Put a scanner on your page:**

```html
<script src="https://vend-id.com/sdk/mrz.js"></script>
<button onclick="scan()">Scan passport</button>
<script>
  async function scan() {
    const r = await VendIdMrz.open({ key: 'vid_...' })   // camera, auto-capture, valid check digits only
    console.log(r.surname, r.given_names, r.document_number, r.birth_date)
  }
</script>
```

## Examples

| Folder | What | Run |
|---|---|---|
| [`examples/web-checkin`](examples/web-checkin/) | Hotel check-in form that fills from a passport: camera, photo upload, specimen | [live](https://kaza.github.io/vendid-passport-sdk/examples/web-checkin/), or `python3 -m http.server` and open `/examples/web-checkin/` |
| [`examples/curl`](examples/curl/) | One `curl` call | `./examples/curl/scan.sh [image]` |
| [`examples/node`](examples/node/) | Node 18+, no dependencies | `node examples/node/scan.mjs [image]` |
| [`examples/python`](examples/python/) | Python 3.8+, standard library only | `python3 examples/python/scan.py [image]` |

All of them read the key from `VENDID_API_KEY` (the web example asks for it) and use the specimen when no image is given.

## Docs

- [API reference](docs/api.md): request, response fields, error codes, limits, `mrz.js`
- [JSON Schema of the response](docs/response.schema.json)
- [OpenAPI 3.1 spec](openapi/openapi.yaml): import into Postman, Insomnia or a code generator
- [Postman collection](openapi/vendid-mrz-api.postman_collection.json): set `bearerToken` to your key
- [Full docs on vend-id.com](https://vend-id.com/sdk/docs)
- For AI coding assistants: [AGENTS.md](AGENTS.md), [llms.txt](llms.txt), and everything in one file:
  [vend-id.com/llms-full.txt](https://vend-id.com/llms-full.txt) (recipes for React, Vue, Next.js, PHP, WebViews, field
  mapping for SES.Hospedajes / Alloggiati Web / SIBA, migration from other SDKs)
- [MCP server](mcp/): `scan_mrz`, `get_pricing`, `get_docs` for Claude Code, Cursor and other MCP clients
- [Roadmap](ROADMAP.md): what is live, what comes next

## Prices

| Plan | Price |
|---|---|
| Free | 500 successful reads a month, no card |
| Pay as you go | €0.01 per successful read, no monthly fee |
| Starter | €29 a month incl. 5,000 reads, then €0.01 (cheaper than pay as you go from 3,400 reads) |
| Browser SDK (on the device) | €99 a month, or €990 a year per website; unlimited reads; localhost and staging free |
| Mobile SDK (MRZ + NFC chip + Passive Authentication) | €990 a year per app, unlimited devices; face match + liveness €0.25 per completed check, 50 free a month, failed checks free (€490 a year flat per app or device for offline use) |
| Volume / own servers | from 100,000 reads a month or self-hosted container: custom offer |

Only reads with valid check digits count; failed reads are free. The first 10 customers get 3 months free in production
(up to €29 a month); founding customers keep €0.01 a read and their plan price for 18 months. Details and volume offers:
[vend-id.com/sdk](https://vend-id.com/sdk).

## Passport SDK: Android, iOS, Flutter, React Native

The on-device SDK (MRZ by camera, NFC chip read, Passive Authentication against the issuing state's certificate) is
handed out with a test licence: **request access at [vend-id.com/sdk](https://vend-id.com/sdk#get-key)**. It is not
on Maven Central, CocoaPods, pub.dev or npm yet; the [roadmap](ROADMAP.md) says when.

## Privacy

The API reads the image in memory on servers in the EU (Belgium) and drops it. Nothing is stored. Each call is
logged with the key, time, outcome, duration and calling web origin only, for billing and quota.

## Support

[hello@spaetitogo.at](mailto:hello@spaetitogo.at), or [open an issue](https://github.com/kaza/vendid-passport-sdk/issues)
for anything in these examples.

## Licence

The examples and docs in this repository are [MIT](LICENSE): copy them into your product. The VendID engine, the API
service and the SDK binaries are proprietary and are not covered by this licence.

VendID is a product of Späti to GO KG, Vienna, Austria.
