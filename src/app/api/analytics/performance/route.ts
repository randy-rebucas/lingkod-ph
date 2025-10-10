import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const performanceReport = await request.json();
    
    // Validate the performance report
    if (!performanceReport.sessionId || !performanceReport.metrics) {
      return NextResponse.json(
        { error: 'Invalid performance report' },
        { status: 400 }
      );
    }

    // Store performance data in Firestore
    if (getDb()) {
      await addDoc(collection(getDb(), 'performanceReports'), {
        ...performanceReport,
        receivedAt: serverTimestamp(),
        processed: false,
      });
    }

    // Log performance metrics for monitoring
    console.log('Performance report received:', {
      sessionId: performanceReport.sessionId,
      metricsCount: performanceReport.metrics.length,
      url: performanceReport.url,
      timestamp: performanceReport.timestamp,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing performance report:', error);
    return NextResponse.json(
      { error: 'Failed to process performance report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!getDb()) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const { collection, query, where, getDocs, orderBy, limit: firestoreLimit, Timestamp } = await import('firebase/firestore');
    
    const cutoffTime = new Date();
    switch (timeframe) {
      case '1h':
        cutoffTime.setHours(cutoffTime.getHours() - 1);
        break;
      case '24h':
        cutoffTime.setHours(cutoffTime.getHours() - 24);
        break;
      case '7d':
        cutoffTime.setDate(cutoffTime.getDate() - 7);
        break;
      case '30d':
        cutoffTime.setDate(cutoffTime.getDate() - 30);
        break;
    }

    const reportsQuery = query(
      collection(getDb(), 'performanceReports'),
      where('timestamp', '>=', Timestamp.fromDate(cutoffTime)),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limit)
    );

    const reportsSnap = await getDocs(reportsQuery);
    const reports = reportsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate aggregated metrics
    const aggregatedMetrics = calculateAggregatedMetrics(reports);

    return NextResponse.json({
      reports,
      aggregatedMetrics,
      timeframe,
      totalReports: reports.length,
    });
  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}

function calculateAggregatedMetrics(reports: any[]) {
  const metrics = {
    totalReports: reports.length,
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
    deviceBreakdown: {} as Record<string, number>,
    connectionBreakdown: {} as Record<string, number>,
  };

  if (reports.length === 0) return metrics;

  let totalLoadTime = 0;
  let totalLCP = 0;
  let totalFID = 0;
  let totalCLS = 0;
  let totalFCP = 0;
  let totalTTFB = 0;
  let loadTimeCount = 0;
  let lcpCount = 0;
  let fidCount = 0;
  let clsCount = 0;
  let fcpCount = 0;
  let ttfbCount = 0;

  reports.forEach(report => {
    if (report.metrics) {
      report.metrics.forEach((metric: any) => {
        switch (metric.name) {
          case 'page-load-time':
            totalLoadTime += metric.value;
            loadTimeCount++;
            break;
          case 'LCP':
            totalLCP += metric.value;
            lcpCount++;
            break;
          case 'FID':
            totalFID += metric.value;
            fidCount++;
            break;
          case 'CLS':
            totalCLS += metric.value;
            clsCount++;
            break;
          case 'FCP':
            totalFCP += metric.value;
            fcpCount++;
            break;
          case 'TTFB':
            totalTTFB += metric.value;
            ttfbCount++;
            break;
          case 'slow-resource':
            metrics.slowResources++;
            break;
          case 'slow-api-call':
            metrics.slowAPICalls++;
            break;
          case 'slow-image-load':
            metrics.slowImages++;
            break;
          case 'slow-script-load':
            metrics.slowScripts++;
            break;
          case 'api-error':
            metrics.apiErrors++;
            break;
        }
      });
    }

    // Device breakdown
    if (report.device) {
      const deviceType = report.device.cores ? 'desktop' : 'mobile';
      metrics.deviceBreakdown[deviceType] = (metrics.deviceBreakdown[deviceType] || 0) + 1;
    }

    // Connection breakdown
    if (report.connection && report.connection.effectiveType) {
      const connectionType = report.connection.effectiveType;
      metrics.connectionBreakdown[connectionType] = (metrics.connectionBreakdown[connectionType] || 0) + 1;
    }
  });

  metrics.averageLoadTime = loadTimeCount > 0 ? totalLoadTime / loadTimeCount : 0;
  metrics.averageLCP = lcpCount > 0 ? totalLCP / lcpCount : 0;
  metrics.averageFID = fidCount > 0 ? totalFID / fidCount : 0;
  metrics.averageCLS = clsCount > 0 ? totalCLS / clsCount : 0;
  metrics.averageFCP = fcpCount > 0 ? totalFCP / fcpCount : 0;
  metrics.averageTTFB = ttfbCount > 0 ? totalTTFB / ttfbCount : 0;

  return metrics;
}
