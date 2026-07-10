import type { Meta, StoryObj } from '@storybook/nextjs'

function ColorSwatch({ name, variable, hex }: { name: string; variable: string; hex: string }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="h-12 w-12 shrink-0 rounded-sm border border-border"
        style={{ backgroundColor: hex }}
      />
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted">{variable}</p>
        <p className="text-xs text-muted">{hex}</p>
      </div>
    </div>
  )
}

function OpacityScale({ base, label }: { base: string; label: string }) {
  const steps = [5, 10, 20, 30, 40, 50]
  return (
    <div>
      <p className="mb-3 text-sm font-medium">{label}</p>
      <div className="flex gap-2">
        {steps.map((step) => (
          <div key={step} className="text-center">
            <div
              className="mb-1 h-10 w-10 rounded-sm border border-border"
              style={{ backgroundColor: base, opacity: step / 100 }}
            />
            <p className="text-xs text-muted">{step}%</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ColorsPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <section>
        <h2 className="mb-1 text-lg font-semibold">Color Palette</h2>
        <p className="mb-6 text-sm text-muted">
          Swiss minimalist palette: black, white, one accent. No gradients, no decorative fills.
        </p>

        <div className="grid grid-cols-2 gap-6">
          <ColorSwatch name="Primary" variable="--color-primary" hex="#000000" />
          <ColorSwatch name="Background" variable="--color-background" hex="#FFFFFF" />
          <ColorSwatch name="Foreground" variable="--color-foreground" hex="#000000" />
          <ColorSwatch name="Muted" variable="--color-muted" hex="#737373" />
          <ColorSwatch name="Border" variable="--color-border" hex="#E5E5E5" />
          <ColorSwatch name="Accent" variable="--color-accent" hex="#D99E6A" />
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Semantic Colors</h2>
        <p className="mb-6 text-sm text-muted">Used for feedback states.</p>

        <div className="grid grid-cols-2 gap-6">
          <ColorSwatch name="Destructive" variable="--color-destructive" hex="#DC2626" />
          <ColorSwatch name="Success" variable="--color-success" hex="#16A34A" />
          <ColorSwatch name="Warning" variable="--color-warning" hex="#D97706" />
          <ColorSwatch name="Info" variable="--color-info" hex="#2563EB" />
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Opacity Scale</h2>
        <p className="mb-6 text-sm text-muted">
          Use opacity variations for subtle backgrounds (e.g. <code>bg-primary/5</code>).
        </p>

        <div className="flex flex-col gap-6">
          <OpacityScale base="#000000" label="Black opacity" />
          <OpacityScale base="#D99E6A" label="Accent opacity" />
        </div>
      </section>
    </div>
  )
}

const meta: Meta = {
  title: 'Foundations/Colors',
  parameters: { layout: 'padded' },
}

export default meta

type Story = StoryObj

export const Palette: Story = {
  render: () => <ColorsPage />,
}
