"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  BarChart3
} from 'lucide-react';

interface PayMayaMetrics {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  successRate: number;
  averageProcessingTime: number;
  totalRevenue: number;
  averagePaymentAmount: number;
}

interface PayMayaEvent {
  eventType: string;
  paymentId: string;
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  processingTime?: number;
  errorMessage?: string;
  timestamp: Date;
}

export function PayMayaDashboard() {
  const [metrics, setMetrics] = useState<PayMayaMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<PayMayaEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      // Fetch metrics from API
      const response = await fetch('/api/analytics/paymaya/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }

      // Fetch recent events
      const eventsResponse = await fetch('/api/analytics/paymaya/events?limit=10');
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setRecentEvents(eventsData);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching PayMaya metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'payment_success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'payment_failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'payment_created':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'payment_cancelled':
        return <XCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'payment_success':
        return 'bg-green-100 text-green-800';
      case 'payment_failed':
        return 'bg-red-100 text-red-800';
      case 'payment_created':
        return 'bg-blue-100 text-blue-800';
      case 'payment_cancelled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">PayMaya Analytics</h2>
          <Button disabled>
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">PayMaya Analytics</h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleString()}
            </p>
          )}
        </div>
        <Button onClick={fetchMetrics} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalPayments}</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.successfulPayments} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{metrics.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Avg: ₱{metrics.averagePaymentAmount.toFixed(0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageProcessingTime.toFixed(0)}ms</div>
              <p className="text-xs text-muted-foreground">
                Payment processing
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payment Events</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No recent payment events found.
            </p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getEventIcon(event.eventType)}
                    <div>
                      <p className="font-medium">
                        {event.eventType.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Plan: {event.planId} • Amount: ₱{event.amount}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getEventBadgeColor(event.eventType)}>
                      {event.eventType.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
