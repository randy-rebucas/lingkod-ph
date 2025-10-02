"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/auth-context';
import { getDb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2, Clock, MapPin, Package, Users, Truck, Home, AlertTriangle, CheckCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import type { Service } from '@/app/(app)/providers/[providerId]/page';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

// Enhanced booking schema with all new features
const enhancedBookingSchema = z.object({
  serviceType: z.enum(['transport', 'delivery', 'moving'], { required_error: "Please select a service type." }),
  bookingType: z.enum(['instant', 'scheduled'], { required_error: "Please select booking type." }),
  date: z.date().optional(),
  time: z.string().optional(),
  pickupAddress: z.string().min(1, "Pickup address is required"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  contactName: z.string().min(1, "Contact name is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  contactEmail: z.string().email("Invalid email address"),
  // Service-specific fields
  passengerCount: z.number().min(1).optional(),
  itemDescription: z.string().optional(),
  itemWeight: z.number().min(0).optional(),
  itemValue: z.number().min(0).optional(),
  movingItems: z.array(z.string()).optional(),
  // Special requests
  specialRequests: z.object({
    fragileHandling: z.boolean().default(false),
    multipleDropoffs: z.boolean().default(false),
    helperRequired: z.boolean().default(false),
    insuranceRequired: z.boolean().default(false),
    whiteGloveService: z.boolean().default(false),
    assemblyRequired: z.boolean().default(false),
  }),
  additionalStops: z.array(z.object({
    address: z.string(),
    type: z.enum(['pickup', 'delivery']),
    contactName: z.string().optional(),
    contactPhone: z.string().optional(),
    items: z.string().optional(),
  })).optional(),
  notes: z.string().optional(),
  estimatedDuration: z.number().min(1).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

type EnhancedBookingFormValues = z.infer<typeof enhancedBookingSchema>;

type Provider = {
  uid: string;
  displayName: string;
  email: string;
  bio?: string;
  photoURL?: string;
  role: string;
};

type EnhancedBookingDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  service: Service;
  provider: Provider;
  onBookingConfirmed: () => void;
};

// Service type configurations
const serviceTypeConfig = {
  transport: {
    icon: Users,
    label: 'Transport (People)',
    description: 'Passenger transportation services',
    fields: ['passengerCount'],
    defaultDuration: 60,
  },
  delivery: {
    icon: Package,
    label: 'Delivery (Goods)',
    description: 'Package and goods delivery',
    fields: ['itemDescription', 'itemWeight', 'itemValue'],
    defaultDuration: 45,
  },
  moving: {
    icon: Home,
    label: 'Moving (Furniture/Household)',
    description: 'Furniture and household item moving',
    fields: ['movingItems'],
    defaultDuration: 180,
  },
};

// Memoized time slots generation
const generateTimeSlots = () => {
  const slots = [];
  for (let i = 6; i <= 22; i++) {
    const hour = i % 12 === 0 ? 12 : i % 12;
    const ampm = i < 12 ? 'AM' : 'PM';
    slots.push(`${hour}:00 ${ampm}`);
    if (i < 22) slots.push(`${hour}:30 ${ampm}`);
  }
  return slots;
};

export function EnhancedBookingDialog({ isOpen, setIsOpen, service, provider, onBookingConfirmed }: EnhancedBookingDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [additionalStops, setAdditionalStops] = useState<Array<{ address: string; type: 'pickup' | 'delivery'; contactName?: string; contactPhone?: string; items?: string }>>([]);
  const t = useTranslations('BookingDialog');
  
  // Memoize time slots to prevent regeneration on every render
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const form = useForm<EnhancedBookingFormValues>({
    resolver: zodResolver(enhancedBookingSchema),
    defaultValues: {
      serviceType: 'delivery',
      bookingType: 'scheduled',
      pickupAddress: '',
      deliveryAddress: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      passengerCount: 1,
      itemDescription: '',
      itemWeight: 0,
      itemValue: 0,
      movingItems: [],
      specialRequests: {
        fragileHandling: false,
        multipleDropoffs: false,
        helperRequired: false,
        insuranceRequired: false,
        whiteGloveService: false,
        assemblyRequired: false,
      },
      additionalStops: [],
      notes: '',
      estimatedDuration: 60,
      priority: 'normal',
    },
  });
  
  const watchedServiceType = form.watch('serviceType');
  const watchedBookingType = form.watch('bookingType');
  const watchedSpecialRequests = form.watch('specialRequests');

  useEffect(() => {
    if (isOpen) {
      form.reset();
      setCurrentStep(1);
      setAdditionalStops([]);
    }
  }, [isOpen, form]);

  // Update estimated duration based on service type
  useEffect(() => {
    const config = serviceTypeConfig[watchedServiceType];
    if (config) {
      form.setValue('estimatedDuration', config.defaultDuration);
    }
  }, [watchedServiceType, form]);

  // Add additional stop
  const addAdditionalStop = () => {
    setAdditionalStops([...additionalStops, { address: '', type: 'pickup' }]);
  };

  // Remove additional stop
  const removeAdditionalStop = (index: number) => {
    setAdditionalStops(additionalStops.filter((_, i) => i !== index));
  };

  // Update additional stop
  const updateAdditionalStop = (index: number, field: string, value: any) => {
    const updated = [...additionalStops];
    updated[index] = { ...updated[index], [field]: value };
    setAdditionalStops(updated);
  };

  // Calculate dynamic pricing based on service type and special requests
  const calculateDynamicPricing = useCallback(() => {
    let basePrice = service.price;
    let additionalCost = 0;

    // Service type multipliers
    switch (watchedServiceType) {
      case 'transport':
        additionalCost += 50; // Base transport fee
        break;
      case 'delivery':
        additionalCost += 30; // Base delivery fee
        break;
      case 'moving':
        additionalCost += 100; // Base moving fee
        break;
    }

    // Special requests pricing
    if (watchedSpecialRequests.fragileHandling) additionalCost += 25;
    if (watchedSpecialRequests.helperRequired) additionalCost += 50;
    if (watchedSpecialRequests.insuranceRequired) additionalCost += 30;
    if (watchedSpecialRequests.whiteGloveService) additionalCost += 75;
    if (watchedSpecialRequests.assemblyRequired) additionalCost += 40;
    if (watchedSpecialRequests.multipleDropoffs) additionalCost += 20 * additionalStops.length;

    // Priority pricing
    const priorityMultiplier = {
      low: 0.9,
      normal: 1.0,
      high: 1.2,
      urgent: 1.5,
    };

    return Math.round((basePrice + additionalCost) * priorityMultiplier[form.getValues('priority')]);
  }, [service.price, watchedServiceType, watchedSpecialRequests, additionalStops.length, form]);

  const dynamicPrice = useMemo(() => calculateDynamicPricing(), [calculateDynamicPricing]);

  // Memoize the submit handler
  const onSubmit = useCallback(async (data: EnhancedBookingFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: t('error'), description: t('mustBeLoggedIn') });
      return;
    }
    
    setIsSaving(true);
    try {
      let bookingDateTime: Date;
      
      if (data.bookingType === 'instant') {
        bookingDateTime = new Date();
      } else {
        if (!data.date || !data.time) {
          toast({ variant: 'destructive', title: t('error'), description: 'Date and time are required for scheduled bookings' });
          return;
        }
        
        const timeParts = data.time.match(/(\d+):(\d+)\s(AM|PM)/);
        if (!timeParts) {
          toast({ variant: 'destructive', title: t('error'), description: t('invalidTimeFormat') });
          return;
        }
        
        let hours = parseInt(timeParts[1], 10);
        const minutes = parseInt(timeParts[2], 10);
        const ampm = timeParts[3];

        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;

        bookingDateTime = new Date(data.date);
        bookingDateTime.setHours(hours, minutes, 0, 0);
      }

      const bookingData = {
        providerId: provider.uid,
        providerName: provider.displayName,
        providerAvatar: provider.photoURL || '',
        clientId: user.uid,
        clientName: user.displayName,
        clientAvatar: user.photoURL || '',
        serviceId: service.id,
        serviceName: service.name,
        price: dynamicPrice,
        basePrice: service.price,
        additionalFees: dynamicPrice - service.price,
        date: Timestamp.fromDate(bookingDateTime),
        status: data.bookingType === 'instant' ? "Pending" : "Scheduled",
        // Enhanced fields
        serviceType: data.serviceType,
        bookingType: data.bookingType,
        pickupAddress: data.pickupAddress,
        deliveryAddress: data.deliveryAddress,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        // Service-specific data
        passengerCount: data.passengerCount,
        itemDescription: data.itemDescription,
        itemWeight: data.itemWeight,
        itemValue: data.itemValue,
        movingItems: data.movingItems,
        // Special requests
        specialRequests: data.specialRequests,
        additionalStops: additionalStops,
        notes: data.notes,
        estimatedDuration: data.estimatedDuration,
        priority: data.priority,
        // Tracking
        trackingStatus: 'pending',
        statusHistory: [{
          status: 'pending',
          timestamp: serverTimestamp(),
          note: 'Booking created',
        }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (!getDb()) {
        throw new Error('Database not initialized. Please check your Firebase configuration.');
      }
      
      const newBookingRef = await addDoc(collection(getDb(), 'bookings'), bookingData);
      onBookingConfirmed();
      
      toast({
        title: "Booking Created Successfully",
        description: `Your ${data.serviceType} booking has been created. Booking ID: ${newBookingRef.id}`,
      });
      
      router.push(`/bookings/${newBookingRef.id}/payment`);

    } catch (error) {
      console.error("Error creating booking:", error);
      const errorMessage = error instanceof Error ? error.message : t('failedToCreateBooking');
      toast({ variant: 'destructive', title: t('error'), description: errorMessage });
    } finally {
      setIsSaving(false);
    }
  }, [user, provider, service, onBookingConfirmed, router, toast, t, dynamicPrice, additionalStops]);

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Service Type</Label>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(serviceTypeConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <Card 
                      key={key} 
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        watchedServiceType === key && "ring-2 ring-primary"
                      )}
                      onClick={() => form.setValue('serviceType', key as any)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-6 w-6 text-primary" />
                          <div>
                            <h3 className="font-semibold">{config.label}</h3>
                            <p className="text-sm text-muted-foreground">{config.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold">Booking Type</Label>
              <div className="grid grid-cols-2 gap-4">
                <Card 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    watchedBookingType === 'instant' && "ring-2 ring-primary"
                  )}
                  onClick={() => form.setValue('bookingType', 'instant')}
                >
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-semibold">Instant Booking</h3>
                    <p className="text-sm text-muted-foreground">Available now</p>
                  </CardContent>
                </Card>
                <Card 
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    watchedBookingType === 'scheduled' && "ring-2 ring-primary"
                  )}
                  onClick={() => form.setValue('bookingType', 'scheduled')}
                >
                  <CardContent className="p-4 text-center">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-semibold">Scheduled</h3>
                    <p className="text-sm text-muted-foreground">Book for later</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {watchedBookingType === 'scheduled' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="mb-1">Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="time" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time slot" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            )}

            <div className="space-y-4">
              <FormField control={form.control} name="pickupAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pickup Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Enter pickup address" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="deliveryAddress" render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Enter delivery address" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="space-y-4">
              <FormField control={form.control} name="contactName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="contactPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="contactEmail" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Service-specific fields */}
            {watchedServiceType === 'transport' && (
              <FormField control={form.control} name="passengerCount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Passengers</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="8" placeholder="Enter passenger count" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {watchedServiceType === 'delivery' && (
              <div className="space-y-4">
                <FormField control={form.control} name="itemDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the items to be delivered" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="itemWeight" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.1" placeholder="Enter weight" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="itemValue" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Value (₱)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" placeholder="Enter value" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>
            )}

            {watchedServiceType === 'moving' && (
              <FormField control={form.control} name="movingItems" render={({ field }) => (
                <FormItem>
                  <FormLabel>Moving Items</FormLabel>
                  <FormControl>
                    <Textarea placeholder="List items to be moved (e.g., sofa, dining table, boxes)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            {/* Special Requests */}
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Special Requests</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries({
                  fragileHandling: 'Fragile Handling',
                  helperRequired: 'Helper Required',
                  insuranceRequired: 'Insurance Required',
                  whiteGloveService: 'White Glove Service',
                  assemblyRequired: 'Assembly Required',
                  multipleDropoffs: 'Multiple Drop-offs',
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={watchedSpecialRequests[key as keyof typeof watchedSpecialRequests]}
                      onCheckedChange={(checked) => 
                        form.setValue(`specialRequests.${key}`, checked as boolean)
                      }
                    />
                    <Label htmlFor={key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Stops */}
            {watchedSpecialRequests.multipleDropoffs && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Additional Stops</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addAdditionalStop}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stop
                  </Button>
                </div>
                
                {additionalStops.map((stop, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Stop {index + 1}</h4>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeAdditionalStop(index)}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">Address</Label>
                          <Input
                            placeholder="Enter address"
                            value={stop.address}
                            onChange={(e) => updateAdditionalStop(index, 'address', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Type</Label>
                          <Select value={stop.type} onValueChange={(value) => updateAdditionalStop(index, 'type', value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pickup">Pickup</SelectItem>
                              <SelectItem value="delivery">Delivery</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">Contact Name</Label>
                          <Input
                            placeholder="Contact name"
                            value={stop.contactName || ''}
                            onChange={(e) => updateAdditionalStop(index, 'contactName', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Contact Phone</Label>
                          <Input
                            placeholder="Contact phone"
                            value={stop.contactPhone || ''}
                            onChange={(e) => updateAdditionalStop(index, 'contactPhone', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Items</Label>
                        <Textarea
                          placeholder="Describe items for this stop"
                          value={stop.items || ''}
                          onChange={(e) => updateAdditionalStop(index, 'items', e.target.value)}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any additional instructions or notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Booking Summary</Label>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Truck className="h-5 w-5" />
                    <span>{serviceTypeConfig[watchedServiceType].label}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provider:</span>
                    <span className="font-medium">{provider.displayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Booking Type:</span>
                    <Badge variant={watchedBookingType === 'instant' ? 'default' : 'secondary'}>
                      {watchedBookingType === 'instant' ? 'Instant' : 'Scheduled'}
                    </Badge>
                  </div>
                  {watchedBookingType === 'scheduled' && form.getValues('date') && form.getValues('time') && (
                    <div className="flex justify-between">
                      <span>Date & Time:</span>
                      <span className="font-medium">
                        {format(form.getValues('date')!, "PPP")} at {form.getValues('time')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Estimated Duration:</span>
                    <span className="font-medium">{form.getValues('estimatedDuration')} minutes</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Special Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.entries(watchedSpecialRequests).some(([_, value]) => value) ? (
                    <div className="space-y-2">
                      {Object.entries(watchedSpecialRequests)
                        .filter(([_, value]) => value)
                        .map(([key, _]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">
                              {key === 'fragileHandling' && 'Fragile Handling'}
                              {key === 'helperRequired' && 'Helper Required'}
                              {key === 'insuranceRequired' && 'Insurance Required'}
                              {key === 'whiteGloveService' && 'White Glove Service'}
                              {key === 'assemblyRequired' && 'Assembly Required'}
                              {key === 'multipleDropoffs' && 'Multiple Drop-offs'}
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No special requests</p>
                  )}
                </CardContent>
              </Card>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-lg">
                  <span>Base Price:</span>
                  <span>₱{service.price.toFixed(2)}</span>
                </div>
                {dynamicPrice > service.price && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Additional Fees:</span>
                    <span>₱{(dynamicPrice - service.price).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                  <span>Total Price:</span>
                  <span className="text-primary">₱{dynamicPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enhanced Booking: {service.name}</DialogTitle>
          <DialogDescription>
            Create a detailed booking with {provider.displayName}. Step {currentStep} of 4.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {renderStepContent()}
            
            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                Previous
              </Button>
              
              {currentStep < 4 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? 'Creating Booking...' : 'Create Booking'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
