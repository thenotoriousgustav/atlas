import type { Editor } from "@tiptap/react"
import { Plus } from "lucide-react"
import { useEffect, useRef } from "react"

import { TextAlignSelector } from "./bubble-menu/align-selector"
import { ColorSelector } from "./bubble-menu/color-selector"
import { LinkSelector } from "./bubble-menu/link-selector"
import { NodeSelector } from "./bubble-menu/node-selector"
import { TextButtons } from "./bubble-menu/text-buttons"
import { BubbleButton, BubbleSeparator } from "./ui"

export interface BottomBarProps {
  editor: Editor
}

export const BottomBar = ({ editor }: BottomBarProps) => {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const viewport = window.visualViewport
    const bar = barRef.current
    if (!viewport || !bar) {
      return
    }
    const update = () => {
      const inset = window.innerHeight - viewport.height - viewport.offsetTop
      bar.style.setProperty(
        "--block-editor-keyboard-inset",
        `${Math.max(0, inset)}px`
      )
    }
    update()
    viewport.addEventListener("resize", update)
    viewport.addEventListener("scroll", update)
    return () => {
      viewport.removeEventListener("resize", update)
      viewport.removeEventListener("scroll", update)
    }
  }, [])

  const handleAdd = () => {
    const { $from } = editor.state.selection
    const chain = editor.chain().focus()
    if ($from.depth > 0 && $from.parent.textContent) {
      const pos = $from.after()
      chain
        .insertContentAt(pos, { type: "paragraph" })
        .setTextSelection(pos + 1)
    }
    chain.insertContent("/").run()
  }

  const hasTextAlign = editor.extensionManager.extensions.some(
    (ext) => ext.name === "textAlign"
  )

  return (
    <div ref={barRef} className="block-editor-bottom-bar">
      <div className="block-editor-bottom-bar-scroll">
        <BubbleButton
          aria-label="Add block"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAdd}
        >
          <Plus />
        </BubbleButton>
        <NodeSelector editor={editor} />
        <BubbleSeparator />
        <TextButtons editor={editor} />
        <BubbleSeparator />
        <ColorSelector editor={editor} />
        <LinkSelector editor={editor} />
        {hasTextAlign && (
          <>
            <BubbleSeparator />
            <TextAlignSelector editor={editor} />
          </>
        )}
      </div>
    </div>
  )
}
