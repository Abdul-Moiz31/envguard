# envguard

Validate environment variables at startup — fail fast with a clear error
instead of crashing 30 minutes later in production with
`Cannot read DATABASE_URL of undefined`.

Framework-agnostic. No rewriting `process.env` access. No proxy object.
Define a schema, call one function at startup, done.

## Install

```bash
npm install envguard zod
# or
pnpm add envguard zod
```

`zod` is a peer dependency — envguard uses whatever version you already
have installed.

## Usage

```typescript
import { createEnv } from 'envguard'
import { z } from 'zod'

export const env = createEnv({
  schema: {
    DATABASE_URL: z.string().url(),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']),
    DEBUG: z.coerce.boolean().optional(),
  },
})

// env.PORT is a number, env.NODE_ENV is the literal union — fully typed.
```

Call this once, at process startup, before anything else reads `process.env`.
If a required variable is missing or malformed, envguard prints exactly
which variable and why, then throws (or exits, see below) — your app never
boots into a half-configured state.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  envguard — environment validation failed
  2 variable(s) need attention
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✗ DATABASE_URL
    Required
    received: (not set)

  ✗ PORT
    Expected number, received nan
    received: "abc"

  Fix: set these variables in your .env file or your
  deployment environment, then restart the process.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## API

### `createEnv(options)`

| Option           | Type                                      | Default        | Description                                                              |
| ---------------- | ------------------------------------------ | -------------- | -------------------------------------------------------------------------- |
| `schema`          | `Record<string, z.ZodTypeAny>`             | —              | Required. Maps env var names to Zod schemas.                              |
| `source`          | `NodeJS.ProcessEnv \| Record<string, ...>` | `process.env`  | Where to read raw values from — override for testing.                     |
| `onError`         | `'throw' \| 'exit'`                        | `'throw'`       | `'exit'` logs the report and calls `process.exit(1)` instead of throwing. |
| `skipValidation`  | `boolean`                                  | `false`         | Bypasses validation entirely — useful in tests with stubbed env values.   |

Returns an object typed via `z.infer` for every key in `schema`.

### `generateEnvExample(schema)`

Generates `.env.example` file contents from a schema, with sensible
placeholders per type (`https://example.com` for `.url()`,
`user@example.com` for `.email()`, the first value for `z.enum()`, etc.)
and a `# Optional` comment above optional fields.

```typescript
import { generateEnvExample } from 'envguard'
import { writeFileSync } from 'fs'

writeFileSync('.env.example', generateEnvExample({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number(),
}))
```

### `EnvValidationError`

Thrown when validation fails (unless `onError: 'exit'`). Carries a
`fieldErrors: EnvFieldError[]` array — one entry per failing variable,
with `key`, `message`, and `received`.

## License

MIT
