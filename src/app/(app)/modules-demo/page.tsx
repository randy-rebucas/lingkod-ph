'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Utensils, Sparkles, Home, Package, Truck } from 'lucide-react';

// Import modules
import { CateringBookingDialog, type FoodCateringService } from '@/modules/food-catering';
import { SpaBookingDialog, type WellnessService } from '@/modules/wellness';

export default function ModulesDemoPage() {
  const [selectedCateringService, setSelectedCateringService] = useState<FoodCateringService | null>(null);
  const [selectedWellnessServices, setSelectedWellnessServices] = useState<WellnessService[]>([]);

  // Sample data for demonstration
  const sampleCateringServices: FoodCateringService[] = [
    {
      id: '1',
      name: 'Premium Wedding Catering',
      description: 'Complete wedding catering service with 5-course meal, professional staff, and elegant presentation.',
      category: 'catering',
      pricePerHour: 0,
      minimumHours: 6,
      maxCapacity: 200,
      specialties: ['Wedding Cakes', 'International Cuisine', 'Live Cooking Stations'],
      equipmentProvided: true,
      dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal'],
      serviceAreas: ['Metro Manila', 'Cavite', 'Laguna'],
      providerId: 'provider-1',
      isActive: true,
      rating: 4.8,
      reviewCount: 127,
    },
    {
      id: '2',
      name: 'Corporate Event Catering',
      description: 'Professional catering for corporate events, meetings, and business gatherings.',
      category: 'catering',
      pricePerHour: 0,
      minimumHours: 4,
      maxCapacity: 100,
      specialties: ['Business Lunch', 'Coffee Break', 'Networking Events'],
      equipmentProvided: true,
      dietaryOptions: ['Vegetarian', 'Low Sodium', 'Diabetic-Friendly'],
      serviceAreas: ['Metro Manila', 'Makati', 'BGC'],
      providerId: 'provider-2',
      isActive: true,
      rating: 4.6,
      reviewCount: 89,
    },
  ];

  const sampleWellnessServices: WellnessService[] = [
    {
      id: '1',
      name: 'Full Body Massage',
      description: 'Relaxing full body massage with aromatherapy oils to relieve stress and tension.',
      category: 'massage',
      subcategory: 'therapeutic',
      duration: 60,
      price: 2500,
      providerId: 'provider-1',
      isActive: true,
      amenities: ['Aromatherapy', 'Hot Stones', 'Relaxing Music'],
      specialties: ['Stress Relief', 'Muscle Tension', 'Deep Tissue'],
      serviceAreas: ['Metro Manila', 'Quezon City'],
      rating: 4.9,
      reviewCount: 156,
    },
    {
      id: '2',
      name: 'Facial Treatment',
      description: 'Rejuvenating facial treatment with premium skincare products for glowing skin.',
      category: 'beauty',
      subcategory: 'skincare',
      duration: 90,
      price: 1800,
      providerId: 'provider-1',
      isActive: true,
      amenities: ['Premium Products', 'Steam Treatment', 'Face Mask'],
      specialties: ['Anti-Aging', 'Hydration', 'Brightening'],
      serviceAreas: ['Metro Manila', 'Makati'],
      rating: 4.7,
      reviewCount: 98,
    },
    {
      id: '3',
      name: 'Manicure & Pedicure',
      description: 'Complete nail care service with gel polish and nail art options.',
      category: 'beauty',
      subcategory: 'nails',
      duration: 45,
      price: 800,
      providerId: 'provider-1',
      isActive: true,
      amenities: ['Gel Polish', 'Nail Art', 'Cuticle Care'],
      specialties: ['French Manicure', 'Nail Art', 'Gel Extensions'],
      serviceAreas: ['Metro Manila', 'Quezon City', 'Makati'],
      rating: 4.5,
      reviewCount: 203,
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Modular Architecture Demo</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This page demonstrates the new modular architecture in action. Each module is self-contained 
          with its own components, services, hooks, and types.
        </p>
      </div>

      <Tabs defaultValue="food-catering" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="food-catering" className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Food & Catering
          </TabsTrigger>
          <TabsTrigger value="wellness" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Wellness
          </TabsTrigger>
          <TabsTrigger value="laundry" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Laundry
          </TabsTrigger>
          <TabsTrigger value="supplies" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Supplies
          </TabsTrigger>
          <TabsTrigger value="logistics" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Logistics
          </TabsTrigger>
        </TabsList>

        {/* Food & Catering Module Demo */}
        <TabsContent value="food-catering" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Food & Catering Services</h2>
            <p className="text-muted-foreground">
              Professional catering services for events, weddings, and corporate functions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sampleCateringServices.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {service.description}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{service.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Max Capacity: {service.maxCapacity} guests</span>
                    <span>Min Hours: {service.minimumHours}h</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Specialties:</p>
                    <div className="flex flex-wrap gap-1">
                      {service.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Dietary Options:</p>
                    <div className="flex flex-wrap gap-1">
                      {service.dietaryOptions.map((option) => (
                        <Badge key={option} variant="secondary" className="text-xs">
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        ⭐ {service.rating} ({service.reviewCount} reviews)
                      </span>
                    </div>
                    <CateringBookingDialog
                      providerId={service.providerId}
                      serviceId={service.id}
                      serviceName={service.name}
                    >
                      <Button>Book Service</Button>
                    </CateringBookingDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Wellness Module Demo */}
        <TabsContent value="wellness" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Wellness & Beauty Services</h2>
            <p className="text-muted-foreground">
              Relaxing spa treatments, beauty services, and wellness programs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleWellnessServices.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {service.description}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">{service.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      ⏱️ {service.duration} min
                    </span>
                    <span className="font-semibold text-primary">
                      ₱{service.price.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Amenities:</p>
                    <div className="flex flex-wrap gap-1">
                      {service.amenities.map((amenity) => (
                        <Badge key={amenity} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        ⭐ {service.rating} ({service.reviewCount} reviews)
                      </span>
                    </div>
                    <SpaBookingDialog
                      providerId={service.providerId}
                      services={[service]}
                    >
                      <Button>Book Service</Button>
                    </SpaBookingDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Other Modules - Placeholder */}
        <TabsContent value="laundry" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Laundry & Cleaning Services</h2>
            <p className="text-muted-foreground">
              Professional cleaning and laundry services for homes and businesses.
            </p>
            <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <p className="text-muted-foreground">Module implementation coming soon...</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="supplies" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Supplies & Hardware</h2>
            <p className="text-muted-foreground">
              Equipment rental, supplies, and hardware for various services.
            </p>
            <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <p className="text-muted-foreground">Module implementation coming soon...</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logistics" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Logistics & Transportation</h2>
            <p className="text-muted-foreground">
              Delivery services, moving assistance, and transportation solutions.
            </p>
            <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <p className="text-muted-foreground">Module implementation coming soon...</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Architecture Benefits */}
      <Card className="mt-12">
        <CardHeader>
          <CardTitle>Modular Architecture Benefits</CardTitle>
          <CardDescription>
            This implementation demonstrates the key advantages of the new modular structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">🔧 Self-Contained</h4>
              <p className="text-sm text-muted-foreground">
                Each module has its own components, services, hooks, and types
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">🔄 Reusable</h4>
              <p className="text-sm text-muted-foreground">
                Shared services and components can be used across modules
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">📈 Scalable</h4>
              <p className="text-sm text-muted-foreground">
                Easy to add new modules and features without affecting existing code
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">👥 Team-Friendly</h4>
              <p className="text-sm text-muted-foreground">
                Different teams can work on different modules independently
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
