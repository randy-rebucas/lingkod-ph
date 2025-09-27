import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Sparkles, 
  Star, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Shield, 
  Clock,
  // Home & Property Services
  Wrench,
  Droplets,
  Zap,
  Paintbrush,
  Hammer,
  Scissors,
  Bug,
  TreePine,
  Building,
  WashingMachine,
  Truck,
  Wind,
  // Personal & Lifestyle Services
  Scissors as HairScissors,
  Heart,
  BookOpen,
  Dumbbell,
  Sparkles as BeautySparkles,
  // Food & Hospitality Services
  Utensils,
  Users as EventStaff,
  // Creative & Professional Services
  Camera,
  Calendar,
  Monitor,
  Palette,
  // Auto & Mobile Services
  Car,
  Smartphone,
  Package,
  // Supplies & Distribution
  Package2,
  Wrench as ToolWrench,
  PaintBucket
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: 'Our Services - LocalPro',
  description: 'Discover the comprehensive range of services available on LocalPro. From home maintenance to personal care, we connect you with trusted local service providers across the Philippines.',
};

const serviceCategories = [
  {
    id: "home-property",
    title: "Home & Property Services",
    description: "Complete home maintenance and improvement services",
    icon: <Home className="h-8 w-8 text-primary" />,
    services: [
      { name: "Cleaning Services", description: "General, deep cleaning, sofa, carpet, etc.", icon: <Sparkles className="h-5 w-5" /> },
      { name: "Housekeeping / Maid Services", description: "Regular household maintenance and cleaning", icon: <Users className="h-5 w-5" /> },
      { name: "Pest Control", description: "Professional pest elimination and prevention", icon: <Bug className="h-5 w-5" /> },
      { name: "Landscaping & Gardening", description: "Garden design, maintenance, and landscaping", icon: <TreePine className="h-5 w-5" /> },
      { name: "Painting Services", description: "Interior and exterior painting solutions", icon: <Paintbrush className="h-5 w-5" /> },
      { name: "Handyman Services", description: "General repairs and maintenance tasks", icon: <Hammer className="h-5 w-5" /> },
      { name: "Plumbing Services", description: "Pipe repairs, installations, and maintenance", icon: <Droplets className="h-5 w-5" /> },
      { name: "Electrical Services", description: "Wiring, installations, and electrical repairs", icon: <Zap className="h-5 w-5" /> },
      { name: "Roofing Services", description: "Roof repairs, installation, and maintenance", icon: <Building className="h-5 w-5" /> },
      { name: "Appliance Repair", description: "Home appliance maintenance and repairs", icon: <WashingMachine className="h-5 w-5" /> },
      { name: "Home Renovation / Construction", description: "Complete home remodeling and construction", icon: <Wrench className="h-5 w-5" /> },
      { name: "Moving Services", description: "Professional moving and relocation services", icon: <Truck className="h-5 w-5" /> },
      { name: "HVAC Services", description: "Aircon installation, repair, and maintenance", icon: <Wind className="h-5 w-5" /> }
    ]
  },
  {
    id: "personal-lifestyle",
    title: "Personal & Lifestyle Services",
    description: "Personal care and lifestyle enhancement services",
    icon: <Heart className="h-8 w-8 text-primary" />,
    services: [
      { name: "Beauty Salon / Haircut / Makeup", description: "Professional beauty and styling services", icon: <HairScissors className="h-5 w-5" /> },
      { name: "Barber Services", description: "Men's grooming and haircut services", icon: <HairScissors className="h-5 w-5" /> },
      { name: "Spa & Massage", description: "Relaxation and therapeutic massage services", icon: <Heart className="h-5 w-5" /> },
      { name: "Nail Care", description: "Manicure, pedicure, and nail art services", icon: <BeautySparkles className="h-5 w-5" /> },
      { name: "Pet Grooming & Pet Care", description: "Professional pet grooming and care services", icon: <Heart className="h-5 w-5" /> },
      { name: "Tutoring & Academic Coaching", description: "Educational support and academic guidance", icon: <BookOpen className="h-5 w-5" /> },
      { name: "Fitness Trainers", description: "Personal training and fitness coaching", icon: <Dumbbell className="h-5 w-5" /> },
      { name: "Event Makeup & Styling", description: "Special event beauty and styling services", icon: <BeautySparkles className="h-5 w-5" /> }
    ]
  },
  {
    id: "food-hospitality",
    title: "Food & Hospitality Services",
    description: "Culinary and hospitality support services",
    icon: <Utensils className="h-8 w-8 text-primary" />,
    services: [
      { name: "Catering Services", description: "Professional catering for events and occasions", icon: <Utensils className="h-5 w-5" /> },
      { name: "Food Stall Vendors", description: "Event support and food stall services", icon: <Utensils className="h-5 w-5" /> },
      { name: "Event Staff & Waiters", description: "Professional event staffing and service", icon: <EventStaff className="h-5 w-5" /> },
      { name: "Hotel & Resort Support Staff", description: "Hospitality industry support services", icon: <EventStaff className="h-5 w-5" /> }
    ]
  },
  {
    id: "creative-professional",
    title: "Creative & Professional Services",
    description: "Creative and professional business services",
    icon: <Camera className="h-8 w-8 text-primary" />,
    services: [
      { name: "Photography & Videography", description: "Professional photography and video services", icon: <Camera className="h-5 w-5" /> },
      { name: "Event Planning & Coordination", description: "Complete event planning and management", icon: <Calendar className="h-5 w-5" /> },
      { name: "IT Support / Tech Assistance", description: "Technical support and IT services", icon: <Monitor className="h-5 w-5" /> },
      { name: "Graphic Design & Printing Services", description: "Design and printing solutions", icon: <Palette className="h-5 w-5" /> }
    ]
  },
  {
    id: "auto-mobile",
    title: "Auto & Mobile Services",
    description: "Automotive and mobile device services",
    icon: <Car className="h-8 w-8 text-primary" />,
    services: [
      { name: "Auto Repair & Car Care", description: "Automotive repair and maintenance services", icon: <Car className="h-5 w-5" /> },
      { name: "Motorcycle Repair", description: "Motorcycle maintenance and repair services", icon: <Car className="h-5 w-5" /> },
      { name: "Mobile Technician", description: "Phone, laptop, and gadget repair services", icon: <Smartphone className="h-5 w-5" /> },
      { name: "Delivery / Courier Services", description: "Package delivery and courier services", icon: <Package className="h-5 w-5" /> }
    ]
  },
  {
    id: "supplies-distribution",
    title: "Supplies & Distribution",
    description: "LocalPro add-on services and supplies",
    icon: <Package2 className="h-8 w-8 text-primary" />,
    services: [
      { name: "Cleaning Supplies & Chemicals", description: "Professional cleaning supplies and chemicals", icon: <Sparkles className="h-5 w-5" /> },
      { name: "Pest Control Chemicals", description: "Professional pest control supplies", icon: <Bug className="h-5 w-5" /> },
      { name: "Tools & Equipment Rentals", description: "Professional tools and equipment rental", icon: <ToolWrench className="h-5 w-5" /> },
      { name: "Plumbing / Electrical Parts", description: "Professional plumbing and electrical supplies", icon: <Droplets className="h-5 w-5" /> },
      { name: "Paints & Materials", description: "Quality paints and construction materials", icon: <PaintBucket className="h-5 w-5" /> },
      { name: "Starter Kits", description: "Convenient starter kits and packages", icon: <Package2 className="h-5 w-5" /> }
    ]
  }
];

