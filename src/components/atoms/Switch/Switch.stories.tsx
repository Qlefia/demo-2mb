import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { Switch } from './Switch'

const meta: Meta<typeof Switch> = {
  title: 'Atoms/Switch',
  component: Switch,
}

export default meta
type Story = StoryObj<typeof Switch>

export const Default: Story = {
  render: () => {
    const [enabled, setEnabled] = useState(false)
    return <Switch checked={enabled} onChange={setEnabled} label="Enable notifications" />
  },
}

export const Checked: Story = {
  render: () => {
    const [enabled, setEnabled] = useState(true)
    return <Switch checked={enabled} onChange={setEnabled} label="Dark mode" />
  },
}

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Switch checked={false} onChange={() => {}} disabled label="Disabled off" />
      <Switch checked={true} onChange={() => {}} disabled label="Disabled on" />
    </div>
  ),
}
