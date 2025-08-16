
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Edit, PlusCircle, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleUpdateAdCampaign, handleDeleteAdCampaign, handleAddAdCampaign } from "./actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type AdCampaign = {
    id: string;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    isActive: boolean;
};

export default function AdminAdsPage() {
    const { userRole } = useAuth();
    const { toast } = useToast();
    const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<AdCampaign | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState(0);
    const [durationDays, setDurationDays] = useState(7);
    const [isActive, setIsActive] = useState(true);

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }

        const campaignsQuery = query(collection(db, "adCampaigns"), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(campaignsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdCampaign));
            setCampaigns(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching ad campaigns:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userRole]);

    const resetForm = () => {
        setName("");
        setDescription("");
        setPrice(0);
        setDurationDays(7);
        setIsActive(true);
    };
    
    const closeDialog = () => {
        setIsDialogOpen(false);
        setIsEditing(null);
        setIsAdding(false);
        resetForm();
    };

    const openEditDialog = (campaign: AdCampaign) => {
        setIsEditing(campaign);
        setIsAdding(false);
        setName(campaign.name);
        setDescription(campaign.description);
        setPrice(campaign.price);
        setDurationDays(campaign.durationDays);
        setIsActive(campaign.isActive);
        setIsDialogOpen(true);
    };
    
    const openAddDialog = () => {
        setIsAdding(true);
        setIsEditing(null);
        resetForm();
        setIsDialogOpen(true);
    };

    const handleFormSubmit = async () => {
        const payload = { name, description, price, durationDays, isActive };
        const result = isAdding ? await handleAddAdCampaign(payload) : await handleUpdateAdCampaign(isEditing!.id, payload);

        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
        if (!result.error) {
            closeDialog();
        }
    };
    
    const onDeleteCampaign = async (campaignId: string) => {
        const result = await handleDeleteAdCampaign(campaignId);
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
    }

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
                    <h1 className="text-3xl font-bold font-headline">Ad Management</h1>
                    <p className="text-muted-foreground">Manage promotional campaigns for providers.</p>
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
        <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Ad Management</h1>
                        <p className="text-muted-foreground">
                            Manage promotional campaigns for providers.
                        </p>
                    </div>
                    <Button onClick={openAddDialog}><PlusCircle className="mr-2"/> Add Campaign</Button>
                </div>
                 <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Campaign Name</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Duration (Days)</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campaigns.length > 0 ? campaigns.map(campaign => (
                                    <TableRow key={campaign.id}>
                                        <TableCell className="font-medium">{campaign.name}</TableCell>
                                        <TableCell>₱{campaign.price.toFixed(2)}</TableCell>
                                        <TableCell>{campaign.durationDays}</TableCell>
                                        <TableCell>
                                            <Badge variant={campaign.isActive ? "default" : "secondary"}>
                                                {campaign.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                         <TableCell className="text-right">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => openEditDialog(campaign)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={(e) => e.preventDefault()}>
                                                                <Trash2 className="mr-2 h-4 w-4" />Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the campaign "{campaign.name}".</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/80" onClick={() => onDeleteCampaign(campaign.id)}>
                                                            Confirm Deletion
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">
                                            No ad campaigns found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isAdding ? "Add New Ad Campaign" : "Edit Ad Campaign"}</DialogTitle>
                    </DialogHeader>
                     <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Campaign Name</Label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Homepage Feature" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what this campaign offers."/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (PHP)</Label>
                                <Input id="price" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="duration">Duration (Days)</Label>
                                <Input id="duration" type="number" value={durationDays} onChange={e => setDurationDays(Number(e.target.value))} />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                             <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                             <Label htmlFor="isActive">Campaign is Active</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleFormSubmit}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </div>
        </Dialog>
    )
}
