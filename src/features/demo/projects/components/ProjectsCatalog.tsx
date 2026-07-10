'use client'

import { useMemo, useState } from 'react'
import { SearchInput } from '@/components/molecules/SearchInput'
import { Select } from '@/components/molecules/Select'
import { ViewModeToggle } from '@/components/molecules/ViewModeToggle'
import { cn } from '@/lib/cn'
import type { ResidentialProject, ProjectsViewMode } from '../types'
import { projectsCopy } from '../copy.en'
import { projectToolbarControlClass } from '../projectUi'
import { ResidentialGridCard } from './ResidentialGridCard'
import { ResidentialListCard } from './ResidentialListCard'

type ProjectsCatalogProps = {
  projects: ResidentialProject[]
  cities: string[]
  propertyTypes: string[]
  statuses: string[]
}

const GRID_CLASS = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'

const TYPE_LABEL: Record<string, string> = {
  residential_complex: projectsCopy.residentialComplex,
  townhouses: projectsCopy.townhouses,
  villas: projectsCopy.villas,
  apartments: projectsCopy.apartments,
  mixed_use: projectsCopy.mixedUse,
}

const STATUS_LABEL: Record<string, string> = {
  on_sale: projectsCopy.onSale,
  coming_soon: projectsCopy.comingSoon,
  last_units: projectsCopy.lastUnits,
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: { value: string; label: string }[]
  className?: string
}) {
  return (
    <div className={cn('min-w-0', projectToolbarControlClass, className)}>
      <Select value={value} onChange={onChange} placeholder={placeholder} options={options} />
    </div>
  )
}

export function ProjectsCatalog({ projects, cities, propertyTypes, statuses }: ProjectsCatalogProps) {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('all')
  const [propertyType, setPropertyType] = useState('all')
  const [status, setStatus] = useState('all')
  const [viewMode, setViewMode] = useState<ProjectsViewMode>('card')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((p) => {
      if (city !== 'all' && p.city !== city) return false
      if (propertyType !== 'all' && p.propertyType !== propertyType) return false
      if (status !== 'all' && p.status !== status) return false
      if (!q) return true
      const haystack = [
        p.title,
        p.subtitle,
        p.city,
        p.district,
        p.locationLabel,
        p.metroStation ?? '',
        p.propertyTypeLabel,
        ...p.amenityTags,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [projects, query, city, propertyType, status])

  const cityOptions = [
    { value: 'all', label: projectsCopy.allCities },
    ...cities.map((c) => ({ value: c, label: c })),
  ]
  const typeOptions = [
    { value: 'all', label: projectsCopy.allTypes },
    ...propertyTypes.map((t) => ({ value: t, label: TYPE_LABEL[t] ?? t })),
  ]
  const statusOptions = [
    { value: 'all', label: projectsCopy.allStatuses },
    ...statuses.map((s) => ({ value: s, label: STATUS_LABEL[s] ?? s })),
  ]

  return (
    <div className={GRID_CLASS}>
      <div className="min-w-0 sm:col-span-2 xl:col-span-2">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={projectsCopy.searchPlaceholder}
          className="w-full max-w-full"
        />
      </div>

      <div
        className={cn(
          'col-span-full grid grid-cols-2 gap-3 sm:col-span-2',
          'xl:col-span-2 xl:col-start-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-center xl:gap-4',
        )}
      >
        <FilterSelect
          value={city}
          onChange={setCity}
          placeholder={projectsCopy.filterCity}
          options={cityOptions}
        />
        <FilterSelect
          value={propertyType}
          onChange={setPropertyType}
          placeholder={projectsCopy.filterType}
          options={typeOptions}
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          placeholder={projectsCopy.filterStatus}
          options={statusOptions}
          className="col-span-2 xl:col-span-1"
        />
        <div className="flex h-9 items-center justify-end xl:col-auto xl:justify-start [&>div]:h-9 [&_button]:h-9">
          <ViewModeToggle
            mode={viewMode}
            onChange={(m) => setViewMode(m as ProjectsViewMode)}
            options={['list', 'card']}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
          {projectsCopy.noResults}
        </p>
      ) : viewMode === 'card' ? (
        filtered.map((project) => <ResidentialGridCard key={project.id} project={project} />)
      ) : (
        <div className="col-span-full flex flex-col gap-3">
          {filtered.map((project) => (
            <ResidentialListCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
