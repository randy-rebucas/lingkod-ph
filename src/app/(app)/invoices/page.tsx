
"use client";

import * as React from "react";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  PlusCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Download,
  Send,
  Calendar,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Copy,
  Mail,
  CreditCard,
  Receipt,
  Target,
  Users,
  Zap,
  Repeat
} from "lucide-react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AddEditInvoiceDialog } from "@/components/add-edit-invoice-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InvoicePreview } from "@/components/invoice-preview";
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";


type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

type LineItem = {
    description: string;
    quantity: number;
    price: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  amount: number; // This will be the calculated total
  status: InvoiceStatus;
  issueDate: Timestamp;
  dueDate: Timestamp;
  lineItems: LineItem[];
  taxRate: number;
  providerId: string;
};

const getStatusVariant = (status: InvoiceStatus) => {
  switch (status) {
    case "Paid": return "secondary";
    case "Sent": return "default";
    case "Overdue": return "destructive";
    case "Draft": return "outline";
    default: return "outline";
  }
};


export default function InvoicesPage() {
    const { user } = useAuth();
    const t = useTranslations('Invoices');
    const { toast } = useToast();
    const [invoices, setInvoices] = React.useState<Invoice[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null);

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    
    const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);


    const fetchInvoices = React.useCallback(() => {
        if (!user || !db) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(collection(db, "invoices"), where("providerId", "==", user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const invoicesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Invoice));
            setInvoices(invoicesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching invoices:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch invoices.' });
            setLoading(false);
        });

        return unsubscribe;
    }, [user, toast]);

    React.useEffect(() => {
        const unsubscribe = fetchInvoices();
        return () => unsubscribe?.();
    }, [fetchInvoices]);

    const handleStatusUpdate = async (invoiceId: string, status: InvoiceStatus) => {
        if (!db) return;
        const invoiceRef = doc(db, "invoices", invoiceId);
        try {
            await updateDoc(invoiceRef, { status });
            toast({ title: "Success", description: `Invoice marked as ${status.toLowerCase()}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update invoice status.' });
        }
    };
    
    const handleDeleteInvoice = async (invoiceId: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, "invoices", invoiceId));
            toast({ title: "Success", description: "Invoice deleted successfully." });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete invoice.' });
        }
    };
    
    const handleAddInvoice = () => {
        setSelectedInvoice(null);
        setIsDialogOpen(true);
    };
    
    const handleEditInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsDialogOpen(true);
    };
    
    const handleOpenPreview = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsPreviewOpen(true);
    };


    const columns: ColumnDef<Invoice>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "invoiceNumber",
        header: "Invoice #",
        cell: ({ row }) => <div className="font-medium">{row.getValue("invoiceNumber")}</div>,
      },
      {
        accessorKey: "clientName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Client
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("clientName")}</div>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={getStatusVariant(row.getValue("status"))} className="capitalize">{row.getValue("status")}</Badge>
        ),
      },
      {
        accessorKey: "issueDate",
        header: "Issued",
        cell: ({ row }) => {
            const date: Timestamp = row.getValue("issueDate");
            return <div>{date.toDate().toLocaleDateString()}</div>
        }
      },
      {
        accessorKey: "dueDate",
        header: "Due",
        cell: ({ row }) => {
            const date: Timestamp = row.getValue("dueDate");
            return <div>{date.toDate().toLocaleDateString()}</div>
        }
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">Amount</div>,
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("amount"));
          const formatted = new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(amount);
          return <div className="text-right font-medium">{formatted}</div>;
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const invoice = row.original;
          return (
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => handleOpenPreview(invoice)}>View/Download</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleEditInvoice(invoice)}>
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleStatusUpdate(invoice.id, 'Paid')} disabled={invoice.status === 'Paid'}>
                      Mark as Paid
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleStatusUpdate(invoice.id, 'Sent')} disabled={invoice.status === 'Sent'}>
                      Mark as Sent
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">Delete</DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                 <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete this invoice.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={() => handleDeleteInvoice(invoice.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          );
        },
      },
    ];

    const table = useReactTable({
        data: invoices,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });
    
    if (!user) {
         return (
            <div className="container space-y-8">
                <div className="max-w-6xl mx-auto">
                  <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                  <p className="text-muted-foreground">
                      {t('subtitle')}
                  </p>
              </div>
                <div className="max-w-6xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('upgradeToProOrElite')}</CardTitle>
                            <CardDescription>{t('upgradeDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                            <FileText className="h-16 w-16 mb-4" />
                            <p className="mb-4">{t('streamlineBilling')}</p>
                             <Button asChild>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Calculate analytics data
    const analyticsData = React.useMemo(() => {
        const totalInvoices = invoices.length;
        const paidInvoices = invoices.filter(inv => inv.status === 'Paid').length;
        const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue').length;
        const draftInvoices = invoices.filter(inv => inv.status === 'Draft').length;
        
        const totalRevenue = invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.amount, 0);
        
        const pendingAmount = invoices
            .filter(inv => inv.status === 'Sent' || inv.status === 'Overdue')
            .reduce((sum, inv) => sum + inv.amount, 0);
        
        const overdueAmount = invoices
            .filter(inv => inv.status === 'Overdue')
            .reduce((sum, inv) => sum + inv.amount, 0);
        
        const collectionRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;
        
        return {
            totalInvoices,
            paidInvoices,
            overdueInvoices,
            draftInvoices,
            totalRevenue,
            pendingAmount,
            overdueAmount,
            collectionRate
        };
    }, [invoices]);

    return (
      <div className="container space-y-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                  <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Invoices</h1>
                  <p className="text-muted-foreground">
                      Create and manage invoices for your clients.
                  </p>
              </div>
              <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Advanced
                  </Badge>
              </div>
          </div>

          {/* Quick Stats */}
          <div className="max-w-6xl mx-auto">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                      <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-primary/10">
                                  <DollarSign className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                                  <p className="text-xl font-bold">₱{analyticsData.totalRevenue.toLocaleString()}</p>
                              </div>
                          </div>
                      </CardContent>
                  </Card>
                  
                  <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                      <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-green-100 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                              </div>
                              <div>
                                  <p className="text-sm text-muted-foreground">Paid Invoices</p>
                                  <p className="text-xl font-bold">{analyticsData.paidInvoices}</p>
                              </div>
                          </div>
                      </CardContent>
                  </Card>
                  
                  <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                      <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
                                  <Clock className="h-4 w-4" />
                              </div>
                              <div>
                                  <p className="text-sm text-muted-foreground">Pending</p>
                                  <p className="text-xl font-bold">₱{analyticsData.pendingAmount.toLocaleString()}</p>
                              </div>
                          </div>
                      </CardContent>
                  </Card>
                  
                  <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                      <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-red-100 text-red-600">
                                  <AlertTriangle className="h-4 w-4" />
                              </div>
                              <div>
                                  <p className="text-sm text-muted-foreground">Overdue</p>
                                  <p className="text-xl font-bold">{analyticsData.overdueInvoices}</p>
                              </div>
                          </div>
                      </CardContent>
                  </Card>
              </div>
          </div>

          <div className="max-w-6xl mx-auto">
              <Tabs defaultValue="invoices" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="invoices" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Invoices
                      </TabsTrigger>
                      <TabsTrigger value="analytics" className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Analytics
                      </TabsTrigger>
                      <TabsTrigger value="templates" className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Templates
                      </TabsTrigger>
                      <TabsTrigger value="automation" className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Automation
                      </TabsTrigger>
                  </TabsList>
              
              <TabsContent value="invoices" className="mt-6">
                  <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                          <Button onClick={handleAddInvoice} className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Create Invoice
                          </Button>
                          <Button variant="outline">
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                          </Button>
                          <Button variant="outline">
                              <Send className="mr-2 h-4 w-4" />
                              Send Reminders
                          </Button>
                      </div>
                      <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                              <Download className="mr-2 h-4 w-4" />
                              Export
                          </Button>
                      </div>
                  </div>
                  <div className="w-full">
                    <div className="flex items-center py-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Filter by client name..."
                          value={(table.getColumn("clientName")?.getFilterValue() as string) ?? ""}
                          onChange={(event) =>
                            table.getColumn("clientName")?.setFilterValue(event.target.value)
                          }
                          className="max-w-sm"
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuCheckboxItem
                            checked={!table.getColumn("status")?.getFilterValue()}
                            onCheckedChange={() => table.getColumn("status")?.setFilterValue(undefined)}
                          >
                            All Statuses
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={table.getColumn("status")?.getFilterValue() === "Paid"}
                            onCheckedChange={() => table.getColumn("status")?.setFilterValue("Paid")}
                          >
                            Paid
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={table.getColumn("status")?.getFilterValue() === "Sent"}
                            onCheckedChange={() => table.getColumn("status")?.setFilterValue("Sent")}
                          >
                            Sent
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={table.getColumn("status")?.getFilterValue() === "Overdue"}
                            onCheckedChange={() => table.getColumn("status")?.setFilterValue("Overdue")}
                          >
                            Overdue
                          </DropdownMenuCheckboxItem>
                          <DropdownMenuCheckboxItem
                            checked={table.getColumn("status")?.getFilterValue() === "Draft"}
                            onCheckedChange={() => table.getColumn("status")?.setFilterValue("Draft")}
                          >
                            Draft
                          </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="ml-auto">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                              return (
                                <DropdownMenuCheckboxItem
                                  key={column.id}
                                  className="capitalize"
                                  checked={column.getIsVisible()}
                                  onCheckedChange={(value) =>
                                    column.toggleVisibility(!!value)
                                  }
                                >
                                  {column.id}
                                </DropdownMenuCheckboxItem>
                              );
                            })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
            <div className="rounded-md border bg-card shadow-soft border-0 bg-background/80 backdrop-blur-sm">
               {loading ? (
                 <div className="p-4">
                     <Skeleton className="h-10 w-full mb-4" />
                     {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full mb-2" />)}
                 </div>
                ) : (
                <Table>
                    <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                            return (
                            <TableHead key={header.id}>
                                {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                    )}
                            </TableHead>
                            );
                        })}
                        </TableRow>
                    ))}
                    </TableHeader>
                    <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                        <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                        >
                            {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                                {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                                )}
                            </TableCell>
                            ))}
                        </TableRow>
                        ))
                    ) : (
                        <TableRow>
                        <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                        >
                            No results.
                        </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
                )}
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
                    </div>
                  </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-6">
                  <InvoiceAnalyticsTab analyticsData={analyticsData} />
              </TabsContent>
              
              <TabsContent value="templates" className="mt-6">
                  <InvoiceTemplatesTab />
              </TabsContent>
              
              <TabsContent value="automation" className="mt-6">
                  <InvoiceAutomationTab />
              </TabsContent>
              </Tabs>
          </div>
          
          <AddEditInvoiceDialog
              isOpen={isDialogOpen}
              setIsOpen={setIsDialogOpen}
              invoice={selectedInvoice}
              onInvoiceSaved={() => {
                  setIsDialogOpen(false);
                  fetchInvoices();
              }}
          />
           <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
               <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Invoice Preview: {selectedInvoice?.invoiceNumber}</DialogTitle>
                    </DialogHeader>
                   {selectedInvoice && <InvoicePreview invoice={selectedInvoice} />}
                </DialogContent>
            </Dialog>
      </div>
    );
}

// Invoice Analytics Tab Component
function InvoiceAnalyticsTab({ analyticsData }: { analyticsData: any }) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Invoice Analytics</h2>
                <p className="text-muted-foreground">Financial insights and performance metrics</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Collection Performance
                        </CardTitle>
                        <CardDescription>Payment collection metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Collection Rate</span>
                                <div className="flex items-center gap-2">
                                    <Progress value={analyticsData.collectionRate} className="w-20" />
                                    <span className="text-sm font-medium">{analyticsData.collectionRate.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                                    <div className="text-2xl font-bold text-green-600">{analyticsData.paidInvoices}</div>
                                    <div className="text-sm text-green-700">Paid</div>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                                    <div className="text-2xl font-bold text-red-600">{analyticsData.overdueInvoices}</div>
                                    <div className="text-sm text-red-700">Overdue</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Revenue Trends
                        </CardTitle>
                        <CardDescription>Monthly revenue analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                                <div className="text-3xl font-bold text-primary mb-2">₱{analyticsData.totalRevenue.toLocaleString()}</div>
                                <div className="text-sm text-muted-foreground">Total Collected Revenue</div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                                    <span className="text-sm">Pending Amount</span>
                                    <span className="font-medium">₱{analyticsData.pendingAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                                    <span className="text-sm">Overdue Amount</span>
                                    <span className="font-medium text-red-600">₱{analyticsData.overdueAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Invoice Templates Tab Component
function InvoiceTemplatesTab() {
    const templates = [
        {
            id: 1,
            name: "Standard Service Invoice",
            description: "Basic invoice template for services",
            category: "Services"
        },
        {
            id: 2,
            name: "Product Sales Invoice",
            description: "Template for product sales",
            category: "Products"
        },
        {
            id: 3,
            name: "Consulting Invoice",
            description: "Professional consulting invoice",
            category: "Consulting"
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Invoice Templates</h2>
                    <p className="text-muted-foreground">Pre-built templates for different invoice types</p>
                </div>
                <Button>
                    <Target className="h-4 w-4 mr-2" />
                    Create Template
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                    <Card key={template.id} className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{template.name}</CardTitle>
                                    <CardDescription>{template.description}</CardDescription>
                                </div>
                                <Badge variant="outline">{template.category}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Button size="sm" className="flex-1">
                                    <FileText className="h-4 w-4 mr-1" />
                                    Use
                                </Button>
                                <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4 mr-1" />
                                    Preview
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// Invoice Automation Tab Component
function InvoiceAutomationTab() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Invoice Automation</h2>
                <p className="text-muted-foreground">Automate your invoice workflow and payment reminders</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Payment Reminders
                        </CardTitle>
                        <CardDescription>Automated follow-up emails</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-800">Auto Reminders</span>
                                </div>
                                <p className="text-sm text-blue-700">Send automatic payment reminders 7, 14, and 30 days after due date.</p>
                            </div>
                            <Button className="w-full">
                                <Zap className="h-4 w-4 mr-2" />
                                Enable Auto Reminders
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Recurring Invoices
                        </CardTitle>
                        <CardDescription>Set up recurring billing</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Repeat className="h-4 w-4 text-green-600" />
                                    <span className="font-medium text-green-800">Recurring Billing</span>
                                </div>
                                <p className="text-sm text-green-700">Automatically generate and send invoices on a schedule.</p>
                            </div>
                            <Button className="w-full">
                                <Calendar className="h-4 w-4 mr-2" />
                                Set Up Recurring
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
