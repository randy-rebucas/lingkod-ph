'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, Clock, Activity, Database, CreditCard, Shield } from 'lucide-react';
import { getErrorStats, resolveError, ErrorReport } from '@/lib/error-monitoring';

interface ErrorStats {
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  criticalCount: number;
  unresolvedCount: number;
}

interface ErrorReportWithId extends ErrorReport {
  id: string;
}

const categoryIcons = {
  client: Activity,
  server: Database,
  database: Database,
  payment: CreditCard,
  auth: Shield,
  api: Activity,
  unknown: AlertTriangle,
};

const severityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export default function ErrorMonitoringDashboard() {
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [recentErrors, setRecentErrors] = useState<ErrorReportWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [resolving, setResolving] = useState<string | null>(null);

  const loadErrorData = useCallback(async () => {
    try {
      setLoading(true);
      const errorStats = await getErrorStats(timeframe);
      setStats(errorStats);
      
      // In a real implementation, you would fetch recent errors from the database
      // For now, we'll use mock data
      setRecentErrors([]);
    } catch (error) {
      console.error('Failed to load error data:', error);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadErrorData();
  }, [loadErrorData]);

  const handleResolveError = async (errorId: string) => {
    try {
      setResolving(errorId);
      await resolveError(errorId, 'admin', 'Resolved via dashboard');
      await loadErrorData();
    } catch (error) {
      console.error('Failed to resolve error:', error);
    } finally {
      setResolving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load error monitoring data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Error Monitoring</h1>
          <p className="text-muted-foreground">
            Monitor and manage application errors in real-time
          </p>
        </div>
        <div className="flex gap-2">
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

      {/* Critical Alerts */}
      {stats.criticalCount > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{stats.criticalCount}</strong> critical error{stats.criticalCount !== 1 ? 's' : ''} 
            {stats.criticalCount !== 1 ? ' have' : ' has'} been detected in the last {timeframe}. 
            Immediate attention required.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeframe}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalCount}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresolved</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.unresolvedCount}</div>
            <p className="text-xs text-muted-foreground">
              Pending resolution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.total - stats.unresolvedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="severity">By Severity</TabsTrigger>
          <TabsTrigger value="recent">Recent Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Errors by Category</CardTitle>
              <CardDescription>
                Breakdown of errors by their category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.byCategory).map(([category, count]) => {
                  const Icon = categoryIcons[category as keyof typeof categoryIcons] || AlertTriangle;
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  
                  return (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium capitalize">{category}</span>
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

        <TabsContent value="severity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Errors by Severity</CardTitle>
              <CardDescription>
                Distribution of errors by severity level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.bySeverity).map(([severity, count]) => {
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  
                  return (
                    <div key={severity} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge className={severityColors[severity as keyof typeof severityColors]}>
                          {severity.toUpperCase()}
                        </Badge>
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

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>
                Latest error reports that need attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentErrors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No recent errors to display</p>
                  <p className="text-sm">Great job! Your application is running smoothly.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Error</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentErrors.map((error) => (
                      <TableRow key={error.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{error.message}</div>
                            {error.context.component && (
                              <div className="text-sm text-muted-foreground">
                                {error.context.component}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {error.context.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={severityColors[error.context.severity]}>
                            {error.context.severity.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(error.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {error.resolved ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!error.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveError(error.id)}
                              disabled={resolving === error.id}
                            >
                              {resolving === error.id ? 'Resolving...' : 'Resolve'}
                            </Button>
                          )}
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
