import { test, expect } from '@playwright/test'

type HotspotPosition = { id: string; x: number; y: number }

type HotspotCheck = {
  id: string
  xBand: [number, number]
  yBand: [number, number]
}

async function readHotspotPositions(page: import('@playwright/test').Page): Promise<HotspotPosition[] | null> {
  return page.evaluate(() => {
    const stage = document.querySelector('[data-testid="configurator-stage"]')
    const img = stage?.querySelector('img')
    if (!stage || !img || !(img instanceof HTMLImageElement)) return null

    const stageRect = stage.getBoundingClientRect()
    const naturalW = img.naturalWidth
    const naturalH = img.naturalHeight
    if (naturalW <= 0 || naturalH <= 0) return null

    const imageRect = (() => {
      const containerW = stageRect.width
      const containerH = stageRect.height
      const containerAspect = containerW / containerH
      const imageAspect = naturalW / naturalH

      if (imageAspect > containerAspect) {
        const width = containerW
        const height = containerW / imageAspect
        return {
          left: stageRect.left,
          top: stageRect.top + (containerH - height) / 2,
          width,
          height,
        }
      }

      const height = containerH
      const width = containerH * imageAspect
      return {
        left: stageRect.left + (containerW - width) / 2,
        top: stageRect.top,
        width,
        height,
      }
    })()

    const buttons = Array.from(
      stage.querySelectorAll<HTMLButtonElement>('[data-testid^="configurator-hotspot-"]'),
    )

    return buttons.map((button) => {
      const rect = button.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      return {
        id: button.dataset.testid?.replace('configurator-hotspot-', '') ?? '',
        x: (cx - imageRect.left) / imageRect.width,
        y: (cy - imageRect.top) / imageRect.height,
      }
    })
  })
}

function expectHotspotsInBands(positions: HotspotPosition[], checks: HotspotCheck[]) {
  for (const check of checks) {
    const spot = positions.find((p) => p.id === check.id)
    expect(spot, `hotspot ${check.id} should be present`).toBeTruthy()
    if (!spot) continue
    expect(
      spot.x,
      `${check.id} x=${spot.x.toFixed(2)} outside [${check.xBand.join(', ')}]`,
    ).toBeGreaterThanOrEqual(check.xBand[0])
    expect(spot.x, `${check.id} x`).toBeLessThanOrEqual(check.xBand[1])
    expect(
      spot.y,
      `${check.id} y=${spot.y.toFixed(2)} outside [${check.yBand.join(', ')}]`,
    ).toBeGreaterThanOrEqual(check.yBand[0])
    expect(spot.y, `${check.id} y`).toBeLessThanOrEqual(check.yBand[1])
  }
}

test.describe('Urban Oasis configurator hotspots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo/projects/urban-oasis/configure')
    await page.getByRole('tab', { name: 'Graphic Pop' }).click()
    await page.getByRole('tab', { name: 'Photo' }).click()
    await page.locator('[data-testid="configurator-stage"] img').waitFor({ state: 'visible' })
    await page.waitForFunction(() => {
      const img = document.querySelector(
        '[data-testid="configurator-stage"] img',
      ) as HTMLImageElement | null
      return Boolean(img && img.naturalWidth > 0)
    })
  })

  test('hero view — five hotspots sit on room zones', async ({ page }) => {
    const positions = await readHotspotPositions(page)
    expect(positions?.length).toBe(5)

    expectHotspotsInBands(positions ?? [], [
      { id: 'furniture', xBand: [0, 0.22], yBand: [0.4, 0.65] },
      { id: 'wall-color', xBand: [0.28, 0.52], yBand: [0.15, 0.38] },
      { id: 'upper-cabinets', xBand: [0.68, 0.9], yBand: [0.08, 0.28] },
      { id: 'backsplash', xBand: [0.7, 0.92], yBand: [0.22, 0.4] },
      { id: 'lower-cabinets', xBand: [0.68, 0.9], yBand: [0.32, 0.52] },
    ])
  })

  test('kitchen view — backsplash sits low on tile field', async ({ page }) => {
    await page.getByRole('button', { name: /Lower cabinets/i }).click()
    await page.waitForTimeout(400)

    const positions = await readHotspotPositions(page)
    expect(positions?.length).toBe(3)

    expectHotspotsInBands(positions ?? [], [
      { id: 'upper-cabinets', xBand: [0.32, 0.58], yBand: [0.05, 0.22] },
      { id: 'backsplash', xBand: [0.5, 0.78], yBand: [0.28, 0.45] },
      { id: 'lower-cabinets', xBand: [0.38, 0.68], yBand: [0.38, 0.58] },
    ])
  })

  test('wall view — work zone hotspot sits on the chair (left)', async ({ page }) => {
    await page.getByRole('button', { name: /Wall colour White walls/i }).click()
    await page.waitForTimeout(400)

    const positions = await readHotspotPositions(page)
    const furniture = positions?.find((p) => p.id === 'furniture')
    expect(furniture).toBeTruthy()
    expect(furniture!.x).toBeLessThan(0.2)
    expect(furniture!.y).toBeGreaterThan(0.4)
    expect(furniture!.y).toBeLessThan(0.62)
  })

  test('workstation view — furniture hotspot sits on desk zone', async ({ page }) => {
    await page.getByRole('button', { name: /Work zone Red chair/i }).click()
    await page.waitForTimeout(400)

    const positions = await readHotspotPositions(page)
    const furniture = positions?.find((p) => p.id === 'furniture')
    expect(furniture).toBeTruthy()
    expect(furniture!.x).toBeGreaterThan(0.12)
    expect(furniture!.x).toBeLessThan(0.48)
    expect(furniture!.y).toBeGreaterThan(0.48)
  })
})
