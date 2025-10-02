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
  ClipboardList, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Utensils,
  Sparkles,
  Truck,
  Wrench,
  Eye,
  Edit,
  Trash2,
  Plus
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  type: 'laundry' | 'food' | 'wellness' | 'logistics' | 'supplies';
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceDetails: string;
  address: string;
  scheduledDate: string;
  scheduledTime: string;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrdersBookingsPage() {
  const { user, userRole, partnerStatus } = useAuth();
  const t = useTranslations('Partners');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Mock data - replace with actual data fetching
  useEffect(() => {
    const loadOrders = async () => {
      if (user && userRole === 'partner') {
        try {
          setLoading(true);
          
          // Mock data for different business types
          const mockOrders: Order[] = [
            {
              id: "ORD-001",
              type: "laundry",
              status: "pending",
              customerName: "Maria Santos",
              customerEmail: "maria.santos@email.com",
              customerPhone: "+63 912 345 6789",
              serviceDetails: "Dry cleaning: 3 suits, 2 dresses",
              address: "123 Main St, Makati City",
              scheduledDate: "2024-01-15",
              scheduledTime: "10:00 AM",
              totalAmount: 850,
              notes: "Please handle with care",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "ORD-002",
              type: "food",
              status: "confirmed",
              customerName: "John Dela Cruz",
              customerEmail: "john.delacruz@email.com",
              customerPhone: "+63 917 123 4567",
              serviceDetails: "Catering for 50 people - Corporate event",
              address: "456 Business Ave, BGC",
              scheduledDate: "2024-01-20",
              scheduledTime: "12:00 PM",
              totalAmount: 15000,
              notes: "Vegetarian options required",
              createdAt: "2024-01-12T10:30:00Z",
              updatedAt: "2024-01-12T14:20:00Z"
            },
            {
              id: "ORD-003",
              type: "wellness",
              status: "in_progress",
              customerName: "Sarah Johnson",
              customerEmail: "sarah.johnson@email.com",
              customerPhone: "+63 918 987 6543",
              serviceDetails: "Full body massage - 90 minutes",
              address: "789 Wellness Center, Ortigas",
              scheduledDate: "2024-01-18",
              scheduledTime: "2:00 PM",
              totalAmount: 2500,
              notes: "Prefer deep tissue massage",
              createdAt: "2024-01-14T16:45:00Z",
              updatedAt: "2024-01-18T14:00:00Z"
            },
            {
              id: "ORD-004",
              type: "logistics",
              status: "completed",
              customerName: "Michael Chen",
              customerEmail: "michael.chen@email.com",
              customerPhone: "+63 919 555 1234",
              serviceDetails: "Office relocation - 20 boxes",
              address: "321 Corporate Plaza, Alabang",
              scheduledDate: "2024-01-16",
              scheduledTime: "9:00 AM",
              totalAmount: 5000,
              notes: "Fragile items included",
              createdAt: "2024-01-11T09:15:00Z",
              updatedAt: "2024-01-16T17:30:00Z"
            },
            {
              id: "ORD-005",
              type: "supplies",
              status: "pending",
              customerName: "Lisa Rodriguez",
              customerEmail: "lisa.rodriguez@email.com",
              customerPhone: "+63 920 777 8888",
              serviceDetails: "Office supplies delivery",
              address: "654 Business Park, Quezon City",
              scheduledDate: "2024-01-22",
              scheduledTime: "11:00 AM",
              totalAmount: 3200,
              notes: "Urgent delivery needed",
              createdAt: "2024-01-15T13:20:00Z",
              updatedAt: "2024-01-15T13:20:00Z"
            }
          ];
          
          setOrders(mockOrders);
        } catch (error) {
          console.error('Error loading orders:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load orders. Please try again.",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadOrders();
  }, [user, userRole, toast]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'laundry': return <Package className="h-4 w-4" />;
      case 'food': return <Utensils className="h-4 w-4" />;
      case 'wellness': return <Sparkles className="h-4 w-4" />;
      case 'logistics': return <Truck className="h-4 w-4" />;
      case 'supplies': return <Wrench className="h-4 w-4" />;
      default: return <ClipboardList className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'laundry': return 'Laundry & Dry Cleaning';
      case 'food': return 'Food & Catering';
      case 'wellness': return 'Wellness';
      case 'logistics': return 'Logistics';
      case 'supplies': return 'Supplies & Hardware';
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.serviceDetails.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesType = typeFilter === "all" || order.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      // Update order status
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as any, updatedAt: new Date().toISOString() }
          : order
      ));
      
      toast({
        title: "Status Updated",
        description: `Order ${orderId} status updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status. Please try again.",
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
          <h1 className="text-3xl font-bold tracking-tight">Orders & Bookings</h1>
          <p className="text-muted-foreground">
            Manage your business orders and bookings across all service categories
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
                    placeholder="Search orders..."
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
                    <SelectItem value="laundry">Laundry & Dry Cleaning</SelectItem>
                    <SelectItem value="food">Food & Catering</SelectItem>
                    <SelectItem value="wellness">Wellness</SelectItem>
                    <SelectItem value="logistics">Logistics</SelectItem>
                    <SelectItem value="supplies">Supplies & Hardware</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Actions</label>
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Order
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Orders ({filteredOrders.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({orders.filter(o => o.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({orders.filter(o => o.status === 'in_progress').length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({orders.filter(o => o.status === 'completed').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                      ? "No orders match your current filters."
                      : "You don't have any orders yet. Start by creating your first order."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{order.id}</CardTitle>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(order.type)}
                            <span className="text-sm text-muted-foreground">
                              {getTypeLabel(order.type)}
                            </span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status.replace('_', ' ')}
                          </div>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{order.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{order.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{order.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(order.scheduledDate)} at {order.scheduledTime}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Service Details:</p>
                        <p className="text-sm text-muted-foreground">{order.serviceDetails}</p>
                        {order.notes && (
                          <p className="text-sm text-muted-foreground italic">
                            Note: {order.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(order.totalAmount)}
                        </span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
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
                      {order.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                            className="flex-1"
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                      {order.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'in_progress')}
                          className="w-full"
                        >
                          Start Service
                        </Button>
                      )}
                      {order.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'completed')}
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
              {filteredOrders.filter(order => order.status === 'pending').map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{order.id}</CardTitle>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(order.type)}
                          <span className="text-sm text-muted-foreground">
                            {getTypeLabel(order.type)}
                          </span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(order.scheduledDate)} at {order.scheduledTime}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(order.totalAmount)}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(order.id, 'cancelled')}
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
              {filteredOrders.filter(order => order.status === 'in_progress').map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{order.id}</CardTitle>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(order.type)}
                          <span className="text-sm text-muted-foreground">
                            {getTypeLabel(order.type)}
                          </span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(order.scheduledDate)} at {order.scheduledTime}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(order.totalAmount)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, 'completed')}
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
              {filteredOrders.filter(order => order.status === 'completed').map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{order.id}</CardTitle>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(order.type)}
                          <span className="text-sm text-muted-foreground">
                            {getTypeLabel(order.type)}
                          </span>
                        </div>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {order.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{order.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(order.scheduledDate)} at {order.scheduledTime}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(order.totalAmount)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
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

        {/* Order Details Modal would go here */}
        {selectedOrder && (
          <Card className="fixed inset-4 z-50 overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order Details - {selectedOrder.id}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
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
                    <p className="text-sm text-muted-foreground">{selectedOrder.customerName}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.customerPhone}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Service Details</h4>
                    <p className="text-sm text-muted-foreground">{selectedOrder.serviceDetails}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.address}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Schedule</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedOrder.scheduledDate)} at {selectedOrder.scheduledTime}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Total Amount</h4>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </p>
                  </div>
                </div>
                {selectedOrder.notes && (
                  <div>
                    <h4 className="font-medium">Notes</h4>
                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
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
