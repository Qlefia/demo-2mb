import type { Meta, StoryObj } from '@storybook/nextjs'
import { Label } from './Label'

const meta: Meta<typeof Label> = {
  title: 'Atoms/Label',
  component: Label,
  argTypes: {
    required: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Label>

export const Default: Story = {
  args: { children: 'Email address' },
}

export const Required: Story = {
  args: { children: 'Email address', required: true },
}
