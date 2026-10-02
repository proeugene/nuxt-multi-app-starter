import { existsSync, readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const [, , scriptName, appRef, ...forwardedArgs] = process.argv

if (!scriptName || !appRef) {
  console.error('Usage: pnpm app:<command> <app-slug-or-package-name> [-- extra args]')
  process.exit(1)
}

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url))

const resolvePackageName = async (value: string): Promise<string> => {
  if (value.startsWith('@')) {
    return value
  }

  const manifestPath = resolve(workspaceRoot, 'apps', value, 'site.manifest.ts')

  if (existsSync(manifestPath)) {
    const manifestModule = (await import(pathToFileURL(manifestPath).href)) as {
      default?: { packageName?: string }
    }

    if (manifestModule.default?.packageName) {
      return manifestModule.default.packageName
    }
  }

  const packageJsonPath = resolve(workspaceRoot, 'apps', value, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { name?: string }

  if (!packageJson.name) {
    throw new Error(`Missing package name in ${packageJsonPath}`)
  }

  return packageJson.name
}

const child = spawn(
  'pnpm',
  ['--filter', await resolvePackageName(appRef), 'run', scriptName, ...forwardedArgs],
  {
    cwd: workspaceRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  },
)

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
