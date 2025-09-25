
"use client";

import * as React from "react";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  PlusCircle,
  FileText
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
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { LoadingState } from "@/components/app/loading-state";
import { EmptyState } from "@/components/app/empty-state";
import { AccessDenied } from "@/components/app/access-denied";
import { designTokens } from "@/lib/design-tokens";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AddEditInvoiceDialog } from "@/components/add-edit-invoice-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InvoicePreview } from "@/components/invoice-preview";
import { useTranslations } from 'next-intl';


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
        if (!user) {
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
        const invoiceRef = doc(db, "invoices", invoiceId);
        try {
            await updateDoc(invoiceRef, { status });
            toast({ title: "Success", description: `Invoice marked as ${status.toLowerCase()}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to update invoice status.' });
        }
    };
    
    const handleDeleteInvoice = async (invoiceId: string) => {
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
         return <AccessDenied 
            title={t('title')} 
            description={t('subtitle')} 
        />;
    }

    return (
      <PageLayout 
          title="Invoices" 
          description="Create and manage invoices for your clients."
      >
          <div className="flex justify-between items-center mb-6">
              <Button onClick={handleAddInvoice}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Invoice
              </Button>
          </div>
          <div className="w-full">
            <div className="flex items-center py-4">
              <Input
                placeholder="Filter by client name..."
                value={(table.getColumn("clientName")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("clientName")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
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
            <div className="rounded-md border bg-card">
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
      </PageLayout>
    );
}
