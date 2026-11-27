/*
 * The VendID MRZ API and its docs, for the MCP server in index.ts. No MCP types here: plain functions, unit-tested.
 * API: https://vend-id.com/sdk/docs · Everything for AI assistants: https://vend-id.com/llms-full.txt
 */
import { readFileSync } from 'node:fs'
import { extname } from 'node:path'

export const API = 'https://vend-id.com/v1/mrz'
export const DOCS_URL = 'https://vend-id.com/llms-full.txt'
export const GET_KEY = 'https://vend-id.com/sdk#get-key'

export interface Section { title: string; text: string }

/** llms-full.txt → its `## ` sections (the part before the first one is the intro, not a section). */
export function sections(doc: string): Section[] {
  return doc.split(/^(?=## )/m).filter((s) => s.startsWith('## ')).map((s) => ({
    title: s.slice(3, s.indexOf('\n') === -1 ? undefined : s.indexOf('\n')).trim(),
    text: s.trimEnd(),
  }))
}

const SYNONYMS: Record<string, string> = {
  pricing: 'prices', price: 'prices', cost: 'prices', plans: 'prices', key: 'api key', auth: 'api key', signup: 'api key',
  error: 'errors', quota: 'limits', 'mrz.js': 'mrz.js', javascript: 'mrz.js', camera: 'mrz.js', privacy: 'data protection',
  gdpr: 'data protection', dpa: 'data protection', spain: 'ses.hospedajes', italy: 'alloggiati', portugal: 'siba',
  nextjs: 'next.js', next: 'next.js', webview: 'webview', android: 'webview', ios: 'webview', migration: 'migrating',
  blinkid: 'migrating', regula: 'migrating', scanbot: 'migrating', dynamsoft: 'migrating', test: 'testing', specimen: 'testing',
}

/** The sections whose heading contains the topic (or its synonym). */
export function findSections(doc: string, topic: string): Section[] {
  const t = topic.trim().toLowerCase()
  const want = SYNONYMS[t] ?? t
  return sections(doc).filter((s) => s.title.toLowerCase().includes(want))
}

const TYPES: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }

function sniff(bytes: Buffer): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png'
  if (bytes.subarray(0, 4).toString() === 'RIFF') return 'image/webp'
  return 'image/jpeg'
}

export interface Image { bytes: Buffer; type: string }

/** `image_path` (a local file) or `image_base64` (plain or a data: URL) → bytes and content type. */
export function imageInput(args: { image_path?: string; image_base64?: string }): Image {
  if (args.image_path && args.image_base64) throw new Error('Give image_path or image_base64, not both.')
  if (args.image_path) {
    const bytes = readFileSync(args.image_path)
    return { bytes, type: TYPES[extname(args.image_path).toLowerCase()] ?? sniff(bytes) }
  }
  if (args.image_base64) {
    const m = /^data:(image\/[\w+.-]+);base64,(.*)$/s.exec(args.image_base64.trim())
    const bytes = Buffer.from(m ? m[2]! : args.image_base64, 'base64')
    return { bytes, type: m ? m[1]! : sniff(bytes) }
  }
  throw new Error('Give image_path or image_base64: a photo of the passport or ID card data page.')
}

/** POST the image to /v1/mrz. Returns the HTTP status and the JSON body; a network failure throws. */
export async function scanMrz(image: Image, key: string | undefined, fetchImpl: typeof fetch): Promise<{ status: number; body: unknown }> {
  if (!key) {
    throw new Error(`VENDID_API_KEY is not set. Get a free key in 60 seconds at ${GET_KEY} (500 scans a month free, no card), then set VENDID_API_KEY in the MCP server's environment.`)
  }
  const res = await fetchImpl(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': image.type },
    body: new Uint8Array(image.bytes),
    signal: AbortSignal.timeout(30_000),
  })
  return { status: res.status, body: await res.json() }
}

let cache: string | undefined

/** llms-full.txt, fetched once per server process. */
export async function docs(fetchImpl: typeof fetch): Promise<string> {
  if (cache) return cache
  const res = await fetchImpl(DOCS_URL, { signal: AbortSignal.timeout(15_000) })
  if (!res.ok) throw new Error(`${DOCS_URL}: HTTP ${res.status}`)
  cache = await res.text()
  return cache
}
