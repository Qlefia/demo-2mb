import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  getRowKey?: (row: T, index: number) => React.Key
  onRowClick?: (row: T, index: number) => void
}

export function Table<T extends object>({
  columns,
  data,
  emptyMessage = 'No data',
  getRowKey,
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-auto rounded-sm border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-primary/5">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-muted">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={getRowKey ? getRowKey(row, i) : String((row as Record<string, unknown>).id ?? (row as Record<string, unknown>)._id ?? i)}
                className={cn('border-b border-border last:border-0', onRowClick && 'cursor-pointer hover:bg-primary/5')}
                onClick={onRowClick ? () => onRowClick(row, i) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
