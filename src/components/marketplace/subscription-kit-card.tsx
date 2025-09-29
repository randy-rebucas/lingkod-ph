"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Calendar, 
  DollarSign, 
  ShoppingCart,
  Star,
  ArrowRight
} from 'lucide-react';
import { SubscriptionKit } from '@/lib/marketplace/types';
import { SubscriptionService } from '@/lib/marketplace/subscription-service';

interface SubscriptionKitCardProps {
  kit: SubscriptionKit;
  onAddToCart?: (kitId: string) => void;
  showAddToCart?: boolean;
}

export function SubscriptionKitCard({
  kit,
  onAddToCart,
  showAddToCart = true
}: SubscriptionKitCardProps) {
  const savings = SubscriptionService.calculateKitSavings(kit);

  const getDeliveryScheduleLabel = (schedule: string) => {
    switch (schedule) {
      case 'monthly':
        return 'Monthly Delivery';
      case 'quarterly':
        return 'Quarterly Delivery';
      case 'custom':
        return 'Custom Schedule';
      default:
        return 'Monthly Delivery';
    }
  };

  const getDeliveryScheduleIcon = (schedule: string) => {
    switch (schedule) {
      case 'monthly':
        return '📅';
      case 'quarterly':
        return '🗓️';
      case 'custom':
        return '⚙️';
      default:
        return '📅';
    }
  };

  return (
    <Card className="group relative overflow-hidden border-0 shadow-soft hover:shadow-glow transition-all duration-300 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm">
      {/* Header */}
      <CardContent className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {kit.featured && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-sm">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {kit.category}
              </Badge>
            </div>
            
            <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
              <Link href={`/marketplace/subscription-kits/${kit.id}`}>
                {kit.name}
              </Link>
            </h3>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {kit.description}
            </p>
          </div>
        </div>

        {/* Products Preview */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Includes {kit.products.length} products</span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {kit.products.slice(0, 3).map((kitProduct, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {kitProduct.quantity}x {kitProduct.productId.split('-')[0]}
              </Badge>
            ))}
            {kit.products.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{kit.products.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Delivery Schedule */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{getDeliveryScheduleIcon(kit.deliverySchedule)} {getDeliveryScheduleLabel(kit.deliverySchedule)}</span>
        </div>

        <Separator className="my-4" />

        {/* Pricing */}
        <div className="space-y-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold text-primary">
                ₱{kit.pricing.monthlyPrice.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
            <div className="text-xs text-muted-foreground">
              One-time: ₱{kit.pricing.oneTimePrice.toLocaleString()}
            </div>
          </div>

          {/* Savings */}
          {savings.monthlySavings > 0 && (
            <div className="text-center">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                Save ₱{savings.monthlySavings.toLocaleString()} ({savings.monthlySavingsPercentage}%)
              </Badge>
            </div>
          )}
        </div>
      </CardContent>

      {showAddToCart && (
        <CardFooter className="p-6 pt-0 space-y-2">
          <Button 
            className="w-full" 
            onClick={() => onAddToCart?.(kit.id)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full group"
            asChild
          >
            <Link href={`/marketplace/subscription-kits/${kit.id}`}>
              View Details
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
