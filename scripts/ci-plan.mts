import { execFileSync } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

type SiteManifest = {
  slug: string
  packageName: string
  features: {
    smoke: boolean
  }
  deployment: {
    buildCommand: string
    rootDirectory: string
  }
}

type PlannedApp = {
  slug: string
  packageName: string
  smoke: boolean
  buildCommand: string
  rootDirectory: string
}

const scriptDir = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(scriptDir, '..')
const appsRoot = resolve(workspaceRoot, 'apps')

const args = process.argv.slice(2)

const takeArgValue = (flag: string): string | undefined => {
  const index = args.indexOf(flag)

  if (index === -1) {
    return undefined
  }

  return args[index + 1]
}

const takeRepeatedValues = (flag: string): string[] =>
  args.flatMap((value, index) => (value === flag ? [args[index + 1]].filter(Boolean) : []))

const listManifests = async (): Promise<SiteManifest[]> => {
  const appDirs = await readdir(appsRoot, { withFileTypes: true })
  const manifests = await Promise.all(
    appDirs
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const manifestPath = resolve(appsRoot, entry.name, 'site.manifest.ts')
        const manifestModule = (await import(pathToFileURL(manifestPath).href)) as {
          default: SiteManifest
        }

        return manifestModule.default
      }),
  )

  return manifests.sort((left, right) => left.slug.localeCompare(right.slug))
}

const isZeroSha = (value?: string): boolean => !value || /^0+$/.test(value)

const gitDiffFiles = (base: string, head: string): string[] => {
  const output = execFileSync('git', ['diff', '--name-only', base, head], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  })

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

const sharedChangePrefixes = ['packages/', 'scripts/', '.github/workflows/']
const sharedRootFiles = new Set([
  '.npmrc',
  '.nvmrc',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'tsconfig.json',
])

const isSharedChange = (filePath: string): boolean =>
  sharedRootFiles.has(filePath) ||
  sharedChangePrefixes.some((prefix) => filePath.startsWith(prefix))

const isDocumentationOnlyChange = (filePath: string): boolean =>
  filePath.endsWith('.md') && !/^apps\/[^/]+\/content\//.test(filePath)

const scaffoldRootFiles = new Set([
  '.npmrc',
  '.nvmrc',
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'tsconfig.json',
])

const needsScaffoldValidation = (filePath: string): boolean =>
  scaffoldRootFiles.has(filePath) ||
  filePath.startsWith('packages/') ||
  filePath.startsWith('scripts/') ||
  filePath.startsWith('.github/workflows/')

const createPlan = (manifests: SiteManifest[], changedFiles: string[]) => {
  const changedAppSlugs = new Set(
    manifests
      .filter((manifest) =>
        changedFiles.some((filePath) => filePath.startsWith(`apps/${manifest.slug}/`)),
      )
      .map((manifest) => manifest.slug),
  )

  const hasSharedChange = changedFiles.some(isSharedChange)
  // First pushes and runs without a usable diff must exercise the full workspace.
  const hasCodeChange =
    changedFiles.length === 0 ||
    changedFiles.some((filePath) => !isDocumentationOnlyChange(filePath))
  const selectedSlugs =
    changedFiles.length === 0 || hasSharedChange
      ? manifests.map((manifest) => manifest.slug)
      : [...changedAppSlugs]

  const apps: PlannedApp[] = manifests
    .filter((manifest) => selectedSlugs.includes(manifest.slug))
    .map((manifest) => ({
      slug: manifest.slug,
      packageName: manifest.packageName,
      smoke: manifest.features.smoke,
      buildCommand: manifest.deployment.buildCommand,
      rootDirectory: manifest.deployment.rootDirectory,
    }))

  return {
    sharedChange: hasSharedChange,
    hasCodeChange,
    needsScaffold: changedFiles.length === 0 || changedFiles.some(needsScaffoldValidation),
    changedFiles,
    apps,
  }
}

const repeatedChangedFiles = takeRepeatedValues('--changed-file')
const base = takeArgValue('--base')
const head = takeArgValue('--head')

const manifests = await listManifests()

let changedFiles = repeatedChangedFiles

if (changedFiles.length === 0 && base && head && !isZeroSha(base)) {
  changedFiles = gitDiffFiles(base, head)
}

const plan = createPlan(manifests, changedFiles)

process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`)
