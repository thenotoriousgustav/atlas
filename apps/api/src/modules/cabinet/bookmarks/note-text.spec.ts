import { noteDocumentText } from "./note-text"

describe("noteDocumentText", () => {
  it("keeps one line per block, including quotes, lists, headings and line breaks", () => {
    expect(noteDocumentText({
      type: "doc",
      content: [
        { type: "heading", content: [{ type: "text", text: "Title" }] },
        { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "Quoted " }, { type: "text", text: "line", marks: [{ type: "bold" }] }] }] },
        { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Item" }] }] }] },
        { type: "paragraph", content: [{ type: "text", text: "a" }, { type: "hardBreak" }, { type: "text", text: "b" }] },
        { type: "paragraph" },
      ],
    })).toBe("Title\nQuoted line\nItem\na\nb")
  })

  it("ignores anything that is not a document", () => {
    expect(noteDocumentText(null)).toBe("")
    expect(noteDocumentText("text")).toBe("")
  })
})
