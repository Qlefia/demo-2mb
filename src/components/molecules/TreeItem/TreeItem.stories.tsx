import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { TreeItem } from './TreeItem'

const meta: Meta<typeof TreeItem> = {
  title: 'Molecules/TreeItem',
  component: TreeItem,
}

export default meta
type Story = StoryObj<typeof TreeItem>

export const Default: Story = {
  render: () => (
    <div className="w-56">
      <TreeItem label="Step 1" count={34} />
    </div>
  ),
}

export const Active: Story = {
  render: () => (
    <div className="w-56">
      <TreeItem label="Step 1" count={34} />
      <TreeItem label="Step 2 (Categories)" count={24} active />
      <TreeItem label="Step 3 (Subcategories)" count={24} />
    </div>
  ),
}

export const Nested: Story = {
  render: () => (
    <div className="w-56">
      <TreeItem label="Stage 1" hasChildren depth={0} />
      <TreeItem label="Step 1" count={34} depth={1} />
      <TreeItem label="Step 2 (Categories)" count={24} depth={1} active />
      <TreeItem label="Step 3" count={24} depth={1} />
      <TreeItem label="Stage 2" hasChildren depth={0} />
      <TreeItem label="Step 4 (Body)" count={24} depth={1} />
      <TreeItem label="Step 5 (Body)" count={24} depth={1} />
    </div>
  ),
}

export const Collapsible: Story = {
  render: function Render() {
    const [open, setOpen] = useState(true)
    return (
      <div className="w-56">
        <TreeItem label="Stage 1" hasChildren collapsed={!open} onToggle={() => setOpen(!open)} depth={0} />
        {open && (
          <>
            <TreeItem label="Step 1" count={34} depth={1} />
            <TreeItem label="Step 2" count={24} depth={1} />
          </>
        )}
      </div>
    )
  },
}
