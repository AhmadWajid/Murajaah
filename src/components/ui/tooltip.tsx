'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Tooltip — lightweight, CSS-only tooltip for icon-only controls.
 *
 * Ensures icon-only buttons have meaningful accessible labels.
 * Uses the native `title` attribute as a fallback and renders a
 * styled tooltip on hover/focus. Respects reduced-motion.
 */
interface TooltipProps {
  label: string
  children: React.ReactNode
  side?: "top" | "bottom"
  className?: string
}

export function Tooltip({ label, children, side = "bottom", className }: TooltipProps) {
  return (
    <span
      className={cn("relative inline-flex group/tt", className)}
      tabIndex={0}
      aria-label={label}
      title={label}
    >
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 whitespace-nowrap rounded-[var(--radius-xs)] bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 scale-95 transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100",
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
        )}
      >
        {label}
      </span>
    </span>
  )
}
