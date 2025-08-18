
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

const SuccessTips = () => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-accent hover:bg-accent/90"
      >
        <Lightbulb className="h-6 w-6" />
        <span className="sr-only">Tips for Success</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-80 mb-2">
      <div className="grid gap-4">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Tips for Success</h4>
          <p className="text-sm text-muted-foreground">
            Maximize your opportunities on LocalPro.
          </p>
        </div>
        <ul className="space-y-3">
            <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">Be punctual and respectful</span>
            </li>
             <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">Bring your own tools (if possible)</span>
            </li>
             <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">Keep your phone ready — jobs move fast</span>
            </li>
             <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">Ask for a review after each job</span>
            </li>
             <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">Build your rating = Get more jobs!</span>
            </li>
        </ul>
      </div>
    </PopoverContent>
  </Popover>
);

const EmergencyHotlineButton = () => (
  <Button
    asChild
    size="icon"
    className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
  >
    <a href="tel:911">
      <Phone className="h-6 w-6" />
      <span className="sr-only">Call Emergency Hotline</span>
    </a>
  </Button>
);


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, userRole, subscription } = useAuth();
  const { toast } = useToast();
  const { setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Success", description: "Logged out successfully." });
      window.location.href = '/login'; // Force a full page reload to avoid fetch errors
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
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
          <p>Loading your experience...</p>
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

  const isPaidSubscriber = subscription?.status === 'active' && subscription.planId !== 'free';
  const isProOrElite = isPaidSubscriber && (subscription?.planId === 'pro' || subscription?.planId === 'elite');
  const isElite = isPaidSubscriber && subscription?.planId === 'elite';
  const isAgencyPaidSubscriber = userRole === 'agency' && isPaidSubscriber;
  
  const dashboardPath = userRole === 'admin' ? '/admin/dashboard' : '/dashboard';

  const getPageTitle = (path: string) => {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return "Dashboard";
    const lastPart = parts[parts.length - 1];
    // Handle UUIDs in paths like /bookings/[bookingId]/work-log
    if (parts.includes('bookings') && lastPart === 'work-log') return "Work Log";
    if (parts.includes('my-job-posts') && lastPart === 'applicants') return "Applicants";
    if (parts.includes('providers')) return "Provider Profile";
    if (parts.includes('jobs')) return "Job Details";

    return lastPart.replace(/-/g, ' ');
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between">
            <Logo />
            <div className="group-data-[collapsible=icon]:hidden">
              <SidebarTrigger />
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive(dashboardPath)}>
                <Link href={dashboardPath}>
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            {(userRole !== 'admin') && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/calendar")}>
                    <Link href="/calendar">
                      <Calendar />
                      <span>Calendar</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/bookings")}>
                    <Link href="/bookings">
                      <Briefcase />
                      <span>Bookings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/messages")}>
                    <Link href="/messages">
                      <MessageSquare />
                      <span>Messages</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
            
            {(userRole === 'provider' || userRole === 'agency') && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/subscription")}>
                    <Link href="/subscription">
                      <Star />
                      <span>Subscription</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {userRole === 'agency' && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/manage-providers")}>
                        <Link href="/manage-providers">
                          <Users2 />
                          <span>Manage Providers</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/reports")}>
                        <Link href="/reports">
                          <FilePieChart />
                          <span>Reports</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}

                {userRole === 'provider' && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/services")}>
                        <Link href="/services">
                          <BriefcaseBusiness />
                          <span>My Services</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}


                {isPaidSubscriber && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/smart-rate")}>
                      <Link href="/smart-rate">
                        <Sparkles />
                        <span>Smart Rate</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {isProOrElite && (
                   <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/invoices")}>
                        <Link href="/invoices">
                          <FileText />
                          <span>Invoices</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
                 {isPaidSubscriber && (userRole === 'provider' || userRole === 'agency') && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/earnings")}>
                        <Link href="/earnings">
                          <DollarSign />
                          <span>Earnings</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
                {isElite && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/quote-builder")}>
                        <Link href="/quote-builder">
                          <Calculator />
                          <span>Quote Builder</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={isActive("/analytics")}>
                        <Link href="/analytics">
                          <BarChart2 />
                          <span>Analytics</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </>
            )}

             {userRole === 'admin' && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/users")}>
                    <Link href="/admin/users">
                      <Users2 />
                      <span>Users</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/conversations")}>
                    <Link href="/admin/conversations">
                      <MessageSquare />
                      <span>Conversations</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/tickets")}>
                    <Link href="/admin/tickets">
                      <LifeBuoy />
                      <span>Support Tickets</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/broadcast")}>
                    <Link href="/admin/broadcast">
                      <Radio />
                      <span>Broadcast</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/ads")}>
                    <Link href="/admin/ads">
                      <Megaphone />
                      <span>Ad Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/bookings")}>
                    <Link href="/admin/bookings">
                      <Briefcase />
                      <span>Bookings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/jobs")}>
                    <Link href="/admin/jobs">
                      <BriefcaseBusiness />
                      <span>Job Posts</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/moderation")}>
                    <Link href="/admin/moderation">
                      <Flag />
                      <span>Moderation</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/payouts")}>
                    <Link href="/admin/payouts">
                      <Wallet />
                      <span>Payouts</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/transactions")}>
                    <Link href="/admin/transactions">
                      <Receipt />
                      <span>Transactions</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/reports")}>
                    <Link href="/admin/reports">
                      <FilePieChart />
                      <span>Platform Reports</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/client-reports")}>
                    <Link href="/admin/client-reports">
                      <Users />
                      <span>Client Reports</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/backup")}>
                    <Link href="/admin/backup">
                      <DatabaseBackup />
                      <span>Data Backup</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/security-logs")}>
                    <Link href="/admin/security-logs">
                      <Shield />
                      <span>Security Logs</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/subscriptions")}>
                    <Link href="/admin/subscriptions">
                      <Star />
                      <span>Subscriptions</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/categories")}>
                    <Link href="/admin/categories">
                      <Shapes />
                      <span>Categories</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/rewards")}>
                    <Link href="/admin/rewards">
                      <Gift />
                      <span>Rewards</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/settings")}>
                    <Link href="/admin/settings">
                      <Settings />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
              )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
         <header className="flex h-16 items-center justify-between border-b px-6 sticky top-0 bg-background/95 z-40">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          <div className="flex-1 text-center font-semibold text-lg md:text-left capitalize">
            {getPageTitle(pathname)}
          </div>
           <div className="flex items-center gap-4">
            {userRole === 'provider' && (
              <Button asChild variant="secondary">
                <Link href="/jobs">
                  <Search className="mr-2" />
                  <span>Find Jobs</span>
                </Link>
              </Button>
            )}
            {(userRole === 'client' || userRole === 'agency') && (
              <Button asChild>
                <Link href="/post-a-job">
                  <PlusCircle className="mr-2" />
                  <span>Post a Job</span>
                </Link>
              </Button>
            )}
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={user.photoURL || ''} alt="User avatar" />
                    <AvatarFallback>{getAvatarFallback(user.displayName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.displayName || 'User'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                  <Link href="/billing">
                    <Receipt className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </Link>
                </DropdownMenuItem>

                {userRole === 'provider' && (
                   <DropdownMenuItem asChild>
                      <Link href="/applied-jobs">
                        <CheckSquare className="mr-2 h-4 w-4" />
                        <span>Applied Jobs</span>
                      </Link>
                    </DropdownMenuItem>
                )}

                {(userRole === 'client' || userRole === 'agency') && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/my-job-posts">
                        <Briefcase className="mr-2 h-4 w-4" />
                        <span>My Job Posts</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-favorites">
                        <Heart className="mr-2 h-4 w-4" />
                        <span>My Favorites</span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <BroadcastBanner />
        <main className="flex-1 p-6 relative">
            {children}
            <EmergencyHotlineButton />
            {(userRole === 'provider' || userRole === 'agency') && <SuccessTips />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
