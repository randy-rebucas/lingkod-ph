
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  User,
  Sparkles,
  DollarSign,
  Settings,
  LogOut,
  BriefcaseBusiness,
  Star,
  FileText,
  Calculator,
  BarChart2,
  Users2,
  Moon,
  Sun,
  FilePieChart,
  Lightbulb,
  Check,
  PlusCircle,
  Briefcase,
  Heart,
  Search,
  CheckSquare,
  Phone,
  Megaphone,
  Flag,
  Wallet,
  Shapes,
  Gift,
  Receipt,
  Radio,
  TrendingUp,
  DatabaseBackup,
  Shield,
  LifeBuoy,
  Users,
  Handshake,
  Bell,
  Tag,
  CreditCard,
  Layers,
  Award,
  HardDrive,
  Link as LinkIcon,
  Target,
  Activity,
  TrendingDown,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/notification-bell";
import { useTheme } from "next-themes";
import BroadcastBanner from "@/components/broadcast-banner";
import { Logo } from "@/components/logo";
import { SupportChat } from "@/components/support-chat";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  hasActiveSubscription, 
  canAccessFeature, 
  canAccessAgencyFeature,
  canManageProviders,
  getSubscriptionTier 
} from "@/lib/subscription-utils";

const SubscriptionPaymentBadge = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const { userRole } = useAuth();

  useEffect(() => {
    if (userRole !== 'admin') return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, "subscriptionPayments"),
        where("status", "==", "pending_verification")
      ),
      (snapshot) => {
        setPendingCount(snapshot.size);
      }
    );

    return () => unsubscribe();
  }, [userRole]);

  if (pendingCount === 0) return null;

  return (
    <Badge variant="destructive" className="ml-auto text-xs">
      {pendingCount}
    </Badge>
  );
};

