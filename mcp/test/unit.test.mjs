// Unit tests for the pure parts (no network). Run: npm test
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { sections, findSections, imageInput, scanMrz } from '../dist/vendid.js'

const DOC = '# Title\n\nintro\n\n## Prices\n\n€0.01 a scan\n\n## Recipe: React\n\nuseState\n\n## Errors\n\n422 blurry\n'

test('sections splits llms-full.txt at the ## headings', () => {
  assert.deepEqual(sections(DOC).map((s) => s.title), ['Prices', 'Recipe: React', 'Errors'])
  assert.match(sections(DOC)[0].text, /^## Prices\n\n€0\.01 a scan/)
})

test('findSections matches a topic against the headings, case-insensitive, with a few synonyms', () => {
  assert.deepEqual(findSections(DOC, 'react').map((s) => s.title), ['Recipe: React'])
  assert.deepEqual(findSections(DOC, 'ERRORS').map((s) => s.title), ['Errors'])
  assert.deepEqual(findSections(DOC, 'pricing').map((s) => s.title), ['Prices'])
  assert.deepEqual(findSections(DOC, 'cobol'), [])
})

test('imageInput reads a file path or base64 (with or without data: prefix), exactly one of them', () => {
  const dir = mkdtempSync(join(tmpdir(), 'vendid-'))
  const file = join(dir, 'p.png')
  writeFileSync(file, Buffer.from([0x89, 0x50, 0x4e, 0x47]))
  assert.equal(imageInput({ image_path: file }).type, 'image/png')
  const b64 = imageInput({ image_base64: 'data:image/webp;base64,' + Buffer.from('abc').toString('base64') })
  assert.equal(b64.type, 'image/webp')
  assert.equal(b64.bytes.toString(), 'abc')
  assert.equal(imageInput({ image_base64: Buffer.from([0xff, 0xd8, 0xff]).toString('base64') }).type, 'image/jpeg')
  assert.throws(() => imageInput({}), /image_path or image_base64/)
  assert.throws(() => imageInput({ image_path: file, image_base64: 'x' }), /not both/)
})

test('scanMrz posts the raw image with the key and returns status and body', async () => {
  let seen
  const fetchFake = async (url, init) => { seen = { url, init }; return new Response('{"error":"blurry"}', { status: 422 }) }
  const r = await scanMrz({ bytes: Buffer.from('img'), type: 'image/jpeg' }, 'vid_abc', fetchFake)
  assert.equal(seen.url, 'https://vend-id.com/v1/mrz')
  assert.equal(seen.init.headers.Authorization, 'Bearer vid_abc')
  assert.equal(seen.init.headers['Content-Type'], 'image/jpeg')
  assert.deepEqual(r, { status: 422, body: { error: 'blurry' } })
})

test('scanMrz without a key says how to get one', async () => {
  await assert.rejects(scanMrz({ bytes: Buffer.from('x'), type: 'image/jpeg' }, undefined, fetch), /VENDID_API_KEY.*vend-id\.com\/sdk#get-key/s)
})
