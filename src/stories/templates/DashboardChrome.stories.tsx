import type { Meta, StoryObj } from '@storybook/nextjs'
import { useEffect, type ReactNode } from 'react'
import { TopNavTabs } from '@/components/organisms/TopNavTabs/TopNavTabs'
import { Container } from '@/components/atoms'
import { seedUserStoreForStorybook } from './seedUserStoreForStorybook'

function Seed({ children }: { children: ReactNode }) {
  useEffect(() => {
    seedUserStoreForStorybook()
  }, [])
  return children
}

const meta = {
  title: 'Templates/DashboardChrome',
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
      },
    },
    docs: {
      description: {
        component: 'Chrome for audit mockups. Header + brand + top nav.',
      },
    },
  },
  decorators: [
    (Story) => (
      <Seed>
        <Story />
      </Seed>
    ),
  ],
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

export const HeaderAndNav: Story = {
  render: () => (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold tracking-tight">2mb</span>
          <div className="h-5 w-px bg-border" />
          <TopNavTabs />
        </div>
      </header>
      <main>
        <Container className="py-10">
          <p className="text-sm text-muted">Replace this area with page-level mock content.</p>
        </Container>
      </main>
    </div>
  ),
}
