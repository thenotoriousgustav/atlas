// Run the skill's real browser inspector against an explicitly mocked account.
// No application authentication code is changed, and no real account data is accessed.
// node test/cabinet-inspect.mjs --out ../../.taste-skill/before
import { Browser } from "../../../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs"
import { cabinetResponse, prepareCabinetImages } from "./fixtures/cabinet-data.mjs"

const origin = process.env.WEB_URL || "http://localhost:3000"
const images = await prepareCabinetImages()
const original = Browser.prototype.newPage
Browser.prototype.newPage = async function (options) {
  const page = await original.call(this, options)
  await page.send("Network.setCookie", { name: "cabinet.session_token", value: "browser-test", url: origin })
  await page.send("Page.addScriptToEvaluateOnNewDocument", { source: `localStorage.setItem('cabinet_view_mode', 'moodboard'); localStorage.setItem('theme', '${process.env.THEME === "dark" ? "dark" : "light"}');` })
  await page.send("Fetch.enable", { patterns: [{ urlPattern: "*/v1/*" }] })
  this.on(page.sessionId, "Fetch.requestPaused", async ({ requestId, request }) => {
    const url = new URL(request.url)
    const image = images.get(url.searchParams.get("url"))
    const body = image?.body || Buffer.from(JSON.stringify(cabinetResponse(request.url)))
    await page.send("Fetch.fulfillRequest", {
      requestId, responseCode: request.method === "OPTIONS" ? 204 : 200,
      responseHeaders: Object.entries({ "Content-Type": image?.contentType || "application/json", "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true", "Access-Control-Allow-Headers": "content-type,authorization" }).map(([name, value]) => ({ name, value })),
      body: body.toString("base64"),
    }).catch((error) => console.error(error.message))
  })
  return page
}
process.argv = [process.argv[0], "inspect.mjs", `${origin}/cabinet`, "--app", ...process.argv.slice(2)]
await import("../../../.agents/skills/design-taste-frontend/scripts/inspect.mjs")
