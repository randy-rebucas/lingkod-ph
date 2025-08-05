
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CheckCircle, Slash, ShieldAlert, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleUserStatusUpdate, handleDeleteUser } from "./actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from "next/link";


type UserStatus = 'active' | 'pending_approval' | 'suspended';

type User = {
    uid: string;
    displayName: string;
    email: string;
    role: 'client' | 'provider' | 'agency' | 'admin';
    createdAt: Timestamp;
    accountStatus: UserStatus;
    photoURL?: string;
};

const getRoleVariant = (role: string) => {
    switch (role) {
        case "admin": return "destructive";
        case "agency": return "default";
        case "provider": return "secondary";
        case "client": return "outline";
        default: return "outline";
    }
};

const getStatusVariant = (status: UserStatus) => {
    switch (status) {
        case "active": return "secondary";
        case "pending_approval": return "outline";
        case "suspended": return "destructive";
        default: return "outline";
    }
};

const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export default function AdminUsersPage() {
    const { userRole } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

     useEffect(() => {
        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }

        const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
            setUsers(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userRole]);
    
    const onUpdateStatus = async (userId: string, status: UserStatus) => {
        const result = await handleUserStatusUpdate(userId, status);
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
    };

    const onDeleteUser = async (userId: string) => {
        const result = await handleDeleteUser(userId);
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
    }
    
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesStatus = statusFilter === 'all' || user.accountStatus === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });

    if (userRole !== 'admin') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>This page is for administrators only.</CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    if (loading) {
        return (
             <div className="space-y-6">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">User Management</h1>
                    <p className="text-muted-foreground">View and manage all users.</p>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
             </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">User Management</h1>
                <p className="text-muted-foreground">
                     View and manage all users on the platform.
                </p>
            </div>
             <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input 
                            placeholder="Search by name or email..."
                            className="flex-1"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                         <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="agency">Agency</SelectItem>
                                <SelectItem value="provider">Provider</SelectItem>
                                <SelectItem value="client">Client</SelectItem>
                            </SelectContent>
                        </Select>
                         <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="pending_approval">Pending</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                <TableRow key={user.uid}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.photoURL} />
                                                <AvatarFallback>{getAvatarFallback(user.displayName)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{user.displayName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={getRoleVariant(user.role)} className="capitalize">{user.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(user.accountStatus)} className="capitalize">{user.accountStatus?.replace('_', ' ') || 'Active'}</Badge>
                                    </TableCell>
                                     <TableCell className="text-xs text-muted-foreground">
                                        {user.createdAt ? format(user.createdAt.toDate(), 'PP') : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                     {user.role !== 'client' && (
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/providers/${user.uid}`} target="_blank"><Eye className="mr-2 h-4 w-4" />View Profile</Link>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    {user.accountStatus === 'pending_approval' && (
                                                        <DropdownMenuItem onClick={() => onUpdateStatus(user.uid, 'active')}>
                                                            <CheckCircle className="mr-2 h-4 w-4" />Approve
                                                        </DropdownMenuItem>
                                                    )}
                                                    {user.accountStatus === 'active' && user.role !== 'admin' && (
                                                        <DropdownMenuItem className="focus:bg-destructive/10" onClick={() => onUpdateStatus(user.uid, 'suspended')}>
                                                            <Slash className="mr-2 h-4 w-4 text-destructive" />Suspend
                                                        </DropdownMenuItem>
                                                    )}
                                                    {user.accountStatus === 'suspended' && (
                                                        <DropdownMenuItem onClick={() => onUpdateStatus(user.uid, 'active')}>
                                                            <ShieldAlert className="mr-2 h-4 w-4" />Reactivate
                                                        </DropdownMenuItem>
                                                    )}
                                                    {user.role !== 'admin' && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                             <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                                    <Trash2 className="mr-2 h-4 w-4" />Delete User
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                             <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the user "{user.displayName}" from the database. This does not remove them from Firebase Authentication.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/80" onClick={() => onDeleteUser(user.uid)}>
                                                        Confirm Deletion
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
