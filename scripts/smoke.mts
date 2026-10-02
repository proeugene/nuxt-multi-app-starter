import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium, type Browser } from 'playwright'

type SiteManifest = {
  site: {
    url: string
    name: string
  }
  social: {
    linkedInUrl?: string
  }
  features: {
    rss: boolean
    robots: boolean
    sitemap: boolean
  }
  deployment: {
    outputDirectory: string
    outputBase?: 'app' | 'workspace'
  }
  smoke?: {
    routes: string[]
    absentRoutes?: string[]
    sitemapRoutes?: string[]
    personSchema?: boolean
  }
}

const workspaceRoot = fileURLToPath(new URL('..', import.meta.url))
const host = '127.0.0.1'
const port = 0
let origin = ''
const manifestPath = resolve('site.manifest.ts')
const manifestModule = (await import(pathToFileURL(manifestPath).href)) as { default: SiteManifest }
const siteManifest = manifestModule.default
const outputRoot = resolve(
  siteManifest.deployment.outputBase === 'workspace' ? workspaceRoot : dirname(manifestPath),
  siteManifest.deployment.outputDirectory,
)

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
}

const isFile = async (path: string): Promise<boolean> => {
  try {
    return (await stat(path)).isFile()
  } catch {
    return false
  }
}

const resolveRequestPath = async (pathname: string): Promise<string | null> => {
  const safePath = normalize(decodeURIComponent(pathname)).replace(/^(\.\.(\/|\\|$))+/, '')
  const candidates: string[] = []

  if (safePath === '/' || safePath === '.') {
    candidates.push(join(outputRoot, 'index.html'))
  } else {
    const relativePath = safePath.replace(/^\/+/, '')
    candidates.push(join(outputRoot, relativePath, 'index.html'))
    candidates.push(join(outputRoot, `${relativePath}.html`))
    candidates.push(join(outputRoot, relativePath))
  }

  for (const candidate of candidates) {
    if (await isFile(candidate)) {
      return candidate
    }
  }

  return null
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', origin)
    const filePath = await resolveRequestPath(url.pathname)

    if (!filePath) {
      res.statusCode = 404
      res.end('Not found')
      return
    }

    const file = await readFile(filePath)
    res.setHeader('content-type', contentTypes[extname(filePath)] || 'application/octet-stream')
    res.end(file)
  } catch (error) {
    res.statusCode = 500
    res.end(error instanceof Error ? error.message : 'Unknown error')
  }
})

const listen = () =>
  new Promise<void>((resolvePromise, rejectPromise) => {
    server.listen(port, host, () => {
      const address = server.address()
      assert.ok(address && typeof address !== 'string')
      origin = `http://${host}:${address.port}`
      resolvePromise()
    })
    server.on('error', rejectPromise)
  })

const close = () =>
  new Promise<void>((resolvePromise, rejectPromise) => {
    server.close((error) => {
      if (error) rejectPromise(error)
      else resolvePromise()
    })
  })

const assertGeneratedFile = async (relativePath: string, expectedText: RegExp): Promise<void> => {
  const contents = await readFile(join(outputRoot, relativePath), 'utf8')
  assert.match(contents, expectedText)
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

let browser: Browser | undefined

try {
  await stat(outputRoot)
  await listen()

  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const smokeRoutes = siteManifest.smoke?.routes ?? ['/']

  for (const route of smokeRoutes) {
    const response = await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' })
    assert.equal(response?.status(), 200, `Expected ${route} to return 200`)
  }

  for (const route of siteManifest.smoke?.absentRoutes ?? []) {
    const response = await page.goto(`${origin}${route}`, { waitUntil: 'networkidle' })
    assert.equal(response?.status(), 404, `Expected ${route} to return 404`)
  }

  await page.goto(origin, { waitUntil: 'networkidle' })
  assert.match(await page.title(), new RegExp(escapeRegExp(siteManifest.site.name), 'i'))

  const homepageHtml = await readFile(join(outputRoot, 'index.html'), 'utf8')
  const homepageUrl = `${siteManifest.site.url}/`
  assert.ok(homepageHtml.includes(`<link rel="canonical" href="${homepageUrl}">`))
  const ogUrl = homepageHtml.match(/<meta property="og:url" content="([^"]+)">/)?.[1]
  assert.ok(ogUrl, 'Homepage Open Graph URL must exist')
  assert.equal(new URL(ogUrl).href, new URL(homepageUrl).href)
  const structuredData = [
    ...homepageHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
  ].map((match) => JSON.parse(match[1]) as { '@type'?: string; sameAs?: string[] })
  if (siteManifest.smoke?.personSchema) {
    assert.ok(siteManifest.social.linkedInUrl, 'Person schema requires a LinkedIn identity URL')
    const personData = structuredData.find((entry) => entry['@type'] === 'Person')
    assert.deepEqual(personData?.sameAs, [siteManifest.social.linkedInUrl])
  }

  if (siteManifest.features.rss) {
    await assertGeneratedFile('rss.xml', /<rss version="2.0">/)
    await assertGeneratedFile('rss.xml', new RegExp(escapeRegExp(siteManifest.site.url)))
  } else {
    assert.equal(await isFile(join(outputRoot, 'rss.xml')), false, 'RSS should not be generated')
  }

  if (siteManifest.features.sitemap) {
    const sitemap = await readFile(join(outputRoot, 'sitemap.xml'), 'utf8')
    const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
    if (siteManifest.smoke?.sitemapRoutes) {
      assert.deepEqual(
        locations.sort(),
        siteManifest.smoke.sitemapRoutes
          .map((route) => new URL(route, siteManifest.site.url).href)
          .sort(),
        'Sitemap should match declared public routes',
      )
    } else {
      assert.ok(locations.some((location) => location.startsWith(siteManifest.site.url)))
    }
  }

  if (siteManifest.features.robots) {
    await assertGeneratedFile(
      'robots.txt',
      new RegExp(escapeRegExp(`Sitemap: ${siteManifest.site.url}/sitemap.xml`)),
    )
  }

  console.log('Smoke checks passed.')
} catch (error) {
  if (error instanceof Error && error.message.includes("Executable doesn't exist")) {
    console.error('Install Chromium first with `pnpm exec playwright install chromium`.')
  }

  throw error
} finally {
  await browser?.close()
  if (server.listening) await close()
}
