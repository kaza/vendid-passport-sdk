# Node.js

Node 18 or newer. No `npm install`: `fetch`, `FormData` and `Blob` are built in.

```sh
export VENDID_API_KEY=vid_...            # free key: https://vend-id.com/sdk#get-key
node scan.mjs                            # the ICAO specimen in ../specimen.jpg
node scan.mjs ~/Desktop/passport.jpg     # your own image
```

The JSON answer goes to stdout, a one-line summary to stderr. A failed read exits with code 1.

The call itself, for your own code:

```js
const form = new FormData()
form.append('image', new Blob([await readFile('passport.jpg')], { type: 'image/jpeg' }), 'passport.jpg')
const res = await fetch('https://vend-id.com/v1/mrz', {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.VENDID_API_KEY}` },
  body: form,
})
const mrz = await res.json()   // 200 → fields, 422 → { error, reason }
```

Answer and error codes: [docs/api.md](../../docs/api.md).
