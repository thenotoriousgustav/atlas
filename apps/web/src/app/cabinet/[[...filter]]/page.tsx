"use client"

import dynamic from "next/dynamic"

const CabinetDashboard = dynamic(
  () => import("../cabinet-dashboard").then((module) => module.CabinetDashboard),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex min-h-[100dvh] items-center justify-center bg-brand-canvas text-sm text-brand-muted"
        role="status"
      >
        Loading Cabinet...
      </div>
    ),
  }
)

export default function CabinetPage() {
  return <CabinetDashboard />
}
