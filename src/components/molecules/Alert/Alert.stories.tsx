import type { Meta, StoryObj } from '@storybook/nextjs'
import { Alert } from './Alert'

const meta: Meta<typeof Alert> = {
  title: 'Molecules/Alert',
  component: Alert,
  argTypes: {
    variant: { control: 'select', options: ['info', 'success', 'warning', 'error'] },
  },
}

export default meta
type Story = StoryObj<typeof Alert>

export const Info: Story = {
  args: { variant: 'info', children: 'Your survey has been saved as a draft.' },
}

export const Success: Story = {
  args: { variant: 'success', children: 'Survey published successfully.' },
}

export const Warning: Story = {
  args: { variant: 'warning', children: 'Your free plan allows up to 3 surveys.' },
}

export const Error: Story = {
  args: { variant: 'error', children: 'Failed to save. Please try again.' },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-4">
      <Alert variant="info">Informational message.</Alert>
      <Alert variant="success">Success message.</Alert>
      <Alert variant="warning">Warning message.</Alert>
      <Alert variant="error">Error message.</Alert>
    </div>
  ),
}
