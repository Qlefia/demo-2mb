import type { Meta, StoryObj } from '@storybook/nextjs'
import { DashedAddButton } from './DashedAddButton'

const meta: Meta<typeof DashedAddButton> = {
  title: 'Molecules/DashedAddButton',
  component: DashedAddButton,
}

export default meta
type Story = StoryObj<typeof DashedAddButton>

export const Default: Story = {
  args: {
    onClick: () => {},
    children: 'Add item',
  },
}

export const AddStage: Story = {
  args: {
    onClick: () => {},
    children: 'Add stage',
  },
}
