
"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || userRole !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, userRole, router]);

  if (loading || !user || userRole !== 'admin') {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <p>Loading admin resources...</p>
        </div>
    );
  }
  
  return <>{children}</>;
  
}
