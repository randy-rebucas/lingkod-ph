"use client";

import { useAuth } from "@/context/auth-context";
import { ReactNode } from "react";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
  requireSubscription?: boolean;
  requiredPlan?: string;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback = null,
  requireSubscription = false,
  requiredPlan
}: RoleGuardProps) {
  const { userRole, subscription, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Check role
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  // Check subscription if required
  if (requireSubscription) {
    const isPaidSubscriber = subscription?.status === 'active' && subscription.planId !== 'free';
    
    if (!isPaidSubscriber) {
      return <>{fallback}</>;
    }

    // Check specific plan if required
    if (requiredPlan && subscription.planId !== requiredPlan) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ProviderOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['provider']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ClientOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['client']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function AgencyOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['agency']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function PaidSubscriberOnly({ 
  children, 
  fallback, 
  requiredPlan 
}: { 
  children: ReactNode; 
  fallback?: ReactNode;
  requiredPlan?: string;
}) {
  return (
    <RoleGuard 
      allowedRoles={['provider', 'agency']} 
      requireSubscription={true}
      requiredPlan={requiredPlan}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}
