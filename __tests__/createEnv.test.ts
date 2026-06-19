import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'
import { createEnv } from '../src/createEnv'
import { EnvValidationError } from '../src/types'

describe('createEnv', () => {
  beforeEach(() => {
    // createEnv prints the formatted report on every failure path —
    // silence it here so failing-case tests don't spam test output.
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a correctly typed object when the env is valid', () => {
    const env = createEnv({
      schema: {
        DATABASE_URL: z.string().url(),
        PORT: z.coerce.number(),
      },
      source: {
        DATABASE_URL: 'https://db.example.com',
        PORT: '5432',
      },
    })

    expect(env).toEqual({
      DATABASE_URL: 'https://db.example.com',
      PORT: 5432,
    })
  })

  it('throws EnvValidationError when a required var is missing', () => {
    expect(() =>
      createEnv({
        schema: { DATABASE_URL: z.string() },
        source: {},
      })
    ).toThrow(EnvValidationError)
  })

  it('throws when a var has an invalid type', () => {
    expect(() =>
      createEnv({
        schema: { PORT: z.coerce.number() },
        source: { PORT: 'abc' },
      })
    ).toThrow(EnvValidationError)
  })

  it('coerces a numeric string env var to a number with z.coerce.number()', () => {
    const env = createEnv({
      schema: { PORT: z.coerce.number() },
      source: { PORT: '3000' },
    })

    expect(env.PORT).toBe(3000)
    expect(typeof env.PORT).toBe('number')
  })

  it('coerces "true"/"false" strings to booleans with z.coerce.boolean()', () => {
    const env = createEnv({
      schema: { FEATURE_FLAG: z.coerce.boolean() },
      source: { FEATURE_FLAG: 'true' },
    })

    expect(env.FEATURE_FLAG).toBe(true)
    expect(typeof env.FEATURE_FLAG).toBe('boolean')
  })

  it('does not throw when an optional field is missing', () => {
    const env = createEnv({
      schema: { OPTIONAL_VAR: z.string().optional() },
      source: {},
    })

    expect(env.OPTIONAL_VAR).toBeUndefined()
  })

  it('uses the default value when a var with .default() is missing', () => {
    const env = createEnv({
      schema: { NODE_ENV: z.string().default('development') },
      source: {},
    })

    expect(env.NODE_ENV).toBe('development')
  })

  it('calls process.exit(1) instead of throwing when onError is "exit"', () => {
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as unknown as typeof process.exit)

    createEnv({
      schema: { DATABASE_URL: z.string() },
      source: {},
      onError: 'exit',
    })

    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  it('bypasses validation entirely when skipValidation is true', () => {
    const env = createEnv({
      schema: { DATABASE_URL: z.string().url() },
      source: { DATABASE_URL: 'not-a-valid-url' },
      skipValidation: true,
    })

    expect(env.DATABASE_URL).toBe('not-a-valid-url')
  })

  it('reads from a custom source object instead of process.env', () => {
    const customSource = { API_KEY: 'custom-value' }

    const env = createEnv({
      schema: { API_KEY: z.string() },
      source: customSource,
    })

    expect(env.API_KEY).toBe('custom-value')
  })

  it('collects all simultaneous failures into fieldErrors', () => {
    try {
      createEnv({
        schema: {
          DATABASE_URL: z.string(),
          PORT: z.coerce.number(),
          API_KEY: z.string(),
        },
        source: { PORT: 'not-a-number' },
      })
      expect.unreachable('createEnv should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(EnvValidationError)
      const validationError = err as EnvValidationError
      expect(validationError.fieldErrors).toHaveLength(3)
      expect(validationError.fieldErrors.map((e) => e.key).sort()).toEqual([
        'API_KEY',
        'DATABASE_URL',
        'PORT',
      ])
    }
  })

  it('validates z.enum() against allowed values and rejects others', () => {
    const schema = { NODE_ENV: z.enum(['development', 'production', 'test']) }

    const env = createEnv({
      schema,
      source: { NODE_ENV: 'production' },
    })
    expect(env.NODE_ENV).toBe('production')

    expect(() =>
      createEnv({
        schema,
        source: { NODE_ENV: 'staging' },
      })
    ).toThrow(EnvValidationError)
  })
})
