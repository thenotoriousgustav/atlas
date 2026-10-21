import { cn } from "@/lib/utils"

export function CabinetBrand({ className }: { className?: string }) {
  return <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
    <svg viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-6 shrink-0 text-foreground" aria-hidden="true">
      <rect x="2" y="2" width="20" height="24" rx="2" />
      <path d="M2 14h20M9 8h6M9 20h6" strokeLinecap="round" />
    </svg>
    <span className="font-serif text-2xl leading-none tracking-tight text-foreground">Cabinet</span>
  </div>
}
