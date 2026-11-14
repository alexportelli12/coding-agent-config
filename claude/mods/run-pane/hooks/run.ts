// What the run pane reads from ibni and how it words it, apart from the hooks
// so tests can feed recorded `ibni info` / `ibni stats` answers directly. How a
// run's journey reads lives in journey.ts, which segwi's web app shares.
import { isDelivered, record } from './journey'
import type { Tone } from './journey'
import type { RunPaneSnapshot } from '../types'

const IBNI = /(?:^|[\s;&|(/])(?:ibni|implementation-workspace)\s+([a-z-]+)/

// The ibni session a Bash command worked on: its --session argument, or the
// sessionId `prepare` and `adopt` print when they create or take one over.
export function sessionIdFrom(command: string, output: string | undefined): string | null {
  const match = IBNI.exec(command)
  if (!match) return null
  const flag = /--session(?:=|\s+)['"]?([A-Za-z0-9_-]+)/.exec(command)
  if (flag?.[1]) return flag[1]
  if (match[1] !== 'prepare' && match[1] !== 'adopt') return null
  return /"sessionId"\s*:\s*"([A-Za-z0-9_-]+)"/.exec(output ?? '')?.[1] ?? null
}

// The task's short name and the repository it runs in, read from the branch
// and the worktree path (<root>/<repository>-<hash>/<slug>).
export function taskTitle(run: RunPaneSnapshot): { task: string; repository?: string } {
  const task = (run.branch ?? run.sessionId).replace(/^agent\//, '')
  const folder = run.worktreePath?.split('/').at(-2)
  return { task, repository: folder?.replace(/-[0-9a-f]{10}$/, '') }
}

// "started 12m ago", from the workspace's createdAt.
export function since(iso: string | undefined, now: number): string | undefined {
  const at = iso ? Date.parse(iso) : Number.NaN
  if (Number.isNaN(at)) return undefined
  const minutes = Math.max(0, Math.round((now - at) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return hours < 24 ? `${hours}h ${minutes % 60}m ago` : `${Math.floor(hours / 24)}d ago`
}

// The band's one-line hint, or null: a short badge for what happened and
// what to do about it. Its key changes with the reason, so dismissing one
// does not silence the next. A new session picks a pull request back up when
// /wettaq is given its link (it adopts the workspace itself), so the hint
// names that rather than an ibni command.
export type Nudge = { key: string; badge: string; tone: Tone; text: string }

export function nudge(run: RunPaneSnapshot | null, percent: number | null, threshold: number): Nudge | null {
  if (run && isDelivered(run)) {
    const pr = run.prUrl ? `PR #${run.prUrl.split('/').at(-1)}` : 'PR'
    return { key: `delivered:${run.sessionId}`, badge: `✓ ${pr} delivered`, tone: 'success', text: 'Follow-ups go in a fresh session: give /wettaq the PR link.' }
  }
  if (percent !== null && percent >= threshold) {
    return { key: `context:${threshold}`, badge: `${percent}% context`, tone: 'warning', text: 'Finish this run here, then start the next task in a fresh session.' }
  }
  return null
}

// claude.contextNudgePercent from the mexxi config.json text, or the default.
export function nudgePercentFrom(configText: string | undefined, fallback = 70): number {
  try {
    const value = record(record(JSON.parse(configText ?? '{}')).claude).contextNudgePercent
    return typeof value === 'number' && value >= 1 && value <= 100 ? value : fallback
  } catch {
    return fallback
  }
}
