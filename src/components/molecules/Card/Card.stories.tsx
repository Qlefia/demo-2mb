import type { Meta, StoryObj } from '@storybook/nextjs'
import { Card } from './Card'
import { Badge } from '../../atoms/Badge'

const meta: Meta<typeof Card> = {
  title: 'Molecules/Card',
  component: Card,
  argTypes: {
    padding: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  args: {
    children: <p className="text-sm">Card content</p>,
  },
}

export const Paddings: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Card padding="sm"><p className="text-sm">Small padding (p-3)</p></Card>
      <Card padding="md"><p className="text-sm">Medium padding (p-4)</p></Card>
      <Card padding="lg"><p className="text-sm">Large padding (p-6)</p></Card>
    </div>
  ),
}

export const SurveyCard: Story = {
  render: () => (
    <Card padding="lg" className="w-80">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium">Customer Feedback</h3>
          <Badge variant="success">Published</Badge>
        </div>
        <p className="text-sm text-muted">142 responses</p>
        <p className="text-xs text-muted">Created Feb 15, 2026</p>
      </div>
    </Card>
  ),
}
