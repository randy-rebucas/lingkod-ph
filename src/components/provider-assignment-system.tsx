"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Truck, 
  MapPin, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Eye,
  RefreshCw,
  Navigation,
  Shield,
  Car,
  Package,
  Home,
  Zap,
  Award,
  Phone,
  Mail
} from "lucide-react";
import { getDb } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy, addDoc } from "firebase/firestore";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";

interface Provider {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  role: string;
  skills: string[];
  vehicleTypes: string[];
  licenseNumber?: string;
  licenseExpiry?: string;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  currentTask?: string;
  completedTasks: number;
  specializations: string[];
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    expiryDate: string;
  };
  backgroundCheck: {
    status: 'pending' | 'approved' | 'rejected';
    date: string;
  };
  createdAt: any;
  updatedAt: any;
}

interface LogisticsBooking {
  id: string;
  partnerId: string;
  partnerName: string;
  clientId: string;
  clientName: string;
  serviceType: string;
  logisticsSubType: 'transport' | 'delivery' | 'moving';
  status: string;
  trackingStatus: string;
  price: number;
  pickupAddress: string;
  deliveryAddress: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  specialRequests: any;
  additionalStops?: any[];
  notes?: string;
  estimatedDuration: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  statusHistory: any[];
  notifications: any;
  commission: any;
  createdAt: any;
  updatedAt: any;
}

interface AssignmentCriteria {
  maxDistance: number; // in km
  requiredSkills: string[];
  vehicleType?: string;
  minRating: number;
  backgroundCheckRequired: boolean;
  insuranceRequired: boolean;
}

