import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from '../../atoms/Button'

const meta: Meta<typeof Modal> = {
  title: 'Molecules/Modal',
  component: Modal,
}

export default meta
type Story = StoryObj<typeof Modal>

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal open={open} onClose={() => setOpen(false)} title="Confirm action">
          <p className="text-sm text-muted">Are you sure you want to delete this survey? This action cannot be undone.</p>
        </Modal>
      </>
    )
  },
}

export const WithFooter: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <>
        <Button onClick={() => setOpen(true)}>Delete Survey</Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Delete survey"
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => setOpen(false)}>Delete</Button>
            </>
          }
        >
          <p className="text-sm text-muted">
            This will permanently delete "Customer Feedback" and all its responses. This action cannot be undone.
          </p>
        </Modal>
      </>
    )
  },
}
