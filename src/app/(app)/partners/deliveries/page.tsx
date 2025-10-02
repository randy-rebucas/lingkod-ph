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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  Navigation,
  Phone,
  Mail,
  Weight,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Route,
  FileText,
  MoreVertical,
  Grid3X3,
  List,
  UserCheck,
  Users
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useLoadScript } from "@react-google-maps/api";

interface Delivery {
  id: string;
  partnerId: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickupAddress: string;
  deliveryAddress: string;
  deliveryType: 'standard' | 'express' | 'scheduled' | 'moving' | 'multi_stop';
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
  // Multi-stop delivery support
  stops?: {
    id: string;
    type: 'pickup' | 'delivery';
    address: string;
    contactName?: string;
    contactPhone?: string;
    items?: {
      description: string;
      quantity: number;
      weight?: number;
      value?: number;
    }[];
    scheduledTime?: string;
    actualTime?: string;
    status: 'pending' | 'completed' | 'skipped';
    notes?: string;
  }[];
  // Route optimization
  optimizedRoute?: {
    totalDistance: number; // in km
    estimatedDuration: number; // in minutes
    waypoints: {
      lat: number;
      lng: number;
      address: string;
    }[];
  };
  // Auto-dispatch settings
  autoDispatch?: {
    enabled: boolean;
    criteria: {
      maxDistance?: number; // km
      vehicleType?: string;
      driverRating?: number;
      fuelLevel?: number; // percentage
    };
  };
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
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
  const [showDriverAssignment, setShowDriverAssignment] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [showAutoDispatch, setShowAutoDispatch] = useState(false);
  const [showMultiStop, setShowMultiStop] = useState(false);
  const [deliveryStops, setDeliveryStops] = useState<any[]>([]);
  const [autoDispatchCriteria, setAutoDispatchCriteria] = useState({
    maxDistance: 50,
    vehicleType: '',
    driverRating: 4.0,
    fuelLevel: 25
  });
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

  // Load deliveries from Firestore
  useEffect(() => {
    if (!user || userRole !== 'partner') {
      setLoading(false);
      return;
    }

    const db = getDb();
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Query deliveries for this partner
      const deliveriesRef = collection(db, 'deliveries');
      const q = query(
        deliveriesRef,
        where('partnerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const deliveriesData: Delivery[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          deliveriesData.push({
            id: doc.id,
            partnerId: data.partnerId || '',
            orderId: data.orderId || '',
            customerName: data.customerName || '',
            customerPhone: data.customerPhone || '',
            customerEmail: data.customerEmail || '',
            pickupAddress: data.pickupAddress || '',
            deliveryAddress: data.deliveryAddress || '',
            deliveryType: data.deliveryType || 'standard',
            status: data.status || 'pending',
            vehicleId: data.vehicleId,
            driverId: data.driverId,
            driverName: data.driverName,
            vehicleName: data.vehicleName,
            scheduledDate: data.scheduledDate || '',
            scheduledTime: data.scheduledTime || '',
            actualPickupTime: data.actualPickupTime?.toDate?.()?.toISOString(),
            actualDeliveryTime: data.actualDeliveryTime?.toDate?.()?.toISOString(),
            items: data.items || [],
            totalWeight: data.totalWeight || 0,
            totalValue: data.totalValue || 0,
            deliveryFee: data.deliveryFee || 0,
            specialInstructions: data.specialInstructions,
            notes: data.notes,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          });
        });
        
