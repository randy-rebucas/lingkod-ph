
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, PlusCircle } from "lucide-react";

const services = [
    {
        id: "SVC001",
        name: "Deep House Cleaning",
        category: "Cleaning",
        price: 2500,
        description: "A thorough cleaning of your entire house, including hard-to-reach areas.",
        status: "Active",
    },
    {
        id: "SVC002",
        name: "Plumbing Repair",
        category: "Repairs",
        price: 1800,
        description: "Fixing leaky faucets, clogged drains, and other common plumbing issues.",
        status: "Active",
    },
    {
        id: "SVC003",
        name: "Lawn Mowing & Edging",
        category: "Gardening",
        price: 1200,
        description: "Professional lawn mowing and edging to keep your garden looking neat.",
        status: "Inactive",
    },
];

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
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">My Services</h1>
                    <p className="text-muted-foreground">
                        Manage the services you offer to clients.
                    </p>
                </div>
                <Button>
                    <PlusCircle className="mr-2" />
                    Add New Service
                </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                    <Card key={service.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <CardTitle>{service.name}</CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                        <DropdownMenuItem>Mark as {service.status === 'Active' ? 'Inactive' : 'Active'}</DropdownMenuItem>
                                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <CardDescription className="flex items-center justify-between">
                                <span>{service.category}</span>
                                <Badge variant={getStatusVariant(service.status)}>{service.status}</Badge>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                        </CardContent>
                        <CardFooter>
                            <p className="text-lg font-semibold">₱{service.price.toFixed(2)}</p>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
