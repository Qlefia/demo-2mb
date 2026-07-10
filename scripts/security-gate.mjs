/**
 * CI-friendly checks: client bundles must not reference the Supabase service role.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const roots = ['app', 'src']

let failed = false

function walk(dir) {
  let names
  try {
    names = readdirSync(dir)
  } catch {
    return
  }
  for (const name of names) {
    const p = join(dir, name)
    if (name === 'node_modules' || name === '.next') continue
    const st = statSync(p)
    if (st.isDirectory()) {
      walk(p)
    } else if (/\.(tsx?|jsx?)$/.test(name)) {
      const c = readFileSync(p, 'utf8')
      const isClient = c.includes("'use client'") || c.includes('"use client"')
      if (isClient && /SERVICE_ROLE|service_role/i.test(c)) {
        console.error(`security-gate: client file must not reference service role: ${p}`)
        failed = true
      }
    }
  }
}

for (const r of roots) {
  walk(join(process.cwd(), r))
}

if (failed) {
  process.exit(1)
}
console.log('security-gate: pass (no service role in client components)')
