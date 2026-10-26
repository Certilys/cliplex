// Pilote la vraie application pour la tester : node scripts/piloter.mjs <scenario.mjs> <dossier-captures>
// Le scénario exporte `export default async ({ page, capture, app }) => { ... }`.
// L'app tourne avec des données isolées (réglages et projets dans <dossier-captures>/donnees).
import { _electron as electron } from 'playwright'
import { mkdirSync } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

const [scenario, sortie = 'captures'] = process.argv.slice(2)
if (!scenario) {
  console.error('Usage : node scripts/piloter.mjs <scenario.mjs> [dossier-captures]')
  process.exit(1)
}
const dossier = resolve(sortie)
mkdirSync(`${dossier}/donnees`, { recursive: true })

const app = await electron.launch({
  args: [resolve('out/main/index.js')],
  env: { ...process.env, CLIPLEX_DONNEES: `${dossier}/donnees` }
})
const page = await app.firstWindow()
await page.setViewportSize({ width: 1440, height: 900 })
await page.waitForLoadState('domcontentloaded')

let n = 0
const capture = async (nom) => {
  const f = `${dossier}/${String(++n).padStart(2, '0')}-${nom}.png`
  await page.screenshot({ path: f })
  console.log(`capture ${f}`)
}
page.on('console', (m) => m.type() === 'error' && console.log(`console : ${m.text()}`))
page.on('pageerror', (e) => console.log(`erreur page : ${e.message}`))

try {
  const run = (await import(pathToFileURL(resolve(scenario)).href)).default
  await run({ page, capture, app })
} catch (e) {
  console.log(`ÉCHEC : ${e.message}`)
  await capture('echec')
  process.exitCode = 1
} finally {
  await app.close()
}
