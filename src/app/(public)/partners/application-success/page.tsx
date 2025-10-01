"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Mail, 
  Clock, 
  ArrowRight, 
  Handshake,
  Target,
  TrendingUp,
  Users,
  Calendar,
  Phone,
  MessageSquare
} from "lucide-react";
import Link from "next/link";

export default function PartnerApplicationSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Handshake className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Partner Application</h1>
              <p className="text-sm text-muted-foreground">Application submitted successfully</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Application Submitted Successfully!</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Thank you for your interest in becoming a LocalPro partner. Your application has been received and is now under review.
            </p>
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Your account is now in "pending_approval" status. You'll be redirected to a status page when you log in until your application is approved.
              </p>
            </div>
          </div>

          {/* What Happens Next */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                What Happens Next?
              </CardTitle>
              <CardDescription>
                Here's what you can expect during the review process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Initial Review</h3>
                      <p className="text-sm text-muted-foreground">
                        Our team will review your application within 24-48 hours to ensure all information is complete.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Partnership Discussion</h3>
                      <p className="text-sm text-muted-foreground">
                        We'll schedule a call to discuss your partnership goals and how we can work together.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Approval & Onboarding</h3>
                      <p className="text-sm text-muted-foreground">
                        Once approved, you'll receive access to your partner dashboard and marketing materials.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">4</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Referral Setup</h3>
                      <p className="text-sm text-muted-foreground">
                        You'll receive your unique referral codes and tracking links to start promoting LocalPro.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">5</span>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Launch & Support</h3>
                      <p className="text-sm text-muted-foreground">
                        We'll provide ongoing support and resources to help you succeed as a partner.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Expected Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">Day 1-2</Badge>
                    <span className="font-medium">Application Review</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Initial assessment</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">Day 3-5</Badge>
                    <span className="font-medium">Partnership Call</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Discussion & planning</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">Day 5-7</Badge>
                    <span className="font-medium">Approval & Setup</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Dashboard access & materials</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Need Help?
              </CardTitle>
              <CardDescription>
                Have questions about your application? We're here to help.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-muted-foreground">partners@localpro.asia</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-muted-foreground">+63 2 1234 5678</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Benefits Preview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Partnership Benefits
              </CardTitle>
              <CardDescription>
                Here's what you'll get as a LocalPro partner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Commission Earnings</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn competitive commissions for every successful referral
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Marketing Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Access to marketing materials and co-branded content
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Analytics Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Track your performance with detailed analytics and reports
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/partners">
                Learn More About Partnerships
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg">
              <Link href="/">
                Return to Homepage
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
