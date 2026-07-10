import type { Meta, StoryObj } from '@storybook/nextjs'
import { Chip } from './Chip'

const meta: Meta<typeof Chip> = {
  title: 'Atoms/Chip',
  component: Chip,
}

export default meta
type Story = StoryObj<typeof Chip>

export const Default: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Chip>Informational</Chip>
      <Chip>Multiselect</Chip>
      <Chip>Select</Chip>
    </div>
  ),
}

export const Active: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Chip variant="active">Informational</Chip>
      <Chip>Multiselect</Chip>
      <Chip>Select</Chip>
    </div>
  ),
}

export const Removable: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Chip onRemove={() => {}}>Tag 1</Chip>
      <Chip onRemove={() => {}}>Tag 2</Chip>
      <Chip variant="active" onRemove={() => {}}>Active</Chip>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Chip size="sm">Small</Chip>
      <Chip size="md">Medium</Chip>
    </div>
  ),
}
