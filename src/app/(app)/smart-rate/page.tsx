
"use client";

import SmartRateClient from "@/components/smart-rate-client";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, BarChart3, Calculator, Target, DollarSign, MapPin, Clock, Users, Award, Lightbulb, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export default function SmartRatePage() {
    const t = useTranslations('SmartRate');

  return (
    <div className="container space-y-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('smartRateTitle')}</h1>
            <p className="text-muted-foreground">
              {t('smartRateDescription')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              AI-Powered
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
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Rate</p>
                <p className="text-xl font-bold">₱2,500</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Market Trend</p>
                <p className="text-xl font-bold">+12%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Locations</p>
                <p className="text-xl font-bold">15+</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-xl font-bold">94%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Rate Calculator
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Market Analysis
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calculator" className="mt-6">
          <SmartRateClient />
        </TabsContent>
        
        <TabsContent value="analysis" className="mt-6">
          <MarketAnalysisTab />
        </TabsContent>
        
        <TabsContent value="templates" className="mt-6">
          <PricingTemplatesTab />
        </TabsContent>
        
        <TabsContent value="insights" className="mt-6">
          <PricingInsightsTab />
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Market Analysis Tab Component
function MarketAnalysisTab() {
  const marketData = [
    { location: "Metro Manila", avgRate: 3500, trend: "+15%", demand: "High" },
    { location: "Cebu City", avgRate: 2800, trend: "+8%", demand: "Medium" },
    { location: "Davao City", avgRate: 2200, trend: "+12%", demand: "Medium" },
    { location: "Iloilo City", avgRate: 1800, trend: "+5%", demand: "Low" },
    { location: "Baguio City", avgRate: 2000, trend: "+10%", demand: "Medium" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Market Analysis</h2>
        <p className="text-muted-foreground">Regional pricing trends and market insights</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Regional Pricing
            </CardTitle>
            <CardDescription>Average rates by location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {marketData.map((location, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <div>
                    <p className="font-medium">{location.location}</p>
                    <p className="text-sm text-muted-foreground">₱{location.avgRate.toLocaleString()}/hour</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={location.demand === 'High' ? 'default' : location.demand === 'Medium' ? 'secondary' : 'outline'}>
                      {location.demand}
                    </Badge>
                    <p className="text-sm text-green-600 mt-1">{location.trend}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Market Trends
            </CardTitle>
            <CardDescription>Pricing trends and forecasts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Overall Growth</span>
                </div>
                <p className="text-2xl font-bold text-green-600">+12%</p>
                <p className="text-sm text-green-700">Average rate increase this quarter</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Web Development</span>
                  <div className="flex items-center gap-2">
                    <Progress value={85} className="w-20" />
                    <span className="text-sm text-green-600">+15%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Digital Marketing</span>
                  <div className="flex items-center gap-2">
                    <Progress value={70} className="w-20" />
                    <span className="text-sm text-green-600">+10%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Consulting</span>
                  <div className="flex items-center gap-2">
                    <Progress value={60} className="w-20" />
                    <span className="text-sm text-green-600">+8%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Pricing Templates Tab Component
function PricingTemplatesTab() {
  const templates = [
    {
      id: 1,
      name: "Web Development",
      description: "Full-stack web development services",
      rates: {
        hourly: 2500,
        daily: 18000,
        project: 150000
      },
      category: "Technology"
    },
    {
      id: 2,
      name: "Digital Marketing",
      description: "Social media and digital marketing campaigns",
      rates: {
        hourly: 1800,
        daily: 12000,
        project: 80000
      },
      category: "Marketing"
    },
    {
      id: 3,
      name: "Business Consulting",
      description: "Strategic business consulting and analysis",
      rates: {
        hourly: 3000,
        daily: 22000,
        project: 200000
      },
      category: "Consulting"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pricing Templates</h2>
          <p className="text-muted-foreground">Pre-configured pricing for common services</p>
        </div>
        <Button>
          <Target className="h-4 w-4 mr-2" />
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
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Hourly Rate</span>
                  <span className="font-medium">₱{template.rates.hourly.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Daily Rate</span>
                  <span className="font-medium">₱{template.rates.daily.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Project Rate</span>
                  <span className="font-medium">₱{template.rates.project.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  <Calculator className="h-4 w-4 mr-1" />
                  Use
                </Button>
                <Button size="sm" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Analyze
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Pricing Insights Tab Component
function PricingInsightsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pricing Insights</h2>
        <p className="text-muted-foreground">AI-powered recommendations and optimization tips</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Optimization Tips
            </CardTitle>
            <CardDescription>AI recommendations for better pricing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Rate Optimization</span>
                </div>
                <p className="text-sm text-blue-700">Consider increasing your rates by 15-20% based on current market demand and your experience level.</p>
              </div>
              
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Client Segmentation</span>
                </div>
                <p className="text-sm text-green-700">Offer tiered pricing for different client types: startups (20% discount), enterprises (premium rates).</p>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-800">Time-based Pricing</span>
                </div>
                <p className="text-sm text-purple-700">Consider project-based pricing for long-term engagements to increase overall revenue.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Competitive Analysis
            </CardTitle>
            <CardDescription>How you compare to the market</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-6 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                <div className="text-3xl font-bold text-primary mb-2">₱2,500</div>
                <div className="text-sm text-muted-foreground">Your Current Rate</div>
                <div className="text-sm text-green-600 mt-1">+8% above market average</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm">Market Average</span>
                  <span className="font-medium">₱2,300</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm">Top 25%</span>
                  <span className="font-medium">₱3,200</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <span className="text-sm">Top 10%</span>
                  <span className="font-medium">₱4,500</span>
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Growth Opportunity</span>
                </div>
                <p className="text-sm text-yellow-700">You're positioned well in the market. Consider premium positioning for specialized services.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
