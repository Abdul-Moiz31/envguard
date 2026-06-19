import { config as loadDotenv } from 'dotenv'
import { loadSchema } from './loadSchema'
import { createEnv } from '../createEnv'
import { EnvValidationError } from '../types'

export interface CheckCommandOptions {
  envFile?: string
  ci?: boolean
}

export async function runCheckCommand(options: CheckCommandOptions): Promise<void> {
  if (options.envFile) {
    // quiet: true — dotenv prints a promotional tip line to stdout otherwise,
    // which would corrupt --ci JSON output.
    loadDotenv({ path: options.envFile, quiet: true })
  } else {
    loadDotenv({ quiet: true }) // loads .env from cwd if present, silently no-ops if absent
  }

  const schema = await loadSchema(process.cwd())

  try {
    createEnv({ schema, onError: 'throw' })

    if (options.ci) {
      console.log(JSON.stringify({ status: 'ok', errors: [] }))
    } else {
      console.log('✓ All environment variables valid')
    }
    process.exit(0)
  } catch (e) {
    if (e instanceof EnvValidationError) {
      if (options.ci) {
        console.log(JSON.stringify({ status: 'failed', errors: e.fieldErrors }))
      }
      // Non-CI mode: createEnv already printed the formatted report
      process.exit(1)
    }
    throw e
  }
}
