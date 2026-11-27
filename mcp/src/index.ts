#!/usr/bin/env node
/*
 * VendID MCP server (stdio): passport and ID card MRZ scanning for AI assistants.
 *   scan_mrz      image file or base64 → the VendID MRZ API's JSON (needs VENDID_API_KEY)
 *   get_pricing   current prices, from https://vend-id.com/llms-full.txt
 *   get_docs      a topic of https://vend-id.com/llms-full.txt (recipes, errors, mrz.js, field mapping, …)
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { docs, findSections, imageInput, scanMrz, sections, DOCS_URL } from './vendid.js'

const text = (t: string, isError = false) => ({ content: [{ type: 'text' as const, text: t }], ...(isError ? { isError: true } : {}) })

const server = new McpServer({ name: 'vendid', version: '1.0.0' })

server.registerTool('scan_mrz', {
  title: 'Scan a passport or ID card (MRZ)',
  description: 'Read the machine-readable zone of a passport (TD3), ID card (TD1) or TD2 document from an image with the VendID MRZ API. ' +
    'Returns JSON: surname, given_names, document_number, nationality, birth_date, expiry_date (ISO), sex, issuing_state, document_type, ' +
    'optional_data, check_digits (all true on success), mrz lines. On failure: HTTP status and an error code (no_document, no_mrz, blurry, ' +
    'check_digits, invalid_api_key, quota_exceeded, …). Free test image: https://vend-id.com/sdk/specimen.jpg (never counted).',
  inputSchema: {
    image_path: z.string().optional().describe('Path to a local JPEG, PNG or WebP image (max 10 MB)'),
    image_base64: z.string().optional().describe('The image as base64, or a data: URL'),
  },
}, async (args) => {
  const { status, body } = await scanMrz(imageInput(args), process.env.VENDID_API_KEY, fetch)
  return text(`HTTP ${status}\n${JSON.stringify(body, null, 2)}`, status !== 200)
})

server.registerTool('get_pricing', {
  title: 'VendID prices',
  description: 'Current prices of the VendID MRZ API (free 500 scans a month, €0.01 a scan, Starter €29 incl. 5,000) and the VendID Passport SDK (browser, mobile, face + liveness).',
  inputSchema: {},
}, async () => text(findSections(await docs(fetch), 'prices').map((s) => s.text).join('\n\n')))

server.registerTool('get_docs', {
  title: 'VendID docs',
  description: 'Implementation docs for VendID from https://vend-id.com/llms-full.txt. Topics include: api key, api reference, errors, limits, mrz.js, ' +
    'recipe html, react, vue, next.js, node, python, php, curl, webview, ses.hospedajes, alloggiati, siba, guest profile, icao codes, migrating ' +
    '(BlinkID, Regula, Scanbot, Dynamsoft), passport sdk, data protection, testing, faq. Without a topic: the list of sections.',
  inputSchema: { topic: z.string().optional().describe('A section name or keyword, e.g. "react", "errors", "ses.hospedajes"') },
}, async ({ topic }) => {
  const doc = await docs(fetch)
  const all = sections(doc).map((s) => `- ${s.title}`).join('\n')
  if (!topic) return text(`Sections of ${DOCS_URL}:\n${all}`)
  const found = findSections(doc, topic)
  if (found.length === 0) return text(`No section matches "${topic}". Sections of ${DOCS_URL}:\n${all}`, true)
  return text(found.map((s) => s.text).join('\n\n'))
})

// 10 MB images arrive as base64 (+33 %) inside JSON: the SDK's default 10 MiB stdio buffer would drop the connection.
await server.connect(new StdioServerTransport(process.stdin, process.stdout, { maxBufferSize: 16 * 1024 * 1024 }))
