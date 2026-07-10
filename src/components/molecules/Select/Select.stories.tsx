import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { Select } from './Select'
import { Label } from '../../atoms/Label'

const options = [
  { value: 'text', label: 'Text Input' },
  { value: 'choice', label: 'Multiple Choice' },
  { value: 'rating', label: 'Rating Scale' },
  { value: 'nps', label: 'NPS Score' },
]

const meta: Meta<typeof Select> = {
  title: 'Molecules/Select',
  component: Select,
}

export default meta
type Story = StoryObj<typeof Select>

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('')
    return (
      <div className="w-64">
        <Select value={value} onChange={setValue} options={options} />
      </div>
    )
  },
}

export const WithLabel: Story = {
  render: () => {
    const [value, setValue] = useState('')
    return (
      <div className="flex w-64 flex-col gap-1.5">
        <Label>Question type</Label>
        <Select value={value} onChange={setValue} options={options} placeholder="Choose type..." />
      </div>
    )
  },
}

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState('rating')
    return (
      <div className="w-64">
        <Select value={value} onChange={setValue} options={options} />
      </div>
    )
  },
}

export const Disabled: Story = {
  render: () => (
    <div className="w-64">
      <Select value="text" onChange={() => {}} options={options} disabled />
    </div>
  ),
}
