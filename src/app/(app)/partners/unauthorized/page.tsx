"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Mail, 
  Phone, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  LogOut,
  Home
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getAuthInstance } from "@/lib/firebase";

export default function PartnerUnauthorizedPage() {
  const { user, userRole, partnerStatus, loading: authLoading } = useAuth();
  const t = useTranslations('Partners');
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only redirect if user is not a partner or has active status
    // Don't redirect if we're already on this page to prevent loops
    if ((userRole !== 'partner' || partnerStatus === 'active') && 
        typeof window !== 'undefined' && 
        !window.location.pathname.includes('/partners/unauthorized')) {
      router.push('/dashboard');
    }
  }, [userRole, partnerStatus, router]);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const authInstance = getAuthInstance();
      if (authInstance) {
        await signOut(authInstance);
        toast({
          title: "Signed Out",
          description: "You have been signed out successfully.",
        });
        router.push('/login');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval':
      case 'pending':
        return <Clock className="h-16 w-16 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'suspended':
        return <AlertCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Clock className="h-16 w-16 text-yellow-500" />;
    }
  };

  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'pending_approval':
      case 'pending':
        return "Partnership Application Under Review";
      case 'rejected':
        return "Partnership Application Not Approved";
      case 'suspended':
        return "Partnership Suspended";
      default:
        return "Partnership Status Pending";
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending_approval':
      case 'pending':
        return "Your partnership application is currently being reviewed by our team. We'll notify you once the review is complete, typically within 2-3 business days.";
      case 'rejected':
        return "Unfortunately, your partnership application was not approved at this time. You may reapply in the future or contact our support team for more information.";
      case 'suspended':
        return "Your partnership has been suspended. Please contact our support team to resolve this issue.";
      default:
        return "Your partnership status is being processed. Please wait for further updates.";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'rejected':
        return 'border-red-200 bg-red-50';
      case 'suspended':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (userRole !== 'partner') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">This page is only accessible to partners.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {getStatusIcon(partnerStatus || 'pending')}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {getStatusTitle(partnerStatus || 'pending_approval')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {getStatusDescription(partnerStatus || 'pending_approval')}
            </p>
          </div>
        </div>

        {/* Status Card */}
        <Card className={`${getStatusColor(partnerStatus || 'pending_approval')}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Status
            </CardTitle>
            <CardDescription>
              Your partnership application status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  {getStatusIcon(partnerStatus || 'pending_approval')}
                  <div>
                    <h3 className="font-semibold capitalize">
                      {partnerStatus || 'pending_approval'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Partnership Status
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Applied: {user?.metadata?.creationTime ? 
                      new Date(user.metadata.creationTime).toLocaleDateString() : 
                      'Unknown'
                    }
                  </p>
                </div>
              </div>

              {(partnerStatus === 'pending_approval' || partnerStatus === 'pending') && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Our team will review your application within 2-3 business days</li>
                    <li>• You'll receive an email notification once the review is complete</li>
                    <li>• If approved, you'll gain access to the partner dashboard</li>
                    <li>• You can check back here for status updates</li>
                  </ul>
                </div>
              )}

              {partnerStatus === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Next Steps</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Review the feedback provided by our team</li>
                    <li>• You may reapply after addressing any concerns</li>
                    <li>• Contact our support team for more information</li>
                    <li>• Consider applying again in the future</li>
                  </ul>
                </div>
              )}

              {partnerStatus === 'suspended' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Account Suspended</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Your partnership has been temporarily suspended</li>
                    <li>• Contact our support team immediately</li>
                    <li>• Review our partnership terms and conditions</li>
                    <li>• Resolve any outstanding issues to restore access</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Need Help?
            </CardTitle>
            <CardDescription>
              Contact our support team for assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-muted-foreground">
                      partners@localpro.com
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-muted-foreground">
                      +63 2 1234 5678
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Business Hours</p>
                    <p className="text-sm text-muted-foreground">
                      Monday - Friday, 9:00 AM - 6:00 PM
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Response Time</p>
                    <p className="text-sm text-muted-foreground">
                      Within 24 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={handleGoHome}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Homepage
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </Button>
          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            {loading ? 'Signing Out...' : 'Sign Out'}
          </Button>
        </div>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Partnership Program Information</CardTitle>
            <CardDescription>
              Learn more about our partnership program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                <h4 className="font-medium">Easy Application</h4>
                <p className="text-sm text-muted-foreground">
                  Simple online application process
                </p>
              </div>
              <div className="text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                <h4 className="font-medium">Competitive Commissions</h4>
                <p className="text-sm text-muted-foreground">
                  Earn up to 10% commission on referrals
                </p>
              </div>
              <div className="text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                <h4 className="font-medium">Marketing Support</h4>
                <p className="text-sm text-muted-foreground">
                  Access to marketing materials and tools
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
