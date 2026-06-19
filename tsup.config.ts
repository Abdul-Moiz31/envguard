import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  format: ['cjs', 'esm'],
  dts: { entry: 'src/index.ts' }, // only generate types for the library entry
  clean: true,
  sourcemap: true,
  treeshake: true,
})
