"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Search, 
  Star,
  ArrowRight,
  Filter,
  Calendar,
  DollarSign
} from 'lucide-react';
import { SubscriptionKitCard } from '@/components/marketplace/subscription-kit-card';
import { SubscriptionKit } from '@/lib/marketplace/types';
import { SubscriptionService } from '@/lib/marketplace/subscription-service';
import { CartService } from '@/lib/marketplace/cart-service';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function SubscriptionKitsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [kits, setKits] = useState<SubscriptionKit[]>([]);
  const [featuredKits, setFeaturedKits] = useState<SubscriptionKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSchedule, setSelectedSchedule] = useState<string>('all');

  // Categories for filtering
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'cleaning', label: 'Cleaning' },
    { value: 'pest-control', label: 'Pest Control' },
    { value: 'tools', label: 'Tools' },
    { value: 'paint', label: 'Paint' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'electrical', label: 'Electrical' }
  ];

  const schedules = [
    { value: 'all', label: 'All Schedules' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'custom', label: 'Custom' }
  ];

  useEffect(() => {
    loadSubscriptionKits();
  }, []);

  const loadSubscriptionKits = async () => {
    setLoading(true);
    try {
      const [allKits, featured] = await Promise.all([
        SubscriptionService.getSubscriptionKits(),
        SubscriptionService.getFeaturedKits(6)
      ]);
      
      setKits(allKits);
      setFeaturedKits(featured);
    } catch (error) {
      console.error('Error loading subscription kits:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load subscription kits'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddKitToCart = async (kitId: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Login Required',
        description: 'Please log in to add items to cart'
      });
      return;
    }

    try {
      const kit = await SubscriptionService.getSubscriptionKit(kitId);
      if (kit) {
        // Add each product in the kit to cart
        for (const kitProduct of kit.products) {
          await CartService.addToCart(user.uid, kitProduct.productId, kitProduct.quantity);
        }
        
        toast({
          title: 'Kit Added to Cart',
          description: 'Subscription kit added to cart successfully'
        });
      }
    } catch (error) {
      console.error('Error adding kit to cart:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add kit to cart'
      });
    }
  };

  const filteredKits = kits.filter(kit => {
    const matchesSearch = !searchQuery || 
      kit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kit.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kit.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || kit.category === selectedCategory;
    const matchesSchedule = selectedSchedule === 'all' || kit.deliverySchedule === selectedSchedule;
    
    return matchesSearch && matchesCategory && matchesSchedule;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Subscription Kits
          </h1>
          <p className="text-muted-foreground mt-2">
            Get professional supplies delivered regularly at discounted prices
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subscription kits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Schedule" />
              </SelectTrigger>
              <SelectContent>
                {schedules.map((schedule) => (
                  <SelectItem key={schedule.value} value={schedule.value}>
                    {schedule.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Featured Kits */}
      {featuredKits.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              Featured Subscription Kits
            </h2>
            <Button variant="outline" asChild>
              <Link href="/marketplace/subscription-kits?featured=true">
                View All Featured
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredKits.map((kit) => (
              <SubscriptionKitCard
                key={kit.id}
                kit={kit}
                onAddToCart={handleAddKitToCart}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Subscription Kits */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-500" />
            All Subscription Kits
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>{filteredKits.length} kits found</span>
          </div>
        </div>

        {filteredKits.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No subscription kits found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or browse all kits
              </p>
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedSchedule('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKits.map((kit) => (
              <SubscriptionKitCard
                key={kit.id}
                kit={kit}
                onAddToCart={handleAddKitToCart}
              />
            ))}
          </div>
        )}
      </section>

      {/* Benefits Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Why Choose Subscription Kits?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Save Money</h3>
              <p className="text-sm text-muted-foreground">
                Get up to 20% savings compared to buying individual products
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Convenient Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Never run out of supplies with regular automatic deliveries
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-3">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Curated Selection</h3>
              <p className="text-sm text-muted-foreground">
                Professionally selected products for your specific service needs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
