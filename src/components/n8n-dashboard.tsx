'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  Pause,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkflowStatus {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastRun: string;
  executions: number;
  successRate: number;
  avgExecutionTime: number;
}

interface N8nDashboardProps {
  className?: string;
}

export function N8nDashboard({ className }: N8nDashboardProps) {
  const [workflows, setWorkflows] = useState<WorkflowStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchWorkflowStatus();
  }, []);

  const fetchWorkflowStatus = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/n8n/workflows');
      
      if (!response.ok) {
        throw new Error('Failed to fetch workflow status');
      }
      
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Error fetching workflow status:', error);
      toast({
        title: "Error",
        description: "Failed to fetch workflow status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleWorkflow = async (workflowId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const response = await fetch(`/api/n8n/workflows/${workflowId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle workflow');
      }

      // Update local state
      setWorkflows(prev => 
        prev.map(workflow => 
          workflow.id === workflowId 
            ? { ...workflow, status: newStatus as 'active' | 'inactive' | 'error' }
            : workflow
        )
      );

      toast({
        title: "Success",
        description: `Workflow ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast({
        title: "Error",
        description: "Failed to toggle workflow status",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">n8n Workflow Dashboard</h2>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-16" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">n8n Workflow Dashboard</h2>
        <Button 
          onClick={fetchWorkflowStatus} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {workflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Workflows Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              No n8n workflows are currently configured or accessible.
            </p>
            <Button asChild>
              <a href="http://localhost:5678" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open n8n Interface
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(workflow.status)}
                    {workflow.name}
                  </div>
                  {getStatusBadge(workflow.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Last Run</p>
                      <p className="font-medium">
                        {workflow.lastRun ? 
                          new Date(workflow.lastRun).toLocaleDateString() : 
                          'Never'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Executions</p>
                      <p className="font-medium">{workflow.executions}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Success Rate</p>
                      <p className="font-medium">{workflow.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avg Time</p>
                      <p className="font-medium">{workflow.avgExecutionTime}ms</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleWorkflow(workflow.id, workflow.status)}
                    >
                      {workflow.status === 'active' ? (
                        <>
                          <Pause className="h-4 w-4 mr-1" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </>
                      )}
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={`http://localhost:5678/workflow/${workflow.id}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
