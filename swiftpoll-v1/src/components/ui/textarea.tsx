import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { baseField } from "./input";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(baseField, "min-h-[3.25rem] resize-none py-3 leading-snug", className)}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
