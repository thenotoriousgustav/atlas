import assert from "node:assert/strict"
import test from "node:test"
import { emptyScene, keptFiles, sceneKey, storedAppState } from "../src/lib/drawing-scene.ts"

test("only canvas settings are stored, with a white default background", () => {
  assert.deepEqual(storedAppState({ zoom: { value: 2 }, scrollX: 40, selectedElementIds: { a: true } }), { viewBackgroundColor: "#ffffff" })
  assert.deepEqual(storedAppState({ viewBackgroundColor: "#fdf6e3", gridModeEnabled: true }), { viewBackgroundColor: "#fdf6e3", gridModeEnabled: true })
})

test("images removed from the canvas are not saved again", () => {
  const files = { keep: { id: "keep" }, gone: { id: "gone" }, deleted: { id: "deleted" } }
  const elements = [{ type: "image", fileId: "keep" }, { type: "image", fileId: "deleted", isDeleted: true }, { type: "rectangle" }]
  assert.deepEqual(Object.keys(keptFiles(elements, files)), ["keep"])
})

test("the save key changes with the drawing, not with pointer or zoom state", () => {
  const scene = { elements: [{ id: "a", version: 3 }], appState: { viewBackgroundColor: "#ffffff" }, files: {} }
  assert.equal(sceneKey(scene, 10), sceneKey({ ...scene }, 10))
  assert.notEqual(sceneKey(scene, 10), sceneKey(scene, 11))
  assert.notEqual(sceneKey(scene, 10), sceneKey({ ...scene, appState: { viewBackgroundColor: "#000000" } }, 10))
  assert.deepEqual(emptyScene(), { elements: [], appState: {}, files: {} })
})
