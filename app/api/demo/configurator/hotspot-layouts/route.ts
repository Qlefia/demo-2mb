import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Hotspot debug save is disabled in production' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const filePath = path.join(
    process.cwd(),
    'src/features/demo/configurator/hotspot-layout-overrides.json',
  )

  await writeFile(filePath, `${JSON.stringify(body, null, 2)}\n`, 'utf8')

  return NextResponse.json({ ok: true, path: 'src/features/demo/configurator/hotspot-layout-overrides.json' })
}
