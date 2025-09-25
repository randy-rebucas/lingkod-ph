"use client";

import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { designTokens } from '@/lib/design-tokens';

interface ProBadgeProps {
  variant?: 'default' | 'compact' | 'large';
  showIcon?: boolean;
  className?: string;
}

export function ProBadge({ 
  variant = 'default', 
  showIcon = true, 
  className 
}: ProBadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return 'text-xs px-2 py-1';
      case 'large':
        return 'text-sm px-4 py-2';
      default:
        return 'text-xs px-3 py-1.5';
    }
  };

  const getIconSize = () => {
    switch (variant) {
      case 'compact':
        return 'h-3 w-3';
      case 'large':
        return 'h-4 w-4';
      default:
        return 'h-3.5 w-3.5';
    }
  };

  return (
    <Badge 
      className={cn(
        'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-sm',
        'hover:from-yellow-500 hover:to-orange-600 transition-all duration-200',
        designTokens.effects.buttonGlow,
        getVariantStyles(),
        className
      )}
    >
      {showIcon && (
        <Crown className={cn('mr-1', getIconSize())} />
      )}
      <span className="font-semibold">Pro</span>
    </Badge>
  );
}

interface VerifiedProBadgeProps {
  variant?: 'default' | 'compact' | 'large';
  showIcon?: boolean;
  className?: string;
}

export function VerifiedProBadge({ 
  variant = 'default', 
  showIcon = true, 
  className 
}: VerifiedProBadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return 'text-xs px-2 py-1';
      case 'large':
        return 'text-sm px-4 py-2';
      default:
        return 'text-xs px-3 py-1.5';
    }
  };

  const getIconSize = () => {
    switch (variant) {
      case 'compact':
        return 'h-3 w-3';
      case 'large':
        return 'h-4 w-4';
      default:
        return 'h-3.5 w-3.5';
    }
  };

  return (
    <Badge 
      className={cn(
        'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-sm',
        'hover:from-blue-600 hover:to-purple-700 transition-all duration-200',
        designTokens.effects.buttonGlow,
        getVariantStyles(),
        className
      )}
    >
      {showIcon && (
        <Star className={cn('mr-1', getIconSize())} />
      )}
      <span className="font-semibold">Verified Pro</span>
    </Badge>
  );
}

interface SubscriptionBadgeProps {
  tier: 'free' | 'pro';
  variant?: 'default' | 'compact' | 'large';
  showIcon?: boolean;
  className?: string;
}

export function SubscriptionBadge({ 
  tier, 
  variant = 'default', 
  showIcon = true, 
  className 
}: SubscriptionBadgeProps) {
  if (tier === 'pro') {
    return (
      <VerifiedProBadge 
        variant={variant} 
        showIcon={showIcon} 
        className={className} 
      />
    );
  }

  return (
    <Badge 
      variant="secondary"
      className={cn(
        'text-muted-foreground',
        variant === 'compact' ? 'text-xs px-2 py-1' : 
        variant === 'large' ? 'text-sm px-4 py-2' : 
        'text-xs px-3 py-1.5',
        className
      )}
    >
      Free
    </Badge>
  );
}
