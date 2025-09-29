"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Circle,
  Navigation
} from 'lucide-react';
import { OrderTracking as OrderTrackingType, TrackingStatus } from '@/lib/marketplace/types';

interface OrderTrackingProps {
  tracking: OrderTrackingType[];
  orderId: string;
}

const trackingStatusConfig: Record<TrackingStatus, {
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}> = {
  'order-placed': {
    label: 'Order Placed',
    icon: <Package className="h-4 w-4" />,
    color: 'bg-blue-500',
    description: 'Your order has been placed successfully'
  },
  'supplier-notified': {
    label: 'Supplier Notified',
    icon: <Truck className="h-4 w-4" />,
    color: 'bg-orange-500',
    description: 'Supplier has been notified of your order'
  },
  'warehouse-received': {
    label: 'Warehouse Received',
    icon: <Package className="h-4 w-4" />,
    color: 'bg-purple-500',
    description: 'Items received at LocalPro warehouse'
  },
  'packed': {
    label: 'Packed',
    icon: <Package className="h-4 w-4" />,
    color: 'bg-indigo-500',
    description: 'Items have been packed and ready for shipping'
  },
  'shipped': {
    label: 'Shipped',
    icon: <Truck className="h-4 w-4" />,
    color: 'bg-cyan-500',
    description: 'Package is on its way to you'
  },
  'out-for-delivery': {
    label: 'Out for Delivery',
    icon: <Truck className="h-4 w-4" />,
    color: 'bg-yellow-500',
    description: 'Package is out for delivery'
  },
  'delivered': {
    label: 'Delivered',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-green-500',
    description: 'Package has been delivered'
  }
};

export function OrderTracking({ tracking, orderId }: OrderTrackingProps) {
  if (!tracking || tracking.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tracking information available</h3>
          <p className="text-muted-foreground">
            Tracking information will be updated as your order progresses
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort tracking by timestamp
  const sortedTracking = [...tracking].sort((a, b) => 
    a.timestamp.toMillis() - b.timestamp.toMillis()
  );

  const currentStatus = sortedTracking[sortedTracking.length - 1];
  const currentStatusConfig = trackingStatusConfig[currentStatus.status];

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Order Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className={`p-3 rounded-full ${currentStatusConfig.color} text-white`}>
              {currentStatusConfig.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{currentStatusConfig.label}</h3>
              <p className="text-muted-foreground">{currentStatusConfig.description}</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{currentStatus.location}</span>
                <Clock className="h-3 w-3 ml-2" />
                <span>{currentStatus.timestamp.toDate().toLocaleString()}</span>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              Order #{orderId.slice(-8)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedTracking.map((trackingItem, index) => {
              const config = trackingStatusConfig[trackingItem.status];
              const isLast = index === sortedTracking.length - 1;
              
              return (
                <div key={trackingItem.id} className="flex items-start gap-4">
                  {/* Timeline Icon */}
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full ${config.color} text-white`}>
                      {config.icon}
                    </div>
                    {!isLast && (
                      <div className="w-0.5 h-8 bg-border mt-2"></div>
                    )}
                  </div>

                  {/* Timeline Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{config.label}</h4>
                      <span className="text-xs text-muted-foreground">
                        {trackingItem.timestamp.toDate().toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {config.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{trackingItem.location}</span>
                    </div>
                    {trackingItem.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Note: {trackingItem.notes}
                      </p>
                    )}
                    {trackingItem.coordinates && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Navigation className="h-3 w-3 mr-1" />
                          GPS: {trackingItem.coordinates.lat.toFixed(4)}, {trackingItem.coordinates.lng.toFixed(4)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Estimated Delivery */}
      {currentStatus.status !== 'delivered' && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Estimated delivery:</span>
              <span className="font-medium">
                {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
