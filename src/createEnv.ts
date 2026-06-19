import type { EnvSchema, CreateEnvOptions, InferEnv, EnvFieldError } from './types'
import { EnvValidationError } from './types'
import { formatErrorReport } from './format'

export function createEnv<TSchema extends EnvSchema>(
  options: CreateEnvOptions<TSchema>
): InferEnv<TSchema> {
  const {
    schema,
    source = process.env,
    onError = 'throw',
    skipValidation = false,
  } = options

  if (skipValidation) {
    // In test environments, trust the caller has stubbed values correctly.
    // Cast through unknown — we are intentionally bypassing validation.
    return source as unknown as InferEnv<TSchema>
  }

  const fieldErrors: EnvFieldError[] = []
  const result: Record<string, unknown> = {}

  for (const key of Object.keys(schema)) {
    const fieldSchema = schema[key]
    const rawValue = source[key]
    const parsed = fieldSchema.safeParse(rawValue)

    if (parsed.success) {
      result[key] = parsed.data
    } else {
      // Take the first issue message — usually the most relevant
      const message = parsed.error.issues[0]?.message ?? 'Invalid value'
      fieldErrors.push({ key, message, received: rawValue })
    }
  }

  if (fieldErrors.length > 0) {
    const error = new EnvValidationError(fieldErrors)

    if (onError === 'exit') {
      console.error(formatErrorReport(fieldErrors))
      process.exit(1)
      // process.exit() never returns in production, but tests stub it —
      // return explicitly so a stubbed exit doesn't fall through to throw.
      return undefined as never
    }

    // Always print the formatted report even when throwing —
    // a raw stack trace is much less useful than the field list
    console.error(formatErrorReport(fieldErrors))
    throw error
  }

  return result as InferEnv<TSchema>
}
