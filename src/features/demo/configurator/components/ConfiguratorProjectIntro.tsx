'use client'

import type { DemoProject } from '../types'

type ConfiguratorProjectIntroProps = {
  project: DemoProject
}

export function ConfiguratorProjectIntro({ project }: ConfiguratorProjectIntroProps) {
  return (
    <header className="shrink-0 space-y-2">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">{project.title}</h1>

      <p className="text-xs leading-relaxed text-muted-foreground">{project.description}</p>
    </header>
  )
}
