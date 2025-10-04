'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, Sparkles, Heart } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Checkbox } from '@/shared/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/shared/auth';

import { WellnessBookingForm, WellnessService } from '../types';

// Validation schema
const wellnessBookingSchema = z.object({
  appointmentDate: z.string().min(1, 'Appointment date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  services: z.array(z.string()).min(1, 'At least one service is required'),
  specialRequests: z.string().optional(),
  notes: z.string().optional(),
});

interface SpaBookingDialogProps {
  providerId: string;
  services: WellnessService[];
  children: React.ReactNode;
}

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
];

export function SpaBookingDialog({ 
  providerId, 
  services, 
  children 
}: SpaBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState<WellnessService[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<WellnessBookingForm>({
    resolver: zodResolver(wellnessBookingSchema),
    defaultValues: {
      appointmentDate: '',
      startTime: '',
      services: [],
      specialRequests: '',
      notes: '',
    },
  });

  const calculateTotal = () => {
    return selectedServices.reduce((total, service) => total + service.price, 0);
  };

  const calculateDuration = () => {
    return selectedServices.reduce((total, service) => total + service.duration, 0);
  };

  const handleServiceToggle = (service: WellnessService, checked: boolean) => {
    if (checked) {
      setSelectedServices(prev => [...prev, service]);
      form.setValue('services', [...form.getValues('services'), service.id]);
    } else {
      setSelectedServices(prev => prev.filter(s => s.id !== service.id));
      form.setValue('services', form.getValues('services').filter(id => id !== service.id));
    }
  };

  const onSubmit = async (data: WellnessBookingForm) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to make a booking.',
      });
      return;
    }

    if (selectedServices.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Services Selected',
        description: 'Please select at least one service.',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Here you would call the actual booking service
      // const result = await WellnessBookingService.createBooking(data, user.uid, providerId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Booking Created Successfully!',
        description: `Your wellness appointment has been scheduled for ${data.appointmentDate} at ${data.startTime}.`,
      });
      setOpen(false);
      form.reset();
      setSelectedServices([]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Booking Failed',
        description: 'Failed to create booking. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Book Wellness Services
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Services Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Select Services</h3>
                <div className="space-y-3">
                  {services.map((service) => (
                    <Card key={service.id} className="cursor-pointer transition-all hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{service.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {service.description}
                            </CardDescription>
                          </div>
                          <Checkbox
                            checked={selectedServices.some(s => s.id === service.id)}
                            onCheckedChange={(checked) => handleServiceToggle(service, checked as boolean)}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {service.duration} min
                            </span>
                            <Badge variant="secondary">{service.category}</Badge>
                          </div>
                          <span className="font-semibold text-primary">
                            ₱{service.price.toLocaleString()}
                          </span>
                        </div>
                        {service.amenities.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Amenities:</p>
                            <div className="flex flex-wrap gap-1">
                              {service.amenities.slice(0, 3).map((amenity) => (
                                <Badge key={amenity} variant="outline" className="text-xs">
                                  {amenity}
                                </Badge>
                              ))}
                              {service.amenities.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{service.amenities.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Right Column - Booking Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Booking Details</h3>
                
                {/* Appointment Date */}
                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Appointment Date
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Start Time */}
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Start Time
                      </FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="">Select time</option>
                          {TIME_SLOTS.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Special Requests */}
                <FormField
                  control={form.control}
                  name="specialRequests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Requests</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special requests or preferences..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information..."
                          className="min-h-[60px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Booking Summary */}
                {selectedServices.length > 0 && (
                  <Card className="bg-muted/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Booking Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Services ({selectedServices.length})</span>
                        <span>{calculateDuration()} minutes</span>
                      </div>
                      <div className="space-y-1">
                        {selectedServices.map((service) => (
                          <div key={service.id} className="flex justify-between text-xs text-muted-foreground">
                            <span>{service.name}</span>
                            <span>₱{service.price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-primary">₱{calculateTotal().toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || selectedServices.length === 0}>
                {isLoading ? 'Creating Booking...' : 'Book Appointment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
