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
  Activity,
  Fuel,
  Wrench,
  Route,
  Users,
  BarChart3,
  Zap,
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import Link from "next/link";

interface Vehicle {
  id: string;
  partnerId: string;
  name: string;
  type: 'van' | 'truck' | 'pickup' | 'motorcycle' | 'specialized';
  licensePlate: string;
  capacity: number;
  volumeCapacity?: number;
  maxPassengers: number;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  fuelCapacity?: number;
  currentFuelLevel?: number;
  isAvailable: boolean;
  isInService: boolean;
  currentLocation?: string;
  currentLat?: number;
  currentLng?: number;
  driver?: string;
  driverId?: string;
  lastMaintenance: string;
  nextMaintenance: string;
  maintenanceInterval?: number;
  odometer?: number;
  insuranceExpiry?: string;
  registrationExpiry?: string;
  maintenanceHistory?: any[];
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

interface Delivery {
  id: string;
  partnerId: string;
  orderId: string;
  customerName: string;
  deliveryType: 'standard' | 'express' | 'scheduled' | 'moving' | 'multi_stop';
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
  vehicleId?: string;
  driverId?: string;
  driverName?: string;
  vehicleName?: string;
  scheduledDate: string;
  scheduledTime: string;
  totalWeight: number;
  deliveryFee: number;
  autoDispatch?: {
    enabled: boolean;
    criteria: any;
  };
  createdAt: string;
  updatedAt: string;
}

export default function FleetDashboardPage() {
  const { user, userRole, partnerData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  // Load vehicles and deliveries from Firestore
  useEffect(() => {
    if (!user || userRole !== 'partner') {
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
      
      // Load vehicles
      const vehiclesRef = collection(db, 'vehicles');
      const vehiclesQuery = query(
        vehiclesRef,
        where('partnerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribeVehicles = onSnapshot(vehiclesQuery, (snapshot) => {
        const vehiclesData: Vehicle[] = [];
        snapshot.forEach((doc) => {
          vehiclesData.push({ id: doc.id, ...doc.data() } as Vehicle);
        });
        setVehicles(vehiclesData);
      });

      // Load deliveries
      const deliveriesRef = collection(db, 'deliveries');
      const deliveriesQuery = query(
        deliveriesRef,
        where('partnerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribeDeliveries = onSnapshot(deliveriesQuery, (snapshot) => {
        const deliveriesData: Delivery[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          deliveriesData.push({
            id: doc.id,
            partnerId: data.partnerId || '',
            orderId: data.orderId || '',
            customerName: data.customerName || '',
            deliveryType: data.deliveryType || 'standard',
            status: data.status || 'pending',
            vehicleId: data.vehicleId,
            driverId: data.driverId,
            driverName: data.driverName,
            vehicleName: data.vehicleName,
            scheduledDate: data.scheduledDate || '',
            scheduledTime: data.scheduledTime || '',
            totalWeight: data.totalWeight || 0,
            deliveryFee: data.deliveryFee || 0,
            autoDispatch: data.autoDispatch,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          });
        });
        setDeliveries(deliveriesData);
        setLoading(false);
      });

      return () => {
        unsubscribeVehicles();
        unsubscribeDeliveries();
      };
    } catch (error) {
      console.error('Error loading fleet data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load fleet data. Please try again.",
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate fleet statistics
  const fleetStats = {
    totalVehicles: vehicles.length,
    availableVehicles: vehicles.filter(v => v.isAvailable && v.isInService).length,
    inUseVehicles: vehicles.filter(v => !v.isAvailable).length,
    maintenanceDue: vehicles.filter(v => {
      const nextMaintenance = new Date(v.nextMaintenance);
      const today = new Date();
      const daysUntilMaintenance = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilMaintenance <= 7;
    }).length,
    lowFuelVehicles: vehicles.filter(v => v.currentFuelLevel && v.currentFuelLevel < 25).length,
    totalCapacity: vehicles.reduce((sum, v) => sum + v.capacity, 0),
    totalVolumeCapacity: vehicles.reduce((sum, v) => sum + (v.volumeCapacity || 0), 0),
    averageFuelLevel: vehicles.length > 0 
      ? vehicles.reduce((sum, v) => sum + (v.currentFuelLevel || 0), 0) / vehicles.length 
      : 0
  };

  // Calculate delivery statistics
  const deliveryStats = {
    totalDeliveries: deliveries.length,
    pendingDeliveries: deliveries.filter(d => d.status === 'pending').length,
    activeDeliveries: deliveries.filter(d => ['assigned', 'picked_up', 'in_transit'].includes(d.status)).length,
    completedDeliveries: deliveries.filter(d => d.status === 'delivered').length,
    autoDispatched: deliveries.filter(d => d.autoDispatch?.enabled).length,
    todayRevenue: deliveries
      .filter(d => d.status === 'delivered' && 
        new Date(d.updatedAt).toDateString() === new Date().toDateString())
      .reduce((sum, d) => sum + d.deliveryFee, 0),
    totalRevenue: deliveries
      .filter(d => d.status === 'delivered')
      .reduce((sum, d) => sum + d.deliveryFee, 0)
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
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
          <h1 className="text-3xl font-bold tracking-tight">Fleet Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive fleet and delivery management overview
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/partners/vehicles">
              <Truck className="h-4 w-4 mr-2" />
              Manage Vehicles
            </Link>
          </Button>
          <Button asChild>
            <Link href="/partners/deliveries">
              <Package className="h-4 w-4 mr-2" />
              Manage Deliveries
            </Link>
          </Button>
        </div>
      </div>

      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetStats.totalVehicles}</div>
            <p className="text-xs text-muted-foreground">
              {fleetStats.availableVehicles} available
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {deliveryStats.activeDeliveries}
            </div>
            <p className="text-xs text-muted-foreground">
              {deliveryStats.pendingDeliveries} pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(deliveryStats.todayRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {deliveryStats.completedDeliveries} completed deliveries
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Dispatch Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {deliveryStats.totalDeliveries > 0 
                ? Math.round((deliveryStats.autoDispatched / deliveryStats.totalDeliveries) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {deliveryStats.autoDispatched} auto-dispatched
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {fleetStats.maintenanceDue}
            </div>
            <p className="text-xs text-muted-foreground">
              Within 7 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Fuel</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {fleetStats.lowFuelVehicles}
            </div>
            <p className="text-xs text-muted-foreground">
              Below 25%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {fleetStats.totalCapacity.toLocaleString()}kg
            </div>
            <p className="text-xs text-muted-foreground">
              {fleetStats.totalVolumeCapacity.toFixed(1)}m³ volume
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Fuel Level</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(fleetStats.averageFuelLevel)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Fleet average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Deliveries
            </CardTitle>
            <CardDescription>
              Latest delivery activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deliveries.slice(0, 5).map((delivery) => (
                <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{delivery.orderId}</span>
                      <Badge 
                        variant={delivery.status === 'pending' ? 'secondary' : 
                                delivery.status === 'delivered' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {delivery.status}
                      </Badge>
                      {delivery.autoDispatch?.enabled && (
                        <Badge variant="outline" className="text-xs text-purple-600">
                          Auto
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {delivery.customerName} • {delivery.scheduledDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(delivery.deliveryFee)}
                    </p>
                    {delivery.driverName && (
                      <p className="text-xs text-muted-foreground">
                        {delivery.driverName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {deliveries.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No deliveries yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Vehicle Status
            </CardTitle>
            <CardDescription>
              Current fleet status overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vehicles.slice(0, 5).map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{vehicle.name}</span>
                      <Badge 
                        variant={vehicle.isAvailable ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {vehicle.isAvailable ? 'Available' : 'In Use'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.licensePlate} • {vehicle.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {vehicle.currentFuelLevel && (
                        <div className="flex items-center gap-1">
                          <Fuel className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {vehicle.currentFuelLevel}%
                          </span>
                        </div>
                      )}
                      {vehicle.driver && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {vehicle.driver}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {vehicles.length === 0 && (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No vehicles added yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>
            Key performance indicators for your fleet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {deliveryStats.totalDeliveries > 0 
                  ? Math.round((deliveryStats.completedDeliveries / deliveryStats.totalDeliveries) * 100)
                  : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Delivery Success Rate</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {fleetStats.totalVehicles > 0 
                  ? Math.round((fleetStats.availableVehicles / fleetStats.totalVehicles) * 100)
                  : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Fleet Availability</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {formatCurrency(deliveryStats.totalRevenue)}
              </div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
