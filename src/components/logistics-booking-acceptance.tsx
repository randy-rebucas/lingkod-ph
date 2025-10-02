"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
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
  DollarSign,
  User,
  Navigation,
  Shield,
  Star
} from "lucide-react";
import { getDb } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

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
  basePrice: number;
  additionalFees: number;
  pickupAddress: string;
  deliveryAddress: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  passengerCount?: number;
  itemDescription?: string;
  itemWeight?: number;
  itemValue?: number;
  movingItems?: string;
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
  estimatedDuration: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  statusHistory: Array<{
    status: string;
    timestamp: any;
    note?: string;
  }>;
  notifications: {
    partnerNotified: boolean;
    providerAssigned: boolean;
    pickupCompleted: boolean;
    deliveryCompleted: boolean;
  };
  commission: {
    partnerCommission: number;
    localProCommission: number;
    providerEarnings: number;
  };
  createdAt: any;
  updatedAt: any;
}

export function LogisticsBookingAcceptance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingBookings, setPendingBookings] = useState<LogisticsBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<LogisticsBooking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [showAcceptanceDialog, setShowAcceptanceDialog] = useState(false);
  const [acceptanceNote, setAcceptanceNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch pending logistics bookings for this partner
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(getDb(), 'logisticsBookings'),
      where('partnerId', '==', user.uid),
      where('status', 'in', ['Pending', 'Scheduled']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogisticsBooking[];
      
      setPendingBookings(bookingsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const getServiceTypeIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'transport': return Users;
      case 'delivery': return Package;
      case 'moving': return Home;
      default: return Truck;
    }
  };

  const getServiceTypeLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'transport': return 'Transport (People)';
      case 'delivery': return 'Delivery (Goods)';
      case 'moving': return 'Moving (Furniture/Household)';
      default: return serviceType;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAcceptBooking = async () => {
    if (!selectedBooking) return;

    setIsProcessing(true);
    try {
      const bookingRef = doc(getDb(), 'logisticsBookings', selectedBooking.id);
      
      // Update booking status
      const newStatusHistory = [
        ...selectedBooking.statusHistory,
        {
          status: 'accepted',
          timestamp: serverTimestamp(),
          note: acceptanceNote || 'Booking accepted by partner',
        }
      ];

      await updateDoc(bookingRef, {
        status: 'accepted',
        trackingStatus: 'accepted',
        statusHistory: newStatusHistory,
        notifications: {
          ...selectedBooking.notifications,
          partnerNotified: true,
        },
        updatedAt: serverTimestamp(),
      });

      // Create notification for client
      await addDoc(collection(getDb(), 'notifications'), {
        type: 'booking_accepted',
        recipientId: selectedBooking.clientId,
        recipientType: 'client',
        title: 'Booking Accepted',
        message: `Your ${selectedBooking.logisticsSubType} booking has been accepted by ${selectedBooking.partnerName}`,
        data: {
          bookingId: selectedBooking.id,
          partnerName: selectedBooking.partnerName,
          serviceType: selectedBooking.logisticsSubType,
          price: selectedBooking.price,
        },
        read: false,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Booking Accepted",
        description: "The booking has been accepted and the client has been notified.",
      });

      setShowAcceptanceDialog(false);
      setShowBookingDetails(false);
      setSelectedBooking(null);
      setAcceptanceNote('');
    } catch (error) {
      console.error('Error accepting booking:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to accept booking',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectBooking = async () => {
    if (!selectedBooking) return;

    setIsProcessing(true);
    try {
      const bookingRef = doc(getDb(), 'logisticsBookings', selectedBooking.id);
      
      // Update booking status
      const newStatusHistory = [
        ...selectedBooking.statusHistory,
        {
          status: 'rejected',
          timestamp: serverTimestamp(),
          note: acceptanceNote || 'Booking rejected by partner',
        }
      ];

      await updateDoc(bookingRef, {
        status: 'rejected',
        trackingStatus: 'failed',
        statusHistory: newStatusHistory,
        updatedAt: serverTimestamp(),
      });

      // Create notification for client
      await addDoc(collection(getDb(), 'notifications'), {
        type: 'booking_rejected',
        recipientId: selectedBooking.clientId,
        recipientType: 'client',
        title: 'Booking Rejected',
        message: `Your ${selectedBooking.logisticsSubType} booking has been rejected by ${selectedBooking.partnerName}`,
        data: {
          bookingId: selectedBooking.id,
          partnerName: selectedBooking.partnerName,
          serviceType: selectedBooking.logisticsSubType,
          reason: acceptanceNote,
        },
        read: false,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Booking Rejected",
        description: "The booking has been rejected and the client has been notified.",
      });

      setShowAcceptanceDialog(false);
      setShowBookingDetails(false);
      setSelectedBooking(null);
      setAcceptanceNote('');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject booking',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openBookingDetails = (booking: LogisticsBooking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const openAcceptanceDialog = (booking: LogisticsBooking) => {
    setSelectedBooking(booking);
    setShowAcceptanceDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading pending bookings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pending Logistics Bookings</h2>
          <p className="text-muted-foreground">Review and accept new logistics service requests</p>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {pendingBookings.length} pending
        </Badge>
      </div>

      {/* Pending Bookings List */}
      {pendingBookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No pending bookings</h3>
            <p className="text-muted-foreground">You'll see new logistics booking requests here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingBookings.map((booking) => {
            const ServiceIcon = getServiceTypeIcon(booking.logisticsSubType);
            const bookingDate = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date();
            
            return (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ServiceIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{getServiceTypeLabel(booking.logisticsSubType)}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          From {booking.clientName}
                        </p>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(booking.priority)}>
                      {booking.priority}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{booking.pickupAddress}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Navigation className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{booking.deliveryAddress}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(bookingDate, 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Est. {booking.estimatedDuration} minutes</span>
                    </div>
                  </div>

                  {/* Special Requests */}
                  {Object.values(booking.specialRequests).some(Boolean) && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Special Requests</Label>
                      <div className="flex flex-wrap gap-1">
                        {booking.specialRequests.fragileHandling && (
                          <Badge variant="secondary" className="text-xs">Fragile</Badge>
                        )}
                        {booking.specialRequests.helperRequired && (
                          <Badge variant="secondary" className="text-xs">Helper</Badge>
                        )}
                        {booking.specialRequests.insuranceRequired && (
                          <Badge variant="secondary" className="text-xs">Insurance</Badge>
                        )}
                        {booking.specialRequests.whiteGloveService && (
                          <Badge variant="secondary" className="text-xs">White Glove</Badge>
                        )}
                        {booking.specialRequests.multipleDropoffs && (
                          <Badge variant="secondary" className="text-xs">Multi-Stop</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-lg font-bold text-primary">
                      ₱{booking.price.toFixed(2)}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openBookingDetails(booking)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => openAcceptanceDialog(booking)}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
                      <p className="font-medium">{getServiceTypeLabel(selectedBooking.logisticsSubType)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <Badge variant="outline">{selectedBooking.status}</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                      <Badge className={getPriorityColor(selectedBooking.priority)}>
                        {selectedBooking.priority}
                      </Badge>
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
                    <User className="h-5 w-5" />
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
                  {selectedBooking.additionalStops && selectedBooking.additionalStops.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Additional Stops</Label>
                      <div className="space-y-2 mt-2">
                        {selectedBooking.additionalStops.map((stop, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{stop.type}</Badge>
                              <span className="text-sm text-muted-foreground">Stop {index + 1}</span>
                            </div>
                            <p className="font-medium">{stop.address}</p>
                            {stop.contactName && (
                              <p className="text-sm text-muted-foreground">Contact: {stop.contactName}</p>
                            )}
                            {stop.items && (
                              <p className="text-sm text-muted-foreground">Items: {stop.items}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Service Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Service Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedBooking.logisticsSubType === 'transport' && selectedBooking.passengerCount && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Passenger Count</Label>
                      <p className="font-medium">{selectedBooking.passengerCount} passengers</p>
                    </div>
                  )}
                  {selectedBooking.logisticsSubType === 'delivery' && (
                    <div className="space-y-2">
                      {selectedBooking.itemDescription && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Item Description</Label>
                          <p className="font-medium">{selectedBooking.itemDescription}</p>
                        </div>
                      )}
                      {selectedBooking.itemWeight && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Weight</Label>
                          <p className="font-medium">{selectedBooking.itemWeight} kg</p>
                        </div>
                      )}
                      {selectedBooking.itemValue && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Item Value</Label>
                          <p className="font-medium">₱{selectedBooking.itemValue.toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedBooking.logisticsSubType === 'moving' && selectedBooking.movingItems && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Moving Items</Label>
                      <p className="font-medium">{selectedBooking.movingItems}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Estimated Duration</Label>
                    <p className="font-medium">{selectedBooking.estimatedDuration} minutes</p>
                  </div>
                </CardContent>
              </Card>

              {/* Special Requests */}
              {Object.values(selectedBooking.specialRequests).some(Boolean) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Special Requests</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(selectedBooking.specialRequests)
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

              {selectedBooking.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>Notes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedBooking.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDetails(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowBookingDetails(false);
              openAcceptanceDialog(selectedBooking!);
            }}>
              Accept/Reject Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Acceptance Dialog */}
      <Dialog open={showAcceptanceDialog} onOpenChange={setShowAcceptanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept or Reject Booking</DialogTitle>
            <DialogDescription>
              Review the booking details and decide whether to accept or reject this logistics service request.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{getServiceTypeLabel(selectedBooking.logisticsSubType)}</h3>
                  <Badge className={getPriorityColor(selectedBooking.priority)}>
                    {selectedBooking.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  From {selectedBooking.clientName} • ₱{selectedBooking.price.toFixed(2)}
                </p>
                <p className="text-sm">
                  <strong>Pickup:</strong> {selectedBooking.pickupAddress}
                </p>
                <p className="text-sm">
                  <strong>Delivery:</strong> {selectedBooking.deliveryAddress}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Note (Optional)</Label>
                <Textarea
                  placeholder="Add a note about your decision..."
                  value={acceptanceNote}
                  onChange={(e) => setAcceptanceNote(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowAcceptanceDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectBooking}
              disabled={isProcessing}
            >
              {isProcessing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Reject Booking
            </Button>
            <Button 
              onClick={handleAcceptBooking}
              disabled={isProcessing}
            >
              {isProcessing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Accept Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
