/** The part of an Excalidraw scene Cabinet stores for a drawing. */
export type DrawingScene = {
  elements: any[]
  appState: Record<string, unknown>
  files: Record<string, any>
}

export const emptyScene = (): DrawingScene => ({ elements: [], appState: {}, files: {} })

/** Only the canvas settings worth keeping; the rest of Excalidraw's state is per session. */
export function storedAppState(appState: Record<string, any>): Record<string, unknown> {
  return {
    viewBackgroundColor: appState.viewBackgroundColor ?? "#ffffff",
    ...(appState.gridModeEnabled ? { gridModeEnabled: true } : {}),
  }
}

/** Embedded images still used by a visible element; removed images are not saved again. */
export function keptFiles(elements: readonly any[], files: Record<string, any> = {}): Record<string, any> {
  const used = new Set(elements.filter((element) => !element.isDeleted && element.fileId).map((element) => element.fileId))
  return Object.fromEntries(Object.entries(files).filter(([id]) => used.has(id)))
}

/** Changes when the drawing changes, not when the pointer, selection, or zoom does. */
export function sceneKey(scene: DrawingScene, elementsHash?: number): string {
  const hash = elementsHash ?? scene.elements.reduce((sum, element) => sum + (element.version ?? 0) * 31 + (element.isDeleted ? 1 : 0), scene.elements.length)
  return `${hash}|${scene.appState.viewBackgroundColor ?? ""}|${scene.appState.gridModeEnabled ? 1 : 0}|${Object.keys(scene.files).sort().join(",")}`
}
