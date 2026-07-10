import type { Meta, StoryObj } from '@storybook/nextjs'
import { Sidebar } from './Sidebar'
import { FileText, BarChart3, Settings, Bell, User } from 'lucide-react'

const meta: Meta<typeof Sidebar> = {
  title: 'Organisms/Sidebar',
  component: Sidebar,
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof Sidebar>

export const Default: Story = {
  render: () => (
    <div className="h-80">
      <Sidebar
        header="2mb CRM"
        items={[
          { icon: FileText, label: 'Prospects', href: '/prospects', active: true },
          { icon: BarChart3, label: 'Analytics', href: '/analytics' },
          { icon: Bell, label: 'Notifications', href: '/notifications' },
          { icon: User, label: 'Profile', href: '/profile' },
          { icon: Settings, label: 'Settings', href: '/settings' },
        ]}
      />
    </div>
  ),
}
