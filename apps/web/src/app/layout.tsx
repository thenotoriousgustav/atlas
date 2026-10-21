import "./globals.css"
import React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"

const geist = localFont({ src: "./fonts/geist.woff2", weight: "100 900", variable: "--font-geist-sans", display: "swap" })
const geistMono = localFont({ src: "./fonts/geist-mono.woff2", weight: "100 900", variable: "--font-geist-mono", display: "swap", preload: false })
const instrumentSerif = localFont({
  src: [
    { path: "./fonts/instrument-serif.woff2", weight: "400", style: "normal" },
    { path: "./fonts/instrument-serif-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
})

const description = "Your personal library for bookmarks, notes, and saved reading."

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Cabinet",
  description,
  openGraph: {
    type: "website",
    siteName: "Cabinet",
    title: "Cabinet — A place for what you want to keep.",
    description,
    locale: "en_US",
    url: "./",
  },
  twitter: {
    card: "summary_large_image",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", geist.variable, geistMono.variable)}
    >
      <body
        className={cn(
          instrumentSerif.variable,
          "bg-brand-canvas text-brand-charcoal antialiased"
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
