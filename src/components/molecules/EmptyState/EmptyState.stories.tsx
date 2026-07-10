import type { Meta, StoryObj } from '@storybook/nextjs'
import { EmptyState } from './EmptyState'
import { Button } from '../../atoms/Button'
import { FileText, BarChart3 } from 'lucide-react'

const meta: Meta<typeof EmptyState> = {
  title: 'Molecules/EmptyState',
  component: EmptyState,
}

export default meta
type Story = StoryObj<typeof EmptyState>

export const Default: Story = {
  args: {
    icon: FileText,
    title: 'No surveys yet',
    description: 'Create your first survey to get started.',
  },
}

export const WithAction: Story = {
  render: () => (
    <EmptyState
      icon={FileText}
      title="No surveys yet"
      description="Create your first survey to get started."
      action={<Button>Create Survey</Button>}
    />
  ),
}

export const NoResults: Story = {
  args: {
    icon: BarChart3,
    title: 'No responses',
    description: 'Share your survey to start collecting responses.',
  },
}
