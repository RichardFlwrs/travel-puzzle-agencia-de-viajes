import { TourAdapter, NormalizedTour, SyncResult, UnifiedQuery } from './types';

/**
 * Abstract base adapter with common functionality
 * Extend this class when creating new tour provider adapters
 */
export abstract class BaseAdapter implements TourAdapter {
  abstract name: string;

  abstract fetchTours(query: UnifiedQuery): Promise<NormalizedTour[]>;
  abstract fetchTourDetails(id: string): Promise<NormalizedTour | null>;
  
  /**
   * Make an authenticated API request with automatic retry on auth failure
   */
  protected async makeAuthenticatedRequest<T>(
    requestFn: () => Promise<Response>,
    maxRetries: number = 1
  ): Promise<T> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await requestFn();
        
        // Success
        if (response.ok) {
          return response.json();
        }
        
        // Auth error - retry once after re-authentication
        if (response.status === 401 && attempt < maxRetries) {
          console.warn(`[${this.name}] Authentication failed (401), retrying...`);
          await this.handleAuthFailure();
          continue;
        }
        
        // Other error or max retries exceeded
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `API request failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      } catch (err) {
        if (attempt === maxRetries) {
          throw err;
        }
        // Retry on network errors
        console.warn(`[${this.name}] Request failed, retrying...`, err);
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  /**
   * Handle authentication failure - override in subclass
   */
  protected abstract handleAuthFailure(): Promise<void>;

  /**
   * Check if adapter is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Try a simple authenticated request
      await this.fetchTours({ limit: 1 });
      return true;
    } catch (err) {
      console.error(`[${this.name}] Availability check failed:`, err);
      return false;
    }
  }

  /**
   * Optional sync method - not all adapters support this
   */
  async syncToDatabase?(): Promise<SyncResult> {
    throw new Error(`syncToDatabase not implemented for ${this.name}`);
  }

  /**
   * Normalize duration string to standard format
   */
  protected normalizeDuration(duration: string | number): string {
    if (typeof duration === 'number') {
      // Assume minutes
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      
      if (hours > 0 && minutes > 0) {
        return `${hours} hours ${minutes} minutes`;
      } else if (hours > 0) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      } else {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
      }
    }

    // Parse string format (e.g., "3h", "2.5h", "45m", "3:30")
    const match = duration.match(/^(\d+\.?\d*)([hm])$/);
    if (match) {
      const [, value, unit] = match;
      const numValue = parseFloat(value);
      const unitName = unit === 'h' ? 'hours' : 'minutes';
      return `${numValue} ${unitName}`;
    }

    // Try HH:MM format
    const timeMatch = duration.match(/^(\d+):(\d+)$/);
    if (timeMatch) {
      const [, hours, minutes] = timeMatch;
      return this.normalizeDuration(parseInt(hours) * 60 + parseInt(minutes));
    }

    // Return as-is if can't parse
    return duration;
  }

  /**
   * Format price with currency
   */
  protected formatPrice(amount: number, currency: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch {
      // Fallback if currency is invalid
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  /**
   * Log adapter activity
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info', error?: unknown): void {
    const prefix = `[${this.name}]`;
    
    switch (level) {
      case 'info':
        console.log(prefix, message);
        break;
      case 'warn':
        console.warn(prefix, message, error || '');
        break;
      case 'error':
        console.error(prefix, message, error || '');
        break;
    }
  }
}

