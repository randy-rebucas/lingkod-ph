"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { PartnerAccessGuard } from "@/components/partner-access-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  User,
  Calendar,
  Search,
  Filter,
  Eye,
  Navigation
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Delivery {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupAddress: string;
  deliveryAddress: string;
  deliveryType: 'standard' | 'express' | 'scheduled' | 'moving';
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled';
  vehicleId?: string;
  driverId?: string;
  driverName?: string;
  vehicleName?: string;
  scheduledDate: string;
  scheduledTime: string;
  actualPickupTime?: string;
  actualDeliveryTime?: string;
  items: {
    description: string;
    quantity: number;
    weight?: number;
    dimensions?: string;
    value?: number;
  }[];
  totalWeight: number;
  totalValue: number;
  deliveryFee: number;
  specialInstructions?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DeliveryManagementPage() {
  const { user, userRole, partnerData } = useAuth();
  const t = useTranslations('Partners');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<Delivery['status'] | 'all'>('all');
  const [filterType, setFilterType] = useState<Delivery['deliveryType'] | 'all'>('all');
  const [formData, setFormData] = useState({
    orderId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    pickupAddress: '',
    deliveryAddress: '',
    deliveryType: '',
    vehicleId: '',
    driverId: '',
    scheduledDate: '',
    scheduledTime: '',
    items: '',
    specialInstructions: '',
    notes: ''
  });

  // Mock data for deliveries
  useEffect(() => {
    const loadDeliveries = async () => {
      if (user && userRole === 'partner') {
        try {
          setLoading(true);
          
          // Mock data for deliveries
          const mockDeliveries: Delivery[] = [
            {
              id: "DEL-001",
              orderId: "ORD-2024-001",
              customerName: "Maria Santos",
              customerPhone: "09171234567",
              customerEmail: "maria.s@example.com",
              pickupAddress: "123 Business Ave, Makati City",
              deliveryAddress: "456 Residential St, Quezon City",
              deliveryType: "standard",
              status: "in_transit",
              vehicleId: "VEH-001",
              driverId: "DRV-001",
              driverName: "Juan Cruz",
              vehicleName: "Delivery Van #1",
              scheduledDate: "2024-01-15",
              scheduledTime: "14:00",
              actualPickupTime: "2024-01-15T13:45:00Z",
              items: [
                { description: "Office documents", quantity: 1, weight: 2, value: 0 },
                { description: "Electronics package", quantity: 1, weight: 5, value: 15000 }
              ],
              totalWeight: 7,
              totalValue: 15000,
              deliveryFee: 200,
              specialInstructions: "Handle with care - fragile electronics",
              notes: "Customer requested afternoon delivery",
              createdAt: "2024-01-15T08:00:00Z",
              updatedAt: "2024-01-15T13:45:00Z"
            },
            {
              id: "DEL-002",
              orderId: "ORD-2024-002",
              customerName: "Carlos Rodriguez",
              customerPhone: "09187654321",
              customerEmail: "carlos.r@example.com",
              pickupAddress: "789 Warehouse Rd, Pasig City",
              deliveryAddress: "321 Home St, Taguig City",
              deliveryType: "moving",
              status: "pending",
              scheduledDate: "2024-01-16",
              scheduledTime: "09:00",
              items: [
                { description: "Furniture - Sofa", quantity: 1, weight: 50, dimensions: "200x90x80 cm" },
                { description: "Furniture - Dining Table", quantity: 1, weight: 30, dimensions: "150x90x75 cm" },
                { description: "Boxes - Kitchen items", quantity: 5, weight: 25, dimensions: "40x30x30 cm each" }
              ],
              totalWeight: 105,
              totalValue: 0,
              deliveryFee: 800,
              specialInstructions: "Use moving truck, handle furniture carefully",
              notes: "Full house moving service",
              createdAt: "2024-01-15T10:30:00Z",
              updatedAt: "2024-01-15T10:30:00Z"
            },
            {
              id: "DEL-003",
              orderId: "ORD-2024-003",
              customerName: "Ana Garcia",
              customerPhone: "09191112233",
              customerEmail: "ana.g@example.com",
              pickupAddress: "555 Restaurant Blvd, Ortigas",
              deliveryAddress: "777 Office Tower, BGC",
              deliveryType: "express",
              status: "delivered",
              vehicleId: "VEH-004",
              driverId: "DRV-004",
              driverName: "Luis Garcia",
              vehicleName: "Motorcycle Courier #1",
              scheduledDate: "2024-01-15",
              scheduledTime: "12:00",
              actualPickupTime: "2024-01-15T11:45:00Z",
              actualDeliveryTime: "2024-01-15T12:15:00Z",
              items: [
                { description: "Food delivery - Lunch boxes", quantity: 20, weight: 8, value: 3000 }
              ],
              totalWeight: 8,
              totalValue: 3000,
              deliveryFee: 150,
              specialInstructions: "Keep food warm, deliver before 12:30 PM",
              notes: "Express delivery completed on time",
              createdAt: "2024-01-15T11:00:00Z",
              updatedAt: "2024-01-15T12:15:00Z"
            },
            {
              id: "DEL-004",
              orderId: "ORD-2024-004",
              customerName: "Roberto Silva",
              customerPhone: "09203334455",
              customerEmail: "roberto.s@example.com",
              pickupAddress: "888 Supply Center, Mandaluyong",
              deliveryAddress: "999 Construction Site, Marikina",
              deliveryType: "scheduled",
              status: "assigned",
              vehicleId: "VEH-002",
              driverId: "DRV-002",
              driverName: "Maria Rodriguez",
              vehicleName: "Moving Truck #1",
              scheduledDate: "2024-01-17",
              scheduledTime: "08:00",
              items: [
                { description: "Construction materials - Cement bags", quantity: 50, weight: 1250, value: 25000 },
                { description: "Steel bars", quantity: 20, weight: 200, value: 15000 }
              ],
              totalWeight: 1450,
              totalValue: 40000,
              deliveryFee: 1200,
              specialInstructions: "Heavy materials - use truck with crane",
              notes: "Scheduled for early morning delivery",
              createdAt: "2024-01-15T14:00:00Z",
              updatedAt: "2024-01-15T14:00:00Z"
            }
          ];
          
          setDeliveries(mockDeliveries);
        } catch (error) {
          console.error('Error loading deliveries:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load deliveries. Please try again.",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadDeliveries();
  }, [user, userRole, toast]);

  const getDeliveryTypeLabel = (type: string) => {
    switch (type) {
      case 'standard': return 'Standard';
      case 'express': return 'Express';
      case 'scheduled': return 'Scheduled';
      case 'moving': return 'Moving';
      default: return type;
    }
  };

  const getDeliveryTypeColor = (type: string) => {
    switch (type) {
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'express': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'moving': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'assigned': return 'Assigned';
      case 'picked_up': return 'Picked Up';
      case 'in_transit': return 'In Transit';
      case 'delivered': return 'Delivered';
      case 'failed': return 'Failed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-indigo-100 text-indigo-800';
      case 'in_transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'assigned': return <User className="h-4 w-4" />;
      case 'picked_up': return <Package className="h-4 w-4" />;
      case 'in_transit': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Parse items from comma-separated string
      const items = formData.items.split('\n').map(item => {
        const parts = item.split(' - ');
        return {
          description: parts[0] || '',
          quantity: parseInt(parts[1]) || 1,
          weight: parseFloat(parts[2]) || 0,
          dimensions: parts[3] || '',
          value: parseFloat(parts[4]) || 0
        };
      }).filter(item => item.description);

      const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
      const totalValue = items.reduce((sum, item) => sum + (item.value * item.quantity), 0);

      const newDelivery: Delivery = {
        id: editingDelivery ? editingDelivery.id : `DEL-${Date.now()}`,
        orderId: formData.orderId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        pickupAddress: formData.pickupAddress,
        deliveryAddress: formData.deliveryAddress,
        deliveryType: formData.deliveryType as any,
        status: 'pending',
        vehicleId: formData.vehicleId || undefined,
        driverId: formData.driverId || undefined,
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        items,
        totalWeight,
        totalValue,
        deliveryFee: 0, // Will be calculated based on type and distance
        specialInstructions: formData.specialInstructions,
        notes: formData.notes,
        createdAt: editingDelivery ? editingDelivery.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingDelivery) {
        setDeliveries(prev => prev.map(delivery => 
          delivery.id === editingDelivery.id ? newDelivery : delivery
        ));
        toast({
          title: "Delivery Updated",
          description: "Delivery has been updated successfully.",
        });
      } else {
        setDeliveries(prev => [...prev, newDelivery]);
        toast({
          title: "Delivery Added",
          description: "New delivery has been added successfully.",
        });
      }

      // Reset form
      setFormData({
        orderId: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        pickupAddress: '',
        deliveryAddress: '',
        deliveryType: '',
        vehicleId: '',
        driverId: '',
        scheduledDate: '',
        scheduledTime: '',
        items: '',
        specialInstructions: '',
        notes: ''
      });
      setShowAddForm(false);
      setEditingDelivery(null);
    } catch (error) {
      console.error('Error saving delivery:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save delivery. Please try again.",
      });
    }
  };

  const handleStatusUpdate = async (deliveryId: string, newStatus: Delivery['status']) => {
    try {
      setDeliveries(prev => prev.map(delivery => 
        delivery.id === deliveryId 
          ? { 
              ...delivery, 
              status: newStatus,
              updatedAt: new Date().toISOString(),
              ...(newStatus === 'picked_up' && !delivery.actualPickupTime && { actualPickupTime: new Date().toISOString() }),
              ...(newStatus === 'delivered' && !delivery.actualDeliveryTime && { actualDeliveryTime: new Date().toISOString() })
            }
          : delivery
      ));
      
      toast({
        title: "Status Updated",
        description: `Delivery status updated to ${getStatusLabel(newStatus)}.`,
      });
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update delivery status. Please try again.",
      });
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = searchTerm === '' ||
      delivery.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || delivery.status === filterStatus;
    const matchesType = filterType === 'all' || delivery.deliveryType === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

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
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Delivery Management</h1>
            <p className="text-muted-foreground">
              Manage your delivery and logistics operations
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Delivery
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search deliveries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={(value: Delivery['status'] | 'all') => setFilterStatus(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="picked_up">Picked Up</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={(value: Delivery['deliveryType'] | 'all') => setFilterType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="express">Express</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="moving">Moving</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Add/Edit Delivery Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingDelivery ? 'Edit Delivery' : 'New Delivery'}
              </CardTitle>
              <CardDescription>
                {editingDelivery ? 'Update the delivery details' : 'Create a new delivery order'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orderId">Order ID *</Label>
                    <Input
                      id="orderId"
                      value={formData.orderId}
                      onChange={(e) => handleInputChange('orderId', e.target.value)}
                      placeholder="ORD-2024-001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryType">Delivery Type *</Label>
                    <Select
                      value={formData.deliveryType}
                      onValueChange={(value) => handleInputChange('deliveryType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="express">Express</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="moving">Moving</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      placeholder="Maria Santos"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Phone *</Label>
                    <Input
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                      placeholder="09171234567"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      placeholder="maria@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickupAddress">Pickup Address *</Label>
                  <Textarea
                    id="pickupAddress"
                    value={formData.pickupAddress}
                    onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                    placeholder="123 Business Ave, Makati City"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                  <Textarea
                    id="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                    placeholder="456 Residential St, Quezon City"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => handleInputChange('scheduledDate', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scheduledTime">Scheduled Time *</Label>
                    <Input
                      id="scheduledTime"
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="items">Items *</Label>
                  <Textarea
                    id="items"
                    value={formData.items}
                    onChange={(e) => handleInputChange('items', e.target.value)}
                    placeholder="Item description - quantity - weight (kg) - dimensions - value (PHP)&#10;Office documents - 1 - 2 - - 0&#10;Electronics package - 1 - 5 - - 15000"
                    required
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    Format: Description - Quantity - Weight - Dimensions - Value (one per line)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialInstructions">Special Instructions</Label>
                  <Textarea
                    id="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                    placeholder="Handle with care, fragile items, etc."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes or comments..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingDelivery ? 'Update Delivery' : 'Create Delivery'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingDelivery(null);
                      setFormData({
                        orderId: '',
                        customerName: '',
                        customerPhone: '',
                        customerEmail: '',
                        pickupAddress: '',
                        deliveryAddress: '',
                        deliveryType: '',
                        vehicleId: '',
                        driverId: '',
                        scheduledDate: '',
                        scheduledTime: '',
                        items: '',
                        specialInstructions: '',
                        notes: ''
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Deliveries List */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Deliveries</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDeliveries.map((delivery) => (
                <Card key={delivery.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{delivery.orderId}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={getDeliveryTypeColor(delivery.deliveryType)}>
                            {getDeliveryTypeLabel(delivery.deliveryType)}
                          </Badge>
                          <Badge className={getStatusColor(delivery.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(delivery.status)}
                              {getStatusLabel(delivery.status)}
                            </div>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{delivery.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{delivery.pickupAddress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{delivery.deliveryAddress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {delivery.scheduledDate} at {delivery.scheduledTime}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {delivery.items.length} item{delivery.items.length > 1 ? 's' : ''} • {delivery.totalWeight}kg
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Fee: {formatCurrency(delivery.deliveryFee)}
                        </span>
                      </div>
                    </div>

                    {delivery.driverName && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Assigned:</p>
                        <p className="text-sm text-muted-foreground">
                          {delivery.driverName} • {delivery.vehicleName}
                        </p>
                      </div>
                    )}

                    {delivery.specialInstructions && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Instructions:</p>
                        <p className="text-sm text-muted-foreground">{delivery.specialInstructions}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      {delivery.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(delivery.id, 'assigned')}
                        >
                          Assign
                        </Button>
                      )}
                      {delivery.status === 'assigned' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(delivery.id, 'picked_up')}
                        >
                          Mark Picked Up
                        </Button>
                      )}
                      {delivery.status === 'picked_up' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(delivery.id, 'in_transit')}
                        >
                          In Transit
                        </Button>
                      )}
                      {delivery.status === 'in_transit' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(delivery.id, 'delivered')}
                        >
                          Mark Delivered
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingDelivery(delivery);
                          setFormData({
                            orderId: delivery.orderId,
                            customerName: delivery.customerName,
                            customerPhone: delivery.customerPhone,
                            customerEmail: delivery.customerEmail,
                            pickupAddress: delivery.pickupAddress,
                            deliveryAddress: delivery.deliveryAddress,
                            deliveryType: delivery.deliveryType,
                            vehicleId: delivery.vehicleId || '',
                            driverId: delivery.driverId || '',
                            scheduledDate: delivery.scheduledDate,
                            scheduledTime: delivery.scheduledTime,
                            items: delivery.items.map(item => 
                              `${item.description} - ${item.quantity} - ${item.weight || 0} - ${item.dimensions || ''} - ${item.value || 0}`
                            ).join('\n'),
                            specialInstructions: delivery.specialInstructions || '',
                            notes: delivery.notes || ''
                          });
                          setShowAddForm(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {filteredDeliveries.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Deliveries Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== 'all' || filterType !== 'all' 
                  ? 'No deliveries match your current filters.'
                  : 'Start by creating your first delivery order.'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Delivery
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PartnerAccessGuard>
  );
}
