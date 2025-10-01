"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle } from "lucide-react";

interface PartnerAccessGuardProps {
  children: React.ReactNode;
}

export function PartnerAccessGuard({ children }: PartnerAccessGuardProps) {
  const { user, userRole, partnerStatus, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect if still loading
    if (loading) return;

    // Redirect non-partners
    if (userRole !== 'partner') {
      router.push('/dashboard');
      return;
    }

    // Redirect pending partners to unauthorized page
    if (partnerStatus === 'pending_approval' || partnerStatus === 'pending') {
      router.push('/partners/unauthorized');
      return;
    }
  }, [userRole, partnerStatus, loading, router]);

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied for non-partners
  if (userRole !== 'partner') {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              This page is only accessible to approved partners.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show pending status for pending partners
  if (partnerStatus === 'pending_approval' || partnerStatus === 'pending') {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Clock className="h-5 w-5" />
              Partnership Pending
            </CardTitle>
            <CardDescription>
              Your partnership application is still under review. You'll gain access once approved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/partners/unauthorized')} className="w-full">
              View Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied for rejected or suspended partners
  if (partnerStatus === 'rejected' || partnerStatus === 'suspended') {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Partnership {partnerStatus === 'rejected' ? 'Not Approved' : 'Suspended'}
            </CardTitle>
            <CardDescription>
              {partnerStatus === 'rejected' 
                ? 'Your partnership application was not approved. Please contact support for more information.'
                : 'Your partnership has been suspended. Please contact support to resolve this issue.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/partners/unauthorized')} className="w-full">
              View Details
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only show children if partner is active
  if (partnerStatus === 'active') {
    return <>{children}</>;
  }

  // Fallback for any other status
  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600">
            <Clock className="h-5 w-5" />
            Partnership Status Unknown
          </CardTitle>
          <CardDescription>
            Unable to determine your partnership status. Please contact support.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/partners/unauthorized')} className="w-full">
            Check Status
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
