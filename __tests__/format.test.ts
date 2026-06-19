import { describe, it, expect } from 'vitest'
import { formatErrorReport } from '../src/format'
import type { EnvFieldError } from '../src/types'

describe('formatErrorReport', () => {
  it('contains all field names', () => {
    const errors: EnvFieldError[] = [
      { key: 'DATABASE_URL', message: 'Required', received: undefined },
      { key: 'PORT', message: 'Expected number, received nan', received: 'abc' },
    ]

    const report = formatErrorReport(errors)

    expect(report).toContain('DATABASE_URL')
    expect(report).toContain('PORT')
  })

  it('shows "(not set)" for undefined values', () => {
    const errors: EnvFieldError[] = [
      { key: 'DATABASE_URL', message: 'Required', received: undefined },
    ]

    const report = formatErrorReport(errors)

    expect(report).toContain('(not set)')
  })

  it('shows "(empty string)" for empty string values', () => {
    const errors: EnvFieldError[] = [
      { key: 'API_KEY', message: 'Required', received: '' },
    ]

    const report = formatErrorReport(errors)

    expect(report).toContain('(empty string)')
  })

  it('shows the actual value in quotes for invalid-but-present values', () => {
    const errors: EnvFieldError[] = [
      { key: 'PORT', message: 'Expected number, received nan', received: 'abc' },
    ]

    const report = formatErrorReport(errors)

    expect(report).toContain('"abc"')
  })

  it('reports a count that matches the number of errors', () => {
    const errors: EnvFieldError[] = [
      { key: 'DATABASE_URL', message: 'Required', received: undefined },
      { key: 'PORT', message: 'Invalid', received: 'abc' },
      { key: 'API_KEY', message: 'Required', received: undefined },
    ]

    const report = formatErrorReport(errors)

    expect(report).toContain('3 variable(s) need attention')
  })
})
