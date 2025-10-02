"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  CheckCircle, 
  Truck, 
  MapPin, 
  Phone, 
  Mail, 
  Navigation,
  Package,
  Users,
  Home,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Calendar,
  Timer
} from "lucide-react";
import { getDb } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface OrderTrackingProps {
  bookingId: string;
  isPartner?: boolean;
}

interface TrackingStatus {
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'failed';
  timestamp: any;
  note?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface BookingData {
  id: string;
  serviceType: 'transport' | 'delivery' | 'moving';
  serviceName: string;
  clientName: string;
  contactPhone: string;
  contactEmail: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: string;
  trackingStatus: string;
  statusHistory: TrackingStatus[];
  estimatedDuration: number;
  createdAt: any;
  updatedAt: any;
  driverId?: string;
  driverName?: string;
  vehicleId?: string;
  vehicleName?: string;
  specialRequests: {
    fragileHandling: boolean;
    multipleDropoffs: boolean;
    helperRequired: boolean;
    insuranceRequired: boolean;
    whiteGloveService: boolean;
    assemblyRequired: boolean;
  };
  additionalStops?: Array<{
    address: string;
    type: 'pickup' | 'delivery';
    contactName?: string;
    contactPhone?: string;
    items?: string;
  }>;
  notes?: string;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    description: 'Your booking is being processed',
    progress: 10,
  },
  accepted: {
    label: 'Accepted',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle,
    description: 'Your booking has been accepted',
    progress: 25,
  },
  in_transit: {
    label: 'In Transit',
    color: 'bg-purple-100 text-purple-800',
    icon: Truck,
    description: 'Your order is on the way',
    progress: 75,
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    description: 'Your order has been delivered',
    progress: 100,
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-100 text-red-800',
    icon: AlertTriangle,
    description: 'Delivery failed',
    progress: 0,
  },
};

const serviceTypeIcons = {
  transport: Users,
  delivery: Package,
  moving: Home,
};

export function OrderTracking({ bookingId, isPartner = false }: OrderTrackingProps) {
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!bookingId) return;

    const bookingRef = doc(getDb(), 'bookings', bookingId);
    
    const unsubscribe = onSnapshot(bookingRef, (doc) => {
      if (doc.exists()) {
        setBooking({ id: doc.id, ...doc.data() } as BookingData);
        setLoading(false);
        setError(null);
      } else {
        setError('Booking not found');
        setLoading(false);
      }
    }, (error) => {
      console.error('Error fetching booking:', error);
      setError('Failed to load booking details');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [bookingId]);

  const updateStatus = async (newStatus: string, note?: string) => {
    if (!booking) return;

    try {
      const bookingRef = doc(getDb(), 'bookings', booking.id);
      const newStatusHistory = [
        ...booking.statusHistory,
        {
          status: newStatus,
          timestamp: serverTimestamp(),
          note: note || `Status updated to ${newStatus}`,
        }
      ];

      await updateDoc(bookingRef, {
        status: newStatus,
        trackingStatus: newStatus,
        statusHistory: newStatusHistory,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Status Updated",
        description: `Booking status has been updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update booking status',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading tracking information...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !booking) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || 'Booking not found'}</p>
        </CardContent>
      </Card>
    );
  }

  const currentStatus = booking.trackingStatus || booking.status;
  const statusInfo = statusConfig[currentStatus as keyof typeof statusConfig];
  const ServiceIcon = serviceTypeIcons[booking.serviceType];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ServiceIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{booking.serviceName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Booking ID: {booking.id}
                </p>
              </div>
            </div>
            <Badge className={statusInfo.color}>
              {statusInfo.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Progress</p>
              <Progress value={statusInfo.progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {statusInfo.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.clientName}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.contactPhone}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.contactEmail}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {booking.createdAt?.toDate 
                      ? format(booking.createdAt.toDate(), 'MMM dd, yyyy')
                      : 'Unknown date'
                    }
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span>Est. {booking.estimatedDuration} minutes</span>
                </div>
                {booking.driverName && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span>Driver: {booking.driverName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Route Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-green-100 rounded-full mt-1">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium">Pickup Location</p>
                <p className="text-sm text-muted-foreground">{booking.pickupAddress}</p>
              </div>
            </div>

            {booking.additionalStops && booking.additionalStops.length > 0 && (
              <div className="ml-4 space-y-3">
                {booking.additionalStops.map((stop, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="p-1 bg-blue-100 rounded-full mt-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium">
                        {stop.type === 'pickup' ? 'Pickup' : 'Delivery'} Stop {index + 1}
                      </p>
                      <p className="text-sm text-muted-foreground">{stop.address}</p>
                      {stop.contactName && (
                        <p className="text-sm text-muted-foreground">Contact: {stop.contactName}</p>
                      )}
                      {stop.items && (
                        <p className="text-sm text-muted-foreground">Items: {stop.items}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-start space-x-3">
              <div className="p-1 bg-red-100 rounded-full mt-1">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium">Delivery Location</p>
                <p className="text-sm text-muted-foreground">{booking.deliveryAddress}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Special Requests */}
      {Object.values(booking.specialRequests).some(Boolean) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Special Requests</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(booking.specialRequests)
                .filter(([_, value]) => value)
                .map(([key, _]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      {key === 'fragileHandling' && 'Fragile Handling'}
                      {key === 'helperRequired' && 'Helper Required'}
                      {key === 'insuranceRequired' && 'Insurance Required'}
                      {key === 'whiteGloveService' && 'White Glove Service'}
                      {key === 'assemblyRequired' && 'Assembly Required'}
                      {key === 'multipleDropoffs' && 'Multiple Drop-offs'}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Status History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {booking.statusHistory.map((entry, index) => {
              const entryStatusInfo = statusConfig[entry.status as keyof typeof statusConfig];
              const EntryIcon = entryStatusInfo?.icon || Clock;
              const isLatest = index === booking.statusHistory.length - 1;
              
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${isLatest ? 'bg-primary/10' : 'bg-muted'}`}>
                    <EntryIcon className={`h-4 w-4 ${isLatest ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium ${isLatest ? 'text-primary' : ''}`}>
                        {entryStatusInfo?.label || entry.status}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.timestamp?.toDate 
                          ? format(entry.timestamp.toDate(), 'MMM dd, h:mm a')
                          : 'Unknown time'
                        }
                      </p>
                    </div>
                    {entry.note && (
                      <p className="text-sm text-muted-foreground mt-1">{entry.note}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Partner Actions */}
      {isPartner && currentStatus !== 'delivered' && currentStatus !== 'failed' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Navigation className="h-5 w-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentStatus === 'pending' && (
                <Button onClick={() => updateStatus('accepted', 'Booking accepted by partner')}>
                  Accept Booking
                </Button>
              )}
              {currentStatus === 'accepted' && (
                <Button onClick={() => updateStatus('in_transit', 'Order picked up and in transit')}>
                  Start Delivery
                </Button>
              )}
              {currentStatus === 'in_transit' && (
                <Button onClick={() => updateStatus('delivered', 'Order successfully delivered')}>
                  Mark as Delivered
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => updateStatus('failed', 'Delivery failed - please contact customer')}
              >
                Mark as Failed
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {booking.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Notes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{booking.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
