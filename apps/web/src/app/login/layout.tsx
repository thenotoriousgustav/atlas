import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Providers } from "../providers"

export const metadata: Metadata = {
  title: "Sign in — Cabinet",
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>
}
