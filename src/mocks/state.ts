import type { MockStateShape } from '@/mocks/seed'
import { initialMockState } from '@/mocks/seed'

let serverState: MockStateShape | null = null
let clientState: MockStateShape | null = null

function clone(): MockStateShape {
  return structuredClone(initialMockState)
}

export function getMockState(): MockStateShape {
  if (typeof window === 'undefined') {
    if (!serverState) serverState = clone()
    return serverState
  }
  if (!clientState) clientState = clone()
  return clientState
}

export function resetMockStateForTests(): void {
  serverState = clone()
  clientState = clone()
}
