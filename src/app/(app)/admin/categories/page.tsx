
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { getDb  } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, startAfter, QueryDocumentSnapshot } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Edit, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleUpdateCategory, handleDeleteCategory, handleAddCategory, handleFixCategoriesActiveField } from "./actions";
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
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('AdminCategories');
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<Category | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [categoryName, setCategoryName] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [_lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
    const [pageHistory, setPageHistory] = useState<(QueryDocumentSnapshot | null)[]>([null]); // History of lastVisible for each page
    const [isNextPageAvailable, setIsNextPageAvailable] = useState(false);

    const fetchCategories = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const categoriesRef = collection(getDb(), "categories");
            let q;

            if (page === 1) {
                q = query(categoriesRef, orderBy("name"), limit(PAGE_SIZE));
            } else {
                const previousPageLastVisible = pageHistory[page - 1];
                if (!previousPageLastVisible) {
                    q = query(categoriesRef, orderBy("name"), limit(PAGE_SIZE * (page -1)));
                    const initialDocs = await getDocs(q);
                    const lastDoc = initialDocs.docs[initialDocs.docs.length-1];
                    q = query(categoriesRef, orderBy("name"), startAfter(lastDoc), limit(PAGE_SIZE));
                } else {
                    q = query(categoriesRef, orderBy("name"), startAfter(previousPageLastVisible), limit(PAGE_SIZE));
                }
            }

            const documentSnapshots = await getDocs(q);
            const fetchedCategories = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            
            setCategories(fetchedCategories);

            if (!documentSnapshots.empty) {
                const newLastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
                setLastVisible(newLastVisible);
                
                if (page > currentPage) {
                   setPageHistory(prev => [...prev, newLastVisible]);
                }
                
                const nextQuery = query(categoriesRef, orderBy("name"), startAfter(newLastVisible), limit(1));
                const nextSnapshot = await getDocs(nextQuery);
                setIsNextPageAvailable(!nextSnapshot.empty);
            } else {
                 if (page === 1) setCategories([]);
                 setIsNextPageAvailable(false);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch categories." });
        } finally {
            setLoading(false);
        }
    }, [toast, currentPage, pageHistory]);

    useEffect(() => {
        if (userRole !== 'admin' || !getDb()) {
            setLoading(false);
            return;
        }
        fetchCategories(currentPage);
    }, [userRole, currentPage, fetchCategories]);

    const handleNextPage = () => {
        if (isNextPageAvailable) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setPageHistory(prev => prev.slice(0, -1));
            setCurrentPage(prev => prev - 1);
        }
    };


    const resetDialog = () => {
        setIsEditing(null);
        setIsAdding(false);
        setCategoryName("");
        setIsDialogOpen(false);
    }

    const onUpdateCategory = async () => {
        if (!user || !isEditing || !categoryName) return;
        const result = await handleUpdateCategory(isEditing.id, categoryName, { id: user.uid, name: user.displayName });
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
        if (!result.error) {
            resetDialog();
            fetchCategories(currentPage);
        }
    };

    const onAddCategory = async () => {
        if (!user) return;
        const result = await handleAddCategory(categoryName, { id: user.uid, name: user.displayName });
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
        if (!result.error) {
            resetDialog();
            fetchCategories(currentPage);
        }
    }

    const onDeleteCategory = async (categoryId: string) => {
        if (!user) return;
        const result = await handleDeleteCategory(categoryId, { id: user.uid, name: user.displayName });
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
        if (!result.error) {
            fetchCategories(currentPage);
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

    const onFixCategories = async () => {
        if (!user) return;
        const result = await handleFixCategoriesActiveField({ id: user.uid, name: user.displayName });
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
        if (!result.error) {
            fetchCategories(currentPage);
        }
    }

    if (userRole !== 'admin') {
        return (
            <div className="container space-y-8">
                <div className=" mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('accessDenied')}</CardTitle>
                            <CardDescription>This page is for administrators only.</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        );
    }
    
    return (
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetDialog() }}>
            <div className="container space-y-8">
                <div className=" mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                        <p className="text-muted-foreground">
                            {t('subtitle')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={onFixCategories} variant="outline" className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
                            Fix Categories
                        </Button>
                        <Button onClick={openAddDialog} className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground"><PlusCircle className="mr-2"/> {t('addCategory')}</Button>
                    </div>
                </div>
                <div className=" mx-auto">
                     <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
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
                                                            <AlertDialogDescription>This action cannot be undone. This will permanently delete the category &quot;{category.name}&quot;.</AlertDialogDescription>
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
                        <CardFooter className="flex justify-between items-center pt-6">
                            <span className="text-sm text-muted-foreground">Page {currentPage}</span>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handlePrevPage} disabled={currentPage <= 1}>Previous</Button>
                                <Button variant="outline" onClick={handleNextPage} disabled={!isNextPageAvailable}>Next</Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
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
