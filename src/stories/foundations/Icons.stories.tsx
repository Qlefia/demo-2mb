import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  Search,
  Plus,
  Trash2,
  Settings,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  X,
  Check,
  Copy,
  ExternalLink,
  Download,
  Upload,
  Eye,
  EyeOff,
  Bell,
  User,
  LogOut,
  Menu,
  MoreHorizontal,
  Edit,
  GripVertical,
  Play,
  BarChart3,
  FileText,
  Link,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const icons: { name: string; icon: LucideIcon; category: string }[] = [
  { name: 'Search', icon: Search, category: 'Actions' },
  { name: 'Plus', icon: Plus, category: 'Actions' },
  { name: 'Trash2', icon: Trash2, category: 'Actions' },
  { name: 'Edit', icon: Edit, category: 'Actions' },
  { name: 'Copy', icon: Copy, category: 'Actions' },
  { name: 'Download', icon: Download, category: 'Actions' },
  { name: 'Upload', icon: Upload, category: 'Actions' },
  { name: 'ExternalLink', icon: ExternalLink, category: 'Actions' },
  { name: 'Link', icon: Link, category: 'Actions' },
  { name: 'Play', icon: Play, category: 'Actions' },

  { name: 'ChevronRight', icon: ChevronRight, category: 'Navigation' },
  { name: 'ChevronLeft', icon: ChevronLeft, category: 'Navigation' },
  { name: 'ChevronDown', icon: ChevronDown, category: 'Navigation' },
  { name: 'X', icon: X, category: 'Navigation' },
  { name: 'Menu', icon: Menu, category: 'Navigation' },
  { name: 'MoreHorizontal', icon: MoreHorizontal, category: 'Navigation' },

  { name: 'Eye', icon: Eye, category: 'State' },
  { name: 'EyeOff', icon: EyeOff, category: 'State' },
  { name: 'Check', icon: Check, category: 'State' },
  { name: 'GripVertical', icon: GripVertical, category: 'State' },

  { name: 'Settings', icon: Settings, category: 'App' },
  { name: 'Bell', icon: Bell, category: 'App' },
  { name: 'User', icon: User, category: 'App' },
  { name: 'LogOut', icon: LogOut, category: 'App' },
  { name: 'BarChart3', icon: BarChart3, category: 'App' },
  { name: 'FileText', icon: FileText, category: 'App' },

  { name: 'AlertCircle', icon: AlertCircle, category: 'Feedback' },
  { name: 'Info', icon: Info, category: 'Feedback' },
  { name: 'CheckCircle', icon: CheckCircle, category: 'Feedback' },
  { name: 'AlertTriangle', icon: AlertTriangle, category: 'Feedback' },
]

function IconGrid({ title, items }: { title: string; items: typeof icons }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <div className="grid grid-cols-5 gap-4">
        {items.map(({ name, icon: Icon }) => (
          <div key={name} className="flex flex-col items-center gap-2 p-3">
            <Icon size={20} strokeWidth={1.5} />
            <span className="text-xs text-muted">{name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function IconsPage() {
  const categories = [...new Set(icons.map((i) => i.category))]

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <section>
        <h2 className="mb-1 text-lg font-semibold">Icons</h2>
        <p className="mb-6 text-sm text-muted">
          Lucide React icons. Default size: 20px, strokeWidth: 1.5.
          Never use inline SVGs or other icon libraries.
        </p>

        <div className="flex flex-col gap-8">
          {categories.map((cat) => (
            <IconGrid key={cat} title={cat} items={icons.filter((i) => i.category === cat)} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Sizes</h2>
        <p className="mb-4 text-sm text-muted">Common icon sizes used in the design system.</p>
        <div className="flex items-end gap-6">
          {[16, 20, 24].map((size) => (
            <div key={size} className="flex flex-col items-center gap-2">
              <Settings size={size} strokeWidth={1.5} />
              <span className="text-xs text-muted">{size}px</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const meta: Meta = {
  title: 'Foundations/Icons',
  parameters: { layout: 'padded' },
}

export default meta

type Story = StoryObj

export const Gallery: Story = {
  render: () => <IconsPage />,
}
