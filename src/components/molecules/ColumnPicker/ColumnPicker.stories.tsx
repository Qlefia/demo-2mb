import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { ColumnPicker } from './ColumnPicker'

const meta: Meta<typeof ColumnPicker> = {
  title: 'Molecules/ColumnPicker',
  component: ColumnPicker,
}

export default meta
type Story = StoryObj<typeof ColumnPicker>

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
  { key: 'date', label: 'Date' },
]

function ColumnPickerWrapper() {
  const [visible, setVisible] = useState(['name', 'email', 'status'])
  return (
    <ColumnPicker
      columns={COLUMNS}
      visible={visible}
      onChange={setVisible}
    />
  )
}

export const Default: Story = {
  render: () => <ColumnPickerWrapper />,
}
