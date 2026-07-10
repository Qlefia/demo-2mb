import type { Meta, StoryObj } from '@storybook/nextjs'

function LayoutPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <section>
        <h2 className="mb-1 text-lg font-semibold">Page Container</h2>
        <p className="mb-6 text-sm text-muted">
          All pages use the same container: max-width 120rem, centered, horizontal padding 1.5rem.
          No page should "dance" -- spacing is globally consistent.
        </p>

        <div className="rounded-sm border border-border p-4">
          <div
            className="mx-auto border border-dashed border-muted bg-primary/5 p-4"
            style={{ maxWidth: '100%' }}
          >
            <p className="text-center text-xs text-muted">
              max-width: var(--page-max-width) | padding: var(--page-padding)
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Flexbox Patterns</h2>
        <p className="mb-6 text-sm text-muted">
          Flexbox is the default layout method. CSS Grid only for true 2D layouts.
        </p>

        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 text-xs font-medium text-muted">Row -- space-between</p>
            <div className="flex items-center justify-between rounded-sm border border-border p-3">
              <div className="h-8 w-20 bg-primary/10" />
              <div className="h-8 w-20 bg-primary/10" />
              <div className="h-8 w-20 bg-primary/10" />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted">Row -- gap-4</p>
            <div className="flex items-center gap-4 rounded-sm border border-border p-3">
              <div className="h-8 w-20 bg-primary/10" />
              <div className="h-8 w-20 bg-primary/10" />
              <div className="h-8 w-20 bg-primary/10" />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted">Column -- gap-2</p>
            <div className="flex flex-col gap-2 rounded-sm border border-border p-3">
              <div className="h-8 bg-primary/10" />
              <div className="h-8 bg-primary/10" />
              <div className="h-8 bg-primary/10" />
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted">Center content</p>
            <div className="flex h-32 items-center justify-center rounded-sm border border-border">
              <div className="h-8 w-20 bg-primary/10" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Responsive Breakpoints</h2>
        <p className="mb-4 text-sm text-muted">Mobile-first: base styles for mobile, md/lg for larger screens.</p>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between border-b border-border pb-2">
            <span className="font-medium">Base</span>
            <span className="text-muted">0 - 767px (mobile)</span>
          </div>
          <div className="flex justify-between border-b border-border pb-2">
            <span className="font-medium">md:</span>
            <span className="text-muted">768px+ (tablet)</span>
          </div>
          <div className="flex justify-between border-b border-border pb-2">
            <span className="font-medium">lg:</span>
            <span className="text-muted">1024px+ (desktop)</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">xl:</span>
            <span className="text-muted">1280px+ (wide)</span>
          </div>
        </div>
      </section>
    </div>
  )
}

const meta: Meta = {
  title: 'Foundations/Layout',
  parameters: { layout: 'padded' },
}

export default meta

type Story = StoryObj

export const Overview: Story = {
  render: () => <LayoutPage />,
}