const stats = [
  { number: "50+", label: "Service Categories" },
  { number: "10,000+", label: "Verified Providers" },
  { number: "100+", label: "Cities Covered" },
  { number: "99.8%", label: "Success Rate" }
];

const benefits = [
  {
    icon: <Shield className="h-10 w-10 text-primary" />,
    title: "Verified & Insured",
    description: "All service providers are background-checked and insured for your peace of mind."
  },
  {
    icon: <Clock className="h-10 w-10 text-primary" />,
    title: "24/7 Availability",
    description: "Book services anytime with our round-the-clock booking system."
  },
  {
    icon: <Star className="h-10 w-10 text-primary" />,
    title: "Quality Guaranteed",
    description: "We ensure high-quality services with our satisfaction guarantee."
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "Local Experts",
    description: "Connect with trusted local professionals in your area."
  }
];

export default function ServicesPage() {
  const t = useTranslations('Services');
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Star className="w-4 h-4 mr-2" />
              50+ Service Categories
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold font-headline mb-8 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Our Services
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-12">
              Discover the comprehensive range of services available on LocalPro. From home maintenance to personal care, 
              we connect you with trusted local service providers across the Philippines.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg shadow-glow hover:shadow-glow/50 transition-all duration-300">
                <Link href="/signup">
                  Book a Service <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Link href="/providers">
                  Become a Provider
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-bold font-headline mb-6">Service Categories</h2>
            <p className="text-lg text-muted-foreground">
              Explore our comprehensive range of services organized by category
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto space-y-16">
            {serviceCategories.map((category, categoryIndex) => (
              <div key={category.id}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold font-headline">{category.title}</h3>
                    <p className="text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.services.map((service, serviceIndex) => (
                    <Card key={serviceIndex} className="group shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm hover:-translate-y-1">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            {service.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                              {service.name}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {service.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-4xl font-bold font-headline mb-6">Why Choose LocalPro Services?</h2>
            <p className="text-lg text-muted-foreground">
              Experience the benefits of our comprehensive service platform
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center p-6 shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm hover:-translate-y-1">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 shadow-soft border-0 bg-background/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Ready to Get Started?</CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-8">
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                  Whether you need a service or want to offer your expertise, LocalPro is here to connect you with the right people. 
                  Join thousands of satisfied customers and service providers across the Philippines.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button asChild size="lg" className="h-12 px-8 shadow-glow hover:shadow-glow/50 transition-all duration-300">
                    <Link href="/signup">
                      Book a Service <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 px-8 border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                    <Link href="/providers">
                      Become a Provider
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
