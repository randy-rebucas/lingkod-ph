"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock,
  CheckCircle,
  User,
  Phone,
  Search
} from 'lucide-react';
import { DeliveryService } from '@/lib/marketplace/delivery-service';
import { Order } from '@/lib/marketplace/types';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';

export default function AdminDeliveriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [ordersReady, setOrdersReady] = useState<Order[]>([]);
  const [ordersInTransit, setOrdersInTransit] = useState<Order[]>([]);
  const [statistics, setStatistics] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    inTransitDeliveries: 0,
    averageDeliveryTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ready');

  // Driver assignment form
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadDeliveryData();
    }
  }, [user]);

  const loadDeliveryData = async () => {
    setLoading(true);
    try {
      const [readyOrders, inTransitOrders, stats] = await Promise.all([
        DeliveryService.getOrdersReadyForDelivery(),
        DeliveryService.getOrdersOutForDelivery(),
        DeliveryService.getDeliveryStatistics()
      ]);
      
      setOrdersReady(readyOrders);
      setOrdersInTransit(inTransitOrders);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading delivery data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load delivery data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedOrder || !driverName || !driverPhone) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill in all driver details'
      });
      return;
    }

    setAssigning(true);
    try {
      await DeliveryService.assignDeliveryDriver(
        selectedOrder.id,
        `driver_${Date.now()}`,
        driverName,
        driverPhone
      );

      toast({
        title: 'Driver Assigned',
        description: 'Driver has been assigned successfully'
      });

      // Reset form
      setSelectedOrder(null);
      setDriverName('');
      setDriverPhone('');
      
      // Reload data
      await loadDeliveryData();
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to assign driver'
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await DeliveryService.updateDeliveryStatus(
        orderId,
        status as any,
        'Status updated by admin'
      );

      toast({
        title: 'Status Updated',
        description: 'Order status has been updated successfully'
      });

      await loadDeliveryData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update order status'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-cyan-100 text-cyan-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: any) => {
    return timestamp.toDate().toLocaleString();
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              Only administrators can access this page
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Delivery Management</h1>
        <p className="text-muted-foreground">
          Manage marketplace order deliveries and tracking
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Deliveries</p>
                <p className="text-2xl font-bold">{statistics.totalDeliveries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{statistics.completedDeliveries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-cyan-500" />
              <div>
                <p className="text-sm text-muted-foreground">In Transit</p>
                <p className="text-2xl font-bold">{statistics.inTransitDeliveries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg. Delivery Time</p>
                <p className="text-2xl font-bold">{statistics.averageDeliveryTime}d</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ready">Ready for Delivery ({ordersReady.length})</TabsTrigger>
          <TabsTrigger value="transit">In Transit ({ordersInTransit.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ready" className="space-y-4">
          {ordersReady.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders ready for delivery</h3>
                <p className="text-muted-foreground">
                  Orders will appear here once they are ready to be shipped
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {ordersReady.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">
                              Order #{order.id.slice(-8)}
                            </h3>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.items.length} items • ₱{order.pricing.total.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created: {formatDate(order.createdAt)}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{order.shipping.address.city}, {order.shipping.address.province}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Assign Driver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(order.id, 'shipped')}
                        >
                          <Truck className="h-4 w-4 mr-2" />
                          Mark Shipped
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transit" className="space-y-4">
          {ordersInTransit.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders in transit</h3>
                <p className="text-muted-foreground">
                  Orders will appear here once they are shipped
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {ordersInTransit.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <Truck className="h-5 w-5 text-cyan-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">
                              Order #{order.id.slice(-8)}
                            </h3>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.items.length} items • ₱{order.pricing.total.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Shipped: {order.shipping.trackingNumber || 'No tracking number'}
                          </p>
                          {order.shipping.driver && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{order.shipping.driver.name} • {order.shipping.driver.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Delivered
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Driver Assignment Modal */}
      {selectedOrder && (
        <Card>
          <CardHeader>
            <CardTitle>Assign Driver - Order #{selectedOrder.id.slice(-8)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="driverName">Driver Name</Label>
                <Input
                  id="driverName"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Enter driver name"
                />
              </div>
              <div>
                <Label htmlFor="driverPhone">Driver Phone</Label>
                <Input
                  id="driverPhone"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="Enter driver phone number"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAssignDriver}
                disabled={assigning}
              >
                {assigning ? 'Assigning...' : 'Assign Driver'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedOrder(null)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
