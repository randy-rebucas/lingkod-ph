
"use client";

import * as React from "react";
import { useTranslations } from 'next-intl';
import {
  MoreHorizontal,
  UserPlus,
  Users,
  AlertCircle,
  Loader2,
  Trash2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Calendar,
  Target,
  Award,
  Zap,
  Eye,
  Settings,
  RefreshCw,
  Share2,
  Bell,
  Activity,
  MapPin,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calculator,
  Receipt,
  CreditCard,
  Banknote,
  PiggyBank,
  TrendingUp as Growth,
  Percent,
  FileText,
  PieChart as ChartPie,
  Search,
  Mail,
  MessageSquare,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  BookCheck,
  Wallet,
  WalletCards,
  CheckCircle2,
  Hourglass,
  User,
  Shield,
  Crown,
  Briefcase,
  Building,
  Globe,
  Phone,
  MapPin as Location,
  Calendar as CalendarIcon,
  Edit,
  Copy,
  Send,
  Archive,
  Flag,
  AlertTriangle,
  Info,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus as MinusIcon
} from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { getDb  } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, addDoc, serverTimestamp, writeBatch, getDocs, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


type Provider = {
  id: string;
  displayName: string;
  email: string;
  status: "Active" | "Pending";
  avatar?: string;
  phone?: string;
  location?: string;
  joinDate?: Date;
  lastActive?: Date;
  totalEarnings?: number;
  completedJobs?: number;
  averageRating?: number;
  skills?: string[];
  bio?: string;
  availability?: "Available" | "Busy" | "Offline";
  role?: "Senior" | "Junior" | "Lead" | "Specialist";
  performance?: {
    rating: number;
    completionRate: number;
    responseTime: number;
    clientSatisfaction: number;
  };
};

const getStatusVariant = (status: Provider['status']) => {
  switch (status) {
    case "Active": return "secondary";
    case "Pending": return "outline";
    default: return "outline";
  }
};


