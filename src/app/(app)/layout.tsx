
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const Logo = () => (
  <h1 className="text-2xl font-bold font-headline text-primary pl-2 group-data-[collapsible=icon]:hidden">
    Lingkod<span className="text-accent">PH</span>
  </h1>
);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, userRole, subscription } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Success", description: "Logged out successfully." });
      router.push('/login');
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

  const isActive = (path: string) => pathname === path;
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
              <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/bookings")}>
                <Link href="/bookings">
                  <Calendar />
                  <span>Bookings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            {(userRole === 'provider' || userRole === 'agency') && (
               <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/calendar")}>
                    <Link href="/calendar">
                      <Calendar />
                      <span>Calendar</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            )}

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive("/messages")}>
                <Link href="/messages">
                  <MessageSquare />
                  <span>Messages</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
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
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/manage-providers")}>
                      <Link href="/manage-providers">
                        <Users2 />
                        <span>Manage Providers</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {userRole === 'provider' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/services")}>
                      <Link href="/services">
                        <BriefcaseBusiness />
                        <span>My Services</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
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
                 {isPaidSubscriber && userRole === 'provider' && (
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
        <header className="flex h-16 items-center justify-between border-b px-6">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          <div className="flex-1 text-center font-semibold text-lg md:text-left capitalize">
            {/* Page title can be dynamic here */}
            {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
          </div>
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
        </header>
        <main className="flex-1 p-6 bg-secondary">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
