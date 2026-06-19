import type { z } from 'zod'

// The schema shape users define — a record of zod schemas
export type EnvSchema = Record<string, z.ZodTypeAny>

// Options for createEnv()
export interface CreateEnvOptions<TSchema extends EnvSchema> {
  schema: TSchema

  // Where to read raw env vars from. Defaults to process.env.
  // Allows testing without mutating the real process.env.
  source?: NodeJS.ProcessEnv | Record<string, string | undefined>

  // If true, throws on validation failure (default).
  // If false, logs the error and calls process.exit(1) instead
  // of throwing — useful for cleaner startup logs without a stack trace.
  onError?: 'throw' | 'exit'

  // Skip validation entirely — useful in test environments
  // where you stub env values manually. Defaults to false.
  skipValidation?: boolean
}

// The validated, typed result — inferred from the Zod schema
export type InferEnv<TSchema extends EnvSchema> = {
  [K in keyof TSchema]: z.infer<TSchema[K]>
}

// A single field validation failure, used for formatting errors
export interface EnvFieldError {
  key: string
  message: string
  received: string | undefined
}

// Thrown when validation fails
export class EnvValidationError extends Error {
  readonly fieldErrors: EnvFieldError[]

  constructor(fieldErrors: EnvFieldError[]) {
    super(`Environment validation failed for ${fieldErrors.length} variable(s)`)
    this.name = 'EnvValidationError'
    this.fieldErrors = fieldErrors
  }
}
