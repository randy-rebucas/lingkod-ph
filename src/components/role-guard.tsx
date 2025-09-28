"use client";

import { useAuth } from "@/context/auth-context";
import { ReactNode, memo } from "react";
import { Skeleton } from "./ui/skeleton";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export const RoleGuard = memo(function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback = null,
  loadingFallback
}: RoleGuardProps) {
  const { userRole, loading } = useAuth();

  if (loading) {
    return loadingFallback || <Skeleton className="h-8 w-full" />;
  }

  // Check role
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
});

// Convenience components for common use cases
export const AdminOnly = memo(function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
});

export const ProviderOnly = memo(function ProviderOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['provider']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
});

export const ClientOnly = memo(function ClientOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['client']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
});

export const AgencyOnly = memo(function AgencyOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['agency']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
});

