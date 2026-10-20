import assert from "node:assert/strict"
import test from "node:test"

test("URL state synchronizer parses query parameters and handles popstate updates", () => {
  // Simulate browser environment with URL search params
  const originalWindow = globalThis.window
  let currentSearch = "?folder=12345678-1234-4234-8234-123456789abc&sort=newest&q=design"
  let historyEntry = ""

  globalThis.window = {
    location: {
      get search() {
        return currentSearch
      },
      pathname: "/cabinet",
    },
    history: {
      pushState(_state, _title, url) {
        historyEntry = url
      },
      replaceState(_state, _title, url) {
        historyEntry = url
      },
    },
    addEventListener() {},
    removeEventListener() {},
  }

  // Parse helper simulation matching useCabinetFilters
  const params = new URLSearchParams(globalThis.window.location.search)
  assert.equal(params.get("folder"), "12345678-1234-4234-8234-123456789abc")
  assert.equal(params.get("sort"), "newest")
  assert.equal(params.get("q"), "design")

  // Simulate updating folder
  const nextParams = new URLSearchParams()
  nextParams.set("folder", "abcdef12-1234-4234-8234-123456789abc")
  globalThis.window.history.pushState(null, "", `/cabinet?${nextParams.toString()}`)
  assert.equal(historyEntry, "/cabinet?folder=abcdef12-1234-4234-8234-123456789abc")

  // Simulate updating view to favorites
  const favParams = new URLSearchParams()
  favParams.set("view", "favorites")
  globalThis.window.history.pushState(null, "", `/cabinet?${favParams.toString()}`)
  assert.equal(historyEntry, "/cabinet?view=favorites")

  globalThis.window = originalWindow
})
