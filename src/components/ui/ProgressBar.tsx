import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  progress: number; // 0-100
  isLoading: boolean;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ progress, isLoading, showPercentage = false, className, ...props }, ref) => {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.max(0, Math.min(100, progress));

    if (!isLoading && progress >= 100) {
      return null; // Don't show when complete
    }

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      >
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{
              width: `${clampedProgress}%`,
              transition: isLoading ? 'width 0.3s ease-out' : 'none',
            }}
          />
        </div>
        {showPercentage && isLoading && (
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {Math.round(clampedProgress)}%
          </p>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';
