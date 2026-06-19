import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { generateEnvExample } from '../src/exampleGen'

describe('generateEnvExample', () => {
  it('produces the generic placeholder for z.string()', () => {
    const output = generateEnvExample({ API_KEY: z.string() })

    expect(output).toContain('API_KEY=value')
  })

  it('produces "https://example.com" for z.string().url()', () => {
    const output = generateEnvExample({ DATABASE_URL: z.string().url() })

    expect(output).toContain('DATABASE_URL=https://example.com')
  })

  it('produces "user@example.com" for z.string().email()', () => {
    const output = generateEnvExample({ ADMIN_EMAIL: z.string().email() })

    expect(output).toContain('ADMIN_EMAIL=user@example.com')
  })

  it('produces "0" for z.number()', () => {
    const output = generateEnvExample({ PORT: z.number() })

    expect(output).toContain('PORT=0')
  })

  it('produces "true" for z.boolean()', () => {
    const output = generateEnvExample({ FEATURE_FLAG: z.boolean() })

    expect(output).toContain('FEATURE_FLAG=true')
  })

  it('produces the first enum value for z.enum([...])', () => {
    const output = generateEnvExample({
      NODE_ENV: z.enum(['development', 'production', 'test']),
    })

    expect(output).toContain('NODE_ENV=development')
  })

  it('marks optional fields with a "# Optional" comment', () => {
    const output = generateEnvExample({
      DATABASE_URL: z.string(),
      DEBUG: z.string().optional(),
    })

    const lines = output.split('\n')
    const optionalIndex = lines.findIndex((line) => line === '# Optional')
    expect(optionalIndex).toBeGreaterThan(-1)
    expect(lines[optionalIndex + 1]).toBe('DEBUG=value')
  })

  it('produces output that is valid .env file syntax (KEY=value lines)', () => {
    const output = generateEnvExample({
      DATABASE_URL: z.string().url(),
      PORT: z.number(),
      FEATURE_FLAG: z.boolean(),
    })

    const assignmentLines = output
      .split('\n')
      .filter((line) => line.length > 0 && !line.startsWith('#'))

    for (const line of assignmentLines) {
      expect(line).toMatch(/^[A-Z0-9_]+=.+$/)
    }

    expect(assignmentLines).toHaveLength(3)
  })
})
