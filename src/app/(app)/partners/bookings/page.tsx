"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { PartnerAccessGuard } from "@/components/partner-access-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogisticsBookingAcceptance } from "@/components/logistics-booking-acceptance";
import { ProviderAssignmentSystem } from "@/components/provider-assignment-system";
import { NotificationSystem } from "@/components/notification-system";
import { LogisticsPaymentSystem } from "@/components/logistics-payment-system";
import { CommissionManagementSystem } from "@/components/commission-management-system";
import { 
  Calendar, 
  Search, 
  Filter, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Truck,
  Eye,
  Edit,
  Plus,
  Star,
  Timer,
  Package,
  Users,
  Home,
  Navigation,
  RefreshCw,
  MessageSquare,
  FileText,
  Shield,
  Zap,
  Grid3X3,
  List,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getDb } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { format } from "date-fns";

interface EnhancedBooking {
  id: string;
  providerId: string;
  providerName: string;
  clientId: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  serviceType: 'transport' | 'delivery' | 'moving';
  bookingType: 'instant' | 'scheduled';
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  trackingStatus: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'failed';
  price: number;
  basePrice: number;
  additionalFees: number;
  date: any; // Firestore Timestamp
  pickupAddress: string;
  deliveryAddress: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  // Service-specific data
  passengerCount?: number;
  itemDescription?: string;
  itemWeight?: number;
  itemValue?: number;
  movingItems?: string[];
  // Special requests
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
  createdAt: any;
  updatedAt: any;
  rating?: number;
  feedback?: string;
}

