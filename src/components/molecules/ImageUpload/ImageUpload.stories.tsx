import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { ImageUpload } from './ImageUpload'

const meta: Meta<typeof ImageUpload> = {
  title: 'Molecules/ImageUpload',
  component: ImageUpload,
}

export default meta
type Story = StoryObj<typeof ImageUpload>

export const Empty: Story = {
  render: function Render() {
    const [v, setV] = useState<string | null>(null)
    return <ImageUpload value={v} onChange={setV} className="w-96" />
  },
}

export const VideoPlaceholder: Story = {
  render: function Render() {
    const [v, setV] = useState<string | null>(null)
    return <ImageUpload value={v} onChange={setV} accept="video/*" placeholder="Add video" className="w-96" />
  },
}

export const Aspects: Story = {
  render: function Render() {
    const [v, setV] = useState<string | null>(null)
    return (
      <div className="flex gap-4">
        <ImageUpload value={v} onChange={setV} aspect="16:9" className="w-48" />
        <ImageUpload value={v} onChange={setV} aspect="4:3" className="w-48" />
        <ImageUpload value={v} onChange={setV} aspect="1:1" className="w-48" />
      </div>
    )
  },
}

/** Wide parent: `cap` keeps previews from spanning the full viewport. */
export const CappedInWideColumn: Story = {
  render: function Render() {
    const [logo, setLogo] = useState<string | null>(null)
    const [avatar, setAvatar] = useState<string | null>(null)
    const [banner, setBanner] = useState<string | null>(null)
    return (
      <div className="w-full max-w-6xl space-y-6 border border-dashed border-border p-6">
        <ImageUpload value={logo} onChange={setLogo} aspect="1:1" cap="logo" placeholder="Logo" />
        <ImageUpload value={avatar} onChange={setAvatar} aspect="1:1" cap="avatar" placeholder="Portrait" />
        <ImageUpload value={banner} onChange={setBanner} aspect="16:9" cap="banner" placeholder="Banner" />
      </div>
    )
  },
}
