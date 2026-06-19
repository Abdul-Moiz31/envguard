import path from 'node:path'
import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { tsImport } from 'tsx/esm/api'
import type { EnvSchema } from '../types'

const CONFIG_FILENAMES = ['envguard.config.ts', 'envguard.config.js', 'envguard.config.mjs']

export async function loadSchema(cwd: string): Promise<EnvSchema> {
  for (const filename of CONFIG_FILENAMES) {
    const fullPath = path.join(cwd, filename)
    if (existsSync(fullPath)) {
      // tsImport transpiles .ts on the fly and passes .js/.mjs straight through —
      // this makes the built CLI load a TypeScript config without the user
      // needing to run it through tsx themselves.
      const mod = await tsImport(fullPath, pathToFileURL(fullPath).href)
      // When tsImport transpiles the config to CJS under the hood, Node's
      // CJS-to-ESM interop makes `mod.default` the whole exports object
      // (which itself has a `.default` property) instead of unwrapping it —
      // so a plain `export default` can come through double-wrapped.
      const exported = mod.default
      const schema =
        exported && typeof exported === 'object' && 'default' in exported
          ? (exported as { default: unknown }).default
          : exported
      if (!schema || typeof schema !== 'object') {
        throw new Error(`${filename} must have a default export from defineEnvConfig()`)
      }
      return schema as EnvSchema
    }
  }

  throw new Error(
    `No envguard config found. Create one of: ${CONFIG_FILENAMES.join(', ')}\n` +
      `Example:\n\n` +
      `import { z } from 'zod'\n` +
      `import { defineEnvConfig } from 'envguard'\n\n` +
      `export default defineEnvConfig({\n` +
      `  DATABASE_URL: z.string().url(),\n` +
      `})\n`
  )
}
