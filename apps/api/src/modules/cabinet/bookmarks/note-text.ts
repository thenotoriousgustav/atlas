type NoteNode = { type?: string; text?: string; content?: NoteNode[] }

const textBlocks = new Set(["paragraph", "heading", "codeBlock"])

function inlineText(node: NoteNode): string {
  if (node.type === "hardBreak") return "\n"
  if (typeof node.text === "string") return node.text
  return Array.isArray(node.content) ? node.content.map(inlineText).join("") : ""
}

function blockLines(node: unknown): string[] {
  if (!node || typeof node !== "object") return []
  const block = node as NoteNode
  if (block.type && textBlocks.has(block.type)) return [inlineText(block)]
  // Quotes, lists and the document itself only hold other blocks.
  return Array.isArray(block.content) ? block.content.flatMap(blockLines) : []
}

/** Plain text of a structured note, one line per block, so search can find what it says. */
export function noteDocumentText(document: unknown): string {
  return blockLines(document).map((line) => line.trim()).filter(Boolean).join("\n")
}