export function ProviderAssignmentSystem() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [acceptedBookings, setAcceptedBookings] = useState<LogisticsBooking[]>([]);
  const [availableProviders, setAvailableProviders] = useState<Provider[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<LogisticsBooking | null>(null);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showAutoAssignment, setShowAutoAssignment] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [assignmentNote, setAssignmentNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignmentCriteria, setAssignmentCriteria] = useState<AssignmentCriteria>({
    maxDistance: 10,
    requiredSkills: ['driving', 'logistics'],
    minRating: 4.0,
    backgroundCheckRequired: true,
    insuranceRequired: true,
  });

  // Fetch accepted logistics bookings for this partner
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(getDb(), 'logisticsBookings'),
      where('partnerId', '==', user.uid),
      where('status', '==', 'accepted'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogisticsBooking[];
      
      setAcceptedBookings(bookingsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch available providers with logistics skills
  useEffect(() => {
    const q = query(
      collection(getDb(), 'users'),
      where('role', '==', 'provider'),
      where('isAvailable', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const providersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Provider[];
      
      // Filter providers with logistics skills
      const logisticsProviders = providersData.filter(provider => 
        provider.skills?.includes('driving') || 
        provider.skills?.includes('logistics') ||
        provider.specializations?.includes('transport') ||
        provider.specializations?.includes('delivery') ||
        provider.specializations?.includes('moving')
      );
      
      setAvailableProviders(logisticsProviders);
    });

    return () => unsubscribe();
  }, []);

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProviderScore = (provider: Provider, booking: LogisticsBooking): number => {
    let score = 0;
    
    // Base score from rating
    score += provider.rating * 20; // 0-100 points
    
    // Skills match
    const requiredSkills = ['driving', 'logistics'];
    const matchingSkills = requiredSkills.filter(skill => 
      provider.skills?.includes(skill) || provider.specializations?.includes(skill)
    );
    score += (matchingSkills.length / requiredSkills.length) * 30; // 0-30 points
    
    // Vehicle type match
    if (booking.logisticsSubType === 'transport' && provider.vehicleTypes?.includes('van')) {
      score += 15;
    } else if (booking.logisticsSubType === 'delivery' && provider.vehicleTypes?.includes('truck')) {
      score += 15;
    } else if (booking.logisticsSubType === 'moving' && provider.vehicleTypes?.includes('truck')) {
      score += 15;
    }
    
    // Background check
    if (provider.backgroundCheck?.status === 'approved') {
      score += 10;
    }
    
    // Insurance
    if (provider.insuranceInfo) {
      score += 10;
    }
    
    // Availability
    if (provider.isAvailable && !provider.currentTask) {
      score += 15;
    }
    
    return Math.min(score, 100);
  };

  const getFilteredProviders = (booking: LogisticsBooking): Provider[] => {
    return availableProviders
      .filter(provider => {
        // Basic filters
        if (provider.rating < assignmentCriteria.minRating) return false;
        if (assignmentCriteria.backgroundCheckRequired && provider.backgroundCheck?.status !== 'approved') return false;
        if (assignmentCriteria.insuranceRequired && !provider.insuranceInfo) return false;
        
        // Skills filter
        const hasRequiredSkills = assignmentCriteria.requiredSkills.some(skill =>
          provider.skills?.includes(skill) || provider.specializations?.includes(skill)
        );
        if (!hasRequiredSkills) return false;
        
        return true;
      })
      .map(provider => ({
        ...provider,
        score: calculateProviderScore(provider, booking)
      }))
      .sort((a, b) => (b as any).score - (a as any).score);
  };

  const handleManualAssignment = async () => {
    if (!selectedBooking || !selectedProvider) return;

    setIsProcessing(true);
    try {
      const bookingRef = doc(getDb(), 'logisticsBookings', selectedBooking.id);
      
      // Update booking with provider assignment
      const newStatusHistory = [
        ...selectedBooking.statusHistory,
        {
          status: 'provider_assigned',
          timestamp: serverTimestamp(),
          note: assignmentNote || `Assigned to provider ${selectedProvider.displayName}`,
        }
      ];

      await updateDoc(bookingRef, {
        providerId: selectedProvider.uid,
        providerName: selectedProvider.displayName,
        providerAvatar: selectedProvider.photoURL || '',
        status: 'provider_assigned',
        trackingStatus: 'accepted',
        statusHistory: newStatusHistory,
        notifications: {
          ...selectedBooking.notifications,
          providerAssigned: true,
        },
        updatedAt: serverTimestamp(),
      });

      // Update provider status
      const providerRef = doc(getDb(), 'users', selectedProvider.uid);
      await updateDoc(providerRef, {
        currentTask: selectedBooking.id,
        isAvailable: false,
        updatedAt: serverTimestamp(),
      });

      // Create provider task
      await addDoc(collection(getDb(), 'providerTasks'), {
        providerId: selectedProvider.uid,
        providerName: selectedProvider.displayName,
        bookingId: selectedBooking.id,
        taskType: 'logistics',
        serviceType: selectedBooking.logisticsSubType,
        status: 'assigned',
        pickupAddress: selectedBooking.pickupAddress,
        deliveryAddress: selectedBooking.deliveryAddress,
        clientName: selectedBooking.clientName,
        clientPhone: selectedBooking.contactPhone,
        clientEmail: selectedBooking.contactEmail,
        specialRequests: selectedBooking.specialRequests,
        additionalStops: selectedBooking.additionalStops,
        notes: selectedBooking.notes,
        estimatedDuration: selectedBooking.estimatedDuration,
        priority: selectedBooking.priority,
        price: selectedBooking.price,
        providerEarnings: selectedBooking.commission.providerEarnings,
        assignmentNote: assignmentNote,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create notification for provider
      await addDoc(collection(getDb(), 'notifications'), {
        type: 'provider_assigned',
        recipientId: selectedProvider.uid,
        recipientType: 'provider',
        title: 'New Logistics Task Assigned',
        message: `You have been assigned a ${selectedBooking.logisticsSubType} task from ${selectedBooking.partnerName}`,
        data: {
          bookingId: selectedBooking.id,
          partnerName: selectedBooking.partnerName,
          serviceType: selectedBooking.logisticsSubType,
          pickupAddress: selectedBooking.pickupAddress,
          deliveryAddress: selectedBooking.deliveryAddress,
          price: selectedBooking.price,
          providerEarnings: selectedBooking.commission.providerEarnings,
        },
        read: false,
        createdAt: serverTimestamp(),
      });

      // Create notification for client
      await addDoc(collection(getDb(), 'notifications'), {
        type: 'provider_assigned',
        recipientId: selectedBooking.clientId,
        recipientType: 'client',
        title: 'Provider Assigned',
        message: `Your ${selectedBooking.logisticsSubType} booking has been assigned to ${selectedProvider.displayName}`,
        data: {
          bookingId: selectedBooking.id,
          providerName: selectedProvider.displayName,
          serviceType: selectedBooking.logisticsSubType,
        },
        read: false,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Provider Assigned",
        description: `${selectedProvider.displayName} has been assigned to this booking.`,
      });

      setShowAssignmentDialog(false);
      setSelectedBooking(null);
      setSelectedProvider(null);
      setAssignmentNote('');
    } catch (error) {
      console.error('Error assigning provider:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to assign provider',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoAssignment = async () => {
    if (!selectedBooking) return;

    const filteredProviders = getFilteredProviders(selectedBooking);
    if (filteredProviders.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Available Providers',
        description: 'No providers match the assignment criteria.',
      });
      return;
    }

    const bestProvider = filteredProviders[0];
    setSelectedProvider(bestProvider);
    setAssignmentNote('Auto-assigned based on best match criteria');
    await handleManualAssignment();
  };

  const openAssignmentDialog = (booking: LogisticsBooking) => {
    setSelectedBooking(booking);
    setShowAssignmentDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading accepted bookings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Provider Assignment</h2>
          <p className="text-muted-foreground">Assign providers to accepted logistics bookings</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-lg px-3 py-1">
            {acceptedBookings.length} accepted
          </Badge>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {availableProviders.length} providers
          </Badge>
        </div>
      </div>

      {/* Assignment Criteria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Assignment Criteria</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Max Distance (km)</Label>
              <Select 
                value={assignmentCriteria.maxDistance.toString()} 
                onValueChange={(value) => setAssignmentCriteria(prev => ({ ...prev, maxDistance: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 km</SelectItem>
                  <SelectItem value="10">10 km</SelectItem>
                  <SelectItem value="15">15 km</SelectItem>
                  <SelectItem value="20">20 km</SelectItem>
                  <SelectItem value="50">50 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Min Rating</Label>
              <Select 
                value={assignmentCriteria.minRating.toString()} 
                onValueChange={(value) => setAssignmentCriteria(prev => ({ ...prev, minRating: parseFloat(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3.0">3.0+</SelectItem>
                  <SelectItem value="3.5">3.5+</SelectItem>
                  <SelectItem value="4.0">4.0+</SelectItem>
                  <SelectItem value="4.5">4.5+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Background Check</Label>
              <Select 
                value={assignmentCriteria.backgroundCheckRequired.toString()} 
                onValueChange={(value) => setAssignmentCriteria(prev => ({ ...prev, backgroundCheckRequired: value === 'true' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Required</SelectItem>
                  <SelectItem value="false">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Insurance</Label>
              <Select 
                value={assignmentCriteria.insuranceRequired.toString()} 
                onValueChange={(value) => setAssignmentCriteria(prev => ({ ...prev, insuranceRequired: value === 'true' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Required</SelectItem>
                  <SelectItem value="false">Optional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accepted Bookings List */}
      {acceptedBookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No accepted bookings</h3>
            <p className="text-muted-foreground">Accepted bookings will appear here for provider assignment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {acceptedBookings.map((booking) => {
            const ServiceIcon = getServiceTypeIcon(booking.logisticsSubType);
            const bookingDate = booking.createdAt?.toDate ? booking.createdAt.toDate() : new Date();
            const filteredProviders = getFilteredProviders(booking);
            
            return (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <ServiceIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{getServiceTypeLabel(booking.logisticsSubType)}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          From {booking.clientName}
                        </p>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(booking.priority)}>
                      {booking.priority}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{booking.pickupAddress}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Navigation className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{booking.deliveryAddress}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Est. {booking.estimatedDuration} minutes</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="text-lg font-bold text-primary">
                      ₱{booking.price.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {filteredProviders.length} providers available
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openAssignmentDialog(booking)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Assign Provider
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedBooking(booking);
                        handleAutoAssignment();
                      }}
                      disabled={filteredProviders.length === 0}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Auto Assign
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assignment Dialog */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Provider</DialogTitle>
            <DialogDescription>
              Select a provider for this logistics booking
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Truck className="h-5 w-5" />
                    <span>Booking Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span className="font-medium">{getServiceTypeLabel(selectedBooking.logisticsSubType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Client:</span>
                    <span className="font-medium">{selectedBooking.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span className="font-medium text-primary">₱{selectedBooking.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provider Earnings:</span>
                    <span className="font-medium text-green-600">₱{selectedBooking.commission.providerEarnings.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Available Providers */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Available Providers</Label>
                <div className="space-y-3">
                  {getFilteredProviders(selectedBooking).map((provider) => (
                    <Card 
                      key={provider.uid} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedProvider?.uid === provider.uid ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{provider.displayName}</h3>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span>{provider.rating.toFixed(1)}</span>
                                  <span>({provider.reviewCount} reviews)</span>
                                </div>
                                <span>•</span>
                                <span>{provider.completedTasks} tasks completed</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                              {(provider as any).score}%
                            </div>
                            <div className="text-sm text-muted-foreground">Match Score</div>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex flex-wrap gap-2">
                          {provider.skills?.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {provider.vehicleTypes?.slice(0, 2).map((vehicle) => (
                            <Badge key={vehicle} variant="outline" className="text-xs">
                              {vehicle}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                          {provider.backgroundCheck?.status === 'approved' && (
                            <div className="flex items-center space-x-1">
                              <Shield className="h-3 w-3 text-green-600" />
                              <span>Background Checked</span>
                            </div>
                          )}
                          {provider.insuranceInfo && (
                            <div className="flex items-center space-x-1">
                              <Award className="h-3 w-3 text-blue-600" />
                              <span>Insured</span>
                            </div>
                          )}
                          {provider.isAvailable && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span>Available</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Assignment Note */}
              <div className="space-y-2">
                <Label>Assignment Note (Optional)</Label>
                <Textarea
                  placeholder="Add any specific instructions for the provider..."
                  value={assignmentNote}
                  onChange={(e) => setAssignmentNote(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignmentDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleManualAssignment}
              disabled={!selectedProvider || isProcessing}
            >
              {isProcessing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Assign Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
