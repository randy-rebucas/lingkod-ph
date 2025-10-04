import React from 'react';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || process.env.ENABLE_PERFORMANCE_MONITORING === 'true';
  }

  start(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  end(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log slow operations
    if (duration > 1000) { // 1 second
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, metric.metadata);
    }

    // Log to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.logToAnalytics(metric);
    }

    this.metrics.delete(name);
    return duration;
  }

  private logToAnalytics(metric: PerformanceMetric): void {
    // TODO: Implement analytics logging
    // Examples: Google Analytics, Mixpanel, Custom analytics service
    console.log('Performance metric:', metric);
  }

  // Utility method to measure async operations
  async measure<T>(name: string, operation: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await operation();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  // Utility method to measure sync operations
  measureSync<T>(name: string, operation: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata);
    try {
      const result = operation();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  // Get all current metrics
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for measuring component render times
export function usePerformanceMonitor(componentName: string) {
  const startTime = performance.now();
  
  return {
    endRender: () => {
      const duration = performance.now() - startTime;
      if (duration > 16) { // 16ms = 60fps threshold
        console.warn(`Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`);
      }
    },
  };
}

// Higher-order component for measuring component performance
export function withPerformanceMonitor<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    const { endRender } = usePerformanceMonitor(componentName);
    
    React.useEffect(() => {
      endRender();
    });

    return React.createElement(WrappedComponent, props);
  };
}

// Utility functions for common performance measurements
export const measureApiCall = async <T>(
  apiName: string,
  apiCall: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  return performanceMonitor.measure(`api:${apiName}`, apiCall, metadata);
};

export const measureDatabaseQuery = async <T>(
  queryName: string,
  query: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  return performanceMonitor.measure(`db:${queryName}`, query, metadata);
};

export const measureFileOperation = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  return performanceMonitor.measure(`file:${operationName}`, operation, metadata);
};

// Web Vitals monitoring
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Core Web Vitals
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
    onCLS((metric: any) => {
      console.log('CLS:', metric);
      // Send to analytics
    });

    onFID((metric: any) => {
      console.log('FID:', metric);
      // Send to analytics
    });

    onFCP((metric: any) => {
      console.log('FCP:', metric);
      // Send to analytics
    });

    onLCP((metric: any) => {
      console.log('LCP:', metric);
      // Send to analytics
    });

    onTTFB((metric: any) => {
      console.log('TTFB:', metric);
      // Send to analytics
    });
  });
}
