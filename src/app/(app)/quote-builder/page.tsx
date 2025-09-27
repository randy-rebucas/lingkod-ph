
"use client";

import QuoteBuilderClient from "@/components/quote-builder-client";
import { StoredQuotesList } from "@/components/stored-quotes-list";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { Calculator, FileText, BarChart3, Settings, Users, Mail, Download, Copy, History, Star, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";


export default function QuoteBuilderPage() {
  const t = useTranslations('QuoteBuilder');

  return (
    <div className="container space-y-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('quoteBuilderTitle')}</h1>
            <p className="text-muted-foreground">
              {t('quoteBuilderDescription')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              Advanced
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-6xl mx-auto">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Quotes</p>
                  <p className="text-xl font-bold">--</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                  <Calculator className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Accepted</p>
                  <p className="text-xl font-bold">--</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-xl font-bold">--%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Clients</p>
                  <p className="text-xl font-bold">--</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              {t('createQuote')}
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="stored" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('storedQuotes')}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="mt-6">
            <QuoteBuilderClient />
          </TabsContent>
          
          <TabsContent value="templates" className="mt-6">
            <QuoteTemplatesTab />
          </TabsContent>
          
          <TabsContent value="stored" className="mt-6">
            <StoredQuotesList />
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-6">
            <QuoteAnalyticsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Quote Templates Tab Component
function QuoteTemplatesTab() {
  const templates = [
    {
      id: 1,
      name: "Web Development",
      description: "Complete website development package",
      items: [
        { description: "Frontend Development", quantity: 1, price: 50000 },
        { description: "Backend Development", quantity: 1, price: 40000 },
        { description: "Database Setup", quantity: 1, price: 15000 },
        { description: "Testing & Deployment", quantity: 1, price: 10000 }
      ],
      total: 115000,
      category: "Technology"
    },
    {
      id: 2,
      name: "Digital Marketing",
      description: "Comprehensive digital marketing campaign",
      items: [
        { description: "Social Media Management", quantity: 1, price: 25000 },
        { description: "Content Creation", quantity: 1, price: 20000 },
        { description: "SEO Optimization", quantity: 1, price: 30000 },
        { description: "Analytics & Reporting", quantity: 1, price: 15000 }
      ],
      total: 90000,
      category: "Marketing"
    },
    {
      id: 3,
      name: "Consulting Services",
      description: "Business consulting and strategy",
      items: [
        { description: "Business Analysis", quantity: 1, price: 35000 },
        { description: "Strategic Planning", quantity: 1, price: 40000 },
        { description: "Implementation Support", quantity: 1, price: 25000 }
      ],
      total: 100000,
      category: "Consulting"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quote Templates</h2>
          <p className="text-muted-foreground">Pre-built templates for common services</p>
        </div>
        <Button>
          <Star className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </div>
                <Badge variant="outline">{template.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {template.items.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.description}</span>
                    <span className="font-medium">₱{item.price.toLocaleString()}</span>
                  </div>
                ))}
                {template.items.length > 3 && (
                  <div className="text-sm text-muted-foreground">
                    +{template.items.length - 3} more items
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">₱{template.total.toLocaleString()}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4 mr-1" />
                    Use
                  </Button>
                  <Button size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Quote Analytics Tab Component
function QuoteAnalyticsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Quote Analytics</h2>
        <p className="text-muted-foreground">Track your quote performance and conversion rates</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Quote Status Distribution</CardTitle>
            <CardDescription>Breakdown of quote statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Draft</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={30} className="w-20" />
                  <span className="text-sm text-muted-foreground">30%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Sent</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={50} className="w-20" />
                  <span className="text-sm text-muted-foreground">50%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Accepted</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={15} className="w-20" />
                  <span className="text-sm text-muted-foreground">15%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Declined</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={5} className="w-20" />
                  <span className="text-sm text-muted-foreground">5%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest quote activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                  <Calculator className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Quote #Q-2024-001 accepted</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
                <Badge variant="secondary">₱50,000</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Quote #Q-2024-002 sent</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
                <Badge variant="outline">₱75,000</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New quote #Q-2024-003 created</p>
                  <p className="text-xs text-muted-foreground">2 days ago</p>
                </div>
                <Badge variant="outline">₱30,000</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
