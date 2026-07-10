import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { SearchInput } from './SearchInput'

const meta: Meta<typeof SearchInput> = {
  title: 'Molecules/SearchInput',
  component: SearchInput,
}

export default meta
type Story = StoryObj<typeof SearchInput>

function SearchInputWrapper() {
  const [value, setValue] = useState('')
  return (
    <div className="w-64">
      <SearchInput value={value} onChange={setValue} placeholder="Search..." />
    </div>
  )
}

export const Default: Story = {
  render: () => <SearchInputWrapper />,
}

export const WithValue: Story = {
  render: () => {
    const [value, setValue] = useState('Hello')
    return (
      <div className="w-64">
        <SearchInput value={value} onChange={setValue} placeholder="Search..." />
      </div>
    )
  },
}
