import { SignedOutError, getLastFolderId, openCabinet, saveBookmark, saveableUrl } from "./cabinet.js"

const MENU_PAGE = "cabinet-save-page"
const MENU_LINK = "cabinet-save-link"

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: MENU_PAGE, title: "Save page to Cabinet", contexts: ["page"], documentUrlPatterns: ["http://*/*", "https://*/*"] })
    chrome.contextMenus.create({ id: MENU_LINK, title: "Save link to Cabinet", contexts: ["link"], targetUrlPatterns: ["http://*/*", "https://*/*"] })
  })
})

/** A short mark on the toolbar icon: a check when saved, "!" when it failed. */
async function flash(tabId, ok) {
  const options = tabId ? { tabId } : {}
  await chrome.action.setBadgeBackgroundColor({ ...options, color: ok ? "#596344" : "#9f2430" })
  await chrome.action.setBadgeText({ ...options, text: ok ? "✓" : "!" })
  await chrome.action.setTitle({ ...options, title: ok ? "Saved to Cabinet" : "Couldn't save to Cabinet" })
  setTimeout(() => {
    chrome.action.setBadgeText({ ...options, text: "" })
    chrome.action.setTitle({ ...options, title: "Save to Cabinet" })
  }, 2500)
}

/** Saves without the popup, into the folder used last. */
async function quickSave({ url, title, tabId }) {
  if (!saveableUrl(url || "")) return flash(tabId, false)
  try {
    await saveBookmark({ url, title, folderId: await getLastFolderId() })
    await flash(tabId, true)
  } catch (error) {
    await flash(tabId, false)
    if (error instanceof SignedOutError) await openCabinet("/login")
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_PAGE) {
    void quickSave({ url: info.pageUrl || tab?.url, title: tab?.title, tabId: tab?.id })
  } else if (info.menuItemId === MENU_LINK) {
    // A link's own title is unknown here; Cabinet fetches it from the page.
    void quickSave({ url: info.linkUrl, title: info.selectionText || undefined, tabId: tab?.id })
  }
})

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== "quick-save") return
  const active = tab ?? (await chrome.tabs.query({ active: true, currentWindow: true }))[0]
  if (active) void quickSave({ url: active.url, title: active.title, tabId: active.id })
})
