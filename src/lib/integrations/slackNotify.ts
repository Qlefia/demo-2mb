import 'server-only'

export interface DossierHandoffSlackPayload {
  accountName: string
  territory: string
  prospectId: string
  assigneeName: string | null
  taskCreated: boolean
}

export async function postDossierHandoffSlack(payload: DossierHandoffSlackPayload): Promise<boolean> {
  const url = process.env.SLACK_WEBHOOK_URL?.trim()
  if (!url) return false

  const assigneeLine = payload.assigneeName
    ? `Assigned to *${payload.assigneeName}*`
    : 'No sales seat auto-assigned (manual assign needed)'

  const taskLine = payload.taskCreated ? '1st-touch task created (+24h)' : 'Task already open'

  const text = [
    `*Dossier ready* — ${payload.accountName} (${payload.territory})`,
    assigneeLine,
    taskLine,
  ].join('\n')

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    return res.ok
  } catch {
    return false
  }
}
