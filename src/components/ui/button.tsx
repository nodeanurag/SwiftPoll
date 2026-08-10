import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-bg hover:bg-brand-600 shadow-sm hover:shadow-[0_0_15px_rgba(159,141,252,0.2)] dark:hover:shadow-[0_0_15px_rgba(159,141,252,0.4)] border border-brand-500",
  secondary:
    "bg-subtle text-fg hover:bg-border/50 shadow-sm border border-border",
  ghost: "bg-transparent text-muted-fg hover:text-fg hover:bg-subtle",
  danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 rounded-[var(--radius)] font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
        "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
