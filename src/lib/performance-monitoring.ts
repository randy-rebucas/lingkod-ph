/**
 * Performance Monitoring System
 * 
 * This module provides comprehensive performance monitoring including:
 * - Core Web Vitals tracking
 * - Custom performance metrics
 * - User experience monitoring
 * - Performance analytics and reporting
 */

import { onCLS, onFID, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';

export interface PerformanceMetric {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType: string;
  timestamp: number;
  url: string;
  userAgent: string;
  connection?: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

export interface PerformanceReport {
  sessionId: string;
  userId?: string;
  timestamp: Date;
  metrics: PerformanceMetric[];
  userAgent: string;
  url: string;
  viewport: {
    width: number;
    height: number;
  };
  connection: {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  device: {
    memory?: number;
    cores?: number;
    platform?: string;
  };
}

class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetric[] = [];
  private sessionId: string;
  private isEnabled: boolean = true;
  private readonly MAX_METRICS_PER_SESSION = 50;
  private readonly BATCH_SIZE = 10;
  private batchQueue: PerformanceMetric[] = [];

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupPerformanceMonitoring();
    this.setupCustomMetrics();
    this.startBatchProcessor();
  }

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Setup Core Web Vitals monitoring
   */
  private setupPerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Core Web Vitals
    onCLS(this.handleMetric.bind(this));
    onFID(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));

    // Additional performance metrics
    this.measurePageLoadTime();
    this.measureResourceTiming();
    this.measureUserInteraction();
  }

  /**
   * Setup custom performance metrics
   */
  private setupCustomMetrics(): void {
    if (typeof window === 'undefined') return;

    // Measure component render times
    this.measureComponentPerformance();
    
    // Measure API response times
    this.measureAPIPerformance();
    
    // Measure image loading performance
    this.measureImagePerformance();
    
    // Measure bundle loading performance
    this.measureBundlePerformance();
  }

  /**
   * Handle Core Web Vitals metrics
   */
  private handleMetric(metric: Metric): void {
    if (!this.isEnabled) return;

    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo(),
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
    };

    this.addMetric(performanceMetric);
  }

  /**
   * Measure page load time
   */
  private measurePageLoadTime(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.addMetric({
          name: 'page-load-time',
          value: navigation.loadEventEnd - navigation.fetchStart,
          delta: 0,
          id: `page-load-${Date.now()}`,
          navigationType: 'navigate',
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          connection: this.getConnectionInfo(),
          deviceMemory: (navigator as any).deviceMemory,
          hardwareConcurrency: navigator.hardwareConcurrency,
        });
      }
    });
  }

  /**
   * Measure resource timing
   */
  private measureResourceTiming(): void {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Only track slow resources (>1s)
          if (resourceEntry.duration > 1000) {
            this.addMetric({
              name: 'slow-resource',
              value: resourceEntry.duration,
              delta: 0,
              id: `resource-${Date.now()}`,
              navigationType: 'navigate',
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
              connection: this.getConnectionInfo(),
              deviceMemory: (navigator as any).deviceMemory,
              hardwareConcurrency: navigator.hardwareConcurrency,
            });
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Measure user interaction performance
   */
  private measureUserInteraction(): void {
    if (typeof window === 'undefined') return;

    let interactionStart = 0;

    // Measure click response time
    document.addEventListener('click', (_event) => {
      interactionStart = performance.now();
    });

    // Measure scroll performance
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollTime = performance.now() - interactionStart;
        if (scrollTime > 0) {
          this.addMetric({
            name: 'scroll-performance',
            value: scrollTime,
            delta: 0,
            id: `scroll-${Date.now()}`,
            navigationType: 'navigate',
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            connection: this.getConnectionInfo(),
            deviceMemory: (navigator as any).deviceMemory,
            hardwareConcurrency: navigator.hardwareConcurrency,
          });
        }
      }, 100);
    });
  }

  /**
   * Measure component performance
   */
  private measureComponentPerformance(): void {
    if (typeof window === 'undefined') return;

    // Override React's performance measurement if available
    if ((window as any).React && (window as any).React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
      const ReactInternals = (window as any).React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      
      if (ReactInternals.ReactDebugCurrentFrame) {
        const originalGetCurrentStack = ReactInternals.ReactDebugCurrentFrame.getCurrentStack;
        
        ReactInternals.ReactDebugCurrentFrame.getCurrentStack = function() {
          const start = performance.now();
          const result = originalGetCurrentStack.call(this);
          const end = performance.now();
          
          if (end - start > 16) { // More than one frame (16ms)
            // Log slow component renders
            console.warn('Slow component render detected:', end - start, 'ms');
          }
          
          return result;
        };
      }
    }
  }

  /**
   * Measure API performance
   */
  private measureAPIPerformance(): void {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const start = performance.now();
      const _url = args[0] as string;
      
      try {
        const response = await originalFetch(...args);
        const end = performance.now();
        const duration = end - start;
        
        // Track slow API calls (>2s)
        if (duration > 2000) {
          this.addMetric({
            name: 'slow-api-call',
            value: duration,
            delta: 0,
            id: `api-${Date.now()}`,
            navigationType: 'navigate',
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            connection: this.getConnectionInfo(),
            deviceMemory: (navigator as any).deviceMemory,
            hardwareConcurrency: navigator.hardwareConcurrency,
          });
        }
        
        return response;
      } catch (error) {
        const end = performance.now();
        const duration = end - start;
        
        this.addMetric({
          name: 'api-error',
          value: duration,
          delta: 0,
          id: `api-error-${Date.now()}`,
          navigationType: 'navigate',
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          connection: this.getConnectionInfo(),
          deviceMemory: (navigator as any).deviceMemory,
          hardwareConcurrency: navigator.hardwareConcurrency,
        });
        
        throw error;
      }
    };
  }

  /**
   * Measure image loading performance
   */
  private measureImagePerformance(): void {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource' && entry.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
          const imageEntry = entry as PerformanceResourceTiming;
          
          // Track slow image loads (>3s)
          if (imageEntry.duration > 3000) {
            this.addMetric({
              name: 'slow-image-load',
              value: imageEntry.duration,
              delta: 0,
              id: `image-${Date.now()}`,
              navigationType: 'navigate',
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
              connection: this.getConnectionInfo(),
              deviceMemory: (navigator as any).deviceMemory,
              hardwareConcurrency: navigator.hardwareConcurrency,
            });
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Measure bundle loading performance
   */
  private measureBundlePerformance(): void {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource' && entry.name.includes('.js')) {
          const scriptEntry = entry as PerformanceResourceTiming;
          
          // Track slow script loads (>2s)
          if (scriptEntry.duration > 2000) {
            this.addMetric({
              name: 'slow-script-load',
              value: scriptEntry.duration,
              delta: 0,
              id: `script-${Date.now()}`,
              navigationType: 'navigate',
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
              connection: this.getConnectionInfo(),
              deviceMemory: (navigator as any).deviceMemory,
              hardwareConcurrency: navigator.hardwareConcurrency,
            });
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  /**
   * Add metric to collection
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    this.batchQueue.push(metric);
    
    // Prevent memory leaks
    if (this.metrics.length > this.MAX_METRICS_PER_SESSION) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS_PER_SESSION);
    }
  }

  /**
   * Start batch processor for sending metrics
   */
  private startBatchProcessor(): void {
    setInterval(() => {
      if (this.batchQueue.length > 0) {
        this.processBatch();
      }
    }, 10000); // Process every 10 seconds
  }

  /**
   * Process batch of metrics
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = this.batchQueue.splice(0, this.BATCH_SIZE);
    
    try {
      await this.sendMetrics(batch);
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
      // Re-queue failed metrics
      this.batchQueue.unshift(...batch);
    }
  }

  /**
   * Send metrics to server
   */
  private async sendMetrics(metrics: PerformanceMetric[]): Promise<void> {
    try {
      const report: PerformanceReport = {
        sessionId: this.sessionId,
        userId: this.getCurrentUserId(),
        timestamp: new Date(),
        metrics,
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        connection: this.getConnectionInfo(),
        device: {
          memory: (navigator as any).deviceMemory,
          cores: navigator.hardwareConcurrency,
          platform: navigator.platform,
        },
      };

      // Send to multiple analytics services
      await Promise.allSettled([
        this.sendToGoogleAnalytics(report),
        this.sendToMixpanel(report),
        this.sendToAmplitude(report),
        this.sendToCustomAnalytics(report),
      ]);
    } catch (error) {
      console.error('Failed to send performance report:', error);
    }
  }

  /**
   * Send performance data to Google Analytics
   */
  private async sendToGoogleAnalytics(report: PerformanceReport): Promise<void> {
    if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) return;

    try {
      // Send Core Web Vitals to Google Analytics
      for (const metric of report.metrics) {
        if (['CLS', 'FID', 'FCP', 'LCP', 'TTFB'].includes(metric.name)) {
          // Use gtag if available
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', metric.name, {
              event_category: 'Web Vitals',
              event_label: metric.id,
              value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
              non_interaction: true,
            });
          }
        }
      }
    } catch (error) {
      console.warn('Failed to send to Google Analytics:', error);
    }
  }

  /**
   * Send performance data to Mixpanel
   */
  private async sendToMixpanel(report: PerformanceReport): Promise<void> {
    if (!process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) return;

    try {
      const mixpanelData = {
        event: 'Performance Metrics',
        properties: {
          token: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
          distinct_id: report.userId || 'anonymous',
          session_id: report.sessionId,
          timestamp: report.timestamp.toISOString(),
          url: report.url,
          user_agent: report.userAgent,
          viewport: report.viewport,
          connection: report.connection,
          device: report.device,
          metrics: report.metrics.reduce((acc, metric) => {
            acc[metric.name.toLowerCase()] = metric.value;
            return acc;
          }, {} as Record<string, number>),
        },
      };

      await fetch('https://api.mixpanel.com/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mixpanelData),
      });
    } catch (error) {
      console.warn('Failed to send to Mixpanel:', error);
    }
  }

  /**
   * Send performance data to Amplitude
   */
  private async sendToAmplitude(report: PerformanceReport): Promise<void> {
    if (!process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY) return;

    try {
      const amplitudeData = {
        api_key: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY,
        events: [{
          user_id: report.userId || 'anonymous',
          session_id: report.sessionId,
          event_type: 'Performance Metrics',
          time: Math.floor(report.timestamp.getTime()),
          event_properties: {
            url: report.url,
            user_agent: report.userAgent,
            viewport: report.viewport,
            connection: report.connection,
            device: report.device,
            metrics: report.metrics.reduce((acc, metric) => {
              acc[metric.name.toLowerCase()] = metric.value;
              return acc;
            }, {} as Record<string, number>),
          },
        }],
      };

      await fetch('https://api2.amplitude.com/2/httpapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(amplitudeData),
      });
    } catch (error) {
      console.warn('Failed to send to Amplitude:', error);
    }
  }

  /**
   * Send performance data to custom analytics endpoint
   */
  private async sendToCustomAnalytics(report: PerformanceReport): Promise<void> {
    if (!process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) return;

    try {
      await fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.ANALYTICS_API_KEY && { 'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY}` }),
        },
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.warn('Failed to send to custom analytics:', error);
    }
  }

  /**
   * Get connection information
   */
  private getConnectionInfo(): any {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      };
    }
    return undefined;
  }

  /**
   * Get current user ID
   */
  private getCurrentUserId(): string | undefined {
    try {
      // This would typically come from your auth context
      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get performance summary
   */
  public getPerformanceSummary(): {
    totalMetrics: number;
    averageLoadTime: number;
    slowResources: number;
    slowAPICalls: number;
    slowImages: number;
  } {
    const loadTimeMetrics = this.metrics.filter(m => m.name === 'page-load-time');
    const slowResources = this.metrics.filter(m => m.name === 'slow-resource').length;
    const slowAPICalls = this.metrics.filter(m => m.name === 'slow-api-call').length;
    const slowImages = this.metrics.filter(m => m.name === 'slow-image-load').length;

    const averageLoadTime = loadTimeMetrics.length > 0
      ? loadTimeMetrics.reduce((sum, m) => sum + m.value, 0) / loadTimeMetrics.length
      : 0;

    return {
      totalMetrics: this.metrics.length,
      averageLoadTime,
      slowResources,
      slowAPICalls,
      slowImages,
    };
  }

  /**
   * Enable/disable monitoring
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Clear metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
    this.batchQueue = [];
  }
}

// Export singleton instance
export const performanceMonitoring = PerformanceMonitoringService.getInstance();

// Export convenience functions
export const startPerformanceMonitoring = () => performanceMonitoring;
export const getPerformanceSummary = () => performanceMonitoring.getPerformanceSummary();
export const clearPerformanceMetrics = () => performanceMonitoring.clearMetrics();

// Custom event tracking functions
export const trackCustomEvent = (eventName: string, properties?: Record<string, any>, userId?: string) => {
  if (typeof window === 'undefined') return;

  const eventData = {
    event: eventName,
    properties: {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      user_agent: navigator.userAgent,
      ...properties,
    },
    userId: userId || 'anonymous',
  };

  // Send to multiple analytics services
  Promise.allSettled([
    sendToGoogleAnalyticsEvent(eventData),
    sendToMixpanelEvent(eventData),
    sendToAmplitudeEvent(eventData),
  ]).catch(error => {
    console.warn('Failed to track custom event:', error);
  });
};

const sendToGoogleAnalyticsEvent = async (eventData: any) => {
  if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || !(window as any).gtag) return;
  
  (window as any).gtag('event', eventData.event, {
    event_category: 'Custom Event',
    event_label: eventData.properties.url,
    custom_map: eventData.properties,
  });
};

const sendToMixpanelEvent = async (eventData: any) => {
  if (!process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) return;

  const mixpanelData = {
    event: eventData.event,
    properties: {
      token: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
      distinct_id: eventData.userId,
      ...eventData.properties,
    },
  };

  await fetch('https://api.mixpanel.com/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mixpanelData),
  });
};

const sendToAmplitudeEvent = async (eventData: any) => {
  if (!process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY) return;

  const amplitudeData = {
    api_key: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY,
    events: [{
      user_id: eventData.userId,
      event_type: eventData.event,
      time: Math.floor(new Date().getTime()),
      event_properties: eventData.properties,
    }],
  };

  await fetch('https://api2.amplitude.com/2/httpapi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(amplitudeData),
  });
};
export const setPerformanceMonitoringEnabled = (enabled: boolean) => 
  performanceMonitoring.setEnabled(enabled);
