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
import { 
  Star, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  DollarSign,
  Package,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface LaundryService {
  id: string;
  name: string;
  description: string;
  category: 'dry_cleaning' | 'wash_fold' | 'ironing' | 'specialty';
  price: number;
  duration: number; // in minutes
  isActive: boolean;
  requirements?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function LaundryServicesPage() {
  const { user, userRole, partnerData } = useAuth();
  const t = useTranslations('Partners');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<LaundryService[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<LaundryService | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    duration: '',
    requirements: '',
    notes: ''
  });

  // Mock data for laundry services
  useEffect(() => {
    const loadServices = async () => {
      if (user && userRole === 'partner') {
        try {
          setLoading(true);
          
          // Mock data for laundry services
          const mockServices: LaundryService[] = [
            {
              id: "SVC-001",
              name: "Premium Dry Cleaning",
              description: "Professional dry cleaning for suits, dresses, and delicate garments",
              category: "dry_cleaning",
              price: 150,
              duration: 120,
              isActive: true,
              requirements: "Garments must be clean and properly labeled",
              notes: "Handle with extra care for delicate fabrics",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "SVC-002",
              name: "Wash & Fold Service",
              description: "Complete wash, dry, and fold service for everyday clothing",
              category: "wash_fold",
              price: 80,
              duration: 60,
              isActive: true,
              requirements: "Separate whites and colors",
              notes: "Standard detergent used unless specified",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "SVC-003",
              name: "Express Ironing",
              description: "Quick ironing service for shirts, pants, and formal wear",
              category: "ironing",
              price: 50,
              duration: 30,
              isActive: true,
              requirements: "Items should be clean and dry",
              notes: "Professional steam ironing",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "SVC-004",
              name: "Wedding Dress Cleaning",
              description: "Specialized cleaning and preservation for wedding dresses",
              category: "specialty",
              price: 500,
              duration: 480,
              isActive: false,
              requirements: "Appointment required, 2-week notice",
              notes: "Includes preservation box and storage",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            }
          ];
          
          setServices(mockServices);
        } catch (error) {
          console.error('Error loading services:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load laundry services. Please try again.",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadServices();
  }, [user, userRole, toast]);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'dry_cleaning': return 'Dry Cleaning';
      case 'wash_fold': return 'Wash & Fold';
      case 'ironing': return 'Ironing';
      case 'specialty': return 'Specialty';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'dry_cleaning': return 'bg-blue-100 text-blue-800';
      case 'wash_fold': return 'bg-green-100 text-green-800';
      case 'ironing': return 'bg-yellow-100 text-yellow-800';
      case 'specialty': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
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
      const newService: LaundryService = {
        id: editingService ? editingService.id : `SVC-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        category: formData.category as any,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        isActive: true,
        requirements: formData.requirements,
        notes: formData.notes,
        createdAt: editingService ? editingService.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingService) {
        setServices(prev => prev.map(service => 
          service.id === editingService.id ? newService : service
        ));
        toast({
          title: "Service Updated",
          description: "Laundry service has been updated successfully.",
        });
      } else {
        setServices(prev => [...prev, newService]);
        toast({
          title: "Service Added",
          description: "New laundry service has been added successfully.",
        });
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        duration: '',
        requirements: '',
        notes: ''
      });
      setShowAddForm(false);
      setEditingService(null);
    } catch (error) {
      console.error('Error saving service:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save service. Please try again.",
      });
    }
  };

  const handleEdit = (service: LaundryService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      price: service.price.toString(),
      duration: service.duration.toString(),
      requirements: service.requirements || '',
      notes: service.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    try {
      setServices(prev => prev.filter(service => service.id !== serviceId));
      toast({
        title: "Service Deleted",
        description: "Laundry service has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete service. Please try again.",
      });
    }
  };

  const toggleServiceStatus = async (serviceId: string) => {
    try {
      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, isActive: !service.isActive, updatedAt: new Date().toISOString() }
          : service
      ));
      
      const service = services.find(s => s.id === serviceId);
      toast({
        title: "Status Updated",
        description: `Service ${service?.name} has been ${service?.isActive ? 'deactivated' : 'activated'}.`,
      });
    } catch (error) {
      console.error('Error updating service status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update service status. Please try again.",
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
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Laundry Services</h1>
            <p className="text-muted-foreground">
              Manage your laundry and dry cleaning services
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>

        {/* Add/Edit Service Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </CardTitle>
              <CardDescription>
                {editingService ? 'Update the laundry service details' : 'Create a new laundry service for your customers'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Service Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Premium Dry Cleaning"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dry_cleaning">Dry Cleaning</SelectItem>
                        <SelectItem value="wash_fold">Wash & Fold</SelectItem>
                        <SelectItem value="ironing">Ironing</SelectItem>
                        <SelectItem value="specialty">Specialty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what this service includes..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (PHP) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="150"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      placeholder="120"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    placeholder="Any special requirements or instructions..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes or special handling instructions..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingService ? 'Update Service' : 'Add Service'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingService(null);
                      setFormData({
                        name: '',
                        description: '',
                        category: '',
                        price: '',
                        duration: '',
                        requirements: '',
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

        {/* Services List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <Badge className={getCategoryColor(service.category)}>
                      {getCategoryLabel(service.category)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{service.description}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{formatCurrency(service.price)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{formatDuration(service.duration)}</span>
                  </div>
                </div>

                {service.requirements && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Requirements:</p>
                    <p className="text-sm text-muted-foreground">{service.requirements}</p>
                  </div>
                )}

                {service.notes && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Notes:</p>
                    <p className="text-sm text-muted-foreground">{service.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(service)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleServiceStatus(service.id)}
                  >
                    {service.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(service.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {services.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Services Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first laundry service to begin accepting bookings.
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Service
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PartnerAccessGuard>
  );
}