export default function ManageProvidersPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('ManageProviders');
    const [providers, setProviders] = React.useState<Provider[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isInviteDialogOpen, setInviteDialogOpen] = React.useState(false);
    const [inviteEmail, setInviteEmail] = React.useState("");
    const [isInviting, setIsInviting] = React.useState(false);

    
    React.useEffect(() => {
        if (!user || userRole !== 'agency') {
            setLoading(false);
            return;
        }

        const providersQuery = query(collection(getDb(), "users"), where("agencyId", "==", user.uid));
        const invitesQuery = query(collection(getDb(), "invites"), where("agencyId", "==", user.uid), where("status", "==", "pending"));

        const unsubscribeProviders = onSnapshot(providersQuery, (snapshot) => {
            const activeProviders = snapshot.docs.map(doc => ({
                id: doc.id,
                displayName: doc.data().displayName,
                email: doc.data().email,
                status: "Active"
            } as Provider));
            
             setProviders(prev => [
                ...activeProviders,
                ...prev.filter(p => p.status !== 'Active')
            ]);
        });
        
        const unsubscribeInvites = onSnapshot(invitesQuery, (snapshot) => {
            const pendingProviders = snapshot.docs.map(doc => ({
                id: doc.id,
                displayName: "Invitation Sent",
                email: doc.data().email,
                status: "Pending",
            } as Provider));

            setProviders(prev => [
                ...prev.filter(p => p.status !== 'Pending'),
                ...pendingProviders
            ]);
            setLoading(false);
        });

        return () => {
            unsubscribeProviders();
            unsubscribeInvites();
        };
    }, [user, userRole]);
    
    const handleInviteProvider = async () => {
        if (!user || !inviteEmail || !getDb()) return;

        setIsInviting(true);
        try {
            const userQuery = query(collection(getDb(), "users"), where("email", "==", inviteEmail));
            const userSnapshot = await getDocs(userQuery);

            if (userSnapshot.empty) {
                toast({ variant: 'destructive', title: t('providerNotFound'), description: t('providerNotFoundDescription') });
                setIsInviting(false);
                return;
            }

            const providerDoc = userSnapshot.docs[0];
            const providerData = providerDoc.data();

            if (providerData.role !== 'provider') {
                toast({ variant: 'destructive', title: t('invalidUserRole'), description: t('invalidUserRoleDescription') });
                setIsInviting(false);
                return;
            }

            if (providerData.agencyId) {
                toast({ variant: 'destructive', title: t('alreadyInAgency'), description: t('alreadyInAgencyDescription') });
                setIsInviting(false);
                return;
            }

            const existingInviteQuery = query(collection(getDb(), "invites"), where("email", "==", inviteEmail), where("status", "==", "pending"));
            const inviteSnapshot = await getDocs(existingInviteQuery);

             if (!inviteSnapshot.empty) {
                 toast({ variant: 'destructive', title: t('invitePending'), description: t('invitePendingDescription') });
                 setIsInviting(false);
                return;
            }

            const batch = writeBatch(getDb());
            const inviteRef = doc(collection(getDb(), "invites"));
            batch.set(inviteRef, {
                agencyId: user.uid,
                agencyName: user.displayName,
                providerId: providerDoc.id,
                email: inviteEmail,
                status: "pending",
                createdAt: serverTimestamp(),
            });

            const providerNotifSettings = providerData.notificationSettings;
            if (providerNotifSettings?.agencyInvites !== false) {
                 const notificationRef = doc(collection(getDb(), `users/${providerDoc.id}/notifications`));
                batch.set(notificationRef, {
                    type: 'agency_invite',
                    message: `You have been invited to join ${user.displayName}.`,
                    link: '/profile',
                    read: false,
                    createdAt: serverTimestamp(),
                    inviteId: inviteRef.id,
                    agencyName: user.displayName,
                    agencyId: user.uid,
                });
            }

            await batch.commit();

            toast({ title: t('invitationSent'), description: t('invitationSentDescription', { email: inviteEmail }) });
            setInviteEmail("");
            setInviteDialogOpen(false);
        } catch (error) {
            console.error("Error inviting provider:", error);
            toast({ variant: 'destructive', title: t('error'), description: t('failedToSendInvitation') });
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveProvider = async (providerId: string, status: Provider['status']) => {
        if (!user || !getDb()) return;
        try {
            const batch = writeBatch(getDb());
            if (status === 'Active') {
                const providerRef = doc(getDb(), "users", providerId);
                batch.update(providerRef, { agencyId: null });
            } else { // Pending
                const inviteRef = doc(getDb(), "invites", providerId);
                batch.delete(inviteRef);
            }
            await batch.commit();
            toast({ title: t('success'), description: t('providerRemoved') });
        } catch(error) {
             console.error("Error removing provider:", error);
            toast({ variant: 'destructive', title: t('error'), description: t('failedToRemoveProvider') });
        }
    }

    const columns: ColumnDef<Provider>[] = [
      {
        accessorKey: "displayName",
        header: t('name'),
        cell: ({ row }) => <div className="font-medium">{row.getValue("displayName")}</div>,
      },
      {
        accessorKey: "email",
        header: t('email'),
        cell: ({ row }) => <div>{row.getValue("email")}</div>,
      },
      {
        accessorKey: "status",
        header: t('status'),
        cell: ({ row }) => (
          <Badge variant={getStatusVariant(row.getValue("status"))} className="capitalize">{row.getValue("status")}</Badge>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const provider = row.original;
          return (
             <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" /> {t('remove')}
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t('areYouSureRemove')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('removeProviderDescription')}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => handleRemoveProvider(provider.id, provider.status)}
                        className="bg-destructive hover:bg-destructive/80"
                    >
                        {t('confirmRemoval')}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          );
        },
      },
    ];

    const table = useReactTable({
        data: providers,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    if (userRole !== 'agency') {
        return (
             <div className="container space-y-8">
                 <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('agencyOnly')}</p>
                </div>
            </div>
        )
    }

    // Calculate analytics data
    const analyticsData = React.useMemo(() => {
        const activeProviders = providers.filter(p => p.status === 'Active').length;
        const pendingProviders = providers.filter(p => p.status === 'Pending').length;
        const totalEarnings = providers.reduce((sum, p) => sum + (p.totalEarnings || 0), 0);
        const totalJobs = providers.reduce((sum, p) => sum + (p.completedJobs || 0), 0);
        const averageRating = providers.length > 0 ? 
            providers.reduce((sum, p) => sum + (p.averageRating || 0), 0) / providers.length : 0;
        
        return {
            activeProviders,
            pendingProviders,
            totalEarnings,
            totalJobs,
            averageRating
        };
    }, [providers]);

    return (
      <div className="container space-y-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                  <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                  <p className="text-muted-foreground">
                      {t('subtitle')}
                  </p>
              </div>
              <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Advanced Management
                  </Badge>
                <Dialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
                                <UserPlus className="mr-2 h-4 w-4" />
                                {t('inviteProvider')}
                            </Button>
                        </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('inviteNewProvider')}</DialogTitle>
                            <DialogDescription>
                                {t('inviteDescription')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">{t('email')}</Label>
                                <Input 
                                    id="email"
                                    type="email"
                                    className="col-span-3"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline">{t('cancel')}</Button></DialogClose>
                            <Button onClick={handleInviteProvider} disabled={isInviting}>
                                {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                {t('sendInvite')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
          </div>
          </div>

          {/* Advanced Filter Controls */}
          <div className="max-w-6xl mx-auto">
              <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                          <Filter className="h-5 w-5" />
                          Advanced Filters
                      </CardTitle>
                      <CardDescription>Customize your provider management with advanced filtering options</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <div className="grid gap-4 md:grid-cols-4">
                          <div className="space-y-2">
                              <Label htmlFor="search">Search Providers</Label>
                              <div className="relative">
                                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                      placeholder="Search by name, email, or skills..."
                                      className="pl-10"
                                  />
                              </div>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="status">Status</Label>
                              <Select defaultValue="all">
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="all">All Providers</SelectItem>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="available">Available</SelectItem>
                                      <SelectItem value="busy">Busy</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="role">Role</Label>
                              <Select defaultValue="all">
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      <SelectItem value="all">All Roles</SelectItem>
                                      <SelectItem value="senior">Senior</SelectItem>
                                      <SelectItem value="junior">Junior</SelectItem>
                                      <SelectItem value="lead">Lead</SelectItem>
                                      <SelectItem value="specialist">Specialist</SelectItem>
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className="space-y-2">
                              <Label htmlFor="export">Export Options</Label>
                              <div className="flex gap-2">
                                  <Button variant="outline" size="sm">
                                      <Download className="h-4 w-4 mr-2" />
                                      PDF
                                  </Button>
                                  <Button variant="outline" size="sm">
                                      <Download className="h-4 w-4 mr-2" />
                                      Excel
                                  </Button>
                              </div>
                          </div>
                      </div>
                  </CardContent>
              </Card>
          </div>

          {/* Enhanced KPI Cards */}
          <div className="max-w-6xl mx-auto">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 group">
                      <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                              <div>
                                  <p className="text-sm text-muted-foreground">Active Providers</p>
                                  <p className="text-2xl font-bold">{analyticsData.activeProviders}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                      <UserCheck className="h-3 w-3 text-green-600" />
                                      <span className="text-xs text-green-600">Ready to work</span>
                                  </div>
                              </div>
                              <div className="p-3 rounded-full bg-green-100">
                                  <Users className="h-6 w-6 text-green-600" />
                              </div>
                          </div>
                      </CardContent>
                  </Card>
                  
                  <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 group">
                      <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                              <div>
                                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                                  <p className="text-2xl font-bold">₱{analyticsData.totalEarnings.toFixed(2)}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                      <TrendingUp className="h-3 w-3 text-blue-600" />
                                      <span className="text-xs text-blue-600">+12.5%</span>
                                  </div>
                              </div>
                              <div className="p-3 rounded-full bg-blue-100">
                                  <DollarSign className="h-6 w-6 text-blue-600" />
                              </div>
                          </div>
                      </CardContent>
                  </Card>
                  
                  <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 group">
                      <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                              <div>
                                  <p className="text-sm text-muted-foreground">Completed Jobs</p>
                                  <p className="text-2xl font-bold">{analyticsData.totalJobs}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                      <BookCheck className="h-3 w-3 text-purple-600" />
                                      <span className="text-xs text-purple-600">This month</span>
                                  </div>
                              </div>
                              <div className="p-3 rounded-full bg-purple-100">
                                  <BookCheck className="h-6 w-6 text-purple-600" />
                              </div>
                          </div>
                      </CardContent>
                  </Card>
                  
                  <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 group">
                      <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                              <div>
                                  <p className="text-sm text-muted-foreground">Avg. Rating</p>
                                  <p className="text-2xl font-bold">{analyticsData.averageRating.toFixed(1)}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                      <Star className="h-3 w-3 text-yellow-600" />
                                      <span className="text-xs text-yellow-600">Out of 5.0</span>
                                  </div>
                              </div>
                              <div className="p-3 rounded-full bg-yellow-100">
                                  <Star className="h-6 w-6 text-yellow-600" />
                              </div>
                          </div>
                      </CardContent>
                  </Card>
              </div>
          </div>

          <div className="max-w-6xl mx-auto">
              <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="overview" className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Overview
                      </TabsTrigger>
                      <TabsTrigger value="providers" className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Providers
                      </TabsTrigger>
                      <TabsTrigger value="performance" className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Performance
                      </TabsTrigger>
                      <TabsTrigger value="analytics" className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Analytics
                      </TabsTrigger>
                      <TabsTrigger value="insights" className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Insights
                      </TabsTrigger>
                  </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                  <OverviewTab providers={providers} analyticsData={analyticsData} />
              </TabsContent>
              
              <TabsContent value="providers" className="mt-6">
                  <ProvidersTab providers={providers} onRemoveProvider={handleRemoveProvider} />
              </TabsContent>
              
              <TabsContent value="performance" className="mt-6">
                  <PerformanceTab providers={providers} />
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-6">
                  <AnalyticsTab providers={providers} analyticsData={analyticsData} />
              </TabsContent>
              
              <TabsContent value="insights" className="mt-6">
                  <InsightsTab providers={providers} analyticsData={analyticsData} />
              </TabsContent>
              </Tabs>
          </div>
      </div>
    );
}

// Overview Tab Component
function OverviewTab({ providers, analyticsData }: { providers: Provider[], analyticsData: any }) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Provider Network Overview</CardTitle>
                        <CardDescription>Quick overview of your provider network</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                                <div>
                                    <p className="text-sm font-medium text-green-800">Active Providers</p>
                                    <p className="text-2xl font-bold text-green-600">{analyticsData.activeProviders}</p>
                                </div>
                                <Users className="h-8 w-8 text-green-600" />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <div>
                                    <p className="text-sm font-medium text-blue-800">Total Earnings</p>
                                    <p className="text-2xl font-bold text-blue-600">₱{analyticsData.totalEarnings.toFixed(2)}</p>
                                </div>
                                <DollarSign className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50 border border-purple-200">
                                <div>
                                    <p className="text-sm font-medium text-purple-800">Completed Jobs</p>
                                    <p className="text-2xl font-bold text-purple-600">{analyticsData.totalJobs}</p>
                                </div>
                                <BookCheck className="h-8 w-8 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
          
          <Card>
            <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest provider activities and updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {providers.slice(0, 5).map((provider, index) => (
                                <div key={provider.id} className="flex items-center gap-3 p-3 rounded-lg border">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>{provider.displayName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{provider.displayName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {provider.status === 'Active' ? 'Completed a job' : 'Invitation sent'}
                                        </p>
                                    </div>
                                    <Badge variant={provider.status === 'Active' ? 'secondary' : 'outline'}>
                                        {provider.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Providers Tab Component
function ProvidersTab({ providers, onRemoveProvider }: { providers: Provider[], onRemoveProvider: (id: string, status: Provider['status']) => void }) {
    const columns: ColumnDef<Provider>[] = [
        {
            accessorKey: "displayName",
            header: "Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{(row.getValue("displayName") as string).charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{row.getValue("displayName")}</div>
                        <div className="text-sm text-muted-foreground">{row.original.email}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge variant={getStatusVariant(row.getValue("status"))} className="capitalize">
                    {row.getValue("status")}
                </Badge>
            ),
        },
        {
            accessorKey: "totalEarnings",
            header: "Earnings",
            cell: ({ row }) => (
                <div className="text-right">
                    <div className="font-medium">₱{((row.getValue("totalEarnings") as number) || 0).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">{row.original.completedJobs || 0} jobs</div>
                </div>
            ),
        },
        {
            accessorKey: "averageRating",
            header: "Rating",
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{((row.getValue("averageRating") as number) || 0).toFixed(1)}</span>
                </div>
            ),
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const provider = row.original;
                return (
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Send Message
                                </DropdownMenuItem>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will remove the provider from your network.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={() => onRemoveProvider(provider.id, provider.status)}
                                    className="bg-destructive hover:bg-destructive/80"
                                >
                                    Confirm Removal
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                );
            },
        },
    ];

    const table = useReactTable({
        data: providers,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Provider Network</CardTitle>
                    <CardDescription>Manage your provider network and team members</CardDescription>
            </CardHeader>
             <CardContent>
                <div className="rounded-md border bg-card shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <Table>
                        <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                        header.column.columnDef.header,
                                        header.getContext()
                                        )}
                                </TableHead>
                                );
                            })}
                            </TableRow>
                        ))}
                        </TableHeader>
                        <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                    {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                    )}
                                </TableCell>
                                ))}
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-2"/>
                                            No providers yet
                                            <p className="text-muted-foreground">Start by inviting providers to your network</p>
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
          </Card>
      </div>
    );
}

