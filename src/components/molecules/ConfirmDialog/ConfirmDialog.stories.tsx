import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'
import { Button } from '@/components/atoms'

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Molecules/ConfirmDialog',
  component: ConfirmDialog,
}

export default meta
type Story = StoryObj<typeof ConfirmDialog>

function ConfirmDialogWrapper({ variant = 'default' }: { variant?: 'default' | 'destructive' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        title="Confirm action"
        message="Are you sure you want to proceed? This action cannot be undone."
        variant={variant}
      />
    </>
  )
}

export const Default: Story = {
  render: () => <ConfirmDialogWrapper />,
}

export const Destructive: Story = {
  render: () => <ConfirmDialogWrapper variant="destructive" />,
}

export const Loading: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open</Button>
        <ConfirmDialog
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => {}}
          title="Deleting..."
          message="Please wait while we process your request."
          loading
        />
      </>
    )
  },
}
