
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
import { MoreHorizontal, Trash2, Edit, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleUpdateCategory, handleDeleteCategory, handleAddCategory } from "./actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = {
    id: string;
    name: string;
};

export default function AdminCategoriesPage() {
    const { userRole } = useAuth();
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<Category | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [categoryName, setCategoryName] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

     useEffect(() => {
        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }

        const categoriesQuery = query(collection(db, "categories"), orderBy("name"));
        
        const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching categories:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userRole]);
    
    const resetDialog = () => {
        setIsEditing(null);
        setIsAdding(false);
        setCategoryName("");
        setIsDialogOpen(false);
    }

    const onUpdateCategory = async () => {
        if (!isEditing || !categoryName) return;
        const result = await handleUpdateCategory(isEditing.id, categoryName);
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
        if (!result.error) {
            resetDialog();
        }
    };

    const onAddCategory = async () => {
        const result = await handleAddCategory(categoryName);
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
        if (!result.error) {
            resetDialog();
        }
    }

    const onDeleteCategory = async (categoryId: string) => {
        const result = await handleDeleteCategory(categoryId);
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
    }

    const openEditDialog = (category: Category) => {
        setIsEditing(category);
        setCategoryName(category.name);
        setIsDialogOpen(true);
    }
    
    const openAddDialog = () => {
        setIsAdding(true);
        setCategoryName("");
        setIsDialogOpen(true);
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
                    <h1 className="text-3xl font-bold font-headline">Category Management</h1>
                    <p className="text-muted-foreground">Add, edit, or delete service categories.</p>
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
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetDialog() }}>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Category Management</h1>
                        <p className="text-muted-foreground">
                            Add, edit, or delete service categories.
                        </p>
                    </div>
                    <Button onClick={openAddDialog}><PlusCircle className="mr-2"/> Add Category</Button>
                </div>
                 <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Category Name</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.length > 0 ? categories.map(category => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                         <TableCell className="text-right">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openEditDialog(category)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                                <Trash2 className="mr-2 h-4 w-4" />Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the category "{category.name}".</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/80" onClick={() => onDeleteCategory(category.id)}>
                                                            Confirm Deletion
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center h-24">
                                            No categories found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isAdding ? "Add New Category" : "Edit Category"}</DialogTitle>
                    </DialogHeader>
                     <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={categoryName} onChange={e => setCategoryName(e.target.value)} className="col-span-3"/>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={isAdding ? onAddCategory : onUpdateCategory}>Save changes</Button>
                    </DialogFooter>
                </DialogContent>
            </div>
        </Dialog>
    )
}
