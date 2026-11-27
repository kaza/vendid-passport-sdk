# Roadmap

What developers get from VendID, and when. ✅ live · 🔜 next · 📋 planned.
Something missing that you need? [Open an issue](https://github.com/kaza/vendid-passport-sdk/issues) or write to
[hello@spaetitogo.at](mailto:hello@spaetitogo.at): requests move items up.

## VendID MRZ API (server side)

| | Item | Notes |
|---|---|---|
| ✅ | `POST /v1/mrz` | Passports (TD3), ID cards (TD1), TD2; multipart or raw image; ICAO 9303 check digits verified |
| ✅ | API keys in 60 seconds | Free key from the form on [vend-id.com/sdk](https://vend-id.com/sdk#get-key), shown at once and e-mailed |
| ✅ | Free plan with quota | 500 successful reads a month, enforced per key, `429 quota_exceeded` when used up |
| ✅ | CORS | Any web origin can call the API from the browser |
| ✅ | EU hosting, nothing stored | Servers in Belgium; the image is read in memory and dropped |
| ✅ | Specimen for testing | ICAO specimen reads are free and never count |
| 🔜 | Self-serve billing (Stripe) | Pay as you go €0.01 per read and Starter €29/month, paid by card without a call |
| 🔜 | Usage dashboard | Calls, successful reads and quota per key; every call is already logged per key |
| 🔜 | Key management | Revoke and rotate a key yourself, several keys per account |
| 🔜 | OpenAPI spec | `openapi.yaml` in this repo, for client generators and Postman |
| 🔜 | Rate-limit headers | Remaining quota in every answer (`X-RateLimit-*`) |
| 📋 | Webhooks | For asynchronous batch reads |
| 📋 | Batch endpoint | Several images per request for back-office uploads |
| 📋 | Own servers / on-premises | The engine as a container in your cloud; offered today on request |

## mrz.js (browser drop-in)

| | Item | Notes |
|---|---|---|
| ✅ | `mrz.js` script tag | Camera overlay with auto-capture, `scanImage()` for uploads, specimen button |
| ✅ | Working examples | [This repository](README.md): web check-in, curl, Node, Python |
| 🔜 | npm package | `@vendid/mrz` with TypeScript types, same API as the script tag |
| 📋 | Custom overlay | Your own camera UI, styling and texts in your language |

## VendID Passport SDK (on the device)

| | Item | Notes |
|---|---|---|
| ✅ | Android engine: MRZ camera, NFC chip read, Passive Authentication | Runs in production in our own age-check kiosks; as an SDK on request with a test licence |
| 🔜 | Android SDK as a library (AAR) | Library module and demo app; then Maven Central |
| 🔜 | Browser SDK fully on the device | JavaScript + WebAssembly, the image never leaves the browser; npm |
| 📋 | iOS SDK | Core NFC chip read (iPhone 7 and newer); CocoaPods and Swift Package Manager |
| 📋 | Flutter plugin | pub.dev |
| 📋 | React Native module | npm |
| 📋 | Face match and liveness tier | The chip photo (DG2) against a selfie, plus a liveness check |
| 📋 | Chip clone detection | Active Authentication and Chip Authentication on top of Passive Authentication |

## Trust, legal and operations

| | Item | Notes |
|---|---|---|
| ✅ | Support by e-mail | [hello@spaetitogo.at](mailto:hello@spaetitogo.at), answered by the engineers who build it |
| ✅ | GitHub issues | [Issues](https://github.com/kaza/vendid-passport-sdk/issues) on this repository |
| ✅ | Changelog | [CHANGELOG.md](CHANGELOG.md) |
| 🔜 | DPA and GDPR documentation | Data processing agreement to sign online, list of sub-processors, data-flow description |
| 🔜 | Status page | Live state of the API and response times |
| 📋 | SLA | Uptime commitment for paid plans |
| 📋 | Source-code escrow | For mobile SDK customers: if we stop, you get the code |
| 📋 | Public accuracy benchmark | Our reader against other MRZ scanners on the same image set, method and images published |
