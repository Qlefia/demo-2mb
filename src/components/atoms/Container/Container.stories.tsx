import type { Meta, StoryObj } from '@storybook/nextjs'
import { Container } from './Container'

const meta: Meta<typeof Container> = {
  title: 'Atoms/Container',
  component: Container,
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof Container>

export const Default: Story = {
  render: () => (
    <Container>
      <div className="border border-dashed border-muted bg-primary/5 p-6">
        <p className="text-sm text-muted">
          This content is inside the Container. Max-width: var(--page-max-width), padding: var(--page-padding).
        </p>
      </div>
    </Container>
  ),
}

export const WithContent: Story = {
  render: () => (
    <Container>
      <div className="flex flex-col gap-6 py-8">
        <h1 className="text-2xl font-semibold">Page Title</h1>
        <p className="text-sm text-muted">
          This demonstrates a typical page layout inside the Container component.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-sm border border-border p-4">
              <p className="text-sm">Card {i}</p>
            </div>
          ))}
        </div>
      </div>
    </Container>
  ),
}
