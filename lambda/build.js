import { build } from 'esbuild'
import { zip } from 'zip-a-folder'
import { mkdirSync, rmSync } from 'fs'
import { join } from 'path'

const functions = [
  'createCheckout',
  'stripeWebhook',
  'notarise',
  'generateReceipt',
  'verify',
]

const outDir = './dist'

// Clean dist
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir)

for (const fn of functions) {
  console.log(`Building ${fn}…`)

  const fnDir = join(outDir, fn)
  mkdirSync(fnDir)

  // Bundle with esbuild — CJS format works most reliably on Lambda Node 20
  // The handler file is named <fn>.js to match the Terraform handler config
  await build({
    entryPoints: [`./${fn}.js`],
    outfile:     join(fnDir, `${fn}.js`),
    bundle:      true,
    platform:    'node',
    target:      'node20',
    format:      'cjs',
    // Mark entire @aws-sdk namespace as external — provided by Lambda runtime
    external:    ['@aws-sdk/*'],
    minify:      true,
    sourcemap:   false,
  })

  // Zip the bundle directory — Terraform references dist/<fn>.zip
  await zip(fnDir, join(outDir, `${fn}.zip`))
  console.log(`  → dist/${fn}.zip`)
}

console.log('\nAll functions built.')
