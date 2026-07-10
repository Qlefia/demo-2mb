import type { Meta, StoryObj } from '@storybook/nextjs'
import { ToastContainer, toast } from './Toast'

const meta: Meta = {
  title: 'Molecules/Toast',
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj

export const Demo: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-2">
        <ToastContainer />
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded bg-success px-3 py-1.5 text-sm text-white"
            onClick={() => toast('Success message', 'success')}
          >
            Success
          </button>
          <button
            type="button"
            className="rounded bg-destructive px-3 py-1.5 text-sm text-white"
            onClick={() => toast('Error message', 'error')}
          >
            Error
          </button>
          <button
            type="button"
            className="rounded bg-info px-3 py-1.5 text-sm text-white"
            onClick={() => toast('Info message', 'info')}
          >
            Info
          </button>
        </div>
      </div>
    )
  },
}
