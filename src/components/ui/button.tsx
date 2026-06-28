import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-teal-600 text-slate-50 shadow-md hover:bg-teal-500 shadow-teal-600/10 active:scale-98": variant === "default",
            "bg-rose-600 text-slate-50 shadow-sm hover:bg-rose-500 active:scale-98": variant === "destructive",
            "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white": variant === "outline",
            "bg-white/10 text-slate-200 shadow-sm hover:bg-white/15 hover:text-white": variant === "secondary",
            "text-slate-300 hover:bg-white/5 hover:text-white": variant === "ghost",
            "text-teal-400 underline-offset-4 hover:underline": variant === "link",
            "h-9 px-4 py-2": size === "default",
            "h-8 rounded-md px-3 text-xs": size === "sm",
            "h-10 rounded-md px-8": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
