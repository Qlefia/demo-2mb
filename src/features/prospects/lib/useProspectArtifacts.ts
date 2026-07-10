'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createProspectArtifact,
  deleteProspectArtifact,
  fetchProspectArtifacts,
  prospectArtifactsQueryKey,
  updateProspectArtifact,
  uploadProspectArtifactImage,
  type CreateArtifactInput,
  type ProspectArtifactDTO,
  type UpdateArtifactInput,
} from '@/features/prospects/lib/prospectArtifactsApi'

export function useProspectArtifacts(prospectId: string) {
  return useQuery({
    queryKey: prospectArtifactsQueryKey(prospectId),
    queryFn: () => fetchProspectArtifacts(prospectId),
  })
}

export function useProspectArtifactMutations(prospectId: string) {
  const queryClient = useQueryClient()
  const queryKey = prospectArtifactsQueryKey(prospectId)

  const invalidate = () => void queryClient.invalidateQueries({ queryKey })

  const createMutation = useMutation({
    mutationFn: (input: CreateArtifactInput) => createProspectArtifact(prospectId, input),
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: (args: { artifactId: string; input: UpdateArtifactInput }) =>
      updateProspectArtifact(prospectId, args.artifactId, args.input),
    onSuccess: invalidate,
  })

  const uploadMutation = useMutation({
    mutationFn: (args: {
      file: File
      artifactId?: string
      parentId?: string | null
      title?: string
      body?: string
      linkUrl?: string
    }) => uploadProspectArtifactImage(prospectId, args.file, args),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (artifactId: string) => deleteProspectArtifact(prospectId, artifactId),
    onSuccess: invalidate,
  })

  return { createMutation, updateMutation, uploadMutation, deleteMutation }
}

export type { ProspectArtifactDTO }
