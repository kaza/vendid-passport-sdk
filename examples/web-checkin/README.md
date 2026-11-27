# Web check-in

A guest check-in form that fills itself from a passport or ID card. Plain HTML and JavaScript, no build step:
[`index.html`](index.html) loads `https://vend-id.com/sdk/mrz.js`, [`app.js`](app.js) puts the answer into the form.

**Live:** https://kaza.github.io/vendid-passport-sdk/examples/web-checkin/

Three ways in, all giving the same JSON:

| Button | Call |
|---|---|
| Scan passport (camera) | `VendIdMrz.open({ key })`: full-screen camera, auto-capture, resolves when the check digits are valid |
| Upload a photo | `VendIdMrz.scanImage({ key, image: file })` |
| Try the specimen passport | `scanImage` with [`../specimen.jpg`](../specimen.jpg), the ICAO 9303 specimen; reads of it are free |

## Run it locally

The camera needs HTTPS or `localhost`. From the repository root:

```sh
python3 -m http.server 8000
# open http://localhost:8000/examples/web-checkin/
```

Paste your key (free at [vend-id.com/sdk](https://vend-id.com/sdk#get-key)) and press a button.

## The part you copy

```html
<form id="guest">
  <input name="surname"> <input name="given_names">
  <input name="birth_date" type="date"> <input name="document_number">
  <button type="button" onclick="scan()">Scan passport</button>
</form>

<script src="https://vend-id.com/sdk/mrz.js"></script>
<script>
  async function scan() {
    const r = await VendIdMrz.open({ key: 'vid_…' })
    const form = document.getElementById('guest')
    form.surname.value = r.surname
    form.given_names.value = r.given_names
    form.birth_date.value = r.birth_date        // already YYYY-MM-DD, fits <input type="date">
    form.document_number.value = r.document_number
  }
</script>
```

## The key in a browser

Anyone who opens a page can read a key written into it. That is fine for testing and for pages behind your own login.
On a public page, send the image to your server and call `POST /v1/mrz` from there
([curl](../curl/), [Node](../node/), [Python](../python/)).
