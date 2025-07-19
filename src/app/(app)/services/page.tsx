
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, PlusCircle, Loader2 } from "lucide-react";
import { AddEditServiceDialog, Service } from '@/components/add-edit-service-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';


const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case "active":
            return "default";
        case "inactive":
            return "secondary";
        default:
            return "outline";
    }
}

export default function ServicesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    const fetchServices = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const q = query(collection(db, "services"), where("userId", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const servicesData = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Convert Firestore Timestamp to Date if necessary
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
                } as Service;
            });
            setServices(servicesData);
        } catch (error) {
            console.error("Error fetching services:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch services.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [user]);

    const handleAddService = () => {
        setSelectedService(null);
        setIsDialogOpen(true);
    };

    const handleEditService = (service: Service) => {
        setSelectedService(service);
        setIsDialogOpen(true);
    };
    
    const handleDeleteService = async (serviceId: string) => {
        try {
            await deleteDoc(doc(db, 'services', serviceId));
            toast({ title: 'Success', description: 'Service deleted successfully.' });
            fetchServices(); // Refresh list
        } catch (error) {
            console.error("Error deleting service:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete service.' });
        }
    };


    const onServiceSaved = () => {
        setIsDialogOpen(false);
        fetchServices();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">My Services</h1>
                    <p className="text-muted-foreground">
                        Manage the services you offer to clients.
                    </p>
                </div>
                <Button onClick={handleAddService}>
                    <PlusCircle className="mr-2" />
                    Add New Service
                </Button>
            </div>
            
            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-12 w-full" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-8 w-1/3" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : services.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {services.map((service) => (
                        <Card key={service.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle>{service.name}</CardTitle>
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditService(service)}>Edit</DropdownMenuItem>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                </AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone. This will permanently delete this service from your profile.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-destructive hover:bg-destructive/90"
                                                    onClick={() => service.id && handleDeleteService(service.id)}
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                <CardDescription className="flex items-center justify-between">
                                    <span>{service.category}</span>
                                    <Badge variant={getStatusVariant(service.status)}>{service.status}</Badge>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-muted-foreground line-clamp-3">{service.description}</p>
                            </CardContent>
                            <CardFooter>
                                <p className="text-lg font-semibold">₱{Number(service.price).toFixed(2)}</p>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                         <BriefcaseBusiness className="h-16 w-16 mb-4" />
                        <h3 className="text-xl font-semibold">No services found</h3>
                        <p>Click "Add New Service" to get started.</p>
                    </CardContent>
                </Card>
            )}

            <AddEditServiceDialog
                isOpen={isDialogOpen}
                setIsOpen={setIsDialogOpen}
                service={selectedService}
                onServiceSaved={onServiceSaved}
            />
        </div>
    );
}
