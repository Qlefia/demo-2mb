import type { Meta, StoryObj } from '@storybook/nextjs'
import { TextArea } from './TextArea'
import { Label } from '../Label'

const meta: Meta<typeof TextArea> = {
  title: 'Atoms/TextArea',
  component: TextArea,
  argTypes: {
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
    rows: { control: 'number' },
  },
}

export default meta
type Story = StoryObj<typeof TextArea>

export const Default: Story = {
  args: { placeholder: 'Write your message...' },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-1.5">
      <Label htmlFor="msg">Message</Label>
      <TextArea id="msg" placeholder="Write your message..." />
    </div>
  ),
}

export const WithError: Story = {
  args: {
    defaultValue: 'Too short',
    error: 'Message must be at least 20 characters.',
  },
}

export const Disabled: Story = {
  args: { placeholder: 'Cannot edit', disabled: true },
}
