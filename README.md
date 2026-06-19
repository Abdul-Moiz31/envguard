# envguard

Type-safe environment variable validation. Framework-agnostic.
Zero rewrite of process.env. Fails fast at startup with a clear error.

## Install

```bash
npm install envguard zod
```

## The problem

```typescript
const dbUrl = process.env.DATABASE_URL
// dbUrl is string | undefined
// Your app deploys clean
// 30 minutes later: "Cannot read properties of undefined"
// because someone forgot to set DATABASE_URL in production
```

## The fix

```typescript
// envguard.config.ts
import { z } from 'zod'
import { defineEnvConfig } from 'envguard'

export default defineEnvConfig({
  DATABASE_URL: z.string().url(),
  PORT:         z.coerce.number().default(3000),
  NODE_ENV:     z.enum(['development', 'production', 'test']),
  STRIPE_KEY:   z.string().startsWith('sk_'),
  REDIS_URL:    z.string().url().optional(),
})
```

```typescript
// At the top of your app entry point (index.ts, server.ts, etc.)
import { createEnv } from 'envguard'
import schema from './envguard.config'

export const env = createEnv({ schema })
// env.DATABASE_URL is string — not string | undefined
// env.PORT is number — coerced from the string env var
// App throws immediately at startup if anything is invalid
```

```typescript
// Use it anywhere — fully typed
import { env } from './env'

await db.connect(env.DATABASE_URL)
app.listen(env.PORT)
```

If anything is missing or invalid, you get this instead of a vague
crash three layers deep in your app:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  envguard — environment validation failed
  2 variable(s) need attention
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✗ DATABASE_URL
    Invalid url
    received: (not set)

  ✗ STRIPE_KEY
    Invalid input
    received: "pk_test_abc123"

  Fix: set these variables in your .env file or your
  deployment environment, then restart the process.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## CLI — validate in CI before you deploy

```bash
npx envguard check
```

Catches missing env vars in your CI pipeline, before a deploy ever
starts. No more discovering a missing var after the app is already
crash-looping in production.

```bash
npx envguard check --env-file .env.production
npx envguard check --ci          # JSON output for CI logs
npx envguard example             # generate .env.example from schema
```

## Using it in CI (GitHub Actions)

No custom action needed — call the CLI directly, before your deploy step:

```yaml
- name: Validate environment
  run: npx envguard check --ci
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    STRIPE_KEY: ${{ secrets.STRIPE_KEY }}
```

If any required env var is missing from your deployment secrets, the
workflow fails here instead of mid-deploy.

## API

### createEnv(options)

```typescript
createEnv({
  schema:         EnvSchema      // your zod schema record
  source?:        ProcessEnv     // defaults to process.env
  onError?:       'throw' | 'exit'  // defaults to 'throw'
  skipValidation?: boolean       // defaults to false, for test environments
})
```

### defineEnvConfig(schema)

Identity function for type inference in your config file. No runtime effect.

### generateEnvExample(schema)

Returns a string suitable for writing to .env.example.

## Why not t3-env?

t3-env is excellent for Next.js specifically but requires you to access
all env vars through their generated object, replacing every
`process.env.X` in your codebase. envguard validates the same way but
you keep using `process.env` directly everywhere else in your app —
envguard only owns the startup check, not your entire codebase's env access pattern.

## License

MIT
