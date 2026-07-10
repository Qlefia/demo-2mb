'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { StudioGeneral } from '@/stores/studioProfileTypes'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import {
  finalizeStudioBrandsForSave,
  generalToFormValues,
  studioGeneralFormSchema,
} from '@/features/studio-settings/sections/studioGeneralForm'
import type { GeneralForm } from '@/features/studio-settings/sections/studioGeneralForm'

const FORM_SAVE_DEBOUNCE_MS = 700

/**
 * Push the GeneralForm payload into the Zustand store. Note: `bankAccounts`
 * and `documentTemplates` are deliberately NOT in the form schema — they are
 * edited via `/settings/studio/bank-accounts/[id]` and `/settings/studio/templates/[id]`
 * detail pages (cards UX, mirrors Offices/Sales pattern) and the store has
 * dedicated methods (`addBankAccount`, `updateDocumentTemplate`, ...). Keeping
 * them out of the form prevents form-`reset()` from racing with detail-page
 * edits and overwriting a half-typed IBAN with the previously rendered list.
 */
function applyGeneralFormToStore(data: GeneralForm): StudioGeneral {
  const {
    studioBrands: formBrands,
    displayCurrency,
    studioTimezone,
    defaultProposalLocale,
    taxProfile,
    offerNumbering,
    invoiceNumbering,
    paymentDefaults,
    documentSections,
    ...rest
  } = data
  const existingBrands = useStudioProfileStore.getState().general.studioBrands
  const studioBrands = finalizeStudioBrandsForSave(formBrands, existingBrands)
  useStudioProfileStore.getState().setGeneral({
    ...rest,
    studioBrands,
    displayCurrency: displayCurrency as StudioGeneral['displayCurrency'],
    studioTimezone: studioTimezone as StudioGeneral['studioTimezone'],
    defaultProposalLocale: defaultProposalLocale as StudioGeneral['defaultProposalLocale'],
    taxProfile: taxProfile as StudioGeneral['taxProfile'],
    offerNumbering: offerNumbering as StudioGeneral['offerNumbering'],
    invoiceNumbering: invoiceNumbering as StudioGeneral['invoiceNumbering'],
    paymentDefaults: paymentDefaults as StudioGeneral['paymentDefaults'],
    documentSections: documentSections as StudioGeneral['documentSections'],
  })
  return useStudioProfileStore.getState().general
}

export function StudioGeneralFormShell({ children }: { children: ReactNode }) {
  const general = useStudioProfileStore((s) => s.general)

  const methods = useForm<GeneralForm>({
    resolver: zodResolver(studioGeneralFormSchema),
    defaultValues: generalToFormValues(general),
  })

  const { watch, reset, trigger, getValues } = methods

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /**
   * Reference equality marker for `general` objects this form itself produced
   * (via {@link applyGeneralFormToStore}). When the store emits one of those,
   * the reset-from-server effect below skips its `reset()` so it does not wipe
   * later keystrokes the user already typed but the debounced autosave hasn't
   * flushed yet. Without this, every successful autosave round-trip would race
   * with in-flight user input.
   */
  const lastFormPushedGeneralRef = useRef<StudioGeneral | null>(null)

  useEffect(() => {
    if (general === lastFormPushedGeneralRef.current) return
    reset(generalToFormValues(general))
  }, [general, reset])

  useEffect(() => {
    const subscription = watch((_, info) => {
      // `info.type === 'change'` fires only for genuine user input via
      // RHF-registered onChange. Programmatic `reset()` / `setValue(..., {
      // shouldDirty: false })` — used to mirror server state into the form on
      // Realtime updates — emit `type === undefined` and must NOT trigger an
      // autosave; otherwise every server-originated reset would echo back as a
      // PUT with a now-stale `expectedRevision` and the server's optimistic-
      // concurrency guard would respond with 409 in a self-sustaining loop
      // (the BACKLOG #56 incident).
      if (!info.name || info.type !== 'change') return

      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        const valid = await trigger()
        if (!valid) return
        const values = getValues()
        lastFormPushedGeneralRef.current = applyGeneralFormToStore(values)
      }, FORM_SAVE_DEBOUNCE_MS)
    })

    return () => {
      subscription.unsubscribe()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [watch, trigger, getValues])

  return (
    <div className="studio-section-stack">
      <FormProvider {...methods}>
        <div className="studio-section-stack">{children}</div>
      </FormProvider>
    </div>
  )
}