        setDeliveries(deliveriesData);
        setLoading(false);
      }, (error) => {
        console.error('Error loading deliveries:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load deliveries. Please try again.",
        });
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up deliveries listener:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load deliveries. Please try again.",
      });
      setLoading(false);
    }
  }, [user, userRole, toast]);

  // Load available drivers and vehicles for assignment
  useEffect(() => {
    if (!user || userRole !== 'partner') return;

    const db = getDb();
    if (!db) return;

    try {
      // Load vehicles
      const vehiclesRef = collection(db, 'vehicles');
      const vehiclesQuery = query(
        vehiclesRef,
        where('partnerId', '==', user.uid),
        where('isAvailable', '==', true),
        where('isInService', '==', true)
      );

      const unsubscribeVehicles = onSnapshot(vehiclesQuery, (snapshot) => {
        const vehiclesData: any[] = [];
        snapshot.forEach((doc) => {
          vehiclesData.push({ id: doc.id, ...doc.data() });
        });
        
        // Extract unique drivers from vehicles
        const drivers = vehiclesData
          .filter(vehicle => vehicle.driver)
          .map(vehicle => ({
            id: vehicle.driver,
            name: vehicle.driver,
            vehicleId: vehicle.id,
            vehicleName: vehicle.name,
            vehicleType: vehicle.type
          }))
          .filter((driver, index, self) => 
            index === self.findIndex(d => d.id === driver.id)
          );
        
        setAvailableDrivers(drivers);
      });

      return () => unsubscribeVehicles();
    } catch (error) {
      console.error('Error loading drivers and vehicles:', error);
    }
  }, [user, userRole]);

  const getDeliveryTypeLabel = (type: string) => {
    switch (type) {
      case 'standard': return 'Standard';
      case 'express': return 'Express';
      case 'scheduled': return 'Scheduled';
      case 'moving': return 'Moving';
      case 'multi_stop': return 'Multi-Stop';
      default: return type;
    }
  };

  const getDeliveryTypeColor = (type: string) => {
    switch (type) {
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'express': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'moving': return 'bg-purple-100 text-purple-800';
      case 'multi_stop': return 'bg-orange-100 text-orange-800';
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

  const generateOrderId = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6); // Last 6 digits of timestamp
    return `ORD-${year}${month}${day}-${time}`;
  };

  // Google Places Autocomplete functionality
  const { isLoaded: isGoogleMapsLoaded, loadError: googleMapsError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
    language: "en",
  });

  const pickupAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const deliveryAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const deliveryInputRef = useRef<HTMLInputElement>(null);

  // Autosuggest states
  const [pickupSuggestions, setPickupSuggestions] = useState<string[]>([]);
  const [deliverySuggestions, setDeliverySuggestions] = useState<string[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDeliverySuggestions, setShowDeliverySuggestions] = useState(false);
  const [activePickupSuggestion, setActivePickupSuggestion] = useState(-1);
  const [activeDeliverySuggestion, setActiveDeliverySuggestion] = useState(-1);

  // Debug Google Maps API key
  useEffect(() => {
    console.log('Google Maps API Key configured:', !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    console.log('API Key value (first 10 chars):', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 10));
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key not found! Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.');
    }
  }, []);

  // Initialize Google Maps for autosuggest
  useEffect(() => {
    if (isGoogleMapsLoaded && window.google?.maps?.places) {
      console.log('✅ Google Maps loaded - Autosuggest ready');
    } else {
      console.log('⏳ Google Maps loading...', { isGoogleMapsLoaded, hasGoogle: !!window.google });
    }
  }, [isGoogleMapsLoaded]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Autosuggest functionality
  const getPlaceSuggestions = async (input: string, type: 'pickup' | 'delivery'): Promise<string[]> => {
    if (!input || input.length < 2 || !window.google?.maps?.places) {
      return [];
    }

    try {
      const service = new google.maps.places.AutocompleteService();
      const allSuggestions: string[] = [];

      // Get address suggestions
      const addressRequest = {
        input: input,
        componentRestrictions: { country: 'ph' },
        types: ['address'],
      };

      // Get establishment suggestions
      const establishmentRequest = {
        input: input,
        componentRestrictions: { country: 'ph' },
        types: ['establishment'],
      };

      // Make both requests in parallel
      const [addressResults, establishmentResults] = await Promise.all([
        new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => {
          service.getPlacePredictions(addressRequest, (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              resolve(predictions);
            } else {
              resolve([]);
            }
          });
        }),
        new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => {
          service.getPlacePredictions(establishmentRequest, (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              resolve(predictions);
            } else {
              resolve([]);
            }
          });
        })
      ]);

      // Combine and deduplicate suggestions
      const combinedPredictions = [...addressResults, ...establishmentResults];
      const uniqueSuggestions = combinedPredictions
        .map(prediction => prediction.description)
        .filter((description, index, array) => array.indexOf(description) === index);

      return uniqueSuggestions.slice(0, 5); // Limit to 5 suggestions
    } catch (error) {
      console.error('Autosuggest error:', error);
      return [];
    }
  };

  // Handle input change with autosuggest
  const handleAddressInputChange = async (field: 'pickupAddress' | 'deliveryAddress', value: string) => {
    handleInputChange(field, value);
    
    if (value.length >= 2) {
      const suggestions = await getPlaceSuggestions(value, field === 'pickupAddress' ? 'pickup' : 'delivery');
      
      if (field === 'pickupAddress') {
        setPickupSuggestions(suggestions);
        setShowPickupSuggestions(suggestions.length > 0);
        setActivePickupSuggestion(-1);
      } else {
        setDeliverySuggestions(suggestions);
        setShowDeliverySuggestions(suggestions.length > 0);
        setActiveDeliverySuggestion(-1);
      }
    } else {
      if (field === 'pickupAddress') {
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
        setActivePickupSuggestion(-1);
      } else {
        setDeliverySuggestions([]);
        setShowDeliverySuggestions(false);
        setActiveDeliverySuggestion(-1);
      }
    }
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion: string, type: 'pickup' | 'delivery') => {
    if (type === 'pickup') {
      handleInputChange('pickupAddress', suggestion);
      setShowPickupSuggestions(false);
      setActivePickupSuggestion(-1);
    } else {
      handleInputChange('deliveryAddress', suggestion);
      setShowDeliverySuggestions(false);
      setActiveDeliverySuggestion(-1);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, type: 'pickup' | 'delivery') => {
    const suggestions = type === 'pickup' ? pickupSuggestions : deliverySuggestions;
    const activeIndex = type === 'pickup' ? activePickupSuggestion : activeDeliverySuggestion;
    const setActiveIndex = type === 'pickup' ? setActivePickupSuggestion : setActiveDeliverySuggestion;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeIndex], type);
    } else if (e.key === 'Escape') {
      if (type === 'pickup') {
        setShowPickupSuggestions(false);
        setActivePickupSuggestion(-1);
      } else {
        setShowDeliverySuggestions(false);
        setActiveDeliverySuggestion(-1);
      }
    }
  };

  // Fallback geocoding function
  const geocodeAddress = async (address: string): Promise<string | null> => {
    if (!window.google?.maps?.Geocoder) {
      console.warn('Google Maps Geocoder not available');
      return null;
    }

    try {
      const geocoder = new google.maps.Geocoder();
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode(
          { 
            address: address,
            componentRestrictions: { country: 'ph' }
          },
          (results, status) => {
            if (status === 'OK' && results) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          }
        );
      });

      if (result && result[0]) {
        return result[0].formatted_address;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    
    return null;
  };

  const calculateDeliveryFee = (deliveryType: string, totalWeight: number, totalValue: number) => {
    let baseFee = 0;
    
    switch (deliveryType) {
      case 'standard':
        baseFee = 150;
        break;
      case 'express':
        baseFee = 300;
        break;
      case 'scheduled':
        baseFee = 200;
        break;
      case 'moving':
        baseFee = 500;
        break;
      default:
        baseFee = 150;
    }
    
    // Add weight-based fee (₱10 per kg over 10kg)
    const weightFee = Math.max(0, (totalWeight - 10) * 10);
    
    // Add value-based fee for high-value items (1% of value over ₱10,000)
    const valueFee = Math.max(0, (totalValue - 10000) * 0.01);
    
    return baseFee + weightFee + valueFee;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || userRole !== 'partner') {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in as a partner to manage deliveries.",
      });
      return;
    }


    const db = getDb();
    if (!db) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Database connection not available.",
      });
      return;
    }
    
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

      if (items.length === 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please add at least one item to the delivery.",
        });
        return;
      }

      const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
      const totalValue = items.reduce((sum, item) => sum + (item.value * item.quantity), 0);
      const deliveryFee = calculateDeliveryFee(formData.deliveryType, totalWeight, totalValue);

      const deliveryData = {
        partnerId: user.uid,
        orderId: formData.orderId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        pickupAddress: formData.pickupAddress,
        deliveryAddress: formData.deliveryAddress,
        deliveryType: formData.deliveryType,
        status: 'pending',
        vehicleId: formData.vehicleId || null,
        driverId: formData.driverId || null,
        driverName: null, // Will be set when driver is assigned
        vehicleName: null, // Will be set when vehicle is assigned
        scheduledDate: formData.scheduledDate,
        scheduledTime: formData.scheduledTime,
        actualPickupTime: null,
        actualDeliveryTime: null,
        items: items,
        totalWeight: totalWeight,
        totalValue: totalValue,
        deliveryFee: deliveryFee,
        specialInstructions: formData.specialInstructions || null,
        notes: formData.notes || null,
        updatedAt: serverTimestamp()
      };

      if (editingDelivery) {
        // Update existing delivery
        const deliveryRef = doc(db, 'deliveries', editingDelivery.id);
        await updateDoc(deliveryRef, deliveryData);
        
        toast({
          title: "Delivery Updated",
          description: "Delivery has been updated successfully.",
        });
      } else {
        // Create new delivery
        const newDeliveryData = {
          ...deliveryData,
          createdAt: serverTimestamp()
        };
        await addDoc(collection(db, 'deliveries'), newDeliveryData);
        
        toast({
          title: "Delivery Added",
          description: "New delivery has been added successfully.",
        });
      }

      // Reset form
      setFormData({
        orderId: generateOrderId(),
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
    if (!user || userRole !== 'partner') {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in as a partner to update deliveries.",
      });
      return;
    }

    const db = getDb();
    if (!db) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Database connection not available.",
      });
      return;
    }

    try {
      const deliveryRef = doc(db, 'deliveries', deliveryId);
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      // Add timestamps for specific status changes
      if (newStatus === 'picked_up') {
        updateData.actualPickupTime = serverTimestamp();
      } else if (newStatus === 'delivered') {
        updateData.actualDeliveryTime = serverTimestamp();
      }

      await updateDoc(deliveryRef, updateData);
      
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

  const handleDeleteDelivery = async (deliveryId: string) => {
    if (!user || userRole !== 'partner') {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in as a partner to delete deliveries.",
      });
      return;
    }

    const db = getDb();
    if (!db) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Database connection not available.",
      });
      return;
    }

    try {
      await deleteDoc(doc(db, 'deliveries', deliveryId));
      
      toast({
        title: "Delivery Deleted",
        description: "Delivery has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting delivery:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete delivery. Please try again.",
      });
    }
  };

  const handleAssignDriver = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setSelectedDriver('');
    setSelectedVehicle('');
    setShowDriverAssignment(true);
  };

  const handleDriverAssignment = async () => {
    if (!selectedDriver || !selectedDelivery) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a driver and vehicle.",
      });
      return;
    }

    const db = getDb();
    if (!db) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Database connection not available.",
      });
      return;
    }

    try {
      const selectedDriverData = availableDrivers.find(d => d.id === selectedDriver);
      const selectedVehicleData = availableDrivers.find(d => d.id === selectedDriver)?.vehicleId;

      // Update delivery with driver assignment
      const deliveryRef = doc(db, 'deliveries', selectedDelivery.id);
      await updateDoc(deliveryRef, {
        driverId: selectedDriver,
        driverName: selectedDriverData?.name,
        vehicleId: selectedVehicleData,
        vehicleName: selectedDriverData?.vehicleName,
        status: 'assigned',
        updatedAt: serverTimestamp()
      });

      // Create driver task notification
      await addDoc(collection(db, 'driverTasks'), {
        deliveryId: selectedDelivery.id,
        driverId: selectedDriver,
        driverName: selectedDriverData?.name,
        vehicleId: selectedVehicleData,
        vehicleName: selectedDriverData?.vehicleName,
        partnerId: user?.uid,
        status: 'pending', // pending, accepted, rejected
        orderId: selectedDelivery.orderId,
        customerName: selectedDelivery.customerName,
        customerPhone: selectedDelivery.customerPhone,
        pickupAddress: selectedDelivery.pickupAddress,
        deliveryAddress: selectedDelivery.deliveryAddress,
        scheduledDate: selectedDelivery.scheduledDate,
        scheduledTime: selectedDelivery.scheduledTime,
        deliveryFee: selectedDelivery.deliveryFee,
        specialInstructions: selectedDelivery.specialInstructions,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({
        title: "Driver Assigned",
        description: `Driver ${selectedDriverData?.name} has been assigned to delivery ${selectedDelivery.orderId}.`,
      });

      setShowDriverAssignment(false);
      setSelectedDelivery(null);
      setSelectedDriver('');
      setSelectedVehicle('');
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign driver. Please try again.",
      });
    }
  };

  // Auto-dispatch function
  const handleAutoDispatch = async (delivery: Delivery) => {
    const db = getDb();
    if (!db) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Database connection not available.",
      });
      return;
    }

    try {
      // Find best driver based on criteria
      const bestDriver = findBestDriver(delivery, autoDispatchCriteria);
      
      if (!bestDriver) {
        toast({
          variant: "destructive",
          title: "No Driver Found",
          description: "No suitable driver found based on auto-dispatch criteria.",
        });
        return;
      }

      // Update delivery with auto-assigned driver
      const deliveryRef = doc(db, 'deliveries', delivery.id);
      await updateDoc(deliveryRef, {
        driverId: bestDriver.id,
        driverName: bestDriver.name,
        vehicleId: bestDriver.vehicleId,
        vehicleName: bestDriver.vehicleName,
        status: 'assigned',
        autoDispatch: {
          enabled: true,
          criteria: autoDispatchCriteria
        },
        updatedAt: serverTimestamp()
      });

      // Create driver task notification
      await addDoc(collection(db, 'driverTasks'), {
        deliveryId: delivery.id,
        driverId: bestDriver.id,
        driverName: bestDriver.name,
        vehicleId: bestDriver.vehicleId,
        vehicleName: bestDriver.vehicleName,
        partnerId: user?.uid,
        status: 'pending',
        orderId: delivery.orderId,
        customerName: delivery.customerName,
        customerPhone: delivery.customerPhone,
        pickupAddress: delivery.pickupAddress,
        deliveryAddress: delivery.deliveryAddress,
        scheduledDate: delivery.scheduledDate,
        scheduledTime: delivery.scheduledTime,
        deliveryFee: delivery.deliveryFee,
        specialInstructions: delivery.specialInstructions,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({
        title: "Auto-Dispatch Successful",
        description: `Driver ${bestDriver.name} has been automatically assigned to delivery ${delivery.orderId}.`,
      });
    } catch (error) {
      console.error('Error in auto-dispatch:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to auto-dispatch driver. Please try again.",
      });
    }
  };

  // Find best driver based on criteria
  const findBestDriver = (delivery: Delivery, criteria: any) => {
    const suitableDrivers = availableDrivers.filter(driver => {
      // Check vehicle type criteria
      if (criteria.vehicleType && driver.vehicleType !== criteria.vehicleType) {
        return false;
      }
      
      // Check fuel level criteria
      if (criteria.fuelLevel && driver.currentFuelLevel < criteria.fuelLevel) {
        return false;
      }
      
      // Check distance criteria (simplified - would need actual distance calculation)
      // For now, we'll just return the first suitable driver
      return true;
    });

    // Sort by rating (if available) and return the best one
    return suitableDrivers.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
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
          <Button onClick={() => {
            setFormData({
              orderId: generateOrderId(),
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
            setEditingDelivery(null);
            setShowAddForm(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Delivery
          </Button>
        </div>


         {/* Google Maps Status */}
         {process.env.NODE_ENV === 'development' && (
           <Card className="mb-4">
             <CardHeader>
               <CardTitle className="text-sm">Google Maps Status</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-2 text-sm">
                 <div className="flex items-center gap-2">
                   <span className="font-medium">API Key:</span>
                   <span className={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'text-green-600' : 'text-red-600'}>
                     {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Configured' : 'Missing'}
                   </span>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="font-medium">Maps Loaded:</span>
                   <span className={isGoogleMapsLoaded ? 'text-green-600' : 'text-yellow-600'}>
                     {isGoogleMapsLoaded ? 'Yes' : 'Loading...'}
                   </span>
                 </div>
                 {googleMapsError && (
                   <div className="flex items-center gap-2">
                     <span className="font-medium text-red-600">Error:</span>
                     <span className="text-red-600">{googleMapsError.message}</span>
                   </div>
                 )}
               </div>
             </CardContent>
           </Card>
         )}

         {/* Statistics Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliveries.length}</div>
              <p className="text-xs text-muted-foreground">
                {deliveries.filter(d => d.status === 'delivered').length} completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {deliveries.filter(d => ['pending', 'assigned', 'picked_up', 'in_transit'].includes(d.status)).length}
              </div>
              <p className="text-xs text-muted-foreground">
                In progress
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(deliveries
                  .filter(d => d.status === 'delivered' && 
                    new Date(d.actualDeliveryTime || d.updatedAt).toDateString() === new Date().toDateString())
                  .reduce((sum, d) => sum + d.deliveryFee, 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                From completed deliveries
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {deliveries.length > 0 
                  ? Math.round((deliveries.filter(d => d.status === 'delivered').length / deliveries.length) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Delivery success rate
              </p>
            </CardContent>
          </Card>
        </div>


        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by order ID, customer name, or address..."
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
              <SelectItem value="multi_stop">Multi-Stop</SelectItem>
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

        {/* Add/Edit Delivery Modal */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDelivery ? 'Edit Delivery' : 'New Delivery'}
              </DialogTitle>
              <DialogDescription>
                {editingDelivery ? 'Update the delivery details' : 'Create a new delivery order'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderId">Order ID *</Label>
                  <Input
                    id="orderId"
                    value={formData.orderId}
                    onChange={(e) => handleInputChange('orderId', e.target.value)}
                    placeholder="Auto-generated"
                    required
                    readOnly
                    className="bg-muted/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Order ID is automatically generated
                  </p>
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
                      <SelectItem value="multi_stop">Multi-Stop</SelectItem>
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
                <Label htmlFor="pickupAddress" className="flex items-center gap-2">
                  Pickup Address *
                  {isGoogleMapsLoaded && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      🔍 Autosuggest Active
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    ref={pickupInputRef}
                    id="pickupAddress"
                    value={formData.pickupAddress}
                    onChange={(e) => handleAddressInputChange('pickupAddress', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'pickup')}
                    onFocus={() => {
                      if (pickupSuggestions.length > 0) {
                        setShowPickupSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding to allow clicking on suggestions
                      setTimeout(() => setShowPickupSuggestions(false), 200);
                    }}
                    placeholder="Start typing address or place (e.g., Makati City, SM Mall, BGC)"
                    required
                    className={isGoogleMapsLoaded ? 'border-green-200 focus:border-green-400' : ''}
                    autoComplete="off"
                  />
                  
                  {/* Autosuggest Dropdown */}
                  {showPickupSuggestions && pickupSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {pickupSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                            index === activePickupSuggestion ? 'bg-blue-100 text-blue-800' : ''
                          }`}
                          onClick={() => selectSuggestion(suggestion, 'pickup')}
                          onMouseEnter={() => setActivePickupSuggestion(index)}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{suggestion}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {googleMapsError 
                    ? `❌ Error: ${googleMapsError.message}` 
                    : isGoogleMapsLoaded 
                      ? '✅ Autosuggest is active - type 2+ characters to see addresses and places' 
                      : '⏳ Loading Google Places...'
                  }
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryAddress" className="flex items-center gap-2">
                  Delivery Address *
                  {isGoogleMapsLoaded && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      🔍 Autosuggest Active
                    </span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    ref={deliveryInputRef}
                    id="deliveryAddress"
                    value={formData.deliveryAddress}
                    onChange={(e) => handleAddressInputChange('deliveryAddress', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'delivery')}
                    onFocus={() => {
                      if (deliverySuggestions.length > 0) {
                        setShowDeliverySuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding to allow clicking on suggestions
                      setTimeout(() => setShowDeliverySuggestions(false), 200);
                    }}
                    placeholder="Start typing address or place (e.g., Quezon City, SM Mall, Taguig)"
                    required
                    className={isGoogleMapsLoaded ? 'border-green-200 focus:border-green-400' : ''}
                    autoComplete="off"
                  />
                  
                  {/* Autosuggest Dropdown */}
                  {showDeliverySuggestions && deliverySuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {deliverySuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                            index === activeDeliverySuggestion ? 'bg-blue-100 text-blue-800' : ''
                          }`}
                          onClick={() => selectSuggestion(suggestion, 'delivery')}
                          onMouseEnter={() => setActiveDeliverySuggestion(index)}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{suggestion}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {googleMapsError 
                    ? `❌ Error: ${googleMapsError.message}` 
                    : isGoogleMapsLoaded 
                      ? '✅ Autosuggest is active - type 2+ characters to see addresses and places' 
                      : '⏳ Loading Google Places...'
                  }
                </p>
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
                
                {/* Fee Preview */}
                {formData.items && formData.deliveryType && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-800">Estimated Delivery Fee:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {(() => {
                          const items = formData.items.split('\n').map(item => {
                            const parts = item.split(' - ');
                            return {
                              description: parts[0] || '',
                              quantity: parseInt(parts[1]) || 1,
                              weight: parseFloat(parts[2]) || 0,
                              value: parseFloat(parts[4]) || 0
                            };
                          }).filter(item => item.description);
                          
                          const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
                          const totalValue = items.reduce((sum, item) => sum + (item.value * item.quantity), 0);
                          const fee = calculateDeliveryFee(formData.deliveryType, totalWeight, totalValue);
                          
                          return formatCurrency(fee);
                        })()}
                      </span>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Based on {formData.deliveryType} delivery type
                    </div>
                  </div>
                )}
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

              <div className="flex gap-2 pt-4">
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
                      orderId: generateOrderId(),
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
          </DialogContent>
        </Dialog>

        {/* Deliveries List */}
        <div className={displayMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "space-y-4"
        }>
          {filteredDeliveries.map((delivery) => (
            displayMode === 'grid' ? (
              <Card key={delivery.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-semibold">{delivery.orderId}</CardTitle>
                          {delivery.deliveryType === 'express' && (
                            <Badge variant="destructive" className="text-xs">
                              <Timer className="h-3 w-3 mr-1" />
                              Express
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
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
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(delivery.id, 'cancelled')}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteDelivery(delivery.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Customer Info */}
                    <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{delivery.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{delivery.customerPhone}</span>
                      </div>
                      {delivery.customerEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{delivery.customerEmail}</span>
                        </div>
                      )}
                    </div>

                    {/* Route Info */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-muted-foreground">Pickup:</p>
                          <p className="text-muted-foreground">{delivery.pickupAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Navigation className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-muted-foreground">Delivery:</p>
                          <p className="text-muted-foreground">{delivery.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>

                    {/* Schedule & Items */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Schedule</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {delivery.scheduledDate} at {delivery.scheduledTime}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Items</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {delivery.items.length} item{delivery.items.length > 1 ? 's' : ''} • {delivery.totalWeight}kg
                        </p>
                      </div>
                    </div>

                    {/* Financial Info */}
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Delivery Fee</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(delivery.deliveryFee)}
                      </span>
                    </div>

                    {/* Driver Assignment */}
                    {delivery.driverName && (
                      <div className="space-y-1 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">Assigned Driver</p>
                        <p className="text-sm text-blue-700">
                          {delivery.driverName} • {delivery.vehicleName}
                        </p>
                      </div>
                    )}

                    {/* Special Instructions */}
                    {delivery.specialInstructions && (
                      <div className="space-y-1 p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <p className="text-sm font-medium text-yellow-800">Special Instructions</p>
                        </div>
                        <p className="text-sm text-yellow-700">{delivery.specialInstructions}</p>
                      </div>
                    )}

                    {/* Status Actions */}
                    <div className="flex gap-2 pt-2">
                      {delivery.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAssignDriver(delivery)}
                            className="flex-1"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Manual Assign
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAutoDispatch(delivery)}
                            className="flex-1"
                          >
                            <Timer className="h-4 w-4 mr-1" />
                            Auto Dispatch
                          </Button>
                        </>
                      )}
                      {delivery.status === 'assigned' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(delivery.id, 'picked_up')}
                          className="flex-1"
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Mark Picked Up
                        </Button>
                      )}
                      {delivery.status === 'picked_up' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(delivery.id, 'in_transit')}
                          className="flex-1"
                        >
                          <Truck className="h-4 w-4 mr-1" />
                          In Transit
                        </Button>
                      )}
                      {delivery.status === 'in_transit' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(delivery.id, 'delivered')}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Delivered
                        </Button>
                      )}
                      {delivery.status === 'delivered' && (
                        <div className="flex items-center gap-2 text-green-600 w-full justify-center">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-medium">Delivered Successfully</span>
                        </div>
                      )}
                    </div>

                    {/* Delivery Timeline */}
                    {(delivery.actualPickupTime || delivery.actualDeliveryTime) && (
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-sm font-medium text-muted-foreground">Timeline</p>
                        {delivery.actualPickupTime && (
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-blue-500" />
                            <span className="text-muted-foreground">Picked up:</span>
                            <span className="font-medium">{formatDateTime(delivery.actualPickupTime)}</span>
                          </div>
                        )}
                        {delivery.actualDeliveryTime && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-muted-foreground">Delivered:</span>
                            <span className="font-medium">{formatDateTime(delivery.actualDeliveryTime)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
            ) : (
              // List View
              <Card key={delivery.id} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1">
                      {/* Order Info */}
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                          <p className="text-lg font-semibold">{delivery.orderId}</p>
                        </div>
                        <div className="h-12 w-px bg-border"></div>
                      </div>

                      {/* Customer Info */}
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{delivery.customerName}</p>
                          <p className="text-sm text-muted-foreground">{delivery.customerPhone}</p>
                        </div>
                      </div>

                      {/* Route Info */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div className="text-sm">
                            <p className="font-medium">From: {delivery.pickupAddress.split(',')[0]}</p>
                            <p className="text-muted-foreground">To: {delivery.deliveryAddress.split(',')[0]}</p>
                          </div>
                        </div>
                      </div>

                      {/* Schedule & Items */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm font-medium text-muted-foreground">Schedule</p>
                          <p className="text-sm">{delivery.scheduledDate}</p>
                          <p className="text-sm text-muted-foreground">{delivery.scheduledTime}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-muted-foreground">Items</p>
                          <p className="text-sm">{delivery.items.length} items</p>
                          <p className="text-sm text-muted-foreground">{delivery.totalWeight}kg</p>
                        </div>
                      </div>

                      {/* Status & Fee */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <Badge className={getStatusColor(delivery.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(delivery.status)}
                              {getStatusLabel(delivery.status)}
                            </div>
                          </Badge>
                          <Badge className={getDeliveryTypeColor(delivery.deliveryType)} variant="outline">
                            {getDeliveryTypeLabel(delivery.deliveryType)}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-muted-foreground">Fee</p>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(delivery.deliveryFee)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {delivery.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAssignDriver(delivery)}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Manual
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAutoDispatch(delivery)}
                          >
                            <Timer className="h-4 w-4 mr-1" />
                            Auto
                          </Button>
                        </>
                      )}
                      {delivery.status === 'assigned' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(delivery.id, 'picked_up')}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Pick Up
                        </Button>
                      )}
                      {delivery.status === 'picked_up' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(delivery.id, 'in_transit')}
                        >
                          <Truck className="h-4 w-4 mr-1" />
                          In Transit
                        </Button>
                      )}
                      {delivery.status === 'in_transit' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(delivery.id, 'delivered')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Deliver
                        </Button>
                      )}
                      {delivery.status === 'delivered' && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-medium">Delivered</span>
                        </div>
                      )}
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
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
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(delivery.id, 'cancelled')}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteDelivery(delivery.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>

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
                <Button onClick={() => {
                  setFormData({
                    orderId: generateOrderId(),
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
                  setEditingDelivery(null);
                  setShowAddForm(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Delivery
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Driver Assignment Dialog */}
        <Dialog open={showDriverAssignment} onOpenChange={setShowDriverAssignment}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Assign Driver to Delivery
              </DialogTitle>
              <DialogDescription>
                Select a driver and vehicle for delivery {selectedDelivery?.orderId}
              </DialogDescription>
            </DialogHeader>
            
            {selectedDelivery && (
              <div className="space-y-6">
                {/* Delivery Summary */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <h4 className="font-medium">Delivery Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Customer:</span>
                      <p className="font-medium">{selectedDelivery.customerName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{selectedDelivery.customerPhone}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">From:</span>
                      <p className="font-medium">{selectedDelivery.pickupAddress}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">To:</span>
                      <p className="font-medium">{selectedDelivery.deliveryAddress}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Schedule:</span>
                      <p className="font-medium">{selectedDelivery.scheduledDate} at {selectedDelivery.scheduledTime}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fee:</span>
                      <p className="font-medium text-green-600">{formatCurrency(selectedDelivery.deliveryFee)}</p>
                    </div>
                  </div>
                </div>

                {/* Driver Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="driverSelect">Select Driver *</Label>
                    <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDrivers.length === 0 ? (
                          <SelectItem value="no-drivers" disabled>
                            No available drivers found
                          </SelectItem>
                        ) : (
                          availableDrivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{driver.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {driver.vehicleName} ({driver.vehicleType})
                                </Badge>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {availableDrivers.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No drivers are currently available. Please add drivers to your vehicles first.
                      </p>
                    )}
                  </div>

                  {/* Selected Driver Info */}
                  {selectedDriver && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      {(() => {
                        const driver = availableDrivers.find(d => d.id === selectedDriver);
                        return driver ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-800">Selected Driver</span>
                            </div>
                            <p className="text-sm text-blue-700">
                              <strong>{driver.name}</strong> - {driver.vehicleName} ({driver.vehicleType})
                            </p>
                            <p className="text-xs text-blue-600">
                              This driver will be notified of the delivery task and can accept or reject it.
                            </p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleDriverAssignment}
                    disabled={!selectedDriver || availableDrivers.length === 0}
                    className="flex-1"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Assign Driver
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowDriverAssignment(false);
                      setSelectedDelivery(null);
                      setSelectedDriver('');
                      setSelectedVehicle('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PartnerAccessGuard>
  );
}
