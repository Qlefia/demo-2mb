'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '@/components/molecules/Select'
import { Modal } from '@/components/molecules/Modal'
import { Button } from '@/components/atoms'
import { toast } from '@/components/molecules/Toast'
import { useUserStore } from '@/stores/userStore'
import type { Prospect } from '@/features/prospects/types'
import { LOST_REASONS, type LostReason, type ProspectStage } from '@/lib/db/schema/enums'
import { getAllowedTargets, type PipelineRole } from '@/lib/pipeline/transitions'
import { STAGE_META } from '@/features/prospects/stageMeta'
import { useChangeProspectStageMutation } from '@/features/prospects/api'

interface ProspectStageSelectProps {
  prospect: Prospect
  onProspectUpdated: (next: Prospect) => void
}

export function ProspectStageSelect({ prospect, onProspectUpdated }: ProspectStageSelectProps) {
  const { t } = useTranslation()
  const role = useUserStore((s) => s.role) as PipelineRole
  const changeStage = useChangeProspectStageMutation()
  const [lostReason, setLostReason] = useState<LostReason>('icp_mismatch')
  const [lostModalOpen, setLostModalOpen] = useState(false)

  const allowedTargets = useMemo(() => {
    const raw = getAllowedTargets(prospect.stage, {
      role,
      dossierStatus: prospect.dossierStatus,
    })
    if (prospect.stage === 'new') {
      return raw.filter((s) => s !== 'lost')
    }
    return raw
  }, [prospect.dossierStatus, prospect.stage, role])

  const options = useMemo(() => {
    const ids = new Set<ProspectStage>([prospect.stage, ...allowedTargets])
    return STAGE_META.filter((m) => ids.has(m.id)).map((m) => ({
      value: m.id,
      label: t(m.labelKey),
    }))
  }, [allowedTargets, prospect.stage, t])

  function commitStage(nextStage: ProspectStage, reason?: LostReason) {
    onProspectUpdated({ ...prospect, stage: nextStage })
    changeStage.mutate(
      { prospectId: prospect.id, fromStage: prospect.stage, toStage: nextStage, lostReason: reason },
      {
        onSuccess: ({ prospect: updated }) => onProspectUpdated(updated),
        onError: (err) => {
          const payload = err.payload as { reason?: string } | null
          toast(t(payload?.reason ?? 'pipeline.errors.invalidTransition'), 'error')
          onProspectUpdated(prospect)
        },
      },
    )
  }

  function handleChange(next: string) {
    const nextStage = next as ProspectStage
    if (nextStage === prospect.stage) return
    // Moving to `lost` always needs a reason (API enforces it for new→lost and
    // it's required by domain for any lost). Collect it before committing.
    if (nextStage === 'lost') {
      setLostReason('icp_mismatch')
      setLostModalOpen(true)
      return
    }
    commitStage(nextStage)
  }

  return (
    <>
      <Select
        value={prospect.stage}
        onChange={handleChange}
        options={options}
        disabled={changeStage.isPending || options.length <= 1}
      />

      <Modal
        open={lostModalOpen}
        onClose={() => setLostModalOpen(false)}
        title={t('prospects.lostModal.title')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setLostModalOpen(false)} disabled={changeStage.isPending}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              loading={changeStage.isPending}
              onClick={() => {
                setLostModalOpen(false)
                commitStage('lost', lostReason)
              }}
            >
              {t('prospects.lostModal.confirm')}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <p className="crm-meta-label">{t('prospects.lostModal.reasonLabel')}</p>
          <Select
            value={lostReason}
            onChange={(v) => setLostReason(v as LostReason)}
            options={LOST_REASONS.map((r) => ({ value: r, label: t(`prospects.lostReasons.${r}`) }))}
          />
        </div>
      </Modal>
    </>
  )
}
