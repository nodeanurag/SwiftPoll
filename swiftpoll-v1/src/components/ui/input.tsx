import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const baseField =
  "w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-[var(--color-fg)] placeholder:text-[var(--color-muted-fg)] transition-colors duration-200 focus-visible:outline-none focus-visible:border-[var(--color-fg)] focus-visible:ring-1 focus-visible:ring-[var(--color-fg)] shadow-sm";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(baseField, "h-12", className)} {...props} />
  ),
);
Input.displayName = "Input";

export { baseField };
