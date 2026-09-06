import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * ControlGroup — a shared container for controls that form one logical group.
 *
 * Visually communicates that its children belong together via a single
 * bordered surface with internal dividers, instead of each control being
 * an independent floating pill.
 *
 * Use `separator` to insert a vertical divider between sub-groups.
 */
const ControlGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { separated?: boolean }
>(({ className, separated, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-[var(--radius)] border border-border bg-secondary/60 dark:bg-secondary/40",
        separated && "[&>*+*]:border-l [&>*+*]:border-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ControlGroup.displayName = "ControlGroup"

/**
 * ControlGroupItem — a single control inside a ControlGroup.
 * Removes its own border/background so the group reads as one surface.
 */
const ControlGroupItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center first:rounded-l-[var(--radius)] last:rounded-r-[var(--radius)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ControlGroupItem.displayName = "ControlGroupItem"

export { ControlGroup, ControlGroupItem }
