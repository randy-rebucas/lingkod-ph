
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, limit, startAfter, endBefore, getDocs, DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Edit, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleUpdateCategory, handleDeleteCategory, handleAddCategory } from "./actions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Category = {
    id: string;
    name: string;
};

const PAGE_SIZE = 10;

export default function AdminCategoriesPage() {
    const { userRole } = useAuth();
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<Category | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [categoryName, setCategoryName] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Pagination state
    const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot | null>(null);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
    const [isNextPageAvailable, setIsNextPageAvailable] = useState(false);
    const [page, setPage] = useState(1);

     const fetchCategories = useCallback(async (direction: 'next' | 'prev' | 'initial' = 'initial') => {
        setLoading(true);
        try {
            let q;
            const categoriesRef = collection(db, "categories");

            if (direction === 'next' && lastVisible) {
                q = query(categoriesRef, orderBy("name"), startAfter(lastVisible), limit(PAGE_SIZE));
            } else if (direction === 'prev' && firstVisible) {
                q = query(categoriesRef, orderBy("name", "desc"), startAfter(firstVisible), limit(PAGE_SIZE));
            } else {
                q = query(categoriesRef, orderBy("name"), limit(PAGE_SIZE));
            }

            const documentSnapshots = await getDocs(q);
            
            const fetchedCategories = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            
            if (direction === 'prev') {
                fetchedCategories.reverse();
            }

            if (!documentSnapshots.empty) {
                setFirstVisible(documentSnapshots.docs[0]);
                setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
                setCategories(fetchedCategories);

                // Check if there is a next page
                const nextQuery = query(categoriesRef, orderBy("name"), startAfter(documentSnapshots.docs[documentSnapshots.docs.length - 1]), limit(1));
                const nextSnapshot = await getDocs(nextQuery);
                setIsNextPageAvailable(!nextSnapshot.empty);

            } else if (direction !== 'initial') {
                // If we navigate to an empty page, don't change the current data
                toast({ variant: 'destructive', title: "No More Data", description: "You have reached the end of the list." });
            } else {
                 setCategories([]);
                 setIsNextPageAvailable(false);
            }

        } catch (error) {
            console.error("Error fetching categories:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch categories." });
        } finally {
            setLoading(false);
        }
    }, [lastVisible, firstVisible, toast]);

    useEffect(() => {
        if (userRole === 'admin') {
            fetchCategories('initial');
        } else {
            setLoading(false);
        }
    }, [userRole, fetchCategories]);
    
    const handleNextPage = () => {
        setPage(prev => prev + 1);
        fetchCategories('next');
    };

    const handlePrevPage = () => {
        setPage(prev => Math.max(1, prev - 1));
        fetchCategories('prev');
    };

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
            fetchCategories(); // Refresh data
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
            fetchCategories(); // Refresh data
        }
    }

    const onDeleteCategory = async (categoryId: string) => {
        const result = await handleDeleteCategory(categoryId);
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
        if (!result.error) {
            fetchCategories(); // Refresh data
        }
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
                    <CardContent className="p-0">
                        {loading ? (
                             <div className="p-6 space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                             </div>
                        ) : (
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
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 pt-6">
                        <Button variant="outline" onClick={handlePrevPage} disabled={page <= 1}>Previous</Button>
                        <Button variant="outline" onClick={handleNextPage} disabled={!isNextPageAvailable}>Next</Button>
                    </CardFooter>
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
