import type { Meta, StoryObj } from '@storybook/nextjs'
import { Progress } from './Progress'

const meta: Meta<typeof Progress> = {
  title: 'Molecules/Progress',
  component: Progress,
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 } },
    showValue: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Progress>

export const Default: Story = {
  args: { value: 40 },
}

export const WithLabel: Story = {
  args: { value: 3, max: 7, label: 'Step 3 of 7', showValue: true },
}

export const Steps: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <Progress value={0} max={5} label="Not started" showValue />
      <Progress value={2} max={5} label="In progress" showValue />
      <Progress value={5} max={5} label="Complete" showValue />
    </div>
  ),
}
