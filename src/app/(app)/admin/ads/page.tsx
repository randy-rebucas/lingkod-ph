
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { db, storage } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Edit, PlusCircle, Megaphone, Upload, Image as ImageIcon, Loader2, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleUpdateAdCampaign, handleDeleteAdCampaign, handleAddAdCampaign } from "./actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';
import { differenceInDays, addDays } from 'date-fns';

type AdCampaign = {
    id: string;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    isActive: boolean;
    imageUrl?: string;
    socialLink?: string;
    createdAt: Timestamp;
};

export default function AdminAdsPage() {
    const { user, userRole } = useAuth();
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
    const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
    const [socialLink, setSocialLink] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (userRole !== 'admin' || !db) {
            setLoading(false);
            return;
        }

        const campaignsQuery = query(collection(db, "adCampaigns"), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(campaignsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdCampaign));

            const now = new Date();
            data.forEach(campaign => {
                if (campaign.isActive && campaign.createdAt) {
                    const expirationDate = addDays(campaign.createdAt.toDate(), campaign.durationDays);
                    if (now > expirationDate) {
                        console.log(`Campaign "${campaign.name}" has expired. Setting to inactive.`);
                        if (user) {
                           handleUpdateAdCampaign(campaign.id, { isActive: false }, {id: user.uid, name: user.displayName});
                        }
                    }
                }
            });

            setCampaigns(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching ad campaigns:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userRole]);

    const resetForm = () => {
        setName("");
        setDescription("");
        setPrice(0);
        setDurationDays(7);
        setIsActive(true);
        setImageUrl(undefined);
        setSocialLink("");
        setImageFile(null);
        setImagePreview(null);
        setIsUploading(false);
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
        setImageUrl(campaign.imageUrl);
        setSocialLink(campaign.socialLink || "");
        setImagePreview(campaign.imageUrl || null);
        setIsDialogOpen(true);
    };
    
    const openAddDialog = () => {
        setIsAdding(true);
        setIsEditing(null);
        resetForm();
        setIsDialogOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFormSubmit = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
            return;
        }

        let finalImageUrl = imageUrl;

        if (imageFile) {
            setIsUploading(true);
            try {
                const storagePath = `ad-campaign-images/${Date.now()}_${imageFile.name}`;
                const storageRef = ref(storage, storagePath);
                const uploadTask = await uploadBytesResumable(storageRef, imageFile);
                finalImageUrl = await getDownloadURL(uploadTask.ref);
            } catch (error) {
                 toast({
                    title: 'Upload Error',
                    description: "Failed to upload image. Please try again.",
                    variant: 'destructive',
                });
                setIsUploading(false);
                return;
            }
            setIsUploading(false);
        }

        const payload = { name, description, price, durationDays, isActive, imageUrl: finalImageUrl, socialLink };
        const actor = { id: user.uid, name: user.displayName };
        const result = isAdding ? await handleAddAdCampaign(payload, actor) : await handleUpdateAdCampaign(isEditing!.id, payload, actor);

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
        if (!user) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
            return;
        }
        const result = await handleDeleteAdCampaign(campaignId, { id: user.uid, name: user.displayName });
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
    }
    
     const isExpiringSoon = (campaign: AdCampaign): boolean => {
        if (!campaign.isActive || !campaign.createdAt) return false;
        const expirationDate = addDays(campaign.createdAt.toDate(), campaign.durationDays);
        const daysLeft = differenceInDays(expirationDate, new Date());
        return daysLeft >= 0 && daysLeft <= 3;
    };


    if (userRole !== 'admin') {
        return (
            <div className="container space-y-8">
                <div className="max-w-6xl mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Access Denied</CardTitle>
                            <CardDescription>This page is for administrators only.</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        );
    }
    
    if (loading) {
        return (
             <div className="container space-y-8">
                 <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Ad Management</h1>
                    <p className="text-muted-foreground">Manage promotional campaigns for providers.</p>
                </div>
                <div className="max-w-6xl mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <Skeleton className="h-64 w-full" />
                        </CardContent>
                    </Card>
                </div>
             </div>
        )
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
            <div className="container space-y-8">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Ad Management</h1>
                        <p className="text-muted-foreground">
                            Manage promotional campaigns for providers.
                        </p>
                    </div>
                    <Button onClick={openAddDialog} className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground"><PlusCircle className="mr-2"/> Add Campaign</Button>
                </div>
                <div className="max-w-6xl mx-auto">
                     <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Image</TableHead>
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
                                            <TableCell>
                                                {campaign.imageUrl ? (
                                                    <Image src={campaign.imageUrl} alt={campaign.name} width={40} height={40} className="rounded-md object-cover"/>
                                                ) : (
                                                    <div className="w-10 h-10 bg-secondary rounded-md flex items-center justify-center">
                                                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{campaign.name}</TableCell>
                                            <TableCell>₱{campaign.price.toFixed(2)}</TableCell>
                                            <TableCell>{campaign.durationDays}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={campaign.isActive ? "default" : "secondary"}>
                                                        {campaign.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                    {isExpiringSoon(campaign) && (
                                                        <Badge variant="outline" className="border-yellow-400 text-yellow-600">Expiring Soon</Badge>
                                                    )}
                                                </div>
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
                                            <TableCell colSpan={6} className="text-center h-24">
                                                No ad campaigns found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{isAdding ? "Add New Ad Campaign" : "Edit Ad Campaign"}</DialogTitle>
                    </DialogHeader>
                     <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto p-1">
                        <div className="space-y-2">
                            <Label>Feature Image</Label>
                            {imagePreview ? (
                                <div className="aspect-video w-full rounded-md overflow-hidden border relative">
                                    <Image src={imagePreview} alt="Campaign preview" layout="fill" className="object-cover"/>
                                </div>
                            ) : (
                                <div className="aspect-video w-full rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50">
                                    <div className="text-center text-muted-foreground p-4">
                                        <ImageIcon className="h-8 w-8 mx-auto mb-2"/>
                                        <p>Upload an image for the campaign.</p>
                                    </div>
                                </div>
                            )}
                             <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                {imagePreview ? 'Change Image' : 'Select Image'}
                            </Button>
                            <Input className="hidden" type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Campaign Name</Label>
                            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Homepage Feature" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what this campaign offers."/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="socialLink">Social Link (Optional)</Label>
                             <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="socialLink" value={socialLink} onChange={e => setSocialLink(e.target.value)} placeholder="e.g., https://facebook.com/yourpage" className="pl-9" />
                            </div>
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
                        <div className="flex items-center space-x-2 pt-2">
                             <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                             <Label htmlFor="isActive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Campaign is Active
                             </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleFormSubmit} disabled={isUploading}>
                             {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             {isUploading ? 'Uploading...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </div>
        </Dialog>
    )
}
