import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { RadioGroup } from './RadioGroup'

const options = [
  { value: 'email', label: 'Email at start' },
  { value: 'email-end', label: 'Email at end' },
  { value: 'anonymous', label: 'Anonymous' },
]

const meta: Meta<typeof RadioGroup> = {
  title: 'Molecules/RadioGroup',
  component: RadioGroup,
}

export default meta
type Story = StoryObj<typeof RadioGroup>

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('email')
    return <RadioGroup value={value} onChange={setValue} options={options} />
  },
}

export const Disabled: Story = {
  render: () => (
    <RadioGroup value="email" onChange={() => {}} options={options} disabled />
  ),
}
