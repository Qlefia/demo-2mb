import type { Meta, StoryObj } from '@storybook/nextjs'
import { Popover } from './Popover'
import { Button } from '../../atoms/Button'

const meta: Meta<typeof Popover> = {
  title: 'Molecules/Popover',
  component: Popover,
}

export default meta
type Story = StoryObj<typeof Popover>

export const Default: Story = {
  render: () => (
    <Popover trigger={<Button variant="secondary">Share survey</Button>}>
      <div className="flex w-56 flex-col gap-3">
        <p className="text-sm font-medium">Share options</p>
        <div className="flex flex-col gap-2">
          <button className="text-left text-sm text-muted hover:text-foreground">Copy link</button>
          <button className="text-left text-sm text-muted hover:text-foreground">Embed on website</button>
          <button className="text-left text-sm text-muted hover:text-foreground">Share via email</button>
        </div>
      </div>
    </Popover>
  ),
}
