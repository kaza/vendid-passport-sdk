// Guest check-in that fills itself from a passport: VendID mrz.js + a plain HTML form.
// mrz.js is loaded from https://vend-id.com/sdk/mrz.js (see index.html) and defines window.VendIdMrz.

const $ = (id) => document.getElementById(id)
const keyInput = $('key')
const form = $('guest')
const status = (text, kind = '') => { $('status').textContent = text; $('status').className = kind }

// The key stays in this tab (sessionStorage), never in the URL or the page source.
try { keyInput.value = sessionStorage.getItem('vendid_key') || '' } catch { /* storage blocked: type it each time */ }
keyInput.addEventListener('change', () => {
  try { sessionStorage.setItem('vendid_key', keyInput.value.trim()) } catch { /* storage blocked: nothing to keep */ }
})

function key() {
  const k = keyInput.value.trim()
  if (!k) {
    status('Paste your API key first (free at vend-id.com/sdk).', 'error')
    keyInput.focus()
  }
  return k
}

/** The API answer → the form. Field names match the API (docs/api.md). */
function fill(r) {
  for (const name of ['surname', 'given_names', 'birth_date', 'sex', 'nationality', 'document_type',
    'document_number', 'issuing_state', 'expiry_date']) {
    if (form.elements[name]) form.elements[name].value = r[name] ?? ''
  }
  $('expired').hidden = !(r.expiry_date && r.expiry_date < new Date().toISOString().slice(0, 10))
  status(`Read ${r.format} ${r.document_type} in ${r.ms} ms, all check digits valid.${r.specimen ? ' (ICAO specimen, free)' : ''}`, 'ok')
}

const MESSAGES = {
  closed: 'Scan closed.',
  no_document: 'No passport or ID card found in the image.',
  no_mrz: 'Document found, but not the MRZ (the lines with <<< at the bottom of the data page).',
  blurry: 'The MRZ is too blurry. More light, hold steady.',
  check_digits: 'Read, but the check digits do not match. Try a sharper photo.',
  missing_api_key: 'Paste your API key first.',
  invalid_api_key: 'This API key is not valid. Get a new one at vend-id.com/sdk.',
  quota_exceeded: 'This key has used its free scans for this month.',
  unsupported_image: 'This file is not a photo the reader can open. Use a JPEG, PNG or WebP.',
  engine_unavailable: 'The reader did not answer. Please try again.',
}
function fail(err) {
  status(MESSAGES[err.code] || err.message || String(err), err.code === 'closed' ? '' : 'error')
}

$('scan').addEventListener('click', () => {
  const k = key()
  if (!k) return
  status('Camera open…')
  VendIdMrz.open({ key: k }).then(fill, fail)
})

async function readFile(image) {
  const k = key()
  if (!k) return
  status('Reading… (the first read after a quiet spell takes a few seconds)')
  try {
    fill(await VendIdMrz.scanImage({ key: k, image }))
  } catch (err) {
    fail(err)
  }
}

$('file').addEventListener('change', (e) => {
  const f = e.target.files[0]
  e.target.value = ''
  if (f) readFile(f)
})

$('specimen').addEventListener('click', async () => {
  // The ICAO 9303 specimen passport (fictional person), next to this example. Reads of it are free.
  const res = await fetch('../specimen.jpg')
  if (!res.ok) return status(`Could not load ../specimen.jpg (HTTP ${res.status}).`, 'error')
  readFile(await res.blob())
})

form.addEventListener('submit', (e) => {
  e.preventDefault()
  // Your backend would receive this. Here it is only shown.
  $('out').hidden = false
  $('out').textContent = JSON.stringify(Object.fromEntries(new FormData(form)), null, 2)
})
