'use server';

import { getDb } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, Timestamp, addDoc } from 'firebase/firestore';

export interface PerformanceMetrics {
  totalReports: number;
  averageLoadTime: number;
  averageLCP: number;
  averageFID: number;
  averageCLS: number;
  averageFCP: number;
  averageTTFB: number;
  slowResources: number;
  slowAPICalls: number;
  slowImages: number;
  slowScripts: number;
  apiErrors: number;
  deviceBreakdown: Record<string, number>;
  connectionBreakdown: Record<string, number>;
}

export interface PerformanceReport {
  id: string;
  sessionId: string;
  userId?: string;
  timestamp: Date;
  metrics: any[];
  url: string;
  viewport: { width: number; height: number };
  connection: { effectiveType?: string; downlink?: number; rtt?: number };
  device: { memory?: number; cores?: number; platform?: string };
}

// Get performance analytics data
export async function getPerformanceAnalytics(params: {
  timeframe?: '1h' | '24h' | '7d' | '30d';
  limit?: number;
}): Promise<{ success: boolean; data?: { aggregatedMetrics: PerformanceMetrics; reports: PerformanceReport[] }; error?: string }> {
  try {
    const db = getDb();
    const reportsRef = collection(db, 'performance-reports');
    
    // Calculate time range based on timeframe
    const now = new Date();
    let startTime: Date;
    
    switch (params.timeframe || '24h') {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    // Query performance reports
    const q = query(
      reportsRef,
      where('timestamp', '>=', Timestamp.fromDate(startTime)),
      orderBy('timestamp', 'desc'),
      limit(params.limit || 100)
    );
    
    const snapshot = await getDocs(q);
    const reports: PerformanceReport[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
      } as PerformanceReport);
    });
    
    // Calculate aggregated metrics
    const aggregatedMetrics = calculateAggregatedMetrics(reports);
    
    return { 
      success: true, 
      data: { 
        aggregatedMetrics, 
        reports 
      } 
    };
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    return { success: false, error: 'Failed to fetch performance analytics' };
  }
}

// Calculate aggregated metrics from reports
function calculateAggregatedMetrics(reports: PerformanceReport[]): PerformanceMetrics {
  if (reports.length === 0) {
    return {
      totalReports: 0,
      averageLoadTime: 0,
      averageLCP: 0,
      averageFID: 0,
      averageCLS: 0,
      averageFCP: 0,
      averageTTFB: 0,
      slowResources: 0,
      slowAPICalls: 0,
      slowImages: 0,
      slowScripts: 0,
      apiErrors: 0,
      deviceBreakdown: {},
      connectionBreakdown: {},
    };
  }
  
  let totalLoadTime = 0;
  let totalLCP = 0;
  let totalFID = 0;
  let totalCLS = 0;
  let totalFCP = 0;
  let totalTTFB = 0;
  let slowResources = 0;
  let slowAPICalls = 0;
  let slowImages = 0;
  let slowScripts = 0;
  let apiErrors = 0;
  
  const deviceBreakdown: Record<string, number> = {};
  const connectionBreakdown: Record<string, number> = {};
  
  reports.forEach((report) => {
    // Process metrics
    report.metrics.forEach((metric) => {
      switch (metric.name) {
        case 'load-time':
          totalLoadTime += metric.value;
          break;
        case 'lcp':
          totalLCP += metric.value;
          break;
        case 'fid':
          totalFID += metric.value;
          break;
        case 'cls':
          totalCLS += metric.value;
          break;
        case 'fcp':
          totalFCP += metric.value;
          break;
        case 'ttfb':
          totalTTFB += metric.value;
          break;
        case 'slow-resource':
          slowResources++;
          break;
        case 'slow-api-call':
          slowAPICalls++;
          break;
        case 'slow-image':
          slowImages++;
          break;
        case 'slow-script':
          slowScripts++;
          break;
        case 'api-error':
          apiErrors++;
          break;
      }
    });
    
    // Device breakdown
    const deviceType = report.device?.platform || 'unknown';
    deviceBreakdown[deviceType] = (deviceBreakdown[deviceType] || 0) + 1;
    
    // Connection breakdown
    const connectionType = report.connection?.effectiveType || 'unknown';
    connectionBreakdown[connectionType] = (connectionBreakdown[connectionType] || 0) + 1;
  });
  
  const reportCount = reports.length;
  
  return {
    totalReports: reportCount,
    averageLoadTime: reportCount > 0 ? totalLoadTime / reportCount : 0,
    averageLCP: reportCount > 0 ? totalLCP / reportCount : 0,
    averageFID: reportCount > 0 ? totalFID / reportCount : 0,
    averageCLS: reportCount > 0 ? totalCLS / reportCount : 0,
    averageFCP: reportCount > 0 ? totalFCP / reportCount : 0,
    averageTTFB: reportCount > 0 ? totalTTFB / reportCount : 0,
    slowResources,
    slowAPICalls,
    slowImages,
    slowScripts,
    apiErrors,
    deviceBreakdown,
    connectionBreakdown,
  };
}

// Submit performance report
export async function submitPerformanceReport(data: {
  sessionId: string;
  userId?: string;
  metrics: any[];
  url: string;
  viewport: { width: number; height: number };
  connection: { effectiveType?: string; downlink?: number; rtt?: number };
  device: { memory?: number; cores?: number; platform?: string };
}): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const reportsRef = collection(db, 'performance-reports');
    
    const reportData = {
      ...data,
      timestamp: new Date(),
    };
    
    await addDoc(reportsRef, reportData);
    
    return { success: true };
  } catch (error) {
    console.error('Error submitting performance report:', error);
    return { success: false, error: 'Failed to submit performance report' };
  }
}
