import assert from "node:assert/strict"

// Run against a running web server; optionally pass the configured public origin.
const base = new URL(process.argv[2] || "http://localhost:3000")
const publicOrigin = new URL(process.argv[3] || base).origin

for (const path of ["/", "/login", "/cabinet"]) {
  const response = await fetch(new URL(path, base), {
    headers: { "user-agent": "WhatsApp/2.24.0" },
    redirect: "manual",
  })
  assert.equal(response.status, 200, `${path} must be accessible without login`)
  const head = (await response.text()).split("</head>")[0]
  const meta = (name) => {
    const tag = head.match(new RegExp(`<meta (?:property|name)="${name}" content="([^"]*)"`))
    assert.ok(tag, `Missing ${name} in ${path} head`)
    return tag[1].replaceAll("&amp;", "&")
  }

  assert.equal(meta("og:site_name"), "Cabinet")
  assert.equal(meta("og:title"), "Cabinet — A place for what you want to keep.")
  assert.equal(meta("og:description"), "Your personal library for bookmarks, notes, and saved reading.")
  assert.equal(meta("og:type"), "website")
  assert.equal(new URL(meta("og:url")).href, new URL(path, publicOrigin).href)
  assert.equal(meta("twitter:card"), "summary_large_image")
  assert.equal(meta("twitter:image"), meta("og:image"))
  assert.equal(meta("og:image:width"), "1200")
  assert.equal(meta("og:image:height"), "630")
  assert.ok(meta("og:image:alt"))
  if (path !== "/") assert.equal(meta("robots"), "noindex, nofollow")

  const imageUrl = new URL(meta("og:image"))
  assert.equal(imageUrl.origin, publicOrigin)
  const image = await fetch(new URL(imageUrl.pathname + imageUrl.search, base))
  assert.equal(image.status, 200)
  assert.match(image.headers.get("content-type"), /^image\/png/)
  const png = Buffer.from(await image.arrayBuffer())
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a")
  assert.equal(png.readUInt32BE(16), 1200)
  assert.equal(png.readUInt32BE(20), 630)
  console.log(`PASS ${path}: public metadata and 1200 × 630 PNG`)
}
