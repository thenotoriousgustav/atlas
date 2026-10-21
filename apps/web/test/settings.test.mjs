import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { registerHooks } from "node:module"
import test from "node:test"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === "next/link") {
      return {
        url: new URL("./fixtures/next-link.mjs", import.meta.url).href,
        shortCircuit: true,
      }
    }
    if (specifier === "next/navigation") {
      return {
        url: "data:text/javascript,export function useRouter(){return{push(){},replace(){},back(){}}};",
        shortCircuit: true,
      }
    }
    if (specifier === "@/lib/api-client") {
      return {
        url: "data:text/javascript,export function useBookmarksControllerFindAll(){return {data:null}};export function useBookmarksControllerGetHealthSummary(){return {data:{total:10,ok:8,redirected:1,broken:1,trash:2},isFetching:false,refetch(){}}};export function useBookmarksControllerGetDuplicates(){return {data:[],isFetching:false,refetch(){}}};export function useBookmarksControllerCleanDuplicates(){return {mutateAsync(){}}};export function useBookmarksControllerTriggerHealthCheck(){return {mutateAsync(){}}};export function useBookmarksControllerImport(){return {mutateAsync(){}}};export function useTagsControllerFindAll(){return {data:{data:[]},isLoading:false,isError:false,refetch(){}}};export const AXIOS_INSTANCE={get:async()=>({data:''}),delete:async()=>({data:''}),post:async()=>({data:''}),patch:async()=>({data:''})};",
        shortCircuit: true,
      }
    }
    if (specifier.startsWith("@/") || (specifier.startsWith(".") && context.parentURL?.startsWith("file:"))) {
      const path = specifier.startsWith("@/")
        ? new URL(`../src/${specifier.slice(2)}`, import.meta.url)
        : new URL(specifier, context.parentURL)
      for (const extension of [".tsx", ".ts"]) {
        try {
          readFileSync(new URL(path.href + extension))
          return { url: path.href + extension, shortCircuit: true }
        } catch {}
      }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.endsWith(".tsx") || url.endsWith(".ts")) {
      return {
        format: "module",
        shortCircuit: true,
        source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
          compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext },
        }).outputText,
      }
    }
    return next(url, context)
  },
})

const { Providers } = await import("../src/app/providers.tsx")
const SettingsPage = (await import("../src/app/cabinet/settings/page.tsx")).default

test("SettingsPage renders with all major configuration sections", () => {
  const html = renderToStaticMarkup(
    React.createElement(Providers, null, React.createElement(SettingsPage, null))
  )

  // Header & Navigation
  assert.match(html, /Settings/)
  assert.match(html, /Back to Cabinet/)

  // Tabs
  assert.match(html, /Appearance/)
  assert.match(html, /Account/)
  assert.match(html, /Data &amp; Export|Data & Export/)
  assert.match(html, />Tags</)
  assert.match(html, /Maintenance/)
  assert.match(html, /Shortcuts/)

  // Active appearance tab content
  assert.match(html, /Theme/)
  assert.match(html, /Layout &amp; density|Layout & density/)
  assert.match(html, /Visible details/)
  assert.match(html, /Preview image/)
  assert.match(html, /Comfortable/)
  assert.match(html, /Compact/)
  assert.match(html, /Display preview/)
})
