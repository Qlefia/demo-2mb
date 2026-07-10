import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { Slider } from './Slider'

const meta: Meta<typeof Slider> = {
  title: 'Atoms/Slider',
  component: Slider,
}

export default meta
type Story = StoryObj<typeof Slider>

export const Continuous: Story = {
  render: function Render() {
    const [v, setV] = useState(3)
    return (
      <div className="w-80">
        <Slider value={v} onChange={setV} min={0} max={10} />
        <p className="mt-2 text-sm text-muted">Value: {v}</p>
      </div>
    )
  },
}

export const Discrete: Story = {
  render: function Render() {
    const [v, setV] = useState(2)
    return (
      <div className="w-80">
        <Slider value={v} onChange={setV} min={0} max={5} step={1} discrete />
        <p className="mt-2 text-sm text-muted">Value: {v} / 5</p>
      </div>
    )
  },
}

export const WithEmojis: Story = {
  render: function Render() {
    const [v, setV] = useState(1)
    return (
      <div className="w-96">
        <Slider
          value={v}
          onChange={setV}
          min={0}
          max={5}
          step={1}
          discrete
          leftIcon={<span>😔</span>}
          rightIcon={<span>😊</span>}
        />
        <p className="mt-3 text-center text-sm font-medium">Your rating: {v} / 5</p>
      </div>
    )
  },
}
