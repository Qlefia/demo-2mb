import type { Meta, StoryObj } from '@storybook/nextjs'
import { Input } from './Input'
import { Label } from '../Label'

const meta: Meta<typeof Input> = {
  title: 'Atoms/Input',
  component: Input,
  argTypes: {
    disabled: { control: 'boolean' },
    error: { control: 'text' },
    hint: { control: 'text' },
    placeholder: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: { placeholder: 'Enter your email...' },
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-1.5">
      <Label htmlFor="email" required>Email address</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
}

export const WithHint: Story = {
  args: {
    placeholder: 'you@example.com',
    hint: 'We will never share your email.',
  },
}

export const WithError: Story = {
  args: {
    placeholder: 'you@example.com',
    defaultValue: 'invalid-email',
    error: 'Please enter a valid email address.',
  },
}

export const Disabled: Story = {
  args: { placeholder: 'Cannot edit', disabled: true },
}

export const AllStates: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Label>Default</Label>
        <Input placeholder="Default input" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>With hint</Label>
        <Input placeholder="With hint" hint="Helper text goes here" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Error</Label>
        <Input placeholder="Error state" defaultValue="bad" error="This field is required" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Disabled</Label>
        <Input placeholder="Disabled" disabled />
      </div>
    </div>
  ),
}
