'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { ProposalWorkspace } from '@/features/proposals/ProposalWorkspace'

export default function ProspectOfferPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = typeof params.id === 'string' ? params.id : null
  const proposalId = searchParams.get('proposalId')
  const projectId = searchParams.get('projectId')
  if (!id) return null
  return (
    <ProposalWorkspace
      prospectId={id}
      initialProposalId={proposalId}
      initialProjectId={projectId}
      documentKind="offer"
    />
  )
}
