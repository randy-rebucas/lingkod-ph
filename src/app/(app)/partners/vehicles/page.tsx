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
  Wrench,
  Search,
  Grid3X3,
  List,
  AlertTriangle,
  Clock,
  Activity,
  MoreVertical,
  Shield,
  FileText
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getApp } from "firebase/app";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Vehicle {
  id: string;
  partnerId: string;
  name: string;
  type: 'van' | 'truck' | 'pickup' | 'motorcycle' | 'specialized';
  licensePlate: string;
  capacity: number; // in kg
  volumeCapacity: number; // in cubic meters
  maxPassengers: number;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  fuelCapacity: number; // in liters
  currentFuelLevel: number; // percentage
  isAvailable: boolean;
  isInService: boolean;
  currentLocation?: string;
  currentLat?: number;
  currentLng?: number;
  driver?: string;
  driverId?: string;
  lastMaintenance: string;
  nextMaintenance: string;
  maintenanceInterval: number; // in days
  odometer: number; // in km
  insuranceExpiry: string;
  registrationExpiry: string;
  maintenanceHistory: {
    date: string;
    type: string;
    description: string;
    cost: number;
    odometerReading: number;
  }[];
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export default function VehicleFleetPage() {
  const { user, userRole, partnerData } = useAuth();
  const t = useTranslations('Partners');
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<Vehicle['type'] | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'unavailable' | 'in_service' | 'out_of_service'>('all');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    licensePlate: '',
    capacity: '',
    volumeCapacity: '',
    maxPassengers: '',
    fuelType: '',
    fuelCapacity: '',
    currentFuelLevel: '',
    currentLocation: '',
    currentLat: '',
    currentLng: '',
    driver: '',
    driverId: '',
    lastMaintenance: '',
    nextMaintenance: '',
    maintenanceInterval: '',
    odometer: '',
    insuranceExpiry: '',
    registrationExpiry: '',
    notes: ''
  });

  // Load vehicles from Firestore
  useEffect(() => {
    if (user && userRole === 'partner' && user.uid) {
      try {
        setLoading(true);
        const db = getFirestore(getApp());
        const vehiclesRef = collection(db, 'vehicles');
        const q = query(
          vehiclesRef,
          where('partnerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const vehiclesData: Vehicle[] = [];
          snapshot.forEach((doc) => {
            vehiclesData.push({ id: doc.id, ...doc.data() } as Vehicle);
          });
          setVehicles(vehiclesData);
          setLoading(false);
        }, (error) => {
          console.error('Error loading vehicles:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load vehicles. Please try again.",
          });
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up vehicles listener:', error);
        setLoading(false);
      }
    }
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

  // Filter vehicles based on search and filters
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = searchTerm === '' || 
      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.driver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.currentLocation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || vehicle.type === filterType;
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'available' && vehicle.isAvailable) ||
      (filterStatus === 'unavailable' && !vehicle.isAvailable) ||
      (filterStatus === 'in_service' && vehicle.isInService) ||
      (filterStatus === 'out_of_service' && !vehicle.isInService);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.isAvailable).length,
    inService: vehicles.filter(v => v.isInService).length,
    maintenanceDue: vehicles.filter(v => {
      const nextMaintenance = new Date(v.nextMaintenance);
      const today = new Date();
      const daysUntilMaintenance = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilMaintenance <= 7;
    }).length
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User not found. Please try again.",
      });
      return;
    }
    
    try {
      const db = getFirestore(getApp());
      const vehicleData = {
        partnerId: user.uid,
        name: formData.name,
        type: formData.type,
        licensePlate: formData.licensePlate,
        capacity: parseFloat(formData.capacity),
        volumeCapacity: parseFloat(formData.volumeCapacity),
        maxPassengers: parseInt(formData.maxPassengers),
        fuelType: formData.fuelType,
        fuelCapacity: parseFloat(formData.fuelCapacity),
        currentFuelLevel: parseFloat(formData.currentFuelLevel),
        isAvailable: true,
        isInService: true,
        currentLocation: formData.currentLocation || null,
        currentLat: formData.currentLat ? parseFloat(formData.currentLat) : null,
        currentLng: formData.currentLng ? parseFloat(formData.currentLng) : null,
        driver: formData.driver || null,
        driverId: formData.driverId || null,
        lastMaintenance: formData.lastMaintenance,
        nextMaintenance: formData.nextMaintenance,
        maintenanceInterval: parseInt(formData.maintenanceInterval),
        odometer: parseFloat(formData.odometer),
        insuranceExpiry: formData.insuranceExpiry,
        registrationExpiry: formData.registrationExpiry,
        maintenanceHistory: [],
        notes: formData.notes || null,
        updatedAt: serverTimestamp()
      };

      if (editingVehicle) {
        const vehicleRef = doc(db, 'vehicles', editingVehicle.id);
        await updateDoc(vehicleRef, vehicleData);
        toast({
          title: "Vehicle Updated",
          description: "Vehicle has been updated successfully.",
        });
      } else {
        const newVehicleData = {
          ...vehicleData,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'vehicles'), newVehicleData);
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
        volumeCapacity: '',
        maxPassengers: '',
        fuelType: '',
        fuelCapacity: '',
        currentFuelLevel: '',
        currentLocation: '',
        currentLat: '',
        currentLng: '',
        driver: '',
        driverId: '',
        lastMaintenance: '',
        nextMaintenance: '',
        maintenanceInterval: '',
        odometer: '',
        insuranceExpiry: '',
        registrationExpiry: '',
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
      volumeCapacity: vehicle.volumeCapacity?.toString() || '',
      maxPassengers: vehicle.maxPassengers.toString(),
      fuelType: vehicle.fuelType,
      fuelCapacity: vehicle.fuelCapacity?.toString() || '',
      currentFuelLevel: vehicle.currentFuelLevel?.toString() || '',
      currentLocation: vehicle.currentLocation || '',
      currentLat: vehicle.currentLat?.toString() || '',
      currentLng: vehicle.currentLng?.toString() || '',
      driver: vehicle.driver || '',
      driverId: vehicle.driverId || '',
      lastMaintenance: vehicle.lastMaintenance,
      nextMaintenance: vehicle.nextMaintenance,
      maintenanceInterval: vehicle.maintenanceInterval?.toString() || '',
      odometer: vehicle.odometer?.toString() || '',
      insuranceExpiry: vehicle.insuranceExpiry || '',
      registrationExpiry: vehicle.registrationExpiry || '',
      notes: vehicle.notes || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (vehicleId: string) => {
    try {
      const db = getFirestore(getApp());
      await deleteDoc(doc(db, 'vehicles', vehicleId));
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
      const db = getFirestore(getApp());
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;
      
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      await updateDoc(vehicleRef, {
        isAvailable: !vehicle.isAvailable,
        updatedAt: serverTimestamp()
      });
      
      toast({
        title: "Availability Updated",
        description: `Vehicle ${vehicle.name} has been ${vehicle.isAvailable ? 'made unavailable' : 'made available'}.`,
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
      const db = getFirestore(getApp());
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) return;
      
      const vehicleRef = doc(db, 'vehicles', vehicleId);
      await updateDoc(vehicleRef, {
        isInService: !vehicle.isInService,
        updatedAt: serverTimestamp()
      });
      
      toast({
        title: "Service Status Updated",
        description: `Vehicle ${vehicle.name} has been ${vehicle.isInService ? 'taken out of service' : 'put back in service'}.`,
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Vehicles</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Service</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.inService}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Maintenance Due</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.maintenanceDue}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, license plate, driver, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={(value: Vehicle['type'] | 'all') => setFilterType(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="van">Van</SelectItem>
              <SelectItem value="truck">Truck</SelectItem>
              <SelectItem value="pickup">Pickup</SelectItem>
              <SelectItem value="motorcycle">Motorcycle</SelectItem>
              <SelectItem value="specialized">Specialized</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={(value: 'all' | 'available' | 'unavailable' | 'in_service' | 'out_of_service') => setFilterStatus(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
              <SelectItem value="in_service">In Service</SelectItem>
              <SelectItem value="out_of_service">Out of Service</SelectItem>
            </SelectContent>
          </Select>
          {/* Display Mode Toggle */}
          <div className="flex items-center bg-muted/50 rounded-lg">
            <Button
              variant={displayMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDisplayMode('grid')}
              className={`h-9 w-9 p-0 transition-all duration-200 ${
                displayMode === 'grid' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={displayMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setDisplayMode('list')}
              className={`h-9 w-9 p-0 transition-all duration-200 ${
                displayMode === 'list' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Add/Edit Vehicle Modal */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </DialogTitle>
              <DialogDescription>
                {editingVehicle ? 'Update the vehicle details' : 'Add a new vehicle to your fleet'}
              </DialogDescription>
            </DialogHeader>
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
                  <Label htmlFor="capacity">Weight Capacity (kg) *</Label>
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
                  <Label htmlFor="volumeCapacity">Volume Capacity (m³)</Label>
                  <Input
                    id="volumeCapacity"
                    type="number"
                    step="0.1"
                    value={formData.volumeCapacity}
                    onChange={(e) => handleInputChange('volumeCapacity', e.target.value)}
                    placeholder="5.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="odometer">Current Odometer (km)</Label>
                  <Input
                    id="odometer"
                    type="number"
                    value={formData.odometer}
                    onChange={(e) => handleInputChange('odometer', e.target.value)}
                    placeholder="50000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuelCapacity">Fuel Tank Capacity (L)</Label>
                  <Input
                    id="fuelCapacity"
                    type="number"
                    value={formData.fuelCapacity}
                    onChange={(e) => handleInputChange('fuelCapacity', e.target.value)}
                    placeholder="60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentFuelLevel">Current Fuel Level (%)</Label>
                  <Input
                    id="currentFuelLevel"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.currentFuelLevel}
                    onChange={(e) => handleInputChange('currentFuelLevel', e.target.value)}
                    placeholder="75"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maintenanceInterval">Maintenance Interval (days)</Label>
                  <Input
                    id="maintenanceInterval"
                    type="number"
                    value={formData.maintenanceInterval}
                    onChange={(e) => handleInputChange('maintenanceInterval', e.target.value)}
                    placeholder="90"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="driverId">Driver ID</Label>
                  <Input
                    id="driverId"
                    value={formData.driverId}
                    onChange={(e) => handleInputChange('driverId', e.target.value)}
                    placeholder="Driver's user ID"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
                  <Input
                    id="insuranceExpiry"
                    type="date"
                    value={formData.insuranceExpiry}
                    onChange={(e) => handleInputChange('insuranceExpiry', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationExpiry">Registration Expiry</Label>
                  <Input
                    id="registrationExpiry"
                    type="date"
                    value={formData.registrationExpiry}
                    onChange={(e) => handleInputChange('registrationExpiry', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentLat">Current Latitude</Label>
                  <Input
                    id="currentLat"
                    type="number"
                    step="0.000001"
                    value={formData.currentLat}
                    onChange={(e) => handleInputChange('currentLat', e.target.value)}
                    placeholder="14.5995"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentLng">Current Longitude</Label>
                  <Input
                    id="currentLng"
                    type="number"
                    step="0.000001"
                    value={formData.currentLng}
                    onChange={(e) => handleInputChange('currentLng', e.target.value)}
                    placeholder="120.9842"
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

              <div className="flex gap-2 pt-4">
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
                      volumeCapacity: '',
                      maxPassengers: '',
                      fuelType: '',
                      fuelCapacity: '',
                      currentFuelLevel: '',
                      currentLocation: '',
                      currentLat: '',
                      currentLng: '',
                      driver: '',
                      driverId: '',
                      lastMaintenance: '',
                      nextMaintenance: '',
                      maintenanceInterval: '',
                      odometer: '',
                      insuranceExpiry: '',
                      registrationExpiry: '',
                      notes: ''
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Vehicles List */}
        {displayMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => {
              const isMaintenanceDue = () => {
                const nextMaintenance = new Date(vehicle.nextMaintenance);
                const today = new Date();
                const daysUntilMaintenance = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntilMaintenance <= 7;
              };

              return (
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
                        {isMaintenanceDue() && (
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{vehicle.capacity}kg</span>
                        </div>
                        {vehicle.volumeCapacity && (
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{vehicle.volumeCapacity}m³</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{vehicle.maxPassengers} passengers</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Fuel className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{getFuelTypeLabel(vehicle.fuelType)}</span>
                        </div>
                      </div>
                      
                      {vehicle.fuelCapacity && (
                        <div className="flex items-center gap-2">
                          <Fuel className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Fuel: {vehicle.currentFuelLevel || 0}% ({vehicle.fuelCapacity}L capacity)
                          </span>
                        </div>
                      )}
                      
                      {vehicle.odometer && (
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Odometer: {vehicle.odometer.toLocaleString()} km</span>
                        </div>
                      )}
                      
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
                        <span className={`text-sm ${isMaintenanceDue() ? 'text-orange-600 font-medium' : 'text-muted-foreground'}`}>
                          Next Maintenance: {formatDate(vehicle.nextMaintenance)}
                        </span>
                      </div>
                      {vehicle.insuranceExpiry && (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className={`text-sm ${new Date(vehicle.insuranceExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                            Insurance: {formatDate(vehicle.insuranceExpiry)}
                          </span>
                        </div>
                      )}
                      {vehicle.registrationExpiry && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className={`text-sm ${new Date(vehicle.registrationExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                            Registration: {formatDate(vehicle.registrationExpiry)}
                          </span>
                        </div>
                      )}
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => toggleVehicleAvailability(vehicle.id)}>
                            {vehicle.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleVehicleService(vehicle.id)}>
                            {vehicle.isInService ? 'Out of Service' : 'In Service'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(vehicle.id)}
                            className="text-red-600"
                          >
                            Delete Vehicle
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVehicles.map((vehicle) => {
              const isMaintenanceDue = () => {
                const nextMaintenance = new Date(vehicle.nextMaintenance);
                const today = new Date();
                const daysUntilMaintenance = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                return daysUntilMaintenance <= 7;
              };

              return (
                <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {vehicle.isAvailable ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          {isMaintenanceDue() && (
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{vehicle.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getTypeColor(vehicle.type)}>
                              {getTypeLabel(vehicle.type)}
                            </Badge>
                            <Badge variant="outline">
                              {vehicle.licensePlate}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(vehicle)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => toggleVehicleAvailability(vehicle.id)}>
                              {vehicle.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleVehicleService(vehicle.id)}>
                              {vehicle.isInService ? 'Out of Service' : 'In Service'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(vehicle.id)}
                              className="text-red-600"
                            >
                              Delete Vehicle
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>{vehicle.capacity}kg</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{vehicle.maxPassengers} passengers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4" />
                        <span>{getFuelTypeLabel(vehicle.fuelType)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        <span className={isMaintenanceDue() ? 'text-orange-600 font-medium' : ''}>
                          {formatDate(vehicle.nextMaintenance)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {filteredVehicles.length === 0 && vehicles.length === 0 && (
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

        {filteredVehicles.length === 0 && vehicles.length > 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Vehicles Found</h3>
              <p className="text-muted-foreground mb-4">
                No vehicles match your current search and filter criteria.
              </p>
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterStatus('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PartnerAccessGuard>
  );
}
