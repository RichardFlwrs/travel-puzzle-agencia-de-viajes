import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizes = {
      sm: "h-4 w-4 border-2",
      md: "h-8 w-8 border-3",
      lg: "h-12 w-12 border-4",
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center", className)}
        {...props}
      >
        <div
          className={cn(
            "animate-spin rounded-full border-primary border-t-transparent",
            sizes[size]
          )}
        />
      </div>
    );
  }
);

Loading.displayName = "Loading";

export { Loading };

