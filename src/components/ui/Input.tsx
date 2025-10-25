import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-[var(--tp-space-2)] block text-sm font-medium text-[var(--tp-text-primary)]">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-[var(--tp-radius-lg)] border border-[var(--tp-border-light)] bg-[var(--tp-bg-primary)] px-[var(--tp-space-4)] py-[var(--tp-space-2)] text-base tp-transition-colors",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-[var(--tp-gray-400)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tp-blue-primary focus-visible:ring-offset-1 focus-visible:border-tp-blue-primary",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--tp-gray-50)]",
            error && "border-tp-red focus-visible:ring-tp-red",
            className
          )}
          ref={ref}
          {...props}
        />
        {helperText && !error && (
          <p className="mt-[var(--tp-space-1)] tp-caption text-[var(--tp-text-secondary)]">{helperText}</p>
        )}
        {error && (
          <p className="mt-[var(--tp-space-1)] tp-caption text-tp-red font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };

