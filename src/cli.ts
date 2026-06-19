#!/usr/bin/env node
import { Command } from 'commander'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { runCheckCommand } from './cli/checkCommand'
import { loadSchema } from './cli/loadSchema'
import { generateEnvExample } from './exampleGen'

const program = new Command()

program.name('envguard').description('Type-safe environment variable validation').version('0.1.0')

program
  .command('check')
  .description('Validate environment variables against your schema')
  .option('--env-file <path>', 'Path to a specific .env file to validate')
  .option('--ci', 'Output machine-readable JSON, no colors')
  .action(async (opts) => {
    await runCheckCommand({ envFile: opts.envFile, ci: opts.ci })
  })

program
  .command('example')
  .description('Generate .env.example from your schema')
  .action(async () => {
    const schema = await loadSchema(process.cwd())
    const content = generateEnvExample(schema)
    const outPath = path.join(process.cwd(), '.env.example')
    writeFileSync(outPath, content)
    console.log(`✓ Wrote ${outPath}`)
  })

program.parse()
