
"use client";

import * as React from "react";
import {
  ArrowUpDown,
  MoreHorizontal,
  PlusCircle,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Eye,
  Edit,
  Trash2,
  Send,
  // Calendar
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
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AddEditInvoiceDialog } from "@/components/add-edit-invoice-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InvoicePreview } from "@/components/invoice-preview";
import { useTranslations } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { getInvoicesData, updateInvoiceStatus, deleteInvoice } from './actions';
import { Timestamp } from 'firebase/firestore';


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


function InvoicesPage() {
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


    const fetchInvoices = React.useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const result = await getInvoicesData(user.uid);
            if (result.success && result.data) {
                setInvoices(result.data);
            } else {
                console.error("Error fetching invoices:", result.error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch invoices.' });
                setInvoices([]);
            }
        } catch (error) {
            console.error("Error fetching invoices:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch invoices.' });
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    React.useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const handleStatusUpdate = async (invoiceId: string, status: InvoiceStatus) => {
        try {
            const result = await updateInvoiceStatus(invoiceId, status);
            if (result.success) {
                toast({ title: "Success", description: `Invoice marked as ${status.toLowerCase()}.` });
            } else {
                throw new Error(result.error || 'Failed to update invoice status');
            }
        } catch {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update invoice status.' });
        }
    };
    
    const handleDeleteInvoice = async (invoiceId: string) => {
        try {
            const result = await deleteInvoice(invoiceId);
            if (result.success) {
                toast({ title: "Success", description: "Invoice deleted successfully." });
            } else {
                throw new Error(result.error || 'Failed to delete invoice');
            }
        } catch {
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
            return (
                <div className="text-sm">
                    <div>{date.toDate().toLocaleDateString()}</div>
                    <div className="text-muted-foreground text-xs">
                        {formatDistanceToNow(date.toDate(), { addSuffix: true })}
                    </div>
                </div>
            )
        }
      },
      {
        accessorKey: "dueDate",
        header: "Due",
        cell: ({ row }) => {
            const date: Timestamp = row.getValue("dueDate");
            const isOverdue = date.toDate() < new Date() && row.original.status !== 'Paid';
            return (
                <div className="text-sm">
                    <div className={isOverdue ? "text-red-600 font-medium" : ""}>
                        {date.toDate().toLocaleDateString()}
                    </div>
                    <div className="text-muted-foreground text-xs">
                        {formatDistanceToNow(date.toDate(), { addSuffix: true })}
                    </div>
                </div>
            )
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
                    <DropdownMenuItem onSelect={() => handleOpenPreview(invoice)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View/Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleEditInvoice(invoice)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleStatusUpdate(invoice.id, 'Paid')} disabled={invoice.status === 'Paid'}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Paid
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleStatusUpdate(invoice.id, 'Sent')} disabled={invoice.status === 'Sent'}>
                      <Send className="mr-2 h-4 w-4" />
                      Mark as Sent
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
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

    // Calculate analytics data
    const analyticsData = React.useMemo(() => {
        const totalInvoices = invoices.length;
        const paidInvoices = invoices.filter(inv => inv.status === 'Paid').length;
        const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue').length;
        const draftInvoices = invoices.filter(inv => inv.status === 'Draft').length;
        
        const totalRevenue = invoices
            .filter(inv => inv.status === 'Paid')
            .reduce((sum, inv) => sum + inv.amount, 0);
        
        const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0;
        
        const pendingAmount = invoices
            .filter(inv => inv.status === 'Sent')
            .reduce((sum, inv) => sum + inv.amount, 0);
        
        return {
            totalInvoices,
            paidInvoices,
            overdueInvoices,
            draftInvoices,
            totalRevenue,
            averageInvoiceValue,
            paymentRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
            pendingAmount
        };
    }, [invoices]);
    
    if (!user) {
         return (
            <div className="container space-y-8">
                <div className=" mx-auto">
                  <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                  <p className="text-muted-foreground">
                      {t('subtitle')}
                  </p>
              </div>
                <div className=" mx-auto">
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

    return (
      <div className="container space-y-8">
          {/* Header */}
          <div className=" mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                      <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                      <p className="text-muted-foreground mt-1">
                          {t('subtitle')}
                      </p>
                  </div>
                  <div className="flex items-center gap-3">
                      <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                          <FileText className="h-3 w-3" />
                          {invoices.length} Invoices
                      </Badge>
                      <Button onClick={handleAddInvoice} className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create Invoice
                      </Button>
                  </div>
              </div>
          </div>

          {/* Key Metrics */}
          <div className=" mx-auto">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300">
                      <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                              <div>
                                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                                  <p className="text-2xl font-bold text-primary">₱{analyticsData.totalRevenue.toLocaleString()}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                      <CheckCircle className="h-3 w-3 text-green-600" />
                                      <span className="text-xs text-green-600">From paid invoices</span>
                                  </div>
                              </div>
                              <div className="p-3 rounded-full bg-primary/10">
                                  <DollarSign className="h-6 w-6 text-primary" />
                              </div>
                          </div>
                      </CardContent>
                  </Card>
                  
                  <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300">
                      <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                              <div>
                                  <p className="text-sm text-muted-foreground">Paid Invoices</p>
                                  <p className="text-2xl font-bold text-green-600">{analyticsData.paidInvoices}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                      <CheckCircle className="h-3 w-3 text-green-600" />
                                      <span className="text-xs text-green-600">Completed payments</span>
                                  </div>
                              </div>
                              <div className="p-3 rounded-full bg-green-100">
                                  <CheckCircle className="h-6 w-6 text-green-600" />
                              </div>
                          </div>
                      </CardContent>
                  </Card>
                  
                  <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300">
                      <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                              <div>
                                  <p className="text-sm text-muted-foreground">Pending Amount</p>
                                  <p className="text-2xl font-bold text-orange-600">₱{analyticsData.pendingAmount.toLocaleString()}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                      <Clock className="h-3 w-3 text-orange-600" />
                                      <span className="text-xs text-orange-600">Awaiting payment</span>
                                  </div>
                              </div>
                              <div className="p-3 rounded-full bg-orange-100">
                                  <Clock className="h-6 w-6 text-orange-600" />
                              </div>
                          </div>
                      </CardContent>
                  </Card>
                  
                  <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300">
                      <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                              <div>
                                  <p className="text-sm text-muted-foreground">Overdue Invoices</p>
                                  <p className="text-2xl font-bold text-red-600">{analyticsData.overdueInvoices}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                      <AlertTriangle className="h-3 w-3 text-red-600" />
                                      <span className="text-xs text-red-600">Need attention</span>
                                  </div>
                              </div>
                              <div className="p-3 rounded-full bg-red-100">
                                  <AlertTriangle className="h-6 w-6 text-red-600" />
                              </div>
                          </div>
                      </CardContent>
                  </Card>
              </div>
          </div>

          {/* Invoices Table */}
          <div className=" mx-auto">
              <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                  <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                      <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">All Invoices</CardTitle>
                      <CardDescription>Manage and track your invoice status</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                      <div className="p-4 border-b border-border/50">
                          <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 flex-1">
                                  <Search className="h-4 w-4 text-muted-foreground" />
                                  <Input
                                      placeholder="Search by client name or invoice number..."
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
                                          Filter by Status
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                          onSelect={() => table.getColumn("status")?.setFilterValue(undefined)}
                                      >
                                          All Statuses
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                          onSelect={() => table.getColumn("status")?.setFilterValue("Paid")}
                                      >
                                          Paid
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                          onSelect={() => table.getColumn("status")?.setFilterValue("Sent")}
                                      >
                                          Sent
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                          onSelect={() => table.getColumn("status")?.setFilterValue("Overdue")}
                                      >
                                          Overdue
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                          onSelect={() => table.getColumn("status")?.setFilterValue("Draft")}
                                      >
                                          Draft
                                      </DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          </div>
                      </div>
                      
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
                                              className="h-24 text-center text-muted-foreground"
                                          >
                                              No invoices found. Create your first invoice to get started.
                                          </TableCell>
                                      </TableRow>
                                  )}
                              </TableBody>
                          </Table>
                      )}
                      
                      <div className="flex items-center justify-between p-4 border-t border-border/50">
                          <div className="text-sm text-muted-foreground">
                              {table.getFilteredSelectedRowModel().rows.length} of{" "}
                              {table.getFilteredRowModel().rows.length} row(s) selected.
                          </div>
                          <div className="flex items-center space-x-2">
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
                  </CardContent>
              </Card>
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

export default InvoicesPage;
