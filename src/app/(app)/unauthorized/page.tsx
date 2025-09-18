"use client";

import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UnauthorizedPage() {
  const { userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to appropriate dashboard based on role
    if (userRole) {
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [userRole, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Your current role: <span className="font-medium capitalize">{userRole || 'Unknown'}</span></p>
            <p className="mt-2">
              If you believe this is an error, please contact support or try logging in again.
            </p>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant="outline" onClick={() => router.back()} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>You will be automatically redirected to your dashboard in 5 seconds.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
