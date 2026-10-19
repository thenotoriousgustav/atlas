"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface CabinetContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function CabinetContainer({
  children,
  className,
  ...props
}: CabinetContainerProps) {
  return (
    <div
      className={cn("w-full px-3 sm:px-4 md:px-5", className)}
      {...props}
    >
      {children}
    </div>
  )
}
