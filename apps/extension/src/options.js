import { DEFAULT_SETTINGS, getSettings, trimSlash } from "./cabinet.js"

const $ = (id) => document.getElementById(id)

function parseAddress(value) {
  try {
    const url = new URL(trimSlash(value))
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null
  } catch {
    return null
  }
}

async function load() {
  const settings = await getSettings()
  $("appUrl").value = settings.appUrl
  $("apiUrl").value = settings.apiUrl
}

$("settings").addEventListener("submit", async (event) => {
  event.preventDefault()
  const error = $("error")
  error.hidden = true
  $("status").textContent = ""
  const appUrl = parseAddress($("appUrl").value || DEFAULT_SETTINGS.appUrl)
  const apiUrl = parseAddress($("apiUrl").value || DEFAULT_SETTINGS.apiUrl)
  if (!appUrl || !apiUrl) {
    error.textContent = "Enter full addresses that start with http:// or https://."
    error.hidden = false
    return
  }
  // The extension may only reach the API it is set up for; ask for that one origin.
  const granted = await chrome.permissions.request({ origins: [`${apiUrl}/*`] }).catch(() => false)
  if (!granted && !(await chrome.permissions.contains({ origins: [`${apiUrl}/*`] }))) {
    error.textContent = "Chrome did not allow access to that API address, so it was not saved."
    error.hidden = false
    return
  }
  await chrome.storage.sync.set({ appUrl, apiUrl })
  $("status").textContent = "Saved"
})

void load()
