"use client";

import { useAuth } from "@/context/auth-context";
import { OrderTracking } from "@/components/order-tracking";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Share2, Phone, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

interface TrackingPageProps {
  params: {
    bookingId: string;
  };
}

export default function BookingTrackingPage({ params }: TrackingPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Booking Tracking',
        text: 'Track your booking status',
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Booking tracking link has been copied to clipboard",
      });
    }
  };

  const handleContactSupport = () => {
    // Implement contact support functionality
    toast({
      title: "Contact Support",
      description: "Support contact options will be available soon",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Track Your Booking</h1>
            <p className="text-muted-foreground">Real-time updates on your service request</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleContactSupport}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Support
          </Button>
        </div>
      </div>

      <OrderTracking bookingId={params.bookingId} />

      {/* Support Information */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Need Help?</h3>
            <p className="text-muted-foreground">
              If you have any questions about your booking or need to make changes, 
              our support team is here to help.
            </p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Call Support
              </Button>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Live Chat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
