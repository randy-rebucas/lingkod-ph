"use client";

import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  User,
  Calendar,
  Phone,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Navigation,
  TrendingUp,
  Activity
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import Link from "next/link";

interface DriverTask {
  id: string;
  deliveryId: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleName: string;
  partnerId: string;
  status: 'pending' | 'accepted' | 'rejected';
  orderId: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  scheduledDate: string;
  scheduledTime: string;
  deliveryFee: number;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DriverDashboardPage() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<DriverTask[]>([]);

  // Load driver tasks from Firestore
  useEffect(() => {
    if (!user || userRole !== 'driver') {
      setLoading(false);
      return;
    }

    const db = getDb();
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Query tasks for this driver
      const tasksRef = collection(db, 'driverTasks');
      const q = query(
        tasksRef,
        where('driverId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10) // Only get recent tasks for dashboard
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksData: DriverTask[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          tasksData.push({
            id: doc.id,
            deliveryId: data.deliveryId || '',
            driverId: data.driverId || '',
            driverName: data.driverName || '',
            vehicleId: data.vehicleId || '',
            vehicleName: data.vehicleName || '',
            partnerId: data.partnerId || '',
            status: data.status || 'pending',
            orderId: data.orderId || '',
            customerName: data.customerName || '',
            customerPhone: data.customerPhone || '',
            pickupAddress: data.pickupAddress || '',
            deliveryAddress: data.deliveryAddress || '',
            scheduledDate: data.scheduledDate || '',
            scheduledTime: data.scheduledTime || '',
            deliveryFee: data.deliveryFee || 0,
            specialInstructions: data.specialInstructions,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          });
        });
        
        setTasks(tasksData);
        setLoading(false);
      }, (error) => {
        console.error('Error loading driver tasks:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load tasks. Please try again.",
        });
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up tasks listener:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tasks. Please try again.",
      });
      setLoading(false);
    }
  }, [user, userRole, toast]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate statistics
  const stats = {
    totalTasks: tasks.length,
    pendingTasks: tasks.filter(t => t.status === 'pending').length,
    acceptedTasks: tasks.filter(t => t.status === 'accepted').length,
    todayEarnings: tasks
      .filter(t => t.status === 'accepted' && 
        new Date(t.createdAt).toDateString() === new Date().toDateString())
      .reduce((sum, t) => sum + t.deliveryFee, 0),
    totalEarnings: tasks
      .filter(t => t.status === 'accepted')
      .reduce((sum, t) => sum + t.deliveryFee, 0)
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Driver Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's your delivery overview
          </p>
        </div>
        <Button asChild>
          <Link href="/drivers/tasks">
            <Truck className="h-4 w-4 mr-2" />
            View All Tasks
          </Link>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              All assigned tasks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting your response
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.todayEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">
              From accepted tasks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.totalEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">
              All time earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Tasks
            </CardTitle>
            <CardDescription>
              Your latest delivery assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{task.orderId}</span>
                      <Badge 
                        variant={task.status === 'pending' ? 'secondary' : 
                                task.status === 'accepted' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {task.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {task.customerName} • {task.scheduledDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(task.deliveryFee)}
                    </p>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tasks assigned yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link href="/drivers/tasks">
                  <Clock className="h-4 w-4 mr-2" />
                  View All Tasks
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/drivers/earnings">
                  <DollarSign className="h-4 w-4 mr-2" />
                  View Earnings
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/drivers/profile">
                  <User className="h-4 w-4 mr-2" />
                  Update Profile
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Summary
          </CardTitle>
          <CardDescription>
            Your delivery performance overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.acceptedTasks}
              </div>
              <p className="text-sm text-muted-foreground">Completed Tasks</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.totalTasks > 0 ? Math.round((stats.acceptedTasks / stats.totalTasks) * 100) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Acceptance Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {formatCurrency(stats.totalEarnings)}
              </div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
