import type { Meta, StoryObj } from '@storybook/nextjs'
import { Spinner } from './Spinner'

const meta: Meta<typeof Spinner> = {
  title: 'Atoms/Spinner',
  component: Spinner,
  argTypes: {
    size: { control: { type: 'range', min: 12, max: 48 } },
  },
}

export default meta
type Story = StoryObj<typeof Spinner>

export const Default: Story = {
  args: { size: 20 },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <Spinner size={16} />
        <span className="text-xs text-muted">16px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size={20} />
        <span className="text-xs text-muted">20px</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size={32} />
        <span className="text-xs text-muted">32px</span>
      </div>
    </div>
  ),
}

export const InContext: Story = {
  render: () => (
    <div className="flex h-40 w-60 items-center justify-center rounded-sm border border-border">
      <div className="flex flex-col items-center gap-2">
        <Spinner size={24} />
        <p className="text-xs text-muted">Loading…</p>
      </div>
    </div>
  ),
}