const SidebarSupportChat = () => {
  const t = useTranslations('AppLayout');
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <SidebarMenuButton className="w-full justify-start gap-3 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group">
          <MessageSquare className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="group-data-[collapsible=icon]:hidden font-medium">Support Chat</span>
        </SidebarMenuButton>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 flex flex-col h-[60vh] shadow-glow border-0 bg-background/95 backdrop-blur-md" side="right" align="start">
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100">
          <h4 className="font-semibold text-center text-gray-900">AI Assistant</h4>
        </div>
        <div className="flex-1 p-4">
          <div className="text-center text-gray-600 text-sm p-4">
            Ask me anything about the platform!
          </div>
        </div>
        <div className="p-4 border-t bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="w-full flex gap-2">
            <input
              type="text"
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
            />
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
              <MessageSquare className="h-4 w-4"/>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const SuccessTips = () => {
  const t = useTranslations('AppLayout');
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <SidebarMenuButton className="w-full justify-start gap-3 hover:bg-yellow-50 hover:text-yellow-700 transition-all duration-200 group">
          <Lightbulb className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="group-data-[collapsible=icon]:hidden font-medium">{t('tipsForSuccess')}</span>
        </SidebarMenuButton>
      </PopoverTrigger>
      <PopoverContent className="w-80 shadow-glow border-0 bg-background/95 backdrop-blur-md" side="right" align="start">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold leading-none text-gray-900">{t('tipsForSuccess')}</h4>
            <p className="text-sm text-gray-600">
              {t('maximizeOpportunities')}
            </p>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700">Be punctual and respectful</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700">Bring your own tools (if possible)</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700">Keep your phone ready — jobs move fast</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700">Ask for a review after each job</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700">Build your rating = Get more jobs!</span>
            </li>
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const EmergencyHotlineButton = () => {
  const t = useTranslations('AppLayout');
  
  return (
    <SidebarMenuButton asChild className="w-full justify-start gap-3 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group">
      <a href="tel:911" className="flex items-center gap-3 w-full">
        <Phone className="h-5 w-5 group-hover:scale-110 transition-transform" />
        <span className="group-data-[collapsible=icon]:hidden font-medium">{t('emergencyHotline')}</span>
      </a>
    </SidebarMenuButton>
  );
};

// Helper component for subscription-locked menu items
const SubscriptionLockedMenuItem = ({ 
  href, 
  icon: Icon, 
  children, 
  requiredFeature, 
  requiredPlan,
  className = ""
}: {
  href: string;
  icon: any;
  children: React.ReactNode;
  requiredFeature?: 'smart-rate' | 'invoices' | 'analytics' | 'quote-builder' | 'enhanced-profile' | 'top-placement';
  requiredPlan?: string;
  className?: string;
}) => {
  const { subscription, userRole } = useAuth();
  const pathname = usePathname();
  const isActive = (path: string) => pathname.startsWith(path);
  
  const canAccess = requiredFeature 
    ? canAccessFeature(subscription, requiredFeature)
    : requiredPlan 
    ? hasActiveSubscription(subscription) && subscription?.planId === requiredPlan
    : true;

  if (!canAccess) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton 
          asChild 
          isActive={isActive(href)} 
          className={`hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg opacity-60 ${className}`}
        >
          <Link href="/subscription" className="flex items-center gap-3 px-3 py-2">
            <Icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">{children}</span>
            <Star className="h-4 w-4 text-yellow-500 ml-auto" />
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        asChild 
        isActive={isActive(href)} 
        className={`hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg ${className}`}
      >
        <Link href={href} className="flex items-center gap-3 px-3 py-2">
          <Icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">{children}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, userRole, subscription } = useAuth();
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const t = useTranslations('AppLayout');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: t('success'), description: t('loggedOutSuccessfully') });
      window.location.href = '/login'; // Force a full page reload to avoid fetch errors
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('logoutFailed'),
        description: error.message,
      });
    }
  };

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo />
          <p>{t('loading')}</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null; // or a redirect component
  }

  const isActive = (path: string) => pathname.startsWith(path);
  const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Use subscription utility functions for consistent logic
  const isPaidSubscriber = hasActiveSubscription(subscription);
  const subscriptionTier = getSubscriptionTier(subscription);
  
  // Provider subscription logic
  const isProviderPro = userRole === 'provider' && subscriptionTier === 'pro';
  const isProviderElite = userRole === 'provider' && subscriptionTier === 'elite';
  const isProviderPaid = userRole === 'provider' && isPaidSubscriber;
  
  // Agency subscription logic
  const isAgencyLite = userRole === 'agency' && subscriptionTier === 'lite';
  const isAgencyPro = userRole === 'agency' && subscriptionTier === 'pro';
  const isAgencyCustom = userRole === 'agency' && subscriptionTier === 'custom';
  const isAgencyPaid = userRole === 'agency' && isPaidSubscriber;
  
  // Legacy variables for backward compatibility
  const isProOrElite = isProviderPro || isProviderElite || isAgencyPaid;
  const isElite = isProviderElite;
  const isAgencyPaidSubscriber = isAgencyPaid;
  
  const dashboardPath = userRole === 'admin' ? '/admin/dashboard' : userRole === 'partner' ? '/partners/dashboard' : '/dashboard';

  const getPageTitle = (path: string) => {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return "Dashboard";
    const lastPart = parts[parts.length - 1];
    if (parts.includes('partners') && lastPart === 'dashboard') return "Partners Dashboard";
    if (parts.includes('bookings') && lastPart === 'work-log') return "Work Log";
    if (parts.includes('my-job-posts') && lastPart === 'applicants') return "Applicants";
    if (parts.includes('providers')) return "Provider Profile";
    if (parts.includes('jobs')) return "Job Details";
    if (parts.includes('broadcast')) return "Broadcast Center";

    return lastPart.replace(/-/g, ' ');
  }

  return (
    <SidebarProvider>
      <Sidebar className="border-r-0 bg-background/80 backdrop-blur-md shadow-soft">
        <SidebarHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20 p-6">
          <div className="flex items-center justify-between">
            <Logo />
            <div className="group-data-[collapsible=icon]:hidden">
              <SidebarTrigger className="hover:bg-primary/10 transition-colors" />
            </div>
          </div>
          {/* Subscription Status Indicator */}
          {(userRole === 'provider' || userRole === 'agency') && (
            <div className="mt-4 px-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Plan:</span>
                <Badge 
                  variant={subscriptionTier === 'free' ? 'secondary' : 'default'}
                  className="text-xs"
                >
                  {subscriptionTier === 'free' ? 'Free' : subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}
                </Badge>
              </div>
            </div>
          )}
        </SidebarHeader>
        <SidebarContent className="px-4">
          <div className="space-y-6">
            {/* Home & Overview */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                Overview
              </h3>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive(dashboardPath) && (pathname === dashboardPath)} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                    <Link href={dashboardPath} className="flex items-center gap-3 px-3 py-2">
                      <LayoutDashboard className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>

            {/* Work & Services */}
            {(userRole !== 'admin' && userRole !== 'partner') && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  {userRole === 'client' ? 'My Services' : 'Work & Jobs'}
                </h3>
                <SidebarMenu>
                  {userRole === 'provider' && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/jobs")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                        <Link href="/jobs" className="flex items-center gap-3 px-3 py-2">
                          <Search className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Find Work</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {userRole === 'provider' && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/applied-jobs")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                        <Link href="/applied-jobs" className="flex items-center gap-3 px-3 py-2">
                          <CheckSquare className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Applied Jobs</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {(userRole === 'client' || userRole === 'agency') && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/my-job-posts")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                        <Link href="/my-job-posts" className="flex items-center gap-3 px-3 py-2">
                          <BriefcaseBusiness className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">My Job Posts</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {(userRole === 'client' || userRole === 'agency') && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/my-favorites")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                        <Link href="/my-favorites" className="flex items-center gap-3 px-3 py-2">
                          <Heart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">My Favorites</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/bookings")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/bookings" className="flex items-center gap-3 px-3 py-2">
                        <Briefcase className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">
                          {userRole === 'client' ? 'My Bookings' : 'My Jobs'}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/calendar")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/calendar" className="flex items-center gap-3 px-3 py-2">
                        <Calendar className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Schedule</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}

            {/* Communication */}
            {(userRole !== 'admin' && userRole !== 'partner') && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  Communication
                </h3>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/messages")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/messages" className="flex items-center gap-3 px-3 py-2">
                        <MessageSquare className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Messages</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/notifications")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/notifications" className="flex items-center gap-3 px-3 py-2">
                        <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Notifications</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}
            
            {/* Business Tools */}
            {(userRole === 'provider' || userRole === 'agency') && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  Business Tools
                </h3>
                <SidebarMenu>
                  {userRole === 'provider' && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/services")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                        <Link href="/services" className="flex items-center gap-3 px-3 py-2">
                          <BriefcaseBusiness className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">My Services</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {/* Agency team management - requires paid subscription */}
                  {userRole === 'agency' && (
                    <SubscriptionLockedMenuItem
                      href="/manage-providers"
                      icon={Users2}
                      requiredPlan="lite"
                    >
                      My Team
                    </SubscriptionLockedMenuItem>
                  )}

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/subscription")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/subscription" className="flex items-center gap-3 px-3 py-2">
                        <Star className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">
                          {isPaidSubscriber ? 'Manage Plan' : 'Upgrade Plan'}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}

            {/* Earnings & Analytics */}
            {(userRole === 'provider' || userRole === 'agency') && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  Earnings & Reports
                </h3>
                <SidebarMenu>
                  {/* Earnings tracking - requires paid subscription */}
                  <SubscriptionLockedMenuItem
                    href="/earnings"
                    icon={DollarSign}
                    requiredPlan="pro"
                  >
                    Earnings
                  </SubscriptionLockedMenuItem>

                  {/* Invoices - requires Pro or Elite subscription */}
                  <SubscriptionLockedMenuItem
                    href="/invoices"
                    icon={FileText}
                    requiredFeature="invoices"
                  >
                    Invoices
                  </SubscriptionLockedMenuItem>

                  {/* Agency reports - requires paid subscription */}
                  {userRole === 'agency' && (
                    <SubscriptionLockedMenuItem
                      href="/reports"
                      icon={FilePieChart}
                      requiredPlan="lite"
                    >
                      Reports
                    </SubscriptionLockedMenuItem>
                  )}
                </SidebarMenu>
              </div>
            )}


            {/* Premium Features */}
            {(userRole === 'provider' || userRole === 'agency') && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  Premium Features
                </h3>
                <SidebarMenu>
                  {/* Smart Rate - requires paid subscription */}
                  <SubscriptionLockedMenuItem
                    href="/smart-rate"
                    icon={Sparkles}
                    requiredFeature="smart-rate"
                  >
                    Smart Pricing
                  </SubscriptionLockedMenuItem>

                  {/* Quote Builder - requires Pro or Elite subscription */}
                  <SubscriptionLockedMenuItem
                    href="/quote-builder"
                    icon={Calculator}
                    requiredFeature="quote-builder"
                  >
                    Quote Builder
                  </SubscriptionLockedMenuItem>

                  {/* Analytics - requires Elite subscription */}
                  <SubscriptionLockedMenuItem
                    href="/analytics"
                    icon={BarChart2}
                    requiredFeature="analytics"
                  >
                    Analytics
                  </SubscriptionLockedMenuItem>
                </SidebarMenu>
              </div>
            )}

            {/* Partner Panel */}
            {userRole === 'partner' && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  Partner Management
                </h3>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/partners/analytics")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/partners/analytics" className="flex items-center gap-3 px-3 py-2">
                        <BarChart2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/partners/commission-management")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/partners/commission-management" className="flex items-center gap-3 px-3 py-2">
                        <DollarSign className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Commission Management</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/partners/referral-tracking")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/partners/referral-tracking" className="flex items-center gap-3 px-3 py-2">
                        <LinkIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Referral Tracking</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/partners/performance-metrics")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/partners/performance-metrics" className="flex items-center gap-3 px-3 py-2">
                        <Target className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Performance Metrics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/partners/conversion-analytics")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/partners/conversion-analytics" className="flex items-center gap-3 px-3 py-2">
                        <Activity className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Conversion Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/partners/monthly-statistics")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/partners/monthly-statistics" className="flex items-center gap-3 px-3 py-2">
                        <TrendingDown className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Monthly Statistics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/partners/growth-metrics")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/partners/growth-metrics" className="flex items-center gap-3 px-3 py-2">
                        <TrendingUp className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Growth Metrics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}

            {/* Admin Panel */}
            {userRole === 'admin' && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  Platform Management
                </h3>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/users")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2">
                        <Users2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Users</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/bookings")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/bookings" className="flex items-center gap-3 px-3 py-2">
                        <Briefcase className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Bookings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/jobs")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/jobs" className="flex items-center gap-3 px-3 py-2">
                        <BriefcaseBusiness className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Job Posts</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/categories")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/categories" className="flex items-center gap-3 px-3 py-2">
                        <Tag className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Categories</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/subscriptions")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/subscriptions" className="flex items-center gap-3 px-3 py-2">
                        <CreditCard className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Subscriptions</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/payouts")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/payouts" className="flex items-center gap-3 px-3 py-2">
                        <Wallet className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Payouts</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/subscription-payments")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/subscription-payments" className="flex items-center gap-3 px-3 py-2">
                        <CheckSquare className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Subscription Payments</span>
                        <SubscriptionPaymentBadge />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}

            {userRole === 'admin' && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  Support & Moderation
                </h3>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/tickets")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/tickets" className="flex items-center gap-3 px-3 py-2">
                        <LifeBuoy className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Support Tickets</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/conversations")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/conversations" className="flex items-center gap-3 px-3 py-2">
                        <MessageSquare className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Messages</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/moderation")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/moderation" className="flex items-center gap-3 px-3 py-2">
                        <Flag className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Moderation</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}

            {userRole === 'admin' && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  Reports & Analytics
                </h3>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/reports")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/reports" className="flex items-center gap-3 px-3 py-2">
                        <FilePieChart className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Platform Reports</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/client-reports")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/client-reports" className="flex items-center gap-3 px-3 py-2">
                        <Users className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Client Reports</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/transactions")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/transactions" className="flex items-center gap-3 px-3 py-2">
                        <Receipt className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Transactions</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}

            {userRole === 'admin' && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  Content & Marketing
                </h3>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/broadcast")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/broadcast" className="flex items-center gap-3 px-3 py-2">
                        <Megaphone className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Broadcast</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/ads")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/ads" className="flex items-center gap-3 px-3 py-2">
                        <Radio className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Ads</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/rewards")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/rewards" className="flex items-center gap-3 px-3 py-2">
                        <Award className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Rewards</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}

            {userRole === 'admin' && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">
                  System Settings
                </h3>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/settings")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2">
                        <Settings className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/security-logs")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/security-logs" className="flex items-center gap-3 px-3 py-2">
                        <Shield className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Security</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/backup")} className="hover:bg-primary/10 hover:text-primary transition-all duration-200 group rounded-lg">
                      <Link href="/admin/backup" className="flex items-center gap-3 px-3 py-2">
                        <HardDrive className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Backup</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            )}
          </div>
        </SidebarContent>
        <SidebarFooter className="border-t border-border/50 bg-gradient-to-r from-background/50 to-muted/20 p-4">
          <SidebarMenu>
            {userRole !== 'admin' && (
              <SidebarMenuItem>
                <SidebarSupportChat />
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <EmergencyHotlineButton />
            </SidebarMenuItem>
            {(userRole === 'provider' || userRole === 'agency') && (
              <SidebarMenuItem>
                <SuccessTips />
              </SidebarMenuItem>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={handleLogout}
                className="w-full justify-start gap-3 hover:bg-red-50 hover:text-red-700 transition-all duration-200 font-medium group"
              >
                <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="group-data-[collapsible=icon]:hidden">{t('logout')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
         <header className="flex h-16 items-center justify-between border-b border-border/50 px-6 sticky top-0 bg-background/80 backdrop-blur-md z-40 shadow-soft">
          <div className="md:hidden">
            <SidebarTrigger className="hover:bg-primary/10 transition-colors" />
          </div>
          <div className="flex-1 text-center font-headline text-xl md:text-left capitalize bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {getPageTitle(pathname)}
          </div>
           <div className="flex items-center gap-4">
            {userRole === 'provider' && (
              <Button asChild variant="secondary" className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">
                <Link href="/jobs" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span>{t('findJobs')}</span>
                </Link>
              </Button>
            )}
            {(userRole === 'client' || userRole === 'agency') && (
              <Button asChild className="shadow-glow hover:shadow-glow/50 transition-all duration-300">
                <Link href="/post-a-job" className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span>{t('postAJob')}</span>
                </Link>
              </Button>
            )}
            <NotificationBell />
            <Button asChild variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors">
              <Link href="/help-center">
                <LifeBuoy className="h-5 w-5" />
                <span className="sr-only">{t('helpCenter')}</span>
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">{t('toggleTheme')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  {t('light')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  {t('dark')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  {t('system')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-primary/10 transition-colors">
                  <Avatar className="border-2 border-primary/20 shadow-soft">
                    <AvatarImage src={user.photoURL || ''} alt="User avatar" />
                    <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium">{getAvatarFallback(user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="shadow-glow border-0 bg-background/95 backdrop-blur-md">
                <DropdownMenuLabel className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{user.displayName || 'User'}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem asChild>
                  <Link href={'/profile'}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('profile')}</span>
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/billing">
                    <Receipt className="mr-2 h-4 w-4" />
                    <span>{t('billing')}</span>
                  </Link>
                </DropdownMenuItem>

                {userRole === 'provider' && (
                   <DropdownMenuItem asChild>
                      <Link href="/applied-jobs">
                        <CheckSquare className="mr-2 h-4 w-4" />
                        <span>{t('appliedJobs')}</span>
                      </Link>
                    </DropdownMenuItem>
                )}

                {(userRole === 'client' || userRole === 'agency') && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/my-job-posts">
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>{t('myJobPosts')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-favorites">
                        <Heart className="mr-2 h-4 w-4" />
                        <span>{t('myFavorites')}</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t('settings')}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('logOut')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <BroadcastBanner />
        <main className="flex-1 p-6 relative bg-gradient-to-br from-background via-background to-muted/20 min-h-screen">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
