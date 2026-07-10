import type { Meta, StoryObj } from '@storybook/nextjs'
import { Avatar } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Atoms/Avatar',
  component: Avatar,
}

export default meta
type Story = StoryObj<typeof Avatar>

export const Initials: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar initials="AB" size="xs" />
      <Avatar initials="AB" size="sm" />
      <Avatar initials="AB" size="md" />
      <Avatar initials="AB" size="lg" />
    </div>
  ),
}

export const Emoji: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar emoji="😊" size="sm" />
      <Avatar emoji="😔" size="md" />
      <Avatar emoji="🎯" size="lg" />
    </div>
  ),
}

export const Shapes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar initials="AB" shape="circle" />
      <Avatar initials="AB" shape="square" />
      <Avatar emoji="😊" shape="circle" />
      <Avatar emoji="😊" shape="square" />
    </div>
  ),
}

export const Placeholder: Story = {
  render: () => <Avatar />,
}
