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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Sparkles, 
  Plus, 
  Edit, 
  Trash2, 
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Users,
  Heart,
  Star,
  MapPin
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface WellnessService {
  id: string;
  name: string;
  description: string;
  category: 'massage' | 'facial' | 'hair' | 'nail' | 'spa' | 'wellness' | 'beauty';
  price: number;
  duration: number; // in minutes
  isAvailable: boolean;
  isHomeService: boolean;
  requiresAppointment: boolean;
  maxClients: number;
  therapist?: string;
  requirements?: string;
  benefits?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function WellnessServicesPage() {
  const { user, userRole, partnerData } = useAuth();
  const t = useTranslations('Partners');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<WellnessService[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<WellnessService | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    duration: '',
    isHomeService: false,
    requiresAppointment: true,
    maxClients: '',
    therapist: '',
    requirements: '',
    benefits: '',
    notes: ''
  });

  // Mock data for wellness services
  useEffect(() => {
    const loadServices = async () => {
      if (user && userRole === 'partner') {
        try {
          setLoading(true);
          
          // Mock data for wellness services
          const mockServices: WellnessService[] = [
            {
              id: "WELL-001",
              name: "Swedish Massage",
              description: "Relaxing full-body massage using long strokes and kneading techniques",
              category: "massage",
              price: 1200,
              duration: 60,
              isAvailable: true,
              isHomeService: true,
              requiresAppointment: true,
              maxClients: 1,
              therapist: "Maria Santos",
              requirements: "Clean towel and comfortable space required for home service",
              benefits: ["Stress relief", "Muscle relaxation", "Improved circulation", "Better sleep"],
              notes: "Available for both salon and home service",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "WELL-002",
              name: "Deep Tissue Massage",
              description: "Therapeutic massage targeting deeper layers of muscle and fascia",
              category: "massage",
              price: 1500,
              duration: 90,
              isAvailable: true,
              isHomeService: false,
              requiresAppointment: true,
              maxClients: 1,
              therapist: "Juan Rodriguez",
              requirements: "Previous consultation recommended for first-time clients",
              benefits: ["Pain relief", "Improved flexibility", "Reduced muscle tension", "Better posture"],
              notes: "Salon service only - requires specialized equipment",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "WELL-003",
              name: "Facial Treatment",
              description: "Complete facial cleansing, exfoliation, and moisturizing treatment",
              category: "facial",
              price: 800,
              duration: 45,
              isAvailable: true,
              isHomeService: false,
              requiresAppointment: true,
              maxClients: 1,
              therapist: "Ana Cruz",
              requirements: "Remove makeup before treatment",
              benefits: ["Clearer skin", "Reduced acne", "Improved skin texture", "Relaxation"],
              notes: "Includes consultation for skin type and concerns",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "WELL-004",
              name: "Manicure & Pedicure",
              description: "Complete nail care including shaping, cuticle care, and polish",
              category: "nail",
              price: 600,
              duration: 60,
              isAvailable: true,
              isHomeService: true,
              requiresAppointment: true,
              maxClients: 1,
              therapist: "Lisa Garcia",
              requirements: "Clean hands and feet",
              benefits: ["Healthy nails", "Improved appearance", "Relaxation", "Professional finish"],
              notes: "Available for both salon and home service",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "WELL-005",
              name: "Hair Cut & Style",
              description: "Professional haircut and styling for all hair types",
              category: "hair",
              price: 400,
              duration: 45,
              isAvailable: false,
              isHomeService: false,
              requiresAppointment: true,
              maxClients: 1,
              therapist: "Carlos Mendez",
              requirements: "Clean, dry hair",
              benefits: ["Fresh look", "Professional styling", "Hair health", "Confidence boost"],
              notes: "Currently unavailable - stylist on leave",
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
            description: "Failed to load wellness services. Please try again.",
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
      case 'massage': return 'Massage';
      case 'facial': return 'Facial';
      case 'hair': return 'Hair';
      case 'nail': return 'Nail Care';
      case 'spa': return 'Spa Treatment';
      case 'wellness': return 'Wellness';
      case 'beauty': return 'Beauty';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'massage': return 'bg-green-100 text-green-800';
      case 'facial': return 'bg-pink-100 text-pink-800';
      case 'hair': return 'bg-purple-100 text-purple-800';
      case 'nail': return 'bg-blue-100 text-blue-800';
      case 'spa': return 'bg-yellow-100 text-yellow-800';
      case 'wellness': return 'bg-indigo-100 text-indigo-800';
      case 'beauty': return 'bg-rose-100 text-rose-800';
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const newService: WellnessService = {
        id: editingService ? editingService.id : `WELL-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        category: formData.category as any,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        isAvailable: true,
        isHomeService: formData.isHomeService,
        requiresAppointment: formData.requiresAppointment,
        maxClients: parseInt(formData.maxClients),
        therapist: formData.therapist,
        requirements: formData.requirements,
        benefits: formData.benefits.split(',').map(b => b.trim()).filter(b => b),
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
          description: "Wellness service has been updated successfully.",
        });
      } else {
        setServices(prev => [...prev, newService]);
        toast({
          title: "Service Added",
          description: "New wellness service has been added successfully.",
        });
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        duration: '',
        isHomeService: false,
        requiresAppointment: true,
        maxClients: '',
        therapist: '',
        requirements: '',
        benefits: '',
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

  const handleEdit = (service: WellnessService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      category: service.category,
      price: service.price.toString(),
      duration: service.duration.toString(),
      isHomeService: service.isHomeService,
      requiresAppointment: service.requiresAppointment,
      maxClients: service.maxClients.toString(),
      therapist: service.therapist || '',
      requirements: service.requirements || '',
      benefits: service.benefits?.join(', ') || '',
      notes: service.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    try {
      setServices(prev => prev.filter(service => service.id !== serviceId));
      toast({
        title: "Service Deleted",
        description: "Wellness service has been deleted successfully.",
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

  const toggleServiceAvailability = async (serviceId: string) => {
    try {
      setServices(prev => prev.map(service => 
        service.id === serviceId 
          ? { ...service, isAvailable: !service.isAvailable, updatedAt: new Date().toISOString() }
          : service
      ));
      
      const service = services.find(s => s.id === serviceId);
      toast({
        title: "Availability Updated",
        description: `Service ${service?.name} has been ${service?.isAvailable ? 'made unavailable' : 'made available'}.`,
      });
    } catch (error) {
      console.error('Error updating service availability:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update service availability. Please try again.",
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
            <h1 className="text-3xl font-bold tracking-tight">Wellness Services</h1>
            <p className="text-muted-foreground">
              Manage your wellness, spa, and beauty services
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
                {editingService ? 'Update the wellness service details' : 'Create a new wellness service for your customers'}
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
                      placeholder="e.g., Swedish Massage"
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
                        <SelectItem value="massage">Massage</SelectItem>
                        <SelectItem value="facial">Facial</SelectItem>
                        <SelectItem value="hair">Hair</SelectItem>
                        <SelectItem value="nail">Nail Care</SelectItem>
                        <SelectItem value="spa">Spa Treatment</SelectItem>
                        <SelectItem value="wellness">Wellness</SelectItem>
                        <SelectItem value="beauty">Beauty</SelectItem>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (PHP) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="1200"
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
                      placeholder="60"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxClients">Max Clients *</Label>
                    <Input
                      id="maxClients"
                      type="number"
                      value={formData.maxClients}
                      onChange={(e) => handleInputChange('maxClients', e.target.value)}
                      placeholder="1"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Service Options</Label>
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isHomeService"
                        checked={formData.isHomeService}
                        onCheckedChange={(checked) => handleInputChange('isHomeService', checked as boolean)}
                      />
                      <Label htmlFor="isHomeService">Home Service Available</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="requiresAppointment"
                        checked={formData.requiresAppointment}
                        onCheckedChange={(checked) => handleInputChange('requiresAppointment', checked as boolean)}
                      />
                      <Label htmlFor="requiresAppointment">Requires Appointment</Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="therapist">Assigned Therapist</Label>
                    <Input
                      id="therapist"
                      value={formData.therapist}
                      onChange={(e) => handleInputChange('therapist', e.target.value)}
                      placeholder="Maria Santos"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requirements">Requirements</Label>
                    <Input
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) => handleInputChange('requirements', e.target.value)}
                      placeholder="Clean towel and comfortable space"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="benefits">Benefits</Label>
                  <Input
                    id="benefits"
                    value={formData.benefits}
                    onChange={(e) => handleInputChange('benefits', e.target.value)}
                    placeholder="Stress relief, Muscle relaxation, Improved circulation (comma-separated)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes or special instructions..."
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
                        isHomeService: false,
                        requiresAppointment: true,
                        maxClients: '',
                        therapist: '',
                        requirements: '',
                        benefits: '',
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
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(service.category)}>
                        {getCategoryLabel(service.category)}
                      </Badge>
                      {service.isHomeService && (
                        <Badge variant="secondary" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          Home Service
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {service.isAvailable ? (
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
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Max {service.maxClients} client{service.maxClients > 1 ? 's' : ''}</span>
                  </div>
                  {service.therapist && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Therapist: {service.therapist}</span>
                    </div>
                  )}
                </div>

                {service.benefits && service.benefits.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Benefits:</p>
                    <div className="flex flex-wrap gap-1">
                      {service.benefits.map((benefit, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

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
                    onClick={() => toggleServiceAvailability(service.id)}
                  >
                    {service.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
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
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Services Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first wellness service to begin accepting bookings.
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
