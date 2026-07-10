import type { Meta, StoryObj } from '@storybook/nextjs'
import { ThemeToggle } from './ThemeToggle'

const meta: Meta<typeof ThemeToggle> = {
  title: 'Molecules/ThemeToggle',
  component: ThemeToggle,
}

export default meta
type Story = StoryObj<typeof ThemeToggle>

export const Default: Story = {
  render: () => <ThemeToggle />,
}
