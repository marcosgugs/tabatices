import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const rootDirectory = fileURLToPath(new URL('..', import.meta.url))
const distDirectory = join(rootDirectory, 'dist')
const serverDirectory = join(rootDirectory, 'dist-ssr')

const { renderPage, renderPageHead, prerenderPaths, clientOnlyPaths, siteUrl } = await import(
  pathToFileURL(join(serverDirectory, 'entry-server.js')).href
)

const template = await readFile(join(distDirectory, 'index.html'), 'utf8')
const titlePattern = /<title>.*?<\/title>/s
const appContainer = '<div id="app"></div>'
const teleportContainer = '<div id="teleports"></div>'

if (!titlePattern.test(template) || !template.includes(appContainer) || !template.includes(teleportContainer)) {
  throw new Error('index.html is missing the <title>, the empty #app or the empty #teleports container')
}

function fillTemplate({ head, html = '', teleports = '' }) {
  return template
    .replace(titlePattern, head)
    .replace(appContainer, `<div id="app">${html}</div>`)
    .replace(teleportContainer, `<div id="teleports">${teleports}</div>`)
}

function outputFileFor(path) {
  return path === '/' ? 'index.html' : `${path.slice(1)}.html`
}

async function writePage(fileName, content) {
  const filePath = join(distDirectory, fileName)
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, content)
}

for (const path of prerenderPaths) {
  await writePage(outputFileFor(path), fillTemplate(await renderPage(path)))
}

for (const path of clientOnlyPaths) {
  await writePage(outputFileFor(path), fillTemplate({ head: await renderPageHead(path) }))
}

await writePage('404.html', fillTemplate({ head: (await renderPageHead('/')).concat('\n    <meta name="robots" content="noindex" />') }))

const sitemapEntries = prerenderPaths.map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`).join('\n')
await writePage(
  'sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`,
)

await rm(serverDirectory, { recursive: true, force: true })

console.log(`Prerendered ${prerenderPaths.length} pages, ${clientOnlyPaths.length} client-only pages, 404 and sitemap.`)
