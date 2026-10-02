import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'

const workspace = mkdtempSync(join(tmpdir(), 'nuxt-ci-plan-'))
mkdirSync(join(workspace, 'scripts'))
copyFileSync(new URL('./ci-plan.mts', import.meta.url), join(workspace, 'scripts/ci-plan.mts'))

for (const slug of ['alpha', 'beta']) {
  const directory = join(workspace, 'apps', slug)
  mkdirSync(directory, { recursive: true })
  writeFileSync(
    join(directory, 'site.manifest.ts'),
    `export default ${JSON.stringify({
      slug,
      packageName: `@fixture/${slug}`,
      features: { smoke: true },
      deployment: { buildCommand: `pnpm app:generate ${slug}`, rootDirectory: '.' },
    })}`,
  )
}

after(() => rmSync(workspace, { recursive: true, force: true }))

type Plan = {
  hasCodeChange: boolean
  needsScaffold: boolean
  apps: { slug: string }[]
}

const plan = (...args: string[]): Plan =>
  JSON.parse(
    execFileSync(process.execPath, ['--experimental-strip-types', 'scripts/ci-plan.mts', ...args], {
      cwd: workspace,
      encoding: 'utf8',
    }),
  ) as Plan

const slugs = (result: Plan) => result.apps.map((app) => app.slug)

test('first push with a zero base SHA runs full validation', () => {
  const result = plan('--base', '0'.repeat(40), '--head', 'HEAD')
  assert.equal(result.hasCodeChange, true)
  assert.equal(result.needsScaffold, true)
  assert.deepEqual(slugs(result), ['alpha', 'beta'])
})

test('missing diff conservatively runs full validation', () => {
  const result = plan()
  assert.equal(result.hasCodeChange, true)
  assert.equal(result.needsScaffold, true)
  assert.deepEqual(slugs(result), ['alpha', 'beta'])
})

test('documentation-only changes skip heavy validation', () => {
  const result = plan('--changed-file', 'README.md')
  assert.equal(result.hasCodeChange, false)
  assert.equal(result.needsScaffold, false)
  assert.deepEqual(slugs(result), [])
})

test('app-local code selects only that app', () => {
  const result = plan('--changed-file', 'apps/alpha/app/pages/index.vue')
  assert.equal(result.hasCodeChange, true)
  assert.equal(result.needsScaffold, false)
  assert.deepEqual(slugs(result), ['alpha'])
})

test('content Markdown counts as app content', () => {
  const result = plan('--changed-file', 'apps/beta/content/blog/hello-world.md')
  assert.equal(result.hasCodeChange, true)
  assert.deepEqual(slugs(result), ['beta'])
})

test('shared code, script configuration and workflow changes validate all apps and the scaffold', () => {
  for (const file of [
    'packages/site-core/nuxt.config.ts',
    'tsconfig.json',
    '.github/workflows/ci.yml',
  ]) {
    const result = plan('--changed-file', file)
    assert.equal(result.hasCodeChange, true, file)
    assert.equal(result.needsScaffold, true, file)
    assert.deepEqual(slugs(result), ['alpha', 'beta'], file)
  }
})
