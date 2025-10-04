"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Briefcase, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ProviderEngagementCardProps {
  className?: string;
}

export function ProviderEngagementCard({ className }: ProviderEngagementCardProps) {
  return (
    <Card className={`border border-primary/20 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-medium">
            Become a Provider
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Turn your skills into income opportunities.
        </p>
        
        <Button asChild variant="outline" size="sm" className="w-full text-xs">
          <Link href="/subscription" className="flex items-center gap-1">
            Get Started
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
