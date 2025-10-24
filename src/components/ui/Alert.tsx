import * as React from "react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "info";
  title?: string;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", title, children, ...props }, ref) => {
    const variants = {
      default: "bg-muted border-border",
      success: "bg-success/10 border-success text-success",
      warning: "bg-warning/10 border-warning text-warning",
      error: "bg-error/10 border-error text-error",
      info: "bg-info/10 border-info text-info",
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-lg border p-4",
          variants[variant],
          className
        )}
        {...props}
      >
        {title && (
          <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>
        )}
        <div className="text-sm [&_p]:leading-relaxed">{children}</div>
      </div>
    );
  }
);

Alert.displayName = "Alert";

export { Alert };

