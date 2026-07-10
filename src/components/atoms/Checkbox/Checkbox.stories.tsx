import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { Checkbox } from './Checkbox'

const meta: Meta<typeof Checkbox> = {
  title: 'Atoms/Checkbox',
  component: Checkbox,
}

export default meta
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {
  render: () => {
    const [checked, setChecked] = useState(false)
    return <Checkbox checked={checked} onChange={setChecked} label="Accept terms and conditions" />
  },
}

export const Checked: Story = {
  render: () => {
    const [checked, setChecked] = useState(true)
    return <Checkbox checked={checked} onChange={setChecked} label="Receive notifications" />
  },
}

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Checkbox checked={false} onChange={() => {}} disabled label="Disabled unchecked" />
      <Checkbox checked={true} onChange={() => {}} disabled label="Disabled checked" />
    </div>
  ),
}

export const Group: Story = {
  render: () => {
    const [values, setValues] = useState({ a: false, b: true, c: false })
    return (
      <div className="flex flex-col gap-3">
        <Checkbox checked={values.a} onChange={(v) => setValues({ ...values, a: v })} label="Option A" />
        <Checkbox checked={values.b} onChange={(v) => setValues({ ...values, b: v })} label="Option B" />
        <Checkbox checked={values.c} onChange={(v) => setValues({ ...values, c: v })} label="Option C" />
      </div>
    )
  },
}
