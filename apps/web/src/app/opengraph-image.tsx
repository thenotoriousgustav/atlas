import { ImageResponse } from "next/og"

export const alt = "Cabinet — A place for what you want to keep. Bookmarks, notes, and reading."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "64px 72px",
          background: "#fbfbfa",
          color: "#242424",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 6 }}>
          CABINET
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: -3,
            lineHeight: 1.12,
          }}
        >
          <span>A place for what</span>
          <span>you want to keep.</span>
        </div>
        <div
          style={{
            display: "flex",
            paddingTop: 24,
            borderTop: "1px solid #eaeaea",
            fontSize: 26,
            color: "#707070",
          }}
        >
          Bookmarks · Notes · Reading
        </div>
      </div>
    ),
    size
  )
}
