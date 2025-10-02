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
  Package, 
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
  Utensils,
  Wrench,
  Eye,
  Edit,
  Plus,
  Truck,
  ShoppingCart,
  CreditCard
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  type: 'food' | 'supplies';
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  address: string;
  deliveryDate: string;
  deliveryTime: string;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}

export default function ProductOrdersPage() {
  const { user, userRole, partnerStatus } = useAuth();
  const t = useTranslations('Partners');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Mock data for product orders
  useEffect(() => {
    const loadOrders = async () => {
      if (user && userRole === 'partner') {
        try {
          setLoading(true);
          
          // Mock data for product orders
          const mockOrders: Order[] = [
            {
              id: "ORD-001",
              type: "food",
              status: "pending",
              customerName: "John Dela Cruz",
              customerEmail: "john.delacruz@email.com",
              customerPhone: "+63 917 123 4567",
              items: [
                {
                  id: "ITEM-001",
                  name: "Corporate Lunch Box",
                  quantity: 25,
                  unitPrice: 350,
                  totalPrice: 8750,
                  description: "Includes main dish, rice, vegetables, and dessert"
                },
                {
                  id: "ITEM-002",
                  name: "Beverage Package",
                  quantity: 25,
                  unitPrice: 50,
                  totalPrice: 1250,
                  description: "Assorted drinks"
                }
              ],
              address: "456 Business Ave, BGC",
              deliveryDate: "2024-01-20",
              deliveryTime: "12:00 PM",
              totalAmount: 10000,
              paymentStatus: "pending",
              notes: "Vegetarian options required for 5 people",
              createdAt: "2024-01-12T10:30:00Z",
              updatedAt: "2024-01-12T10:30:00Z"
            },
            {
              id: "ORD-002",
              type: "supplies",
              status: "confirmed",
              customerName: "Lisa Rodriguez",
              customerEmail: "lisa.rodriguez@email.com",
              customerPhone: "+63 920 777 8888",
              items: [
                {
                  id: "ITEM-003",
                  name: "Office Supplies Kit",
                  quantity: 1,
                  unitPrice: 2500,
                  totalPrice: 2500,
                  description: "Includes pens, notebooks, folders, and desk organizers"
                },
                {
                  id: "ITEM-004",
                  name: "Printer Paper (A4)",
                  quantity: 10,
                  unitPrice: 120,
                  totalPrice: 1200,
                  description: "500 sheets per ream"
                }
              ],
              address: "654 Business Park, Quezon City",
              deliveryDate: "2024-01-22",
              deliveryTime: "11:00 AM",
              totalAmount: 3700,
              paymentStatus: "paid",
              notes: "Urgent delivery needed",
              createdAt: "2024-01-15T13:20:00Z",
              updatedAt: "2024-01-15T14:20:00Z"
            },
            {
              id: "ORD-003",
              type: "food",
              status: "preparing",
              customerName: "Maria Santos",
              customerEmail: "maria.santos@email.com",
              customerPhone: "+63 912 345 6789",
              items: [
                {
                  id: "ITEM-005",
                  name: "Birthday Cake",
                  quantity: 1,
                  unitPrice: 2500,
                  totalPrice: 2500,
                  description: "Chocolate cake with vanilla frosting"
                },
                {
                  id: "ITEM-006",
                  name: "Party Snacks",
                  quantity: 1,
                  unitPrice: 1500,
                  totalPrice: 1500,
                  description: "Assorted finger foods for 20 people"
                }
              ],
              address: "123 Main St, Makati City",
              deliveryDate: "2024-01-18",
              deliveryTime: "3:00 PM",
              totalAmount: 4000,
              paymentStatus: "paid",
              notes: "Please handle cake with care",
              createdAt: "2024-01-14T16:45:00Z",
              updatedAt: "2024-01-18T14:00:00Z"
            },
            {
              id: "ORD-004",
              type: "supplies",
              status: "shipped",
              customerName: "Michael Chen",
              customerEmail: "michael.chen@email.com",
              customerPhone: "+63 919 555 1234",
              items: [
                {
                  id: "ITEM-007",
                  name: "Hardware Tools Set",
                  quantity: 1,
                  unitPrice: 4500,
                  totalPrice: 4500,
                  description: "Complete toolkit with 50+ pieces"
                }
              ],
              address: "321 Corporate Plaza, Alabang",
              deliveryDate: "2024-01-16",
              deliveryTime: "2:00 PM",
              totalAmount: 4500,
              paymentStatus: "paid",
              notes: "Fragile items included",
              createdAt: "2024-01-11T09:15:00Z",
              updatedAt: "2024-01-16T10:30:00Z",
              trackingNumber: "TRK-789456123"
            },
            {
              id: "ORD-005",
              type: "food",
              status: "delivered",
              customerName: "Anna Martinez",
              customerEmail: "anna.martinez@email.com",
              customerPhone: "+63 921 333 4444",
              items: [
                {
                  id: "ITEM-008",
                  name: "Catering Package",
                  quantity: 1,
                  unitPrice: 8000,
                  totalPrice: 8000,
                  description: "Full catering for 30 people - buffet style"
                }
              ],
              address: "987 Luxury Hotel, Pasay",
              deliveryDate: "2024-01-15",
              deliveryTime: "6:00 PM",
              totalAmount: 8000,
              paymentStatus: "paid",
              notes: "Anniversary celebration",
              createdAt: "2024-01-13T11:45:00Z",
              updatedAt: "2024-01-15T18:00:00Z"
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
      case 'food': return <Utensils className="h-4 w-4" />;
      case 'supplies': return <Wrench className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'food': return 'Food & Catering';
      case 'supplies': return 'Supplies & Hardware';
      default: return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'preparing': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'shipped': return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
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
                         order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesType = typeFilter === "all" || order.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              status: newStatus as any, 
              updatedAt: new Date().toISOString(),
              trackingNumber: newStatus === 'shipped' ? `TRK-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : order.trackingNumber
            }
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
          <h1 className="text-3xl font-bold tracking-tight">Product Orders</h1>
          <p className="text-muted-foreground">
            Manage your product orders for food & catering and supplies & hardware
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
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="food">Food & Catering</SelectItem>
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
            <TabsTrigger value="preparing">Preparing ({orders.filter(o => o.status === 'preparing').length})</TabsTrigger>
            <TabsTrigger value="shipped">Shipped ({orders.filter(o => o.status === 'shipped').length})</TabsTrigger>
            <TabsTrigger value="delivered">Delivered ({orders.filter(o => o.status === 'delivered').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                      ? "No orders match your current filters."
                      : "You don't have any product orders yet. Start by creating your first order."}
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
                        <div className="flex flex-col gap-2">
                          <Badge className={getStatusColor(order.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(order.status)}
                              {order.status}
                            </div>
                          </Badge>
                          <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              {order.paymentStatus}
                            </div>
                          </Badge>
                        </div>
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
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(order.deliveryDate)} at {order.deliveryTime}
                          </span>
                        </div>
                        {order.trackingNumber && (
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Track: {order.trackingNumber}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Items ({order.items.length}):</p>
                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item) => (
                            <div key={item.id} className="text-sm text-muted-foreground">
                              {item.quantity}x {item.name}
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="text-sm text-muted-foreground">
                              +{order.items.length - 2} more items
                            </div>
                          )}
                        </div>
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
                          onClick={() => handleStatusUpdate(order.id, 'preparing')}
                          className="w-full"
                        >
                          Start Preparing
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'shipped')}
                          className="w-full"
                        >
                          Ship Order
                        </Button>
                      )}
                      {order.status === 'shipped' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'delivered')}
                          className="w-full"
                        >
                          Mark Delivered
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
                          {order.status}
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
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(order.deliveryDate)} at {order.deliveryTime}
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

          <TabsContent value="preparing" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredOrders.filter(order => order.status === 'preparing').map((order) => (
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
                          {order.status}
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
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(order.deliveryDate)} at {order.deliveryTime}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(order.totalAmount)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, 'shipped')}
                        className="w-full"
                      >
                        Ship Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="shipped" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredOrders.filter(order => order.status === 'shipped').map((order) => (
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
                          {order.status}
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
                      {order.trackingNumber && (
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Track: {order.trackingNumber}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(order.totalAmount)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, 'delivered')}
                        className="w-full"
                      >
                        Mark Delivered
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="delivered" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredOrders.filter(order => order.status === 'delivered').map((order) => (
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
                          {order.status}
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
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Delivered on {formatDate(order.updatedAt)}
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

        {/* Order Details Modal */}
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
                    <h4 className="font-medium">Delivery Information</h4>
                    <p className="text-sm text-muted-foreground">{selectedOrder.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedOrder.deliveryDate)} at {selectedOrder.deliveryTime}
                    </p>
                    {selectedOrder.trackingNumber && (
                      <p className="text-sm text-muted-foreground">
                        Tracking: {selectedOrder.trackingNumber}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">Order Items</h4>
                  <div className="space-y-2 mt-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.quantity}x {formatCurrency(item.unitPrice)}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(item.totalPrice)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Payment Status</h4>
                    <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                      {selectedOrder.paymentStatus}
                    </Badge>
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
