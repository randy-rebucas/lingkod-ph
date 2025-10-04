"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Sparkles, 
  Star, 
  ArrowRight, 
  Users, 
  Shield, 
  Clock,
  // Home & Property Services
  Wrench,
  Droplets,
  Zap,
  Paintbrush,
  Hammer,
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
import Link from "next/link";
import { useTranslations } from 'next-intl';



export default function ServicesPage() {
  const t = useTranslations('Services');

  const serviceCategories = [
    {
      id: "home-property",
      title: t('categories.homeProperty.title'),
      description: t('categories.homeProperty.description'),
      icon: <Home className="h-8 w-8 text-primary" />,
      services: [
        { name: t('categories.homeProperty.services.cleaningServices.name'), description: t('categories.homeProperty.services.cleaningServices.description'), icon: <Sparkles className="h-5 w-5" /> },
        { name: t('categories.homeProperty.services.housekeeping.name'), description: t('categories.homeProperty.services.housekeeping.description'), icon: <Users className="h-5 w-5" /> },
        { name: t('categories.homeProperty.services.pestControl.name'), description: t('categories.homeProperty.services.pestControl.description'), icon: <Bug className="h-5 w-5" /> },
        { name: t('categories.homeProperty.services.landscaping.name'), description: t('categories.homeProperty.services.landscaping.description'), icon: <TreePine className="h-5 w-5" /> },
        { name: t('categories.homeProperty.services.painting.name'), description: t('categories.homeProperty.services.painting.description'), icon: <Paintbrush className="h-5 w-5" /> },
        { name: t('categories.homeProperty.services.handyman.name'), description: t('categories.homeProperty.services.handyman.description'), icon: <Hammer className="h-5 w-5" /> },
        { name: t('categories.homeProperty.services.plumbing.name'), description: t('categories.homeProperty.services.plumbing.description'), icon: <Droplets className="h-5 w-5" /> },
        { name: t('categories.homeProperty.services.electrical.name'), description: t('categories.homeProperty.services.electrical.description'), icon: <Zap className="h-5 w-5" /> },
        { name: t('categories.homeProperty.services.roofing.name'), description: t('categories.homeProperty.services.roofing.description'), icon: <Building className="h-5 w-5" /> },
        { name: t('categories.homeProperty.services.applianceRepair.name'), description: t('categories.homeProperty.services.applianceRepair.description'), icon: <WashingMachine className="h-5 w-5" /> },
        { name: t('categories.homeProperty.services.homeRenovation.name'), description: t('categories.homeProperty.services.homeRenovation.description'), icon: <Wrench className="h-5 w-5" /> },
        { name: t('categories.homeProperty.services.movingServices.name'), description: t('categories.homeProperty.services.movingServices.description'), icon: <Truck className="h-5 w-5" /> },
        { name: t('categories.homeProperty.services.hvac.name'), description: t('categories.homeProperty.services.hvac.description'), icon: <Wind className="h-5 w-5" /> }
      ]
    },
    {
      id: "personal-lifestyle",
      title: t('categories.personalLifestyle.title'),
      description: t('categories.personalLifestyle.description'),
      icon: <Heart className="h-8 w-8 text-primary" />,
      services: [
        { name: t('categories.personalLifestyle.services.beautySalon.name'), description: t('categories.personalLifestyle.services.beautySalon.description'), icon: <HairScissors className="h-5 w-5" /> },
        { name: t('categories.personalLifestyle.services.barber.name'), description: t('categories.personalLifestyle.services.barber.description'), icon: <HairScissors className="h-5 w-5" /> },
        { name: t('categories.personalLifestyle.services.spaMassage.name'), description: t('categories.personalLifestyle.services.spaMassage.description'), icon: <Heart className="h-5 w-5" /> },
        { name: t('categories.personalLifestyle.services.nailCare.name'), description: t('categories.personalLifestyle.services.nailCare.description'), icon: <BeautySparkles className="h-5 w-5" /> },
        { name: t('categories.personalLifestyle.services.petGrooming.name'), description: t('categories.personalLifestyle.services.petGrooming.description'), icon: <Heart className="h-5 w-5" /> },
        { name: t('categories.personalLifestyle.services.tutoring.name'), description: t('categories.personalLifestyle.services.tutoring.description'), icon: <BookOpen className="h-5 w-5" /> },
        { name: t('categories.personalLifestyle.services.fitnessTrainers.name'), description: t('categories.personalLifestyle.services.fitnessTrainers.description'), icon: <Dumbbell className="h-5 w-5" /> },
        { name: t('categories.personalLifestyle.services.eventMakeup.name'), description: t('categories.personalLifestyle.services.eventMakeup.description'), icon: <BeautySparkles className="h-5 w-5" /> }
      ]
    },
    {
      id: "food-hospitality",
      title: t('categories.foodHospitality.title'),
      description: t('categories.foodHospitality.description'),
      icon: <Utensils className="h-8 w-8 text-primary" />,
      services: [
        { name: t('categories.foodHospitality.services.catering.name'), description: t('categories.foodHospitality.services.catering.description'), icon: <Utensils className="h-5 w-5" /> },
        { name: t('categories.foodHospitality.services.foodStallVendors.name'), description: t('categories.foodHospitality.services.foodStallVendors.description'), icon: <Utensils className="h-5 w-5" /> },
        { name: t('categories.foodHospitality.services.eventStaff.name'), description: t('categories.foodHospitality.services.eventStaff.description'), icon: <EventStaff className="h-5 w-5" /> },
        { name: t('categories.foodHospitality.services.hotelSupport.name'), description: t('categories.foodHospitality.services.hotelSupport.description'), icon: <EventStaff className="h-5 w-5" /> }
      ]
    },
    {
      id: "creative-professional",
      title: t('categories.creativeProfessional.title'),
      description: t('categories.creativeProfessional.description'),
      icon: <Camera className="h-8 w-8 text-primary" />,
      services: [
        { name: t('categories.creativeProfessional.services.photography.name'), description: t('categories.creativeProfessional.services.photography.description'), icon: <Camera className="h-5 w-5" /> },
        { name: t('categories.creativeProfessional.services.eventPlanning.name'), description: t('categories.creativeProfessional.services.eventPlanning.description'), icon: <Calendar className="h-5 w-5" /> },
        { name: t('categories.creativeProfessional.services.itSupport.name'), description: t('categories.creativeProfessional.services.itSupport.description'), icon: <Monitor className="h-5 w-5" /> },
        { name: t('categories.creativeProfessional.services.graphicDesign.name'), description: t('categories.creativeProfessional.services.graphicDesign.description'), icon: <Palette className="h-5 w-5" /> }
      ]
    },
    {
      id: "auto-mobile",
      title: t('categories.autoMobile.title'),
      description: t('categories.autoMobile.description'),
      icon: <Car className="h-8 w-8 text-primary" />,
      services: [
        { name: t('categories.autoMobile.services.autoRepair.name'), description: t('categories.autoMobile.services.autoRepair.description'), icon: <Car className="h-5 w-5" /> },
        { name: t('categories.autoMobile.services.motorcycleRepair.name'), description: t('categories.autoMobile.services.motorcycleRepair.description'), icon: <Car className="h-5 w-5" /> },
        { name: t('categories.autoMobile.services.mobileTechnician.name'), description: t('categories.autoMobile.services.mobileTechnician.description'), icon: <Smartphone className="h-5 w-5" /> },
        { name: t('categories.autoMobile.services.delivery.name'), description: t('categories.autoMobile.services.delivery.description'), icon: <Package className="h-5 w-5" /> }
      ]
    },
    {
      id: "supplies-distribution",
      title: t('categories.suppliesDistribution.title'),
      description: t('categories.suppliesDistribution.description'),
      icon: <Package2 className="h-8 w-8 text-primary" />,
      services: [
        { name: t('categories.suppliesDistribution.services.cleaningSupplies.name'), description: t('categories.suppliesDistribution.services.cleaningSupplies.description'), icon: <Sparkles className="h-5 w-5" /> },
        { name: t('categories.suppliesDistribution.services.pestControlChemicals.name'), description: t('categories.suppliesDistribution.services.pestControlChemicals.description'), icon: <Bug className="h-5 w-5" /> },
        { name: t('categories.suppliesDistribution.services.toolsEquipment.name'), description: t('categories.suppliesDistribution.services.toolsEquipment.description'), icon: <ToolWrench className="h-5 w-5" /> },
        { name: t('categories.suppliesDistribution.services.plumbingElectrical.name'), description: t('categories.suppliesDistribution.services.plumbingElectrical.description'), icon: <Droplets className="h-5 w-5" /> },
        { name: t('categories.suppliesDistribution.services.paintsMaterials.name'), description: t('categories.suppliesDistribution.services.paintsMaterials.description'), icon: <PaintBucket className="h-5 w-5" /> },
        { name: t('categories.suppliesDistribution.services.starterKits.name'), description: t('categories.suppliesDistribution.services.starterKits.description'), icon: <Package2 className="h-5 w-5" /> }
      ]
    }
  ];

  const stats = [
    { number: "50+", label: t('stats.serviceCategories') },
    { number: "10,000+", label: t('stats.verifiedProviders') },
    { number: "100+", label: t('stats.citiesCovered') },
    { number: "99.8%", label: t('stats.successRate') }
  ];

  const benefits = [
    {
      icon: <Shield className="h-10 w-10 text-primary" />,
      title: t('benefits.verifiedInsured.title'),
      description: t('benefits.verifiedInsured.description')
    },
    {
      icon: <Clock className="h-10 w-10 text-primary" />,
      title: t('benefits.availability.title'),
      description: t('benefits.availability.description')
    },
    {
      icon: <Star className="h-10 w-10 text-primary" />,
      title: t('benefits.qualityGuaranteed.title'),
      description: t('benefits.qualityGuaranteed.description')
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: t('benefits.localExperts.title'),
      description: t('benefits.localExperts.description')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Star className="w-4 h-4 mr-2" />
              50+ {t('stats.serviceCategories')}
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold font-headline mb-8 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-12">
              {t('subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg shadow-glow hover:shadow-glow/50 transition-all duration-300">
                <Link href="/signup">
                  {t('bookAService')} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Link href="/providers">
                  {t('becomeAProvider')}
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
            <h2 className="text-4xl font-bold font-headline mb-6">{t('serviceCategories')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('serviceCategoriesDescription')}
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto space-y-16">
            {serviceCategories.map((category) => (
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
            <h2 className="text-4xl font-bold font-headline mb-6">{t('whyChooseUs')}</h2>
            <p className="text-lg text-muted-foreground">
              {t('whyChooseUsDescription')}
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
                <CardTitle className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('readyToGetStarted')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center pb-8">
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                  {t('readyToGetStartedDescription')}
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button asChild size="lg" className="h-12 px-8 shadow-glow hover:shadow-glow/50 transition-all duration-300">
                    <Link href="/signup">
                      {t('bookAService')} <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 px-8 border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                    <Link href="/providers">
                      {t('becomeAProvider')}
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
