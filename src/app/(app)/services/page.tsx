
"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, PlusCircle, BriefcaseBusiness } from "lucide-react";
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
    const t = useTranslations('Services');
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
            toast({ variant: 'destructive', title: t('error'), description: t('failedToFetchServices') });
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
            toast({ title: t('success'), description: t('serviceDeletedSuccessfully') });
            fetchServices(); // Refresh list
        } catch (error) {
            console.error("Error deleting service:", error);
            toast({ variant: 'destructive', title: t('error'), description: t('failedToDeleteService') });
        }
    };

    const onServiceSaved = () => {
        setIsDialogOpen(false);
        fetchServices();
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
                    <p className="text-muted-foreground">
                        {t('subtitle')}
                    </p>
                </div>
                 <div className="flex items-center gap-2">
                    <Button onClick={handleAddService}>
                        <PlusCircle className="mr-2" />
                        {t('addNewService')}
                    </Button>
                </div>
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
                                                <DropdownMenuItem onClick={() => handleEditService(service)}>{t('edit')}</DropdownMenuItem>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem className="text-destructive">{t('delete')}</DropdownMenuItem>
                                                </AlertDialogTrigger>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>{t('deleteConfirmationTitle')}</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t('deleteConfirmationDescription')}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-destructive hover:bg-destructive/90"
                                                    onClick={() => service.id && handleDeleteService(service.id)}
                                                >
                                                    {t('delete')}
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
                        <h3 className="text-xl font-semibold">{t('noServicesFound')}</h3>
                        <p>{t('noServicesDescription')}</p>
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
