import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Design-system Button.
 *
 * Height scale (matches --control-* tokens):
 *   sm  = 32px  (compact, dense toolbars)
 *   md  = 36px  (standard, default)
 *   lg  = 40px  (prominent)
 *   xl  = 44px  (mobile tap target)
 *
 * Radius follows the deliberate scale: sm/md use --radius-sm (8px),
 * lg/xl use --radius (10px). Icon buttons are square.
 *
 * Variant hierarchy:
 *   default     = primary action (solid)
 *   secondary   = secondary action (subtle fill)
 *   outline     = tertiary action (bordered, quiet)
 *   ghost       = minimal, no chrome
 *   destructive = destructive action
 *   link        = inline link
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:border-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-border bg-background hover:bg-secondary hover:text-secondary-foreground dark:bg-transparent dark:border-border dark:hover:bg-secondary/60",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-secondary hover:text-secondary-foreground dark:hover:bg-secondary/60",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-[var(--radius)] px-5 has-[>svg]:px-4",
        xl: "h-11 rounded-[var(--radius)] px-6 has-[>svg]:px-5 text-[15px]",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
