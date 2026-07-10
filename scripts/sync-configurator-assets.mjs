import { copyFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const src = join(root, 'материалы')
const dst = join(root, 'public', 'demo', 'configurator', 'urban-oasis')

const DESIGN_3_NAMED = [
  'K_1',
  'K_2',
  'K_3',
  'K_3_1',
  'K_3_2',
  'K_3_2_1',
  'K_3_2_2',
  'W_1',
  'W_2',
  'W_3',
  'Work_station_1',
  'Work_station_2',
  'Work_station_3',
]

for (const design of [1, 2, 3]) {
  const destDir = join(dst, `design-${design}`)
  mkdirSync(destDir, { recursive: true })
  const prefix = `DRL_studio_Design ${design}_`
  const files = readdirSync(src).filter((name) => name.startsWith(prefix) && name.endsWith('_jpeg.jpg'))
  for (const name of files) {
    const frame = name.slice(prefix.length).replace('_jpeg.jpg', '')
    copyFileSync(join(src, name), join(destDir, `${frame}.jpg`))
  }
}

const design3Dir = join(dst, 'design-3')
mkdirSync(design3Dir, { recursive: true })
for (const name of DESIGN_3_NAMED) {
  copyFileSync(join(src, `${name}.jpg`), join(design3Dir, `${name}.jpg`))
}

console.log('Synced configurator assets to public/demo/configurator/urban-oasis/')
