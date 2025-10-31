import { TourAdapter } from './types';
import { freeTourAdapter } from './freetour-adapter';
import { viatorAdapter } from './viator-adapter';

/**
 * Adapter Registry
 * Central management system for all tour provider adapters
 */
class AdapterRegistry {
  private adapters: Map<string, TourAdapter> = new Map();

  /**
   * Register a new adapter
   */
  registerAdapter(adapter: TourAdapter): void {
    if (this.adapters.has(adapter.name)) {
      console.warn(`[Registry] Adapter '${adapter.name}' already registered, skipping...`);
      return;
    }

    this.adapters.set(adapter.name, adapter);
    console.log(`[Registry] Registered adapter: ${adapter.name}`);
  }

  /**
   * Get an adapter by name
   */
  getAdapter(name: string): TourAdapter {
    const adapter = this.adapters.get(name);
    
    if (!adapter) {
      throw new Error(`Adapter '${name}' not found in registry`);
    }

    return adapter;
  }

  /**
   * Get all registered adapters
   */
  getAllAdapters(): TourAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Get all adapter names
   */
  getAdapterNames(): string[] {
    return Array.from(this.adapters.keys());
  }

  /**
   * Check if adapter exists
   */
  hasAdapter(name: string): boolean {
    return this.adapters.has(name);
  }

  /**
   * Get available adapters (that pass availability check)
   */
  async getAvailableAdapters(): Promise<TourAdapter[]> {
    const adapters = this.getAllAdapters();
    const availabilityChecks = await Promise.allSettled(
      adapters.map(async (adapter) => ({
        adapter,
        available: await adapter.isAvailable(),
      }))
    );

    return availabilityChecks
      .filter(result => result.status === 'fulfilled' && result.value.available)
      .map(result => (result as PromiseFulfilledResult<{ adapter: TourAdapter; available: boolean }>).value.adapter);
  }

  /**
   * Unregister an adapter (for testing)
   */
  unregisterAdapter(name: string): boolean {
    return this.adapters.delete(name);
  }

  /**
   * Clear all adapters (for testing)
   */
  clear(): void {
    this.adapters.clear();
  }
}

// Create singleton registry
const registry = new AdapterRegistry();

// Register default adapters
registry.registerAdapter(freeTourAdapter);
registry.registerAdapter(viatorAdapter);

// Export registry and helper functions
export { registry };

/**
 * Get an adapter by name (convenience function)
 */
export function getAdapter(name: string): TourAdapter {
  return registry.getAdapter(name);
}

/**
 * Get all registered adapters (convenience function)
 */
export function getAllAdapters(): TourAdapter[] {
  return registry.getAllAdapters();
}

/**
 * Get adapter names (convenience function)
 */
export function getAdapterNames(): string[] {
  return registry.getAdapterNames();
}

