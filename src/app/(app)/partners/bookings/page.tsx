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
  Timer
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  type: 'wellness' | 'logistics' | 'laundry';
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceDetails: string;
  address: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // in minutes
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  rating?: number;
}

export default function ServiceBookingsPage() {
  const { user, userRole, partnerStatus } = useAuth();
  const t = useTranslations('Partners');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Mock data for service bookings
  useEffect(() => {
    const loadBookings = async () => {
      if (user && userRole === 'partner') {
        try {
          setLoading(true);
          
          // Mock data for service bookings
          const mockBookings: Booking[] = [
            {
              id: "BOOK-001",
              type: "wellness",
              status: "pending",
              customerName: "Sarah Johnson",
              customerEmail: "sarah.johnson@email.com",
              customerPhone: "+63 918 987 6543",
              serviceDetails: "Full body massage - 90 minutes",
              address: "789 Wellness Center, Ortigas",
              scheduledDate: "2024-01-18",
              scheduledTime: "2:00 PM",
              duration: 90,
              totalAmount: 2500,
              notes: "Prefer deep tissue massage",
              createdAt: "2024-01-14T16:45:00Z",
              updatedAt: "2024-01-14T16:45:00Z"
            },
            {
              id: "BOOK-002",
              type: "wellness",
              status: "confirmed",
              customerName: "Maria Santos",
              customerEmail: "maria.santos@email.com",
              customerPhone: "+63 912 345 6789",
              serviceDetails: "Facial treatment + manicure",
              address: "123 Spa Avenue, Makati",
              scheduledDate: "2024-01-20",
              scheduledTime: "10:00 AM",
              duration: 120,
              totalAmount: 1800,
              notes: "Sensitive skin - use gentle products",
              createdAt: "2024-01-15T09:30:00Z",
              updatedAt: "2024-01-15T14:20:00Z"
            },
            {
              id: "BOOK-003",
              type: "logistics",
              status: "in_progress",
              customerName: "Michael Chen",
              customerEmail: "michael.chen@email.com",
              customerPhone: "+63 919 555 1234",
              serviceDetails: "Office relocation - 20 boxes",
              address: "321 Corporate Plaza, Alabang",
              scheduledDate: "2024-01-16",
              scheduledTime: "9:00 AM",
              duration: 240,
              totalAmount: 5000,
              notes: "Fragile items included",
              createdAt: "2024-01-11T09:15:00Z",
              updatedAt: "2024-01-16T09:00:00Z"
            },
            {
              id: "BOOK-004",
              type: "logistics",
              status: "completed",
              customerName: "John Dela Cruz",
              customerEmail: "john.delacruz@email.com",
              customerPhone: "+63 917 123 4567",
              serviceDetails: "Furniture delivery and setup",
              address: "456 Business Ave, BGC",
              scheduledDate: "2024-01-14",
              scheduledTime: "1:00 PM",
              duration: 180,
              totalAmount: 3200,
              notes: "Assembly required",
              createdAt: "2024-01-12T10:30:00Z",
              updatedAt: "2024-01-14T16:30:00Z",
              rating: 5
            },
            {
              id: "BOOK-005",
              type: "laundry",
              status: "pending",
              customerName: "Lisa Rodriguez",
              customerEmail: "lisa.rodriguez@email.com",
              customerPhone: "+63 920 777 8888",
              serviceDetails: "Premium dry cleaning service",
              address: "654 Residential Complex, Quezon City",
              scheduledDate: "2024-01-22",
              scheduledTime: "11:00 AM",
              duration: 60,
              totalAmount: 1200,
              notes: "Express service requested",
              createdAt: "2024-01-16T13:20:00Z",
              updatedAt: "2024-01-16T13:20:00Z"
            },
            {
              id: "BOOK-006",
              type: "wellness",
              status: "completed",
              customerName: "Anna Martinez",
              customerEmail: "anna.martinez@email.com",
              customerPhone: "+63 921 333 4444",
              serviceDetails: "Couples massage - 2 hours",
              address: "987 Luxury Hotel, Pasay",
              scheduledDate: "2024-01-15",
              scheduledTime: "3:00 PM",
              duration: 120,
              totalAmount: 4500,
              notes: "Anniversary celebration",
              createdAt: "2024-01-13T11:45:00Z",
              updatedAt: "2024-01-15T17:00:00Z",
              rating: 4
            }
          ];
          
          setBookings(mockBookings);
        } catch (error) {
          console.error('Error loading bookings:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load bookings. Please try again.",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadBookings();
  }, [user, userRole, toast]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'wellness': return <Sparkles className="h-4 w-4" />;
      case 'logistics': return <Truck className="h-4 w-4" />;
      case 'laundry': return <Star className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'wellness': return 'Wellness Services';
      case 'logistics': return 'Logistics Services';
      case 'laundry': return 'Laundry Services';
      default: return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'in_progress': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.serviceDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesType = typeFilter === "all" || booking.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus as any, updatedAt: new Date().toISOString() }
          : booking
      ));
      
      toast({
        title: "Status Updated",
        description: `Booking ${bookingId} status updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update booking status. Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PartnerAccessGuard>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Service Bookings</h1>
          <p className="text-muted-foreground">
            Manage your service appointments and bookings for wellness, logistics, and laundry services
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Service Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="wellness">Wellness Services</SelectItem>
                    <SelectItem value="logistics">Logistics Services</SelectItem>
                    <SelectItem value="laundry">Laundry Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Actions</label>
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Booking
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Bookings ({filteredBookings.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({bookings.filter(b => b.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({bookings.filter(b => b.status === 'in_progress').length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({bookings.filter(b => b.status === 'completed').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredBookings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Bookings Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                      ? "No bookings match your current filters."
                      : "You don't have any service bookings yet. Start by creating your first booking."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBookings.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{booking.id}</CardTitle>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(booking.type)}
                            <span className="text-sm text-muted-foreground">
                              {getTypeLabel(booking.type)}
                            </span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(booking.status)}
                            {booking.status.replace('_', ' ')}
                          </div>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{booking.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{booking.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{booking.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(booking.scheduledDate)} at {booking.scheduledTime}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Duration: {formatDuration(booking.duration)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Service Details:</p>
                        <p className="text-sm text-muted-foreground">{booking.serviceDetails}</p>
                        {booking.notes && (
                          <p className="text-sm text-muted-foreground italic">
                            Note: {booking.notes}
                          </p>
                        )}
                      </div>

                      {booking.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">Rating:</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < booking.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(booking.totalAmount)}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Handle edit
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Quick Status Update */}
                      {booking.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                            className="flex-1"
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                      {booking.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(booking.id, 'in_progress')}
                          className="w-full"
                        >
                          Start Service
                        </Button>
                      )}
                      {booking.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(booking.id, 'completed')}
                          className="w-full"
                        >
                          Complete Service
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBookings.filter(booking => booking.status === 'pending').map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{booking.id}</CardTitle>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(booking.type)}
                          <span className="text-sm text-muted-foreground">
                            {getTypeLabel(booking.type)}
                          </span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(booking.status)}
                          {booking.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{booking.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(booking.scheduledDate)} at {booking.scheduledTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Duration: {formatDuration(booking.duration)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(booking.totalAmount)}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBookings.filter(booking => booking.status === 'in_progress').map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{booking.id}</CardTitle>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(booking.type)}
                          <span className="text-sm text-muted-foreground">
                            {getTypeLabel(booking.type)}
                          </span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(booking.status)}
                          {booking.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{booking.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(booking.scheduledDate)} at {booking.scheduledTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Duration: {formatDuration(booking.duration)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(booking.totalAmount)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(booking.id, 'completed')}
                        className="w-full"
                      >
                        Complete Service
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBookings.filter(booking => booking.status === 'completed').map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{booking.id}</CardTitle>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(booking.type)}
                          <span className="text-sm text-muted-foreground">
                            {getTypeLabel(booking.type)}
                          </span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(booking.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(booking.status)}
                          {booking.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{booking.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(booking.scheduledDate)} at {booking.scheduledTime}
                        </span>
                      </div>
                      {booking.rating && (
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">Rating:</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < booking.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(booking.totalAmount)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Booking Details Modal */}
        {selectedBooking && (
          <Card className="fixed inset-4 z-50 overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Booking Details - {selectedBooking.id}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Customer Information</h4>
                    <p className="text-sm text-muted-foreground">{selectedBooking.customerName}</p>
                    <p className="text-sm text-muted-foreground">{selectedBooking.customerEmail}</p>
                    <p className="text-sm text-muted-foreground">{selectedBooking.customerPhone}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Service Details</h4>
                    <p className="text-sm text-muted-foreground">{selectedBooking.serviceDetails}</p>
                    <p className="text-sm text-muted-foreground">{selectedBooking.address}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Schedule</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedBooking.scheduledDate)} at {selectedBooking.scheduledTime}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Duration: {formatDuration(selectedBooking.duration)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Total Amount</h4>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(selectedBooking.totalAmount)}
                    </p>
                  </div>
                </div>
                {selectedBooking.notes && (
                  <div>
                    <h4 className="font-medium">Notes</h4>
                    <p className="text-sm text-muted-foreground">{selectedBooking.notes}</p>
                  </div>
                )}
                {selectedBooking.rating && (
                  <div>
                    <h4 className="font-medium">Customer Rating</h4>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < selectedBooking.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PartnerAccessGuard>
  );
}
