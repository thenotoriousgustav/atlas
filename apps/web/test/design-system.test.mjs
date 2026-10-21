import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

const root = fileURLToPath(new URL("../src/", import.meta.url))
const walk = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)])
// Flat internal seams are intentional. A new exception requires a design review.
const flat = {
  "components/ui/input-group.tsx": { "rounded-none": 2 },
  "components/ui/card.tsx": { "*:[img:first-child]:rounded-none": 1, "*:[img:last-child]:rounded-none": 1 },
  "components/ui/tooltip.tsx": { "rounded-none": 1 },
  "components/ui/tabs.tsx": { "data-[variant=line]:rounded-none": 1 },
  "components/ui/toggle-group.tsx": { "group-data-[spacing=0]/toggle-group:rounded-none": 1 },
  "components/ui/calendar.tsx": { "rounded-none": 1, "data-[selected=true]:rounded-none": 1, "data-[range-middle=true]:rounded-none": 1 },
}

test("all application components follow the radius and readable-type contract", () => {
  const found = {}
  for (const path of walk(root).filter((path) => /\.(tsx|css)$/.test(path))) {
    const name = relative(root, path)
    const source = readFileSync(path, "utf8")
    for (const [token] of source.matchAll(/[^\s"'`]*rounded-none!?/g)) {
      assert.ok(flat[name]?.[token], `${name}: unexpected square-corner override ${token}`)
      found[name] ??= {}
      found[name][token] = (found[name][token] || 0) + 1
    }
    assert.doesNotMatch(source, /text-\[(?:9|10)px\]/, `${name}: unreadable legacy label`)
    assert.doesNotMatch(source, /(?:bg|text|border)-brand-(?:blue|red)/, `${name}: undefined legacy color token`)
  }
  assert.deepEqual(found, flat)
  assert.doesNotMatch(readFileSync(join(root, "components/ui/button.tsx"), "utf8"), /rounded-sm/)
  assert.doesNotMatch(readFileSync(join(root, "components/ui/action-bar.tsx"), "utf8"), /rounded-xs/)
  assert.doesNotMatch(readFileSync(join(root, "app/share/[token]/shared-collection-browser.tsx"), "utf8"), /font-mono/)
  const css = readFileSync(join(root, "app/globals.css"), "utf8")
  for (const [role, px] of [["chip", 4], ["control", 6], ["panel", 8], ["overlay", 12]]) assert.match(css, new RegExp(`--radius-${role}: ${px}px;`))
  const dashboard = readFileSync(join(root, "app/cabinet/cabinet-dashboard.tsx"), "utf8")
  assert.equal((dashboard.match(/<CabinetSidebarFilters\b/g) || []).length, 1, "Desktop and mobile must share the same shadcn sidebar")
  assert.match(dashboard, /<SidebarProvider\b/)
  assert.match(dashboard, /<SidebarInset\b/)
})
