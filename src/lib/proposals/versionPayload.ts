import type { ProposalBlock } from './blockSchema'
import { parseProposalBlocks } from './blockSchema'

/** Stored in `proposal_versions.blocks_diff` for publish/save snapshots. */
export type VersionSnapshotPayload = { blocks: ProposalBlock[] }

export function snapshotPayload(blocks: ProposalBlock[]): VersionSnapshotPayload {
  return { blocks }
}

export function parseSnapshotFromDiff(raw: unknown): ProposalBlock[] {
  if (!raw || typeof raw !== 'object') {
    throw new Error('bad_snapshot')
  }
  const o = raw as { blocks?: unknown }
  if (o.blocks === undefined) {
    throw new Error('bad_snapshot')
  }
  return parseProposalBlocks(o.blocks)
}
