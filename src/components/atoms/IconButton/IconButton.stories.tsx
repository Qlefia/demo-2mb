import type { Meta, StoryObj } from '@storybook/nextjs'
import { IconButton } from './IconButton'
import { X, Trash2, Settings, GripVertical, Plus, ChevronDown, Filter } from 'lucide-react'

const meta: Meta<typeof IconButton> = {
  title: 'Atoms/IconButton',
  component: IconButton,
}

export default meta
type Story = StoryObj<typeof IconButton>

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <IconButton icon={X} size="xs" label="Close" />
      <IconButton icon={X} size="sm" label="Close" />
      <IconButton icon={X} size="md" label="Close" />
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <IconButton icon={Settings} variant="primary" label="Settings" />
      <IconButton icon={Settings} variant="secondary" label="Settings" />
      <IconButton icon={Settings} variant="ghost" label="Settings" />
      <IconButton icon={Trash2} variant="destructive" label="Delete" />
    </div>
  ),
}

export const AllIcons: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <IconButton icon={X} label="Close" />
      <IconButton icon={Trash2} label="Delete" />
      <IconButton icon={Settings} label="Settings" />
      <IconButton icon={GripVertical} label="Drag" />
      <IconButton icon={Plus} label="Add" />
      <IconButton icon={ChevronDown} label="Expand" />
    </div>
  ),
}

export const WithBadge: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <IconButton icon={Filter} label="Filter (active)" hasBadge />
      <IconButton icon={Settings} label="Settings (active)" hasBadge />
      <IconButton icon={X} label="Close (no badge)" />
    </div>
  ),
}
