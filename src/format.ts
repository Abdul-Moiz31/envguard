import type { EnvFieldError } from './types'

// Produces a clean, readable terminal report.
// This is the single most important UX surface of the library —
// developers see this the moment something is wrong, so it must
// be immediately scannable.

export function formatErrorReport(errors: EnvFieldError[]): string {
  const lines: string[] = []

  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push(`  envguard — environment validation failed`)
  lines.push(`  ${errors.length} variable(s) need attention`)
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')

  for (const e of errors) {
    const receivedDisplay =
      e.received === undefined
        ? '(not set)'
        : e.received === ''
          ? '(empty string)'
          : `"${e.received}"`

    lines.push(`  ✗ ${e.key}`)
    lines.push(`    ${e.message}`)
    lines.push(`    received: ${receivedDisplay}`)
    lines.push('')
  }

  lines.push('  Fix: set these variables in your .env file or your')
  lines.push('  deployment environment, then restart the process.')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')

  return lines.join('\n')
}
