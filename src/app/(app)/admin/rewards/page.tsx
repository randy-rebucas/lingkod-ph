
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getDb  } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Edit, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleUpdateReward, handleDeleteReward, handleAddReward } from "./actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type Reward = {
    id: string;
    title: string;
    description: string;
    pointsRequired: number;
    isActive: boolean;
};

export default function AdminRewardsPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<Reward | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    
    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [pointsRequired, setPointsRequired] = useState(0);
    const [isActive, setIsActive] = useState(true);

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        if (userRole !== 'admin' || !getDb()) {
            setLoading(false);
            return;
        }

        const rewardsQuery = query(collection(getDb(), "loyaltyRewards"), orderBy("pointsRequired"));
        
        const unsubscribe = onSnapshot(rewardsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward));
            setRewards(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching rewards:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userRole]);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setPointsRequired(0);
        setIsActive(true);
    };
    
    const closeDialog = () => {
        setIsDialogOpen(false);
        setIsEditing(null);
        setIsAdding(false);
        resetForm();
    };

    const openEditDialog = (reward: Reward) => {
        setIsEditing(reward);
        setIsAdding(false);
        setTitle(reward.title);
        setDescription(reward.description);
        setPointsRequired(reward.pointsRequired);
        setIsActive(reward.isActive);
        setIsDialogOpen(true);
    };
    
    const openAddDialog = () => {
        setIsAdding(true);
        setIsEditing(null);
        resetForm();
        setIsDialogOpen(true);
    };

    const handleFormSubmit = async () => {
        if (!user) return;
        const payload = { title, description, pointsRequired, isActive };
        const actor = { id: user.uid, name: user.displayName };
        const result = isAdding ? await handleAddReward(payload, actor) : await handleUpdateReward(isEditing!.id, payload, actor);

        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
        if (!result.error) {
            closeDialog();
        }
    };
    
    const onDeleteReward = async (rewardId: string) => {
        if (!user) return;
        const result = await handleDeleteReward(rewardId, { id: user.uid, name: user.displayName });
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
    }

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
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Loyalty Rewards</h1>
                    <p className="text-muted-foreground">Manage rewards for the loyalty program.</p>
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
                        <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Loyalty Rewards</h1>
                        <p className="text-muted-foreground">
                            Manage rewards for the loyalty program.
                        </p>
                    </div>
                    <Button onClick={openAddDialog} className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground"><PlusCircle className="mr-2"/> Add Reward</Button>
                </div>
                <div className="max-w-6xl mx-auto">
                     <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Points Required</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rewards.length > 0 ? rewards.map(reward => (
                                        <TableRow key={reward.id}>
                                            <TableCell className="font-medium">{reward.title}</TableCell>
                                            <TableCell>{reward.pointsRequired}</TableCell>
                                            <TableCell>
                                                <Badge variant={reward.isActive ? "default" : "secondary"}>
                                                    {reward.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                             <TableCell className="text-right">
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onSelect={() => openEditDialog(reward)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
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
                                                            <AlertDialogDescription>This action cannot be undone. This will permanently delete the reward "{reward.title}".</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/80" onClick={() => onDeleteReward(reward.id)}>
                                                                Confirm Deletion
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">
                                                No rewards found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isAdding ? "Add New Reward" : "Edit Reward"}</DialogTitle>
                    </DialogHeader>
                     <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="points">Points Required</Label>
                            <Input id="points" type="number" value={pointsRequired} onChange={e => setPointsRequired(Number(e.target.value))} />
                        </div>
                        <div className="flex items-center space-x-2">
                             <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
                             <Label htmlFor="isActive">Active</Label>
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
