import type { Meta, StoryObj } from '@storybook/nextjs'
import { Tooltip } from './Tooltip'
import { Button } from '../../atoms/Button'
import { Copy, Trash2 } from 'lucide-react'

const meta: Meta<typeof Tooltip> = {
  title: 'Molecules/Tooltip',
  component: Tooltip,
  argTypes: {
    content: { control: 'text' },
    position: { control: 'select', options: ['top', 'bottom'] },
  },
}

export default meta
type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  args: {
    content: 'Copy to clipboard',
    children: (
      <Button variant="ghost" size="sm">
        <Copy size={16} />
      </Button>
    ),
  },
}

export const Positions: Story = {
  render: () => (
    <div className="flex items-center gap-8 pt-10">
      <Tooltip content="Tooltip on top" position="top">
        <Button variant="secondary" size="sm">Top</Button>
      </Tooltip>
      <Tooltip content="Tooltip on bottom" position="bottom">
        <Button variant="secondary" size="sm">Bottom</Button>
      </Tooltip>
    </div>
  ),
}

export const OnIcons: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Tooltip content="Copy link">
        <button className="p-2 text-muted hover:text-foreground"><Copy size={18} /></button>
      </Tooltip>
      <Tooltip content="Delete survey">
        <button className="p-2 text-muted hover:text-destructive"><Trash2 size={18} /></button>
      </Tooltip>
    </div>
  ),
}
