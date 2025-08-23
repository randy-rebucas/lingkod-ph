
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
import { db } from "@/lib/firebase";
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


type Provider = {
  id: string;
  displayName: string;
  email: string;
  status: "Active" | "Pending";
};

const getStatusVariant = (status: Provider['status']) => {
  switch (status) {
    case "Active": return "secondary";
    case "Pending": return "outline";
    default: return "outline";
  }
};

const getProviderLimit = (planId: string | undefined): number => {
    switch(planId) {
        case 'lite': return 3;
        case 'pro': return 10;
        case 'custom': return Infinity;
        default: return 0;
    }
}

export default function ManageProvidersPage() {
    const { user, subscription, userRole } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('ManageProviders');
    const [providers, setProviders] = React.useState<Provider[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isInviteDialogOpen, setInviteDialogOpen] = React.useState(false);
    const [inviteEmail, setInviteEmail] = React.useState("");
    const [isInviting, setIsInviting] = React.useState(false);

    const providerLimit = getProviderLimit(subscription?.planId);
    const canAddMoreProviders = providers.length < providerLimit;
    
    React.useEffect(() => {
        if (!user || userRole !== 'agency') {
            setLoading(false);
            return;
        }

        const providersQuery = query(collection(db, "users"), where("agencyId", "==", user.uid));
        const invitesQuery = query(collection(db, "invites"), where("agencyId", "==", user.uid), where("status", "==", "pending"));

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
        if (!user || !inviteEmail) return;

        setIsInviting(true);
        try {
            const userQuery = query(collection(db, "users"), where("email", "==", inviteEmail));
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

            const existingInviteQuery = query(collection(db, "invites"), where("email", "==", inviteEmail), where("status", "==", "pending"));
            const inviteSnapshot = await getDocs(existingInviteQuery);

             if (!inviteSnapshot.empty) {
                 toast({ variant: 'destructive', title: t('invitePending'), description: t('invitePendingDescription') });
                 setIsInviting(false);
                return;
            }

            const batch = writeBatch(db);
            const inviteRef = doc(collection(db, "invites"));
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
                 const notificationRef = doc(collection(db, `users/${providerDoc.id}/notifications`));
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
        if (!user) return;
        try {
            const batch = writeBatch(db);
            if (status === 'Active') {
                const providerRef = doc(db, "users", providerId);
                batch.update(providerRef, { agencyId: null });
            } else { // Pending
                const inviteRef = doc(db, "invites", providerId);
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
             <div className="space-y-6">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('agencyOnly')}</p>
                </div>
            </div>
        )
    }

    return (
      <div className="space-y-6">
          <div className="flex items-center justify-between">
              <div>
                  <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
                  <p className="text-muted-foreground">
                      {t('subtitle')}
                  </p>
              </div>
               <Dialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogTrigger asChild>
                         <Button disabled={!canAddMoreProviders}>
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
          
          <Card>
            <CardHeader>
                <CardTitle>{t('yourProviderNetwork')}</CardTitle>
                <CardDescription>
                    {t('providerCount', { count: providers.length, limit: isFinite(providerLimit) ? providerLimit : t('unlimited') })}
                </CardDescription>
            </CardHeader>
             <CardContent>
                 {!canAddMoreProviders && (
                    <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 !text-blue-700" />
                        <AlertTitle className="text-blue-800">{t('providerLimitReached')}</AlertTitle>
                        <AlertDescription className="text-blue-700">
                           {t('limitReachedDescription')} <Button variant="link" asChild className="p-0 h-auto"><Link href="/subscription">{t('upgradeSubscription')}</Link></Button>.
                        </AlertDescription>
                    </Alert>
                )}
                <div className="rounded-md border bg-card">
                   {loading ? (
                     <div className="p-4 space-y-2">
                         {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                     </div>
                    ) : (
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
                                    {t('noProvidersYet')}
                                    <p className="text-muted-foreground">{t('noProvidersDescription')}</p>
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                    )}
                </div>
            </CardContent>
          </Card>
      </div>
    );
}

    