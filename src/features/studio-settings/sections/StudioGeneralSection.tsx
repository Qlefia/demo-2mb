'use client'

import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react'
import { Label } from '@/components/atoms'
import { Select } from '@/components/molecules/Select'
import type { GeneralForm } from '@/features/studio-settings/sections/studioGeneralForm'
import { StudioOfficesHubSection } from '@/features/studio-settings/sections/StudioOfficesHubSection'
import { StudioGeneralLegalFields } from '@/features/studio-settings/sections/StudioGeneralLegalFields'
import { StudioGeneralFormShell } from '@/features/studio-settings/sections/StudioGeneralFormShell'
import {
  STUDIO_DISPLAY_CURRENCIES,
  STUDIO_PROPOSAL_DEFAULT_LOCALES,
  STUDIO_TIMEZONES,
} from '@/features/studio-settings/lib/studioGlobalDefaultsOptions'
import { studioFieldStack } from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'
import {
  tabListSectionNavClass,
  tabTriggerSectionClass,
} from '@/components/molecules/Tabs/tabListStyles'
import { StudioSettingsMainPane } from '@/features/studio-settings/components/StudioSettingsMainPane'
import {
  studioSettingsContentGutter,
  studioSettingsListScroll,
  studioSettingsPinnedHeader,
} from '@/features/studio-settings/studioBlockChrome'

function StudioGeneralInfoFields() {
  const { t } = useTranslation()
  const {
    control,
    formState: { errors },
  } = useFormContext<GeneralForm>()

  const localeSelectOptions = useMemo(
    () =>
      STUDIO_PROPOSAL_DEFAULT_LOCALES.map((value) => ({
        value,
        label: t(`studioSettings.general.localeOption.${value}`),
      })),
    [t],
  )

  const currencySelectOptions = useMemo(
    () => STUDIO_DISPLAY_CURRENCIES.map((value) => ({ value, label: value })),
    [],
  )

  const timezoneSelectOptions = useMemo(
    () => STUDIO_TIMEZONES.map((value) => ({ value, label: value })),
    [],
  )

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className={studioFieldStack}>
        <Label>{t('studioSettings.general.defaultProposalLocaleLabel')}</Label>
        <Controller
          name="defaultProposalLocale"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onChange={field.onChange}
              options={localeSelectOptions}
              placeholder={t('studioSettings.general.defaultProposalLocaleLabel')}
            />
          )}
        />
        <p className="text-xs text-muted">{t('studioSettings.general.defaultProposalLocaleHint')}</p>
        {errors.defaultProposalLocale ? (
          <p className="text-xs text-destructive">{errors.defaultProposalLocale.message}</p>
        ) : null}
      </div>
      <div className={studioFieldStack}>
        <Label>{t('studioSettings.general.displayCurrencyLabel')}</Label>
        <Controller
          name="displayCurrency"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onChange={field.onChange}
              options={currencySelectOptions}
              placeholder={t('studioSettings.general.displayCurrencyLabel')}
            />
          )}
        />
        <p className="text-xs text-muted">{t('studioSettings.general.displayCurrencyHint')}</p>
        {errors.displayCurrency ? (
          <p className="text-xs text-destructive">{errors.displayCurrency.message}</p>
        ) : null}
      </div>
      <div className={cn(studioFieldStack, 'sm:col-span-2')}>
        <Label>{t('studioSettings.general.studioTimezoneLabel')}</Label>
        <Controller
          name="studioTimezone"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onChange={field.onChange}
              options={timezoneSelectOptions}
              placeholder={t('studioSettings.general.studioTimezoneLabel')}
            />
          )}
        />
        <p className="text-xs text-muted">{t('studioSettings.general.studioTimezoneHint')}</p>
        {errors.studioTimezone ? (
          <p className="text-xs text-destructive">{errors.studioTimezone.message}</p>
        ) : null}
      </div>
    </div>
  )
}

function StudioGeneralTabs() {
  const { t } = useTranslation()
  const tabClass = cn(tabTriggerSectionClass, 'shrink-0 whitespace-nowrap')

  return (
    <TabGroup className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <nav aria-label={t('studioSettings.general.tabsNavAria')} className={studioSettingsPinnedHeader}>
        <TabList className={tabListSectionNavClass}>
          <Tab className={tabClass}>{t('studioSettings.general.tabs.generalInfo')}</Tab>
          <Tab className={tabClass}>{t('studioSettings.general.tabs.offices')}</Tab>
          <Tab className={tabClass}>{t('studioSettings.general.tabs.legal')}</Tab>
        </TabList>
      </nav>

      <div className={cn(studioSettingsListScroll, studioSettingsContentGutter, 'pt-4')}>
        <StudioGeneralFormShell>
          <TabPanels>
            <TabPanel className="space-y-3 outline-none">
              <StudioGeneralInfoFields />
            </TabPanel>
            <TabPanel className="outline-none">
              <StudioOfficesHubSection />
            </TabPanel>
            <TabPanel className="outline-none">
              <StudioGeneralLegalFields />
            </TabPanel>
          </TabPanels>
        </StudioGeneralFormShell>
      </div>
    </TabGroup>
  )
}

export function StudioGeneralSection() {
  return (
    <StudioSettingsMainPane variant="builder">
      <StudioGeneralTabs />
    </StudioSettingsMainPane>
  )
}
