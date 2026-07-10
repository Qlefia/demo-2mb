import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from './Button'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'destructive'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: { variant: 'primary', children: 'Button' },
}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Button' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Button' },
}

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete' },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="primary" disabled>Disabled</Button>
        <Button variant="secondary" disabled>Disabled</Button>
        <Button variant="ghost" disabled>Disabled</Button>
        <Button variant="destructive" disabled>Disabled</Button>
      </div>
    </div>
  ),
}

export const Loading: Story = {
  args: { loading: true, children: 'Saving...' },
}

export const WithIcon: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button><Plus size={16} /> Create</Button>
      <Button variant="destructive"><Trash2 size={16} /> Delete</Button>
    </div>
  ),
}

function LocaleDemoInner() {
  const { t, i18n } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">Switch language to see i18n:</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          onClick={() => i18n.changeLanguage('en')}
        >
          EN
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          onClick={() => i18n.changeLanguage('de')}
        >
          DE
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs"
          onClick={() => i18n.changeLanguage('ru')}
        >
          RU
        </button>
      </div>
      <div className="flex gap-2">
        <Button>{t('common.save')}</Button>
        <Button variant="secondary">{t('common.cancel')}</Button>
        <Button variant="destructive">{t('common.delete')}</Button>
      </div>
    </div>
  )
}

export const LocaleDemo: Story = {
  render: () => <LocaleDemoInner />,
}