export default function ServiceBookingsPage() {
  const { user, userRole, partnerStatus, partnerData } = useAuth();
  const t = useTranslations('Partners');
  const { toast } = useToast();

  const [bookings, setBookings] = useState<EnhancedBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<EnhancedBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [bookingTypeFilter, setBookingTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedBooking, setSelectedBooking] = useState<EnhancedBooking | null>(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch bookings from Firestore
  useEffect(() => {
    if (!user?.uid || !getDb()) return;

    const q = query(
      collection(getDb()!, 'bookings'),
      where('providerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EnhancedBooking[];
      
      setBookings(bookingsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter bookings
  useEffect(() => {
    let filtered = bookings;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Service type filter
    if (serviceTypeFilter !== 'all') {
      filtered = filtered.filter(booking => booking.serviceType === serviceTypeFilter);
    }

    // Booking type filter
    if (bookingTypeFilter !== 'all') {
      filtered = filtered.filter(booking => booking.bookingType === bookingTypeFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(booking => booking.priority === priorityFilter);
    }

    setFilteredBookings(filtered);
  }, [bookings, searchTerm, statusFilter, serviceTypeFilter, bookingTypeFilter, priorityFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const handleStatusUpdate = async () => {
    if (!selectedBooking || !newStatus) return;

    setIsUpdating(true);
    try {
      if (!getDb()) throw new Error('Database not initialized');
      const bookingRef = doc(getDb()!, 'bookings', selectedBooking.id);
      const newStatusHistory = [
        ...selectedBooking.statusHistory,
        {
          status: newStatus,
          timestamp: serverTimestamp(),
          note: statusNote || `Status updated to ${newStatus}`,
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

      setShowStatusUpdate(false);
      setNewStatus('');
      setStatusNote('');
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update booking status',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const openBookingDetails = (booking: EnhancedBooking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const openStatusUpdate = (booking: EnhancedBooking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setShowStatusUpdate(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <PartnerAccessGuard>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Booking & Order Management</h1>
            <p className="text-muted-foreground">Manage your service bookings and track orders</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Logistics-specific tabs for logistics partners */}
        {partnerData?.businessType === 'Logistics (transport, delivery, moving services)' && (
          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="acceptance">Booking Acceptance</TabsTrigger>
              <TabsTrigger value="assignment">Provider Assignment</TabsTrigger>
              <TabsTrigger value="payments">Payment Processing</TabsTrigger>
              <TabsTrigger value="commissions">Commissions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="notifications" className="space-y-6">
              <NotificationSystem />
            </TabsContent>
            
            <TabsContent value="acceptance" className="space-y-6">
              <LogisticsBookingAcceptance />
            </TabsContent>
            
            <TabsContent value="assignment" className="space-y-6">
              <ProviderAssignmentSystem />
            </TabsContent>
            
            <TabsContent value="payments" className="space-y-6">
              <LogisticsPaymentSystem />
            </TabsContent>
            
            <TabsContent value="commissions" className="space-y-6">
              <CommissionManagementSystem />
            </TabsContent>
          </Tabs>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'pending').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Navigation className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'in_progress').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{bookings.filter(b => b.status === 'completed').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Zap className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Urgent</p>
                  <p className="text-2xl font-bold">{bookings.filter(b => b.priority === 'urgent').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="transport">Transport (People)</SelectItem>
                    <SelectItem value="delivery">Delivery (Goods)</SelectItem>
                    <SelectItem value="moving">Moving (Furniture/Household)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Booking Type</Label>
                <Select value={bookingTypeFilter} onValueChange={setBookingTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="instant">Instant</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Actions</Label>
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Booking
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List/Grid */}
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
              <p className="text-muted-foreground">No bookings match your current filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredBookings.map((booking) => {
              const ServiceIcon = getServiceTypeIcon(booking.serviceType);
              const bookingDate = booking.date?.toDate ? booking.date.toDate() : new Date(booking.date);
              
              return (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <ServiceIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{booking.serviceName}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {getServiceTypeLabel(booking.serviceType)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(booking.priority)}>
                          {booking.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.clientName}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{booking.pickupAddress}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{booking.deliveryAddress}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(bookingDate, 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{format(bookingDate, 'h:mm a')}</span>
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
                          variant="outline"
                          size="sm"
                          onClick={() => openStatusUpdate(booking)}
                        >
                          <Edit className="h-4 w-4" />
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
              <DialogTitle>Booking Details</DialogTitle>
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
                      <FileText className="h-5 w-5" />
                      <span>Basic Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Service</Label>
                        <p className="font-medium">{selectedBooking.serviceName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Service Type</Label>
                        <p className="font-medium">{getServiceTypeLabel(selectedBooking.serviceType)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Booking Type</Label>
                        <Badge variant={selectedBooking.bookingType === 'instant' ? 'default' : 'secondary'}>
                          {selectedBooking.bookingType}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                        <Badge className={getPriorityColor(selectedBooking.priority)}>
                          {selectedBooking.priority}
                        </Badge>
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
                    {selectedBooking.serviceType === 'transport' && selectedBooking.passengerCount && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Passenger Count</Label>
                        <p className="font-medium">{selectedBooking.passengerCount} passengers</p>
                      </div>
                    )}
                    {selectedBooking.serviceType === 'delivery' && (
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
                    {selectedBooking.serviceType === 'moving' && selectedBooking.movingItems && (
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
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
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

                {/* Pricing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="h-5 w-5" />
                      <span>Pricing</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span>₱{selectedBooking.basePrice.toFixed(2)}</span>
                    </div>
                    {selectedBooking.additionalFees > 0 && (
                      <div className="flex justify-between">
                        <span>Additional Fees:</span>
                        <span>₱{selectedBooking.additionalFees.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total Price:</span>
                      <span className="text-primary">₱{selectedBooking.price.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Status History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Status History</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedBooking.statusHistory.map((entry, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <div className="p-1 bg-primary/10 rounded-full">
                            <CheckCircle className="h-3 w-3 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium capitalize">{entry.status.replace('_', ' ')}</p>
                              <p className="text-sm text-muted-foreground">
                                {entry.timestamp?.toDate ? format(entry.timestamp.toDate(), 'MMM dd, yyyy h:mm a') : 'Unknown time'}
                              </p>
                            </div>
                            {entry.note && (
                              <p className="text-sm text-muted-foreground mt-1">{entry.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
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
          </DialogContent>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={showStatusUpdate} onOpenChange={setShowStatusUpdate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Booking Status</DialogTitle>
              <DialogDescription>
                Update the status for booking #{selectedBooking?.id}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Status Note (Optional)</Label>
                <Textarea
                  placeholder="Add a note about this status update..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStatusUpdate(false)}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate} disabled={isUpdating || !newStatus}>
                {isUpdating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PartnerAccessGuard>
  );
}