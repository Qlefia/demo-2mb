import type { Meta, StoryObj } from '@storybook/nextjs'
import { DropdownMenu } from './DropdownMenu'
import { Button, IconButton } from '@/components/atoms'
import { MoreVertical, Trash2, Edit, Copy } from 'lucide-react'

const meta: Meta<typeof DropdownMenu> = {
  title: 'Molecules/DropdownMenu',
  component: DropdownMenu,
}

export default meta
type Story = StoryObj<typeof DropdownMenu>

export const Default: Story = {
  render: () => (
    <DropdownMenu
      trigger={<IconButton icon={MoreVertical} label="Options" variant="secondary" />}
      items={[
        { label: 'Edit', icon: Edit, onClick: () => {} },
        { label: 'Duplicate', icon: Copy, onClick: () => {} },
        { separator: true },
        { label: 'Delete', icon: Trash2, onClick: () => {}, variant: 'destructive' },
      ]}
    />
  ),
}

export const WithSeparator: Story = {
  render: () => (
    <DropdownMenu
      trigger={<Button variant="secondary">Open menu</Button>}
      items={[
        { label: 'Item 1', onClick: () => {} },
        { label: 'Item 2', onClick: () => {} },
        { separator: true },
        { label: 'Item 3', onClick: () => {} },
      ]}
      align="left"
    />
  ),
}

export const WithDisabledItem: Story = {
  render: () => (
    <DropdownMenu
      trigger={<Button variant="secondary">Open</Button>}
      items={[
        { label: 'Enabled', onClick: () => {} },
        { label: 'Disabled', onClick: () => {}, disabled: true },
      ]}
    />
  ),
}
