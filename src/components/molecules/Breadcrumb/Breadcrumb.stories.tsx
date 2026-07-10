import type { Meta, StoryObj } from '@storybook/nextjs'
import { Breadcrumb } from './Breadcrumb'

const meta: Meta<typeof Breadcrumb> = {
  title: 'Molecules/Breadcrumb',
  component: Breadcrumb,
}

export default meta
type Story = StoryObj<typeof Breadcrumb>

export const Default: Story = {
  args: {
    items: [
      { label: 'Dashboard', href: '/' },
      { label: 'Surveys', href: '/surveys' },
      { label: 'Customer Feedback' },
    ],
  },
}

export const TwoLevels: Story = {
  args: {
    items: [
      { label: 'Dashboard', href: '/' },
      { label: 'Settings' },
    ],
  },
}
