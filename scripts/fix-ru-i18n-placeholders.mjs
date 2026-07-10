/**
 * Aligns i18n placeholders in ru.json with en.json (MT often corrupts {{var}} names).
 * Run: node scripts/fix-ru-i18n-placeholders.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const enPath = path.join(root, 'src', 'i18n', 'locales', 'en.json')
const ruPath = path.join(root, 'src', 'i18n', 'locales', 'ru.json')

function fixLeaf(enS, ruS) {
  if (typeof enS !== 'string' || typeof ruS !== 'string') return ruS
  const enParts = enS.split(/(\{\{[^}]+\}\})/g)
  const ruParts = ruS.split(/(\{\{[^}]+\}\})/g)
  if (enParts.length !== ruParts.length) {
    const enHold = [...enS.matchAll(/\{\{[^}]+\}\}/g)].map((m) => m[0])
    const ruHold = [...ruS.matchAll(/\{\{[^}]+\}\}/g)].map((m) => m[0])
    if (enHold.length === ruHold.length && enHold.length > 0) {
      let out = ruS
      for (let i = ruHold.length - 1; i >= 0; i--) {
        out = out.replace(ruHold[i], enHold[i])
      }
      return out
    }
    return ruS
  }
  return ruParts.map((seg, i) => (/^\{\{[^}]+\}\}$/.test(seg) ? enParts[i] : seg)).join('')
}

function walk(enNode, ruNode) {
  if (typeof enNode === 'string' && typeof ruNode === 'string') {
    return fixLeaf(enNode, ruNode)
  }
  if (
    enNode &&
    ruNode &&
    typeof enNode === 'object' &&
    typeof ruNode === 'object' &&
    !Array.isArray(enNode) &&
    !Array.isArray(ruNode)
  ) {
    /** @type {Record<string, unknown>} */
    const out = {}
    for (const k of Object.keys(enNode)) {
      if (!Object.hasOwn(ruNode, k)) continue
      out[k] = walk(enNode[k], ruNode[k])
    }
    return out
  }
  return ruNode
}

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
const ru = JSON.parse(fs.readFileSync(ruPath, 'utf8'))
const fixed = walk(en, ru)
fs.writeFileSync(ruPath, `${JSON.stringify(fixed, null, 2)}\n`, 'utf8')
console.error('fixed placeholders', ruPath)