// Performance Tab Component
function PerformanceTab({ providers }: { providers: Provider[] }) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Performers</CardTitle>
                        <CardDescription>Your best performing providers</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {providers.slice(0, 5).map((provider, index) => (
                                <div key={provider.id} className="flex items-center justify-between p-4 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium">{provider.displayName}</p>
                                            <p className="text-sm text-muted-foreground">{provider.completedJobs || 0} jobs completed</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">₱{(provider.totalEarnings || 0).toFixed(2)}</p>
                                        <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4 text-yellow-500" />
                                            <span className="text-sm">{(provider.averageRating || 0).toFixed(1)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Performance Metrics</CardTitle>
                        <CardDescription>Key performance indicators</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Average Rating</span>
                                    <span>4.2/5.0</span>
                                </div>
                                <Progress value={84} className="w-full" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Job Completion Rate</span>
                                    <span>96%</span>
                                </div>
                                <Progress value={96} className="w-full" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Response Time</span>
                                    <span>2.3 hours</span>
                                </div>
                                <Progress value={85} className="w-full" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Analytics Tab Component
function AnalyticsTab({ providers, analyticsData }: { providers: Provider[], analyticsData: any }) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Provider Distribution</CardTitle>
                        <CardDescription>Breakdown of your provider network</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                                <div className="flex items-center gap-3">
                                    <UserCheck className="h-6 w-6 text-green-600" />
                                    <div>
                                        <p className="font-medium text-green-800">Active Providers</p>
                                        <p className="text-sm text-green-600">{analyticsData.activeProviders} providers</p>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-green-600">{analyticsData.activeProviders}</div>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-6 w-6 text-yellow-600" />
                                    <div>
                                        <p className="font-medium text-yellow-800">Pending Invites</p>
                                        <p className="text-sm text-yellow-600">Awaiting response</p>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-yellow-600">{analyticsData.pendingProviders}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Earnings Summary</CardTitle>
                        <CardDescription>Financial performance overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="flex items-center gap-3">
                                    <DollarSign className="h-6 w-6 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-blue-800">Total Earnings</p>
                                        <p className="text-sm text-blue-600">All time</p>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-blue-600">₱{analyticsData.totalEarnings.toFixed(2)}</div>
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-purple-50 border border-purple-200">
                                <div className="flex items-center gap-3">
                                    <BookCheck className="h-6 w-6 text-purple-600" />
                                    <div>
                                        <p className="font-medium text-purple-800">Completed Jobs</p>
                                        <p className="text-sm text-purple-600">This month</p>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-purple-600">{analyticsData.totalJobs}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Insights Tab Component
function InsightsTab({ providers, analyticsData }: { providers: Provider[], analyticsData: any }) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Management Insights</CardTitle>
                        <CardDescription>AI-powered insights and recommendations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Alert>
                                <TrendingUp className="h-4 w-4" />
                                <AlertDescription>
                                    Your provider network has grown by {analyticsData.activeProviders} active providers. Consider expanding to new service areas.
                                </AlertDescription>
                            </Alert>
                            
                            <Alert>
                                <Target className="h-4 w-4" />
                                <AlertDescription>
                                    Your providers have completed {analyticsData.totalJobs} jobs with an average rating of {analyticsData.averageRating.toFixed(1)}. Great performance!
                                </AlertDescription>
                            </Alert>
                            
                            <Alert>
                                <Calculator className="h-4 w-4" />
                                <AlertDescription>
                                    Total earnings of ₱{analyticsData.totalEarnings.toFixed(2)} show strong financial performance. Consider setting higher targets.
                                </AlertDescription>
                            </Alert>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Optimization Tips</CardTitle>
                        <CardDescription>Strategies to improve your provider network</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                                    <span className="font-medium text-green-800">Network Expansion</span>
                                </div>
                                <p className="text-sm text-green-700">
                                    Consider recruiting more providers in high-demand service areas to increase capacity.
                                </p>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Star className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-800">Performance Training</span>
                                </div>
                                <p className="text-sm text-blue-700">
                                    Provide training sessions to help providers improve their skills and ratings.
                                </p>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="h-4 w-4 text-purple-600" />
                                    <span className="font-medium text-purple-800">Team Building</span>
                                </div>
                                <p className="text-sm text-purple-700">
                                    Organize team events to improve collaboration and provider satisfaction.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
      </div>
    );
}

    