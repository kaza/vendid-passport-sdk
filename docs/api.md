# VendID MRZ API reference

Full docs: [vend-id.com/sdk/docs](https://vend-id.com/sdk/docs). This page is the short version, kept next to the
examples.

## Request

```
POST https://vend-id.com/v1/mrz
Authorization: Bearer vid_...
```

| Body | How |
|---|---|
| multipart/form-data | the image in field `image` |
| raw | the image bytes, `Content-Type: image/jpeg`, `image/png` or `image/webp` |

- Max 10 MB. A photo of the data page or a whole camera frame both work: the document is found in the image.
- Passports (TD3), ID cards (TD1) and TD2 documents.
- CORS is open (`Access-Control-Allow-Origin: *`), so a browser page on any origin can call it.
- A key is `vid_` followed by 32 letters and digits. We keep only its hash: a lost key cannot be shown again, request a new one.
- The image is read in memory on our servers in the EU (Belgium) and dropped. Nothing is stored.

## Response 200

```json
{
  "format": "TD3",
  "document_type": "P",
  "issuing_state": "UTO",
  "surname": "ERIKSSON",
  "given_names": "ANNA MARIA",
  "document_number": "L898902C3",
  "nationality": "UTO",
  "birth_date": "1974-08-12",
  "sex": "F",
  "expiry_date": "2012-04-15",
  "optional_data": "ZE184226B",
  "check_digits": { "document_number": true, "birth_date": true, "expiry_date": true, "composite": true },
  "mrz": [
    "P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<",
    "L898902C36UTO7408122F1204159ZE184226B<<<<<10"
  ],
  "ms": 612,
  "specimen": true
}
```

| Field | Meaning |
|---|---|
| `format` | `TD3` passport (2 × 44), `TD1` ID card (3 × 30), `TD2` (2 × 36) |
| `document_type` | `P` passport, `I` / `ID` / `A` / `C` identity documents, as printed |
| `issuing_state` | ICAO three-letter code of the issuing state, e.g. `AUT`, `D` (Germany), `UTO` (the ICAO specimen state) |
| `surname`, `given_names` | names with the `<` fillers turned into spaces |
| `document_number` | without fillers |
| `nationality` | ICAO three-letter code |
| `birth_date`, `expiry_date` | `YYYY-MM-DD`, or `null` when the MRZ date does not exist (some documents write an unknown day as `<<`) |
| `sex` | `F`, `M`, `X`, or empty when unspecified |
| `optional_data` | the optional data field(s), e.g. a personal number |
| `check_digits` | the ICAO 9303 check digits, recomputed. **A 200 always has all four `true`**: no answer is better than a wrong one |
| `mrz` | the raw lines as read |
| `ms` | time on our side in milliseconds (about 0.55 s warm; the first call after a quiet spell takes a few seconds longer) |
| `specimen` | only present, `true`, when the ICAO specimen was read. Specimen reads are free and never count |

JSON Schema: [response.schema.json](response.schema.json).

## Errors

Every error is JSON with an `error` code.

| Status | `error` | Meaning | Other fields |
|---|---|---|---|
| 422 | `no_document` | No passport or ID card found in the image | `reason`, `ms` |
| 422 | `no_mrz` | Document found, but not the MRZ lines (the `<<<` lines) | `reason`, `ms` |
| 422 | `blurry` | MRZ too blurry to read | `reason`, `ms` |
| 422 | `check_digits` | Read, but the check digits do not match | `reason`, `ms` |
| 400 | `bad_request` | No image in the request | `message` |
| 401 | `missing_api_key` | No `Authorization: Bearer` header | `get_key` |
| 401 | `invalid_api_key` | A key we do not know | `get_key` |
| 429 | `quota_exceeded` | The month's free scans are used up; resets on the 1st (UTC) | `limit`, `used`, `message` |
| 502 | `engine_unavailable` | The reader did not answer. Retry | `message` |

Failed reads (422) are free. Only reads with valid check digits count.

## Limits

| | |
|---|---|
| Image size | 10 MB per request |
| Free plan | 500 successful reads per calendar month (UTC), no card |
| All calls, any outcome | at most 20 × the monthly plan per month (10,000 on the free plan), against abuse |
| Key requests | 5 per minute per IP |

Pay as you go (€0.01 per successful read) and Starter (€29 a month incl. 3,000): [vend-id.com/sdk](https://vend-id.com/sdk).

## mrz.js (browser drop-in)

```html
<script src="https://vend-id.com/sdk/mrz.js"></script>
```

| Call | What it does |
|---|---|
| `VendIdMrz.open({ key, onResult?, onError? })` | Full-screen camera overlay; sends frames to `/v1/mrz` until one reads with valid check digits. The promise resolves with the answer above. It rejects on a key or quota error, and with `code: 'closed'` when the user closes the overlay |
| `VendIdMrz.scanImage({ key, image })` | One `File` or `Blob` → the same answer. Rejects with `err.code` = one of the error codes above |
| `VendIdMrz.close()` | Closes an open overlay |

Camera access needs HTTPS (or `localhost`). Example: [examples/web-checkin](../examples/web-checkin/).
