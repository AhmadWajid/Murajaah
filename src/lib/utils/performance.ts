import React from 'react';

// Performance monitoring utility for tracking database operations and app performance

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled = process.env.NODE_ENV === 'development';

  // Track operation performance
  async trackOperation<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    if (!this.isEnabled) {
      return fn();
    }

    const startTime = performance.now();
    const timestamp = Date.now();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      this.metrics.push({
        operation,
        duration,
        timestamp,
        success: true
      });

      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.metrics.push({
        operation,
        duration,
        timestamp,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  // Get performance summary
  getSummary() {
    if (!this.isEnabled) return null;

    const recentMetrics = this.metrics.filter(
      m => Date.now() - m.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    if (recentMetrics.length === 0) return null;

    const operationStats: Record<string, {
      count: number;
      avgDuration: number;
      minDuration: number;
      maxDuration: number;
      errorCount: number;
    }> = {};

    recentMetrics.forEach(metric => {
      if (!operationStats[metric.operation]) {
        operationStats[metric.operation] = {
          count: 0,
          avgDuration: 0,
          minDuration: Infinity,
          maxDuration: 0,
          errorCount: 0
        };
      }

      const stats = operationStats[metric.operation];
      stats.count++;
      stats.avgDuration = (stats.avgDuration * (stats.count - 1) + metric.duration) / stats.count;
      stats.minDuration = Math.min(stats.minDuration, metric.duration);
      stats.maxDuration = Math.max(stats.maxDuration, metric.duration);
      
      if (!metric.success) {
        stats.errorCount++;
      }
    });

    return {
      totalOperations: recentMetrics.length,
      operationStats,
      slowOperations: recentMetrics.filter(m => m.duration > 1000),
      errors: recentMetrics.filter(m => !m.success)
    };
  }

  // Clear old metrics
  cleanup() {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    this.metrics = this.metrics.filter(m => m.timestamp > fiveMinutesAgo);
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Decorator for tracking function performance
export function trackPerformance(operationName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const operation = operationName || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.trackOperation(operation, () => method.apply(this, args));
    };
  };
}

// Utility function for tracking async operations
export async function trackAsyncOperation<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  return performanceMonitor.trackOperation(operation, fn);
}

// React hook for tracking component render performance
export function useRenderTracking(componentName: string) {
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef(performance.now());

  React.useEffect(() => {
    renderCount.current++;
    const currentTime = performance.now();
    const renderDuration = currentTime - lastRenderTime.current;
    
    if (renderDuration > 16) { // Longer than one frame
      console.warn(`Slow render detected in ${componentName}: ${renderDuration.toFixed(2)}ms (render #${renderCount.current})`);
    }
    
    lastRenderTime.current = currentTime;
  });
}

// Performance optimization utilities
export const performanceUtils = {
  // Debounce function calls
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function calls
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Memoize expensive calculations
  memoize<T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>();
    
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  // Batch DOM updates
  batchDOMUpdates(updates: (() => void)[]): void {
    if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
      requestAnimationFrame(() => {
        updates.forEach(update => update());
      });
    } else {
      updates.forEach(update => update());
    }
  }
};

// Auto-cleanup metrics every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    performanceMonitor.cleanup();
  }, 5 * 60 * 1000);
}

// Export performance summary for debugging
if (typeof window !== 'undefined') {
  (window as any).getPerformanceSummary = () => performanceMonitor.getSummary();
} 