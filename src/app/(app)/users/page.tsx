
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
import { MoreHorizontal, CheckCircle, Slash, ShieldAlert, Trash2, Eye, UserPlus, Loader2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleUserStatusUpdate, handleDeleteUser, handleCreateUser, handleUpdateUser } from "./actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from "next/link";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";


type UserStatus = 'active' | 'pending_approval' | 'suspended';

export type User = {
    uid: string;
    displayName: string;
    email: string;
    phone?: string;
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
    
    // Dialog States
    const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Form states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", role: 'client' as const, phone: "" });
    const [editForm, setEditForm] = useState({ name: "", role: 'client' as const, phone: "" });


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

    const handleOpenEditDialog = (user: User) => {
        setSelectedUser(user);
        setEditForm({ name: user.displayName, role: user.role, phone: user.phone || "" });
        setIsEditUserOpen(true);
    };

    const onUpdateUser = async () => {
        if (!selectedUser) return;
        setIsSubmitting(true);
        const result = await handleUpdateUser(selectedUser.uid, editForm);

        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });

        if (!result.error) {
            setIsEditUserOpen(false);
            setSelectedUser(null);
        }
        setIsSubmitting(false);
    }

    const onCreateUser = async () => {
        setIsSubmitting(true);
        const result = await handleCreateUser({
            name: createForm.name,
            email: createForm.email,
            password: createForm.password,
            role: createForm.role,
            phone: createForm.phone
        });

        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });

        if (!result.error) {
            setIsCreateUserOpen(false);
            setCreateForm({ name: "", email: "", password: "", role: "client", phone: "" });
        }
        setIsSubmitting(false);
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
        <>
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
                            <DialogTrigger asChild>
                                <Button onClick={() => setIsCreateUserOpen(true)}><UserPlus className="mr-2 h-4 w-4" /> Create User</Button>
                            </DialogTrigger>
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
                                                        <DropdownMenuItem onSelect={() => handleOpenEditDialog(user)}>
                                                            <Edit className="mr-2 h-4 w-4" />Edit User
                                                        </DropdownMenuItem>
                                                        {user.role !== 'client' && (
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/providers/${user.uid}`} target="_blank"><Eye className="mr-2 h-4 w-4" />View Profile</Link>
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        {user.accountStatus === 'pending_approval' && (
                                                            <DropdownMenuItem onSelect={() => onUpdateStatus(user.uid, 'active')}>
                                                                <CheckCircle className="mr-2 h-4 w-4" />Approve
                                                            </DropdownMenuItem>
                                                        )}
                                                        {user.accountStatus === 'active' && user.role !== 'admin' && (
                                                            <DropdownMenuItem className="focus:bg-destructive/10" onSelect={() => onUpdateStatus(user.uid, 'suspended')}>
                                                                <Slash className="mr-2 h-4 w-4 text-destructive" />Suspend
                                                            </DropdownMenuItem>
                                                        )}
                                                        {user.accountStatus === 'suspended' && (
                                                            <DropdownMenuItem onSelect={() => onUpdateStatus(user.uid, 'active')}>
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
            
            {/* Create User Dialog */}
            <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <CardDescription>Enter the details for the new user account.</CardDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2"><Label htmlFor="new-name">Full Name</Label><Input id="new-name" value={createForm.name} onChange={e => setCreateForm(f => ({...f, name: e.target.value}))} /></div>
                        <div className="space-y-2"><Label htmlFor="new-email">Email</Label><Input id="new-email" type="email" value={createForm.email} onChange={e => setCreateForm(f => ({...f, email: e.target.value}))} /></div>
                        <div className="space-y-2"><Label htmlFor="new-phone">Phone Number</Label><Input id="new-phone" type="tel" value={createForm.phone} onChange={e => setCreateForm(f => ({...f, phone: e.target.value}))} /></div>
                        <div className="space-y-2"><Label htmlFor="new-password">Password</Label><Input id="new-password" type="password" value={createForm.password} onChange={e => setCreateForm(f => ({...f, password: e.target.value}))} /></div>
                        <div className="space-y-2"><Label htmlFor="new-role">Role</Label><Select value={createForm.role} onValueChange={(v) => setCreateForm(f => ({...f, role: v as any}))}>
                            <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                            <SelectContent><SelectItem value="client">Client</SelectItem><SelectItem value="provider">Provider</SelectItem><SelectItem value="agency">Agency</SelectItem></SelectContent>
                        </Select></div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={onCreateUser} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}Create User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Edit User Dialog */}
             <Dialog open={isEditUserOpen} onOpenChange={(open) => { setIsEditUserOpen(open); if (!open) setSelectedUser(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User: {selectedUser?.displayName}</DialogTitle>
                        <CardDescription>Update the user's details below.</CardDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2"><Label htmlFor="edit-name">Full Name</Label><Input id="edit-name" value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} /></div>
                        <div className="space-y-2"><Label htmlFor="edit-phone">Phone Number</Label><Input id="edit-phone" type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({...f, phone: e.target.value}))} /></div>
                        <div className="space-y-2"><Label htmlFor="edit-role">Role</Label><Select value={editForm.role} onValueChange={(v) => setEditForm(f => ({...f, role: v as any}))}>
                            <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                            <SelectContent><SelectItem value="client">Client</SelectItem><SelectItem value="provider">Provider</SelectItem><SelectItem value="agency">Agency</SelectItem></SelectContent>
                        </Select></div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={onUpdateUser} disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
