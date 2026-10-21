import {
  SignedOutError, cleanTags, findExisting, getLastFolderId, getSession, listFolders, listTags,
  openCabinet, saveBookmark, saveableUrl, setLastFolderId,
} from "./cabinet.js"

const $ = (id) => document.getElementById(id)
const states = ["state-loading", "state-message", "state-form", "state-saved"]
const show = (id) => states.forEach((state) => { $(state).hidden = state !== id })

let tab = null
let tags = []
let folders = []

function message(title, text, action) {
  $("message-title").textContent = title
  $("message-text").textContent = text
  const button = $("message-action")
  button.hidden = !action
  if (action) {
    button.textContent = action.label
    button.onclick = action.run
  }
  show("state-message")
}

function signedOut() {
  message("Sign in to Cabinet", "Saving uses your Cabinet account in this browser.", {
    label: "Sign in",
    run: async () => { await openCabinet("/login"); window.close() },
  })
}

function folderPath(folderId) {
  return folderId ? `/cabinet/folders/${encodeURIComponent(folderId)}` : "/cabinet"
}

function renderTags() {
  const box = $("tags")
  box.querySelectorAll(".chip").forEach((chip) => chip.remove())
  const input = $("tag-input")
  for (const tag of tags) {
    const chip = document.createElement("span")
    chip.className = "chip"
    chip.append(`#${tag}`)
    const remove = document.createElement("button")
    remove.type = "button"
    remove.setAttribute("aria-label", `Remove tag ${tag}`)
    remove.textContent = "×"
    remove.addEventListener("click", () => { tags = tags.filter((t) => t !== tag); renderTags(); input.focus() })
    chip.append(remove)
    box.insertBefore(chip, input)
  }
}

function addTag(raw) {
  const next = cleanTags([...tags, ...cleanTags(raw)])
  if (next.length !== tags.length) { tags = next; renderTags() }
}

async function checkDuplicate(url) {
  try {
    const existing = await findExisting(url)
    if (!existing) return
    const notice = $("duplicate")
    notice.textContent = `Already in your Cabinet${existing.folder?.name ? ` in ${existing.folder.name}` : ""}. Saving makes another copy. `
    const open = document.createElement("a")
    open.href = "#"
    open.textContent = "Open it"
    open.addEventListener("click", async (event) => {
      event.preventDefault()
      await openCabinet(folderPath(existing.folderId))
      window.close()
    })
    notice.append(open)
    notice.hidden = false
  } catch {
    // The check is a courtesy; saving still works without it.
  }
}

async function init() {
  $("open-settings").addEventListener("click", () => chrome.runtime.openOptionsPage())
  // ?tab=<id> lets the popup page be opened in a normal tab (for testing) and still target a page.
  const requestedTab = Number(new URLSearchParams(location.search).get("tab"))
  tab = requestedTab
    ? await chrome.tabs.get(requestedTab).catch(() => null)
    : (await chrome.tabs.query({ active: true, currentWindow: true }))[0]
  const url = tab && saveableUrl(tab.url || "")
  if (!url) {
    message("This page can't be saved", "Open a web page (http or https) and try again.")
    return
  }

  const user = await getSession()
  if (!user) return signedOut()

  try {
    const [folderList, tagList, lastFolderId] = await Promise.all([listFolders(), listTags().catch(() => []), getLastFolderId()])
    folders = folderList
    const select = $("folder")
    select.replaceChildren(new Option("Unfiled", ""))
    for (const folder of folders) select.append(new Option(folder.shared ? `${folder.name} (shared)` : folder.name, folder.id))
    select.value = folders.some((folder) => folder.id === lastFolderId) ? lastFolderId : ""
    $("tag-suggestions").replaceChildren(...tagList.map((name) => new Option(name)))
  } catch (error) {
    if (error instanceof SignedOutError) return signedOut()
    message("Couldn't load your folders", error.message, { label: "Try again", run: () => location.reload() })
    return
  }

  const host = new URL(url).hostname.replace(/^www\./, "")
  $("host").textContent = host
  $("title").value = tab.title || host
  const favicon = $("favicon")
  if (tab.favIconUrl && /^https?:/.test(tab.favIconUrl)) favicon.src = tab.favIconUrl
  else favicon.hidden = true

  show("state-form")
  $("title").focus()
  $("title").select()
  void checkDuplicate(url)
}

$("tag-input").addEventListener("keydown", (event) => {
  const input = event.currentTarget
  if ((event.key === "Enter" || event.key === ",") && input.value.trim()) {
    event.preventDefault()
    addTag(input.value)
    input.value = ""
  } else if (event.key === "Backspace" && !input.value && tags.length) {
    tags = tags.slice(0, -1)
    renderTags()
  }
})
$("tag-input").addEventListener("change", (event) => {
  // Picking a suggestion from the list adds it straight away.
  const input = event.currentTarget
  if (input.value.trim()) { addTag(input.value); input.value = "" }
})

$("state-form").addEventListener("submit", async (event) => {
  event.preventDefault()
  const pending = $("tag-input").value
  if (pending.trim()) { addTag(pending); $("tag-input").value = "" }
  const save = $("save")
  const error = $("error")
  error.hidden = true
  save.disabled = true
  save.textContent = "Saving…"
  const folderId = $("folder").value
  try {
    await saveBookmark({ url: tab.url, title: $("title").value, folderId, tags })
    await setLastFolderId(folderId)
    const folder = folders.find((item) => item.id === folderId)
    $("saved-text").textContent = `In ${folder ? folder.name : "Unfiled"}${tags.length ? ` · ${tags.map((t) => `#${t}`).join(" ")}` : ""}`
    $("open-saved").onclick = async () => { await openCabinet(folderPath(folderId)); window.close() }
    show("state-saved")
    $("close").focus()
  } catch (failure) {
    if (failure instanceof SignedOutError) return signedOut()
    error.textContent = failure.message || "Couldn't save this page. Try again."
    error.hidden = false
  } finally {
    save.disabled = false
    save.textContent = "Save"
  }
})

$("close").addEventListener("click", () => window.close())

void init()
