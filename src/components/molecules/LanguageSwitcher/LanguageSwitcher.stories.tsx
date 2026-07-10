import type { Meta, StoryObj } from '@storybook/nextjs'
import { ThemeToggle } from '@/components/molecules/ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'

const meta: Meta<typeof LanguageSwitcher> = {
  title: 'Molecules/LanguageSwitcher',
  component: LanguageSwitcher,
}

export default meta
type Story = StoryObj<typeof LanguageSwitcher>

export const Default: Story = {
  render: () => <LanguageSwitcher />,
}

export const WithThemeToggle: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-8">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted">Theme</p>
        <ThemeToggle />
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted">Language</p>
        <LanguageSwitcher />
      </div>
    </div>
  ),
}
