// Live test against vend-id.com through the real stdio server. Run: VENDID_API_KEY=vid_... npm run test:live
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const specimen = fileURLToPath(new URL('../../examples/specimen.jpg', import.meta.url))
const client = new Client({ name: 'vendid-live-test', version: '1.0.0' })
await client.connect(new StdioClientTransport({
  command: process.execPath, args: [fileURLToPath(new URL('../dist/index.js', import.meta.url))],
  env: { ...process.env, VENDID_API_KEY: process.env.VENDID_API_KEY ?? '' },
}))
after(() => client.close())
const call = async (name, args = {}) => client.callTool({ name, arguments: args })

test('lists the three tools', async () => {
  assert.deepEqual((await client.listTools()).tools.map((t) => t.name).sort(), ['get_docs', 'get_pricing', 'scan_mrz'])
})

test('scan_mrz reads the ICAO specimen from a path and from base64', async () => {
  for (const args of [{ image_path: specimen }, { image_base64: readFileSync(specimen).toString('base64') }]) {
    const r = await call('scan_mrz', args)
    assert.ok(!r.isError, r.content[0].text)
    assert.match(r.content[0].text, /"document_number": "L898902C3"/)
    assert.match(r.content[0].text, /"surname": "ERIKSSON"/)
  }
})

test('scan_mrz reports API errors as tool errors with the code', async () => {
  // a plain grey picture: no document, nothing sharp → 422
  const r = await call('scan_mrz', { image_path: fileURLToPath(new URL('fixtures/blank.jpg', import.meta.url)) })
  assert.equal(r.isError, true)
  assert.match(r.content[0].text, /HTTP 422\n[\s\S]*"error": "(no_document|no_mrz|blurry|check_digits)"/)
})

test('get_pricing and get_docs answer from llms-full.txt', async () => {
  assert.match((await call('get_pricing')).content[0].text, /€29 a month including 5,000/)
  assert.match((await call('get_docs', { topic: 'react' })).content[0].text, /## Recipe: React/)
  assert.match((await call('get_docs')).content[0].text, /- Errors/)
  assert.equal((await call('get_docs', { topic: 'cobol' })).isError, true)
})
