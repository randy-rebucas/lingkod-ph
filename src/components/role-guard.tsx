"use client";

import { useAuth } from "@/context/auth-context";
import { ReactNode } from "react";
import { LoadingState } from "@/components/app/loading-state";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback = null
}: RoleGuardProps) {
  const { userRole, loading } = useAuth();

  if (loading) {
    return <LoadingState title="Loading..." description="Please wait while we verify your access." />;
  }

  // Check role
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
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

