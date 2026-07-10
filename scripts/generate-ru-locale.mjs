/**
 * One-shot helper: builds src/i18n/locales/ru.json from en.json via Google Translate (unofficial).
 * Run: node scripts/generate-ru-locale.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { batchTranslate } from 'google-translate-api-x'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const enPath = path.join(root, 'src', 'i18n', 'locales', 'en.json')
const ruPath = path.join(root, 'src', 'i18n', 'locales', 'ru.json')

/** @param {unknown} obj @param {string} prefix @param {Array<[string, string]>} out */
function collectLeafPaths(obj, prefix, out) {
  if (typeof obj === 'string') {
      out.push([prefix, obj])
    return
  }
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const k of Object.keys(obj)) {
      const p = prefix ? `${prefix}.${k}` : k
      collectLeafPaths(obj[k], p, out)
    }
  }
}

const SKIP_EXACT = new Set(['__yes__', '__no__', 'TODO: translate'])

async function translateChunk(strings) {
  const payload = strings.map((text) => ({ text, from: 'en', to: 'ru' }))
  const results = await batchTranslate(payload, {
    client: 'gtx',
    rejectOnPartialFail: false,
  })
  return strings.map((s, i) => {
    const r = Array.isArray(results) ? results[i] : results
    const out = r && typeof r.text === 'string' ? r.text : null
    if (out == null && !SKIP_EXACT.has(s)) return s
    return out ?? s
  })
}

async function main() {
  const enRaw = fs.readFileSync(enPath, 'utf8')
  const en = JSON.parse(enRaw)

  /** @type {Array<[string, string]>} */
  const pairs = []
  collectLeafPaths(en, '', pairs)

  const unique = [...new Set(pairs.map(([, v]) => v))]
  /** @type {Map<string, string>} */
  const enToRu = new Map()

  const BATCH = 35
  for (let i = 0; i < unique.length; i += BATCH) {
    const chunk = unique.slice(i, i + BATCH)
    const toTranslate = chunk.map((s) => (SKIP_EXACT.has(s) ? s : s))
    process.stderr.write(`translate ${i + 1}..${Math.min(i + BATCH, unique.length)} / ${unique.length}\n`)
    const translated = await translateChunk(toTranslate)
    for (let j = 0; j < chunk.length; j++) {
      enToRu.set(chunk[j], translated[j])
    }
    await new Promise((r) => setTimeout(r, 400))
  }

  /** @param {unknown} node */
  function apply(node) {
    if (typeof node === 'string') {
      return enToRu.get(node) ?? node
    }
    if (node && typeof node === 'object' && !Array.isArray(node)) {
      /** @type {Record<string, unknown>} */
      const next = {}
      for (const k of Object.keys(node)) {
        next[k] = apply(node[k])
      }
      return next
    }
    return node
  }

  const ru = apply(en)
  fs.writeFileSync(ruPath, `${JSON.stringify(ru, null, 2)}\n`, 'utf8')
  process.stderr.write(`wrote ${ruPath}\n`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
