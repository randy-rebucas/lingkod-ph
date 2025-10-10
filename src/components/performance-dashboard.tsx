'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Smartphone, 
  Monitor,
  Wifi,
  WifiOff
} from 'lucide-react';

interface PerformanceMetrics {
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

interface PerformanceReport {
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

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [reports, setReports] = useState<PerformanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [error, setError] = useState<string | null>(null);

  const loadPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/analytics/performance?timeframe=${timeframe}&limit=100`);
      
      if (!response.ok) {
        throw new Error('Failed to load performance data');
      }
      
      const data = await response.json();
      setMetrics(data.aggregatedMetrics);
      setReports(data.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  const getPerformanceScore = (lcp: number, fid: number, cls: number): number => {
    let score = 100;
    
    // LCP scoring (Good: <2.5s, Needs Improvement: 2.5-4s, Poor: >4s)
    if (lcp > 4000) score -= 30;
    else if (lcp > 2500) score -= 15;
    
    // FID scoring (Good: <100ms, Needs Improvement: 100-300ms, Poor: >300ms)
    if (fid > 300) score -= 25;
    else if (fid > 100) score -= 10;
    
    // CLS scoring (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
    if (cls > 0.25) score -= 25;
    else if (cls > 0.1) score -= 10;
    
    return Math.max(0, score);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number): string => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatScore = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No performance data available.
        </AlertDescription>
      </Alert>
    );
  }

  const performanceScore = getPerformanceScore(metrics.averageLCP, metrics.averageFID, metrics.averageCLS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor application performance and Core Web Vitals
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeframe === '1h' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('1h')}
          >
            1h
          </Button>
          <Button
            variant={timeframe === '24h' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('24h')}
          >
            24h
          </Button>
          <Button
            variant={timeframe === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('7d')}
          >
            7d
          </Button>
          <Button
            variant={timeframe === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('30d')}
          >
            30d
          </Button>
        </div>
      </div>

      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">
              <span className={getScoreColor(performanceScore)}>
                {performanceScore}
              </span>
            </div>
            <div>
              <Badge className={getScoreBadge(performanceScore)}>
                {formatScore(performanceScore)}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                Based on Core Web Vitals
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LCP</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.averageLCP)}</div>
            <p className="text-xs text-muted-foreground">
              Largest Contentful Paint
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FID</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.averageFID)}</div>
            <p className="text-xs text-muted-foreground">
              First Input Delay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CLS</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageCLS.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground">
              Cumulative Layout Shift
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">FCP</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.averageFCP)}</div>
            <p className="text-xs text-muted-foreground">
              First Contentful Paint
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TTFB</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.averageTTFB)}</div>
            <p className="text-xs text-muted-foreground">
              Time to First Byte
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slow Resources</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.slowResources}</div>
            <p className="text-xs text-muted-foreground">
              Resources &gt; 1s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slow API Calls</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.slowAPICalls}</div>
            <p className="text-xs text-muted-foreground">
              API calls &gt; 2s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slow Images</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.slowImages}</div>
            <p className="text-xs text-muted-foreground">
              Images &gt; 3s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.apiErrors}</div>
            <p className="text-xs text-muted-foreground">
              Failed API calls
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Device and Connection Breakdown */}
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Device Breakdown</TabsTrigger>
          <TabsTrigger value="connections">Connection Types</TabsTrigger>
          <TabsTrigger value="reports">Recent Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Types</CardTitle>
              <CardDescription>
                Distribution of performance data by device type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.deviceBreakdown).map(([deviceType, count]) => {
                  const percentage = metrics.totalReports > 0 ? (count / metrics.totalReports) * 100 : 0;
                  const Icon = deviceType === 'desktop' ? Monitor : Smartphone;
                  
                  return (
                    <div key={deviceType} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium capitalize">{deviceType}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connection Types</CardTitle>
              <CardDescription>
                Distribution of performance data by connection speed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.connectionBreakdown).map(([connectionType, count]) => {
                  const percentage = metrics.totalReports > 0 ? (count / metrics.totalReports) * 100 : 0;
                  const Icon = connectionType === '4g' ? Wifi : WifiOff;
                  
                  return (
                    <div key={connectionType} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium uppercase">{connectionType}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Performance Reports</CardTitle>
              <CardDescription>
                Latest performance data from users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No performance reports available</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Connection</TableHead>
                      <TableHead>Metrics</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.slice(0, 10).map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <code className="text-xs">{report.sessionId.slice(-8)}</code>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {new URL(report.url).pathname}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {report.device.cores ? (
                              <Monitor className="h-3 w-3" />
                            ) : (
                              <Smartphone className="h-3 w-3" />
                            )}
                            <span className="text-xs">
                              {report.device.cores ? 'Desktop' : 'Mobile'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {report.connection.effectiveType || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{report.metrics.length}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {new Date(report.timestamp).toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
