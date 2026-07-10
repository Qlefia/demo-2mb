import type { Meta, StoryObj } from '@storybook/nextjs'
import { Badge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  argTypes: {
    variant: { control: 'select', options: ['default', 'success', 'warning', 'error', 'info'] },
    size: { control: 'select', options: ['sm', 'md'] },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {
  args: { children: 'Draft' },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge variant="default">Draft</Badge>
      <Badge variant="success">Published</Badge>
      <Badge variant="warning">Paused</Badge>
      <Badge variant="error">Expired</Badge>
      <Badge variant="info">Processing</Badge>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
    </div>
  ),
}
