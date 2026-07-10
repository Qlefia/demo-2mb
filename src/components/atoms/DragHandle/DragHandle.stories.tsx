import type { Meta, StoryObj } from '@storybook/nextjs'
import { DragHandle } from './DragHandle'

const meta: Meta<typeof DragHandle> = {
  title: 'Atoms/DragHandle',
  component: DragHandle,
}

export default meta
type Story = StoryObj<typeof DragHandle>

export const Default: Story = {
  render: () => <DragHandle />,
}

export const InContext: Story = {
  render: () => (
    <div className="flex w-64 flex-col gap-1">
      {['Item 1', 'Item 2', 'Item 3'].map((item) => (
        <div key={item} className="flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-sm">
          <DragHandle />
          <span>{item}</span>
        </div>
      ))}
    </div>
  ),
}
