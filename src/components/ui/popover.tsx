'use client';

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Popover — lightweight, consistent dropdown/popover primitive.
 *
 * Establishes ONE interaction pattern for small, focused choices
 * (surah selection, reciter, tajweed legend, small settings menus).
 *
 * - Click trigger to toggle.
 * - Click outside or Escape to close.
 * - Anchored to the trigger; positioned via `align` (start/center/end).
 * - Renders a clean panel-surface with subtle entrance animation.
 *
 * For substantial tasks (forms, destructive confirms) use Dialog instead.
 * For large persistent workflows use a Drawer instead.
 */

interface PopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
  align?: "start" | "center" | "end"
  side?: "bottom" | "top"
  /** Width of the panel. Defaults to a comfortable auto width. */
  panelClassName?: string
  content: React.ReactNode
}

export function Popover({
  open,
  onOpenChange,
  children,
  className,
  align = "start",
  side = "bottom",
  panelClassName,
  content,
}: PopoverProps) {
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const handlePointer = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return
      }
      onOpenChange(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("mousedown", handlePointer)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handlePointer)
      document.removeEventListener("keydown", handleKey)
    }
  }, [open, onOpenChange])

  const alignClass =
    align === "end"
      ? "right-0"
      : align === "center"
        ? "left-1/2 -translate-x-1/2"
        : "left-0"
  const sideClass = side === "top" ? "bottom-full mb-2" : "top-full mt-2"

  return (
    <div ref={triggerRef} className={cn("relative inline-flex", className)}>
      <div
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {children}
      </div>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          className={cn(
            "absolute z-50 panel-surface rounded-[var(--radius-lg)] p-1 animate-popover min-w-[12rem]",
            sideClass,
            alignClass,
            panelClassName
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}

/**
 * PopoverItem — a single selectable row inside a Popover.
 */
export function PopoverItem({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm)] text-sm text-left transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * PopoverLabel — section label inside a popover panel.
 */
export function PopoverLabel({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * PopoverSeparator — subtle divider inside a popover.
 */
export function PopoverSeparator() {
  return <div className="h-px my-1 bg-border" />
}
