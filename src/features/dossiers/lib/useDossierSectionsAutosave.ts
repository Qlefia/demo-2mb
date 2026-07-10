'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/components/molecules/Toast'
import type { DossierSections } from '@/lib/dossiers/schema'
import type { DossierRecordDTO } from '@/features/dossiers/types'
import { putDossierSections } from './dossierApi'

const DEBOUNCE_MS = 700

type Options = {
  prospectId: string
  enabled: boolean
  onSaved?: (result: { dossier: DossierRecordDTO; sections: DossierSections }) => void
}

export function useDossierSectionsAutosave({ prospectId, enabled, onSaved }: Options) {
  const { t } = useTranslation()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef(false)
  const onSavedRef = useRef(onSaved)
  onSavedRef.current = onSaved

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const queueSave = useCallback(
    (sections: DossierSections) => {
      if (!enabled) return
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        if (inFlightRef.current) return
        inFlightRef.current = true
        void putDossierSections(prospectId, sections)
          .then((data) => {
            onSavedRef.current?.({ dossier: data.dossier, sections: data.sections })
          })
          .catch(() => {
            toast(t('dossier.errors.save_failed'), 'error')
          })
          .finally(() => {
            inFlightRef.current = false
          })
      }, DEBOUNCE_MS)
    },
    [enabled, prospectId, t],
  )

  return { queueSave }
}
