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
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin,
  CheckCircle,
  XCircle,
  Users,
  Package,
  Fuel,
  Calendar,
  Wrench
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface Vehicle {
  id: string;
  name: string;
  type: 'van' | 'truck' | 'pickup' | 'motorcycle' | 'specialized';
  licensePlate: string;
  capacity: number; // in kg or cubic meters
  maxPassengers: number;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  isAvailable: boolean;
  isInService: boolean;
  currentLocation?: string;
  driver?: string;
  lastMaintenance: string;
  nextMaintenance: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function VehicleFleetPage() {
  const { user, userRole, partnerData } = useAuth();
  const t = useTranslations('Partners');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    licensePlate: '',
    capacity: '',
    maxPassengers: '',
    fuelType: '',
    currentLocation: '',
    driver: '',
    lastMaintenance: '',
    nextMaintenance: '',
    notes: ''
  });

  // Mock data for vehicles
  useEffect(() => {
    const loadVehicles = async () => {
      if (user && userRole === 'partner') {
        try {
          setLoading(true);
          
          // Mock data for vehicles
          const mockVehicles: Vehicle[] = [
            {
              id: "VEH-001",
              name: "Delivery Van #1",
              type: "van",
              licensePlate: "ABC-1234",
              capacity: 1000,
              maxPassengers: 2,
              fuelType: "diesel",
              isAvailable: true,
              isInService: true,
              currentLocation: "Makati City",
              driver: "Juan Santos",
              lastMaintenance: "2024-01-01",
              nextMaintenance: "2024-04-01",
              notes: "Regular delivery vehicle for local routes",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "VEH-002",
              name: "Moving Truck #1",
              type: "truck",
              licensePlate: "XYZ-5678",
              capacity: 5000,
              maxPassengers: 3,
              fuelType: "diesel",
              isAvailable: false,
              isInService: true,
              currentLocation: "BGC",
              driver: "Maria Rodriguez",
              lastMaintenance: "2023-12-15",
              nextMaintenance: "2024-03-15",
              notes: "Large capacity truck for furniture and heavy items",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "VEH-003",
              name: "Pickup Truck #1",
              type: "pickup",
              licensePlate: "DEF-9012",
              capacity: 800,
              maxPassengers: 2,
              fuelType: "gasoline",
              isAvailable: true,
              isInService: false,
              currentLocation: "Quezon City",
              driver: "Pedro Cruz",
              lastMaintenance: "2024-01-05",
              nextMaintenance: "2024-04-05",
              notes: "Currently under maintenance - engine repair",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            },
            {
              id: "VEH-004",
              name: "Motorcycle Courier #1",
              type: "motorcycle",
              licensePlate: "GHI-3456",
              capacity: 50,
              maxPassengers: 1,
              fuelType: "gasoline",
              isAvailable: true,
              isInService: true,
              currentLocation: "Ortigas",
              driver: "Luis Garcia",
              lastMaintenance: "2024-01-08",
              nextMaintenance: "2024-02-08",
              notes: "Fast delivery for small packages and documents",
              createdAt: "2024-01-10T08:00:00Z",
              updatedAt: "2024-01-10T08:00:00Z"
            }
          ];
          
          setVehicles(mockVehicles);
        } catch (error) {
          console.error('Error loading vehicles:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load vehicles. Please try again.",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadVehicles();
  }, [user, userRole, toast]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'van': return 'Van';
      case 'truck': return 'Truck';
      case 'pickup': return 'Pickup Truck';
      case 'motorcycle': return 'Motorcycle';
      case 'specialized': return 'Specialized Vehicle';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'van': return 'bg-blue-100 text-blue-800';
      case 'truck': return 'bg-red-100 text-red-800';
      case 'pickup': return 'bg-green-100 text-green-800';
      case 'motorcycle': return 'bg-yellow-100 text-yellow-800';
      case 'specialized': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFuelTypeLabel = (fuelType: string) => {
    switch (fuelType) {
      case 'gasoline': return 'Gasoline';
      case 'diesel': return 'Diesel';
      case 'electric': return 'Electric';
      case 'hybrid': return 'Hybrid';
      default: return fuelType;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
      const newVehicle: Vehicle = {
        id: editingVehicle ? editingVehicle.id : `VEH-${Date.now()}`,
        name: formData.name,
        type: formData.type as any,
        licensePlate: formData.licensePlate,
        capacity: parseFloat(formData.capacity),
        maxPassengers: parseInt(formData.maxPassengers),
        fuelType: formData.fuelType as any,
        isAvailable: true,
        isInService: true,
        currentLocation: formData.currentLocation,
        driver: formData.driver,
        lastMaintenance: formData.lastMaintenance,
        nextMaintenance: formData.nextMaintenance,
        notes: formData.notes,
        createdAt: editingVehicle ? editingVehicle.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingVehicle) {
        setVehicles(prev => prev.map(vehicle => 
          vehicle.id === editingVehicle.id ? newVehicle : vehicle
        ));
        toast({
          title: "Vehicle Updated",
          description: "Vehicle has been updated successfully.",
        });
      } else {
        setVehicles(prev => [...prev, newVehicle]);
        toast({
          title: "Vehicle Added",
          description: "New vehicle has been added to your fleet.",
        });
      }

      // Reset form
      setFormData({
        name: '',
        type: '',
        licensePlate: '',
        capacity: '',
        maxPassengers: '',
        fuelType: '',
        currentLocation: '',
        driver: '',
        lastMaintenance: '',
        nextMaintenance: '',
        notes: ''
      });
      setShowAddForm(false);
      setEditingVehicle(null);
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save vehicle. Please try again.",
      });
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      type: vehicle.type,
      licensePlate: vehicle.licensePlate,
      capacity: vehicle.capacity.toString(),
      maxPassengers: vehicle.maxPassengers.toString(),
      fuelType: vehicle.fuelType,
      currentLocation: vehicle.currentLocation || '',
      driver: vehicle.driver || '',
      lastMaintenance: vehicle.lastMaintenance,
      nextMaintenance: vehicle.nextMaintenance,
      notes: vehicle.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (vehicleId: string) => {
    try {
      setVehicles(prev => prev.filter(vehicle => vehicle.id !== vehicleId));
      toast({
        title: "Vehicle Deleted",
        description: "Vehicle has been removed from your fleet.",
      });
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete vehicle. Please try again.",
      });
    }
  };

  const toggleVehicleAvailability = async (vehicleId: string) => {
    try {
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === vehicleId 
          ? { ...vehicle, isAvailable: !vehicle.isAvailable, updatedAt: new Date().toISOString() }
          : vehicle
      ));
      
      const vehicle = vehicles.find(v => v.id === vehicleId);
      toast({
        title: "Availability Updated",
        description: `Vehicle ${vehicle?.name} has been ${vehicle?.isAvailable ? 'made unavailable' : 'made available'}.`,
      });
    } catch (error) {
      console.error('Error updating vehicle availability:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update vehicle availability. Please try again.",
      });
    }
  };

  const toggleVehicleService = async (vehicleId: string) => {
    try {
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === vehicleId 
          ? { ...vehicle, isInService: !vehicle.isInService, updatedAt: new Date().toISOString() }
          : vehicle
      ));
      
      const vehicle = vehicles.find(v => v.id === vehicleId);
      toast({
        title: "Service Status Updated",
        description: `Vehicle ${vehicle?.name} has been ${vehicle?.isInService ? 'taken out of service' : 'put back in service'}.`,
      });
    } catch (error) {
      console.error('Error updating vehicle service status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update vehicle service status. Please try again.",
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
            <h1 className="text-3xl font-bold tracking-tight">Vehicle Fleet</h1>
            <p className="text-muted-foreground">
              Manage your delivery and logistics vehicle fleet
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>

        {/* Add/Edit Vehicle Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </CardTitle>
              <CardDescription>
                {editingVehicle ? 'Update the vehicle details' : 'Add a new vehicle to your fleet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Vehicle Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Delivery Van #1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Vehicle Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleInputChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="van">Van</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="pickup">Pickup Truck</SelectItem>
                        <SelectItem value="motorcycle">Motorcycle</SelectItem>
                        <SelectItem value="specialized">Specialized Vehicle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="licensePlate">License Plate *</Label>
                    <Input
                      id="licensePlate"
                      value={formData.licensePlate}
                      onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                      placeholder="ABC-1234"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuelType">Fuel Type *</Label>
                    <Select
                      value={formData.fuelType}
                      onValueChange={(value) => handleInputChange('fuelType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gasoline">Gasoline</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity (kg) *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => handleInputChange('capacity', e.target.value)}
                      placeholder="1000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPassengers">Max Passengers *</Label>
                    <Input
                      id="maxPassengers"
                      type="number"
                      value={formData.maxPassengers}
                      onChange={(e) => handleInputChange('maxPassengers', e.target.value)}
                      placeholder="2"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentLocation">Current Location</Label>
                    <Input
                      id="currentLocation"
                      value={formData.currentLocation}
                      onChange={(e) => handleInputChange('currentLocation', e.target.value)}
                      placeholder="Makati City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driver">Assigned Driver</Label>
                    <Input
                      id="driver"
                      value={formData.driver}
                      onChange={(e) => handleInputChange('driver', e.target.value)}
                      placeholder="Juan Santos"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="lastMaintenance">Last Maintenance *</Label>
                    <Input
                      id="lastMaintenance"
                      type="date"
                      value={formData.lastMaintenance}
                      onChange={(e) => handleInputChange('lastMaintenance', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextMaintenance">Next Maintenance *</Label>
                    <Input
                      id="nextMaintenance"
                      type="date"
                      value={formData.nextMaintenance}
                      onChange={(e) => handleInputChange('nextMaintenance', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes about the vehicle..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingVehicle(null);
                      setFormData({
                        name: '',
                        type: '',
                        licensePlate: '',
                        capacity: '',
                        maxPassengers: '',
                        fuelType: '',
                        currentLocation: '',
                        driver: '',
                        lastMaintenance: '',
                        nextMaintenance: '',
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

        {/* Vehicles List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(vehicle.type)}>
                        {getTypeLabel(vehicle.type)}
                      </Badge>
                      <Badge variant="outline">
                        {vehicle.licensePlate}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {vehicle.isAvailable ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Capacity: {vehicle.capacity}kg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Max Passengers: {vehicle.maxPassengers}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{getFuelTypeLabel(vehicle.fuelType)}</span>
                  </div>
                  {vehicle.currentLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{vehicle.currentLocation}</span>
                    </div>
                  )}
                  {vehicle.driver && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Driver: {vehicle.driver}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Last Maintenance: {formatDate(vehicle.lastMaintenance)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Next Maintenance: {formatDate(vehicle.nextMaintenance)}</span>
                  </div>
                </div>

                {vehicle.notes && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Notes:</p>
                    <p className="text-sm text-muted-foreground">{vehicle.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(vehicle)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleVehicleAvailability(vehicle.id)}
                  >
                    {vehicle.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleVehicleService(vehicle.id)}
                  >
                    {vehicle.isInService ? 'Out of Service' : 'In Service'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(vehicle.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {vehicles.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Vehicles Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first vehicle to your fleet for delivery services.
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Vehicle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PartnerAccessGuard>
  );
}
