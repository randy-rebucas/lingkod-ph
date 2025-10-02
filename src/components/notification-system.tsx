"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bell, 
  BellRing, 
  Truck, 
  Package, 
  Users, 
  Home, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  RefreshCw,
  MessageSquare,
  Calendar,
  DollarSign
} from "lucide-react";
import { getDb } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

interface Notification {
  id: string;
  type: 'logistics_booking' | 'booking_accepted' | 'provider_assigned' | 'pickup_completed' | 'delivery_completed' | 'payment_received';
  recipientId: string;
  recipientType: 'partner' | 'provider' | 'client';
  title: string;
  message: string;
  data?: {
    bookingId?: string;
    clientName?: string;
    serviceType?: string;
    pickupAddress?: string;
    deliveryAddress?: string;
    price?: number;
    providerName?: string;
    partnerName?: string;
  };
  read: boolean;
  createdAt: any;
}

interface LogisticsBooking {
  id: string;
  partnerId: string;
  partnerName: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  logisticsSubType: 'transport' | 'delivery' | 'moving';
  status: string;
  trackingStatus: string;
  price: number;
  pickupAddress: string;
  deliveryAddress: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  specialRequests: any;
  additionalStops?: any[];
  notes?: string;
  estimatedDuration: number;
  priority: string;
  statusHistory: any[];
  notifications: any;
  commission: any;
  createdAt: any;
  updatedAt: any;
}

export function NotificationSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showNotificationDetails, setShowNotificationDetails] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<LogisticsBooking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(getDb(), 'notifications'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.read).length);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(getDb(), 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(notification => 
        updateDoc(doc(getDb(), 'notifications', notification.id), {
          read: true,
          readAt: serverTimestamp(),
        })
      );
      
      await Promise.all(updatePromises);
      
      toast({
        title: "Notifications Marked as Read",
        description: "All notifications have been marked as read",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark notifications as read',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'logistics_booking': return Truck;
      case 'booking_accepted': return CheckCircle;
      case 'provider_assigned': return Users;
      case 'pickup_completed': return Package;
      case 'delivery_completed': return CheckCircle;
      case 'payment_received': return DollarSign;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'logistics_booking': return 'text-blue-600';
      case 'booking_accepted': return 'text-green-600';
      case 'provider_assigned': return 'text-purple-600';
      case 'pickup_completed': return 'text-orange-600';
      case 'delivery_completed': return 'text-green-600';
      case 'payment_received': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // If it's a logistics booking notification, fetch booking details
    if (notification.type === 'logistics_booking' && notification.data?.bookingId) {
      try {
        const bookingRef = doc(getDb(), 'logisticsBookings', notification.data.bookingId);
        const bookingDoc = await getDoc(bookingRef);
        
        if (bookingDoc.exists()) {
          setSelectedBooking({ id: bookingDoc.id, ...bookingDoc.data() } as LogisticsBooking);
          setShowBookingDetails(true);
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load booking details',
        });
      }
    } else {
      setSelectedNotification(notification);
      setShowNotificationDetails(true);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading notifications...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground">You'll receive notifications for new bookings and updates here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const iconColor = getNotificationColor(notification.type);
            const notificationDate = notification.createdAt?.toDate ? notification.createdAt.toDate() : new Date();
            
            return (
              <Card 
                key={notification.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  !notification.read ? 'border-l-4 border-l-primary bg-primary/5' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full bg-muted ${iconColor}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-semibold ${!notification.read ? 'text-primary' : ''}`}>
                          {notification.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {format(notificationDate, 'MMM dd, h:mm a')}
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      {notification.data && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {notification.data.serviceType && (
                            <Badge variant="outline" className="text-xs">
                              {notification.data.serviceType}
                            </Badge>
                          )}
                          {notification.data.price && (
                            <Badge variant="outline" className="text-xs">
                              ₱{notification.data.price.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Notification Details Dialog */}
      <Dialog open={showNotificationDetails} onOpenChange={setShowNotificationDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
            <DialogDescription>
              {selectedNotification?.message}
            </DialogDescription>
          </DialogHeader>
          
          {selectedNotification?.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {selectedNotification.data.clientName && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Client</Label>
                    <p className="font-medium">{selectedNotification.data.clientName}</p>
                  </div>
                )}
                {selectedNotification.data.serviceType && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Service Type</Label>
                    <p className="font-medium">{selectedNotification.data.serviceType}</p>
                  </div>
                )}
                {selectedNotification.data.price && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Price</Label>
                    <p className="font-medium">₱{selectedNotification.data.price.toFixed(2)}</p>
                  </div>
                )}
              </div>
              
              {selectedNotification.data.pickupAddress && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Pickup Address</Label>
                  <p className="font-medium">{selectedNotification.data.pickupAddress}</p>
                </div>
              )}
              
              {selectedNotification.data.deliveryAddress && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Delivery Address</Label>
                  <p className="font-medium">{selectedNotification.data.deliveryAddress}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotificationDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Details Dialog */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Logistics Booking Details</DialogTitle>
            <DialogDescription>
              Complete information for booking #{selectedBooking?.id}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Truck className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Service Type</Label>
                      <p className="font-medium">{selectedBooking.logisticsSubType}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <Badge variant="outline">{selectedBooking.status}</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                      <Badge variant="outline">{selectedBooking.priority}</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Price</Label>
                      <p className="font-medium text-primary">₱{selectedBooking.price.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Customer Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <p className="font-medium">{selectedBooking.clientName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="font-medium">{selectedBooking.contactPhone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedBooking.contactEmail}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Location Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Pickup Address</Label>
                    <p className="font-medium">{selectedBooking.pickupAddress}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Delivery Address</Label>
                    <p className="font-medium">{selectedBooking.deliveryAddress}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Commission Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Commission Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Price:</span>
                    <span className="font-medium">₱{selectedBooking.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Partner Commission (15%):</span>
                    <span className="font-medium text-green-600">₱{(selectedBooking.price * 0.15).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LocalPro Commission (5%):</span>
                    <span className="font-medium text-blue-600">₱{(selectedBooking.price * 0.05).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provider Earnings (80%):</span>
                    <span className="font-medium text-primary">₱{(selectedBooking.price * 0.8).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDetails(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowBookingDetails(false);
              // Navigate to booking management or accept booking
            }}>
              Manage Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
