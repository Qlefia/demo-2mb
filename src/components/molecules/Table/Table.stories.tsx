import type { Meta, StoryObj } from '@storybook/nextjs'
import { Table } from './Table'
import { Badge } from '../../atoms/Badge'

interface SurveyRow {
  name: string
  responses: number
  status: string
  created: string
}

const columns = [
  { key: 'name', header: 'Survey Name' },
  { key: 'responses', header: 'Responses' },
  {
    key: 'status',
    header: 'Status',
    render: (row: SurveyRow) => {
      const variantMap: Record<string, 'success' | 'default' | 'warning'> = {
        Published: 'success',
        Draft: 'default',
        Paused: 'warning',
      }
      return <Badge variant={variantMap[row.status] ?? 'default'}>{row.status}</Badge>
    },
  },
  { key: 'created', header: 'Created' },
]

const data: SurveyRow[] = [
  { name: 'Customer Satisfaction', responses: 142, status: 'Published', created: '2026-02-15' },
  { name: 'Product Feedback', responses: 0, status: 'Draft', created: '2026-03-01' },
  { name: 'Employee Survey', responses: 58, status: 'Paused', created: '2026-01-20' },
]

const meta: Meta = {
  title: 'Molecules/Table',
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <div className="w-[600px]">
      <Table columns={columns} data={data} />
    </div>
  ),
}

export const Empty: Story = {
  render: () => (
    <div className="w-[600px]">
      <Table columns={columns} data={[]} emptyMessage="No surveys yet. Create your first one." />
    </div>
  ),
}
