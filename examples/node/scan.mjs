// Read the MRZ of a passport or ID card image with the VendID MRZ API. Node 18+, no dependencies.
//
//   export VENDID_API_KEY=vid_...        # free key: https://vend-id.com/sdk#get-key
//   node scan.mjs                        # reads the ICAO specimen in ../specimen.jpg
//   node scan.mjs path/to/passport.jpg   # or your own image (JPEG, PNG or WebP, max 10 MB)

import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const key = process.env.VENDID_API_KEY
if (!key) {
  console.error('Set VENDID_API_KEY first. Free key: https://vend-id.com/sdk#get-key')
  process.exit(2)
}
const path = process.argv[2] ?? fileURLToPath(new URL('../specimen.jpg', import.meta.url))

const form = new FormData()
form.append('image', new Blob([await readFile(path)], { type: 'image/jpeg' }), basename(path))

const res = await fetch('https://vend-id.com/v1/mrz', {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}` },
  body: form,
})
const body = await res.json()

if (!res.ok) {
  // 422: the image was read but gave no valid MRZ (body.error: no_document | no_mrz | blurry | check_digits).
  // 401: key missing or unknown. 415: not a JPEG/PNG/WebP image. 429: monthly free scans used up. 502: reader unavailable, retry.
  console.error(`HTTP ${res.status}: ${body.error}${body.message ? ` (${body.message})` : ''}`)
  console.log(JSON.stringify(body, null, 2))
  process.exit(1)
}

console.log(JSON.stringify(body, null, 2))
console.error(`\n${body.surname}, ${body.given_names} · ${body.document_number} · born ${body.birth_date} · ${body.ms} ms`)
