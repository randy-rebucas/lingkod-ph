
"use client";

import * as React from "react";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal
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
import { getDb  } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, Timestamp, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonGrid } from "@/components/ui/loading-states";
import { NoDataEmptyState } from "@/components/ui/empty-states";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { QuoteFormValues } from "./quote-builder-client";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { QuotePreview } from "./quote-preview";
import { useTranslations } from 'next-intl';


type QuoteStatus = "Draft" | "Sent" | "Accepted" | "Declined";

export type Quote = QuoteFormValues & {
  id: string;
  providerId: string;
  createdAt: Timestamp;
  status: QuoteStatus;
};

const getStatusVariant = (status: QuoteStatus) => {
  switch (status) {
    case "Accepted": return "secondary";
    case "Sent": return "default";
    case "Declined": return "destructive";
    case "Draft": return "outline";
    default: return "outline";
  }
};


export function StoredQuotesList() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { handleError } = useErrorHandler();
    const t = useTranslations('StoredQuotesList');
    const [quotes, setQuotes] = React.useState<Quote[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [selectedQuote, setSelectedQuote] = React.useState<Quote | null>(null);

    React.useEffect(() => {
        if (!user || !getDb()) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(collection(getDb(), "quotes"), where("providerId", "==", user.uid), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const quotesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Quote));
            setQuotes(quotesData);
            setLoading(false);
        }, (error) => {
            handleError(error, 'fetch quotes');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, toast, handleError]);

    const handleStatusUpdate = React.useCallback(async (quoteId: string, status: QuoteStatus) => {
        const quoteRef = doc(getDb(), "quotes", quoteId);
        try {
            await updateDoc(quoteRef, { status });
            toast({ title: t('success'), description: t('quoteMarkedAs', { status: status.toLowerCase() }) });
        } catch (error) {
            handleError(error, 'update quote status');
        }
    }, [toast, t, handleError]);
    
    const handleDeleteQuote = React.useCallback(async (quoteId: string) => {
        try {
            await deleteDoc(doc(getDb(), "quotes", quoteId));
            toast({ title: t('success'), description: t('quoteDeletedSuccessfully') });
        } catch (error) {
            handleError(error, 'delete quote');
        }
    }, [toast, t, handleError]);
    
    const calculateTotal = React.useCallback((quote: QuoteFormValues) => {
        const subtotal = quote.lineItems.reduce((acc: number, item: { quantity: number; price: number }) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
        const taxAmount = subtotal * ((Number(quote.taxRate) || 0) / 100);
        return subtotal + taxAmount;
    }, []);

    const columns: ColumnDef<Quote>[] = [
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
        accessorKey: "quoteNumber",
        header: t('quoteNumber'),
        cell: ({ row }) => <div className="font-medium">{row.getValue("quoteNumber")}</div>,
      },
      {
        accessorKey: "clientName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t('client')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("clientName")}</div>,
      },
      {
        accessorKey: "status",
        header: t('status'),
        cell: ({ row }) => (
          <Badge variant={getStatusVariant(row.getValue("status"))} className="capitalize">{row.getValue("status")}</Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: t('created'),
        cell: ({ row }) => {
            const date: Timestamp | { toDate: () => Date } = row.getValue("createdAt");
            if (date && typeof date.toDate === 'function') {
                return <div>{date.toDate().toLocaleDateString()}</div>
            }
            return <div>{t('invalidDate')}</div>
        }
      },
      {
        accessorKey: "amount",
        header: () => <div className="text-right">{t('amount')}</div>,
        cell: ({ row }) => {
          const amount = calculateTotal(row.original)
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
          const quote = row.original;
          return (
            <Dialog onOpenChange={(open) => !open && setSelectedQuote(null)}>
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                    <DialogTrigger asChild>
                        <DropdownMenuItem onClick={() => setSelectedQuote(quote)}>{t('viewDetails')}</DropdownMenuItem>
                    </DialogTrigger>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleStatusUpdate(quote.id, 'Sent')} disabled={quote.status === 'Sent'}>
                      {t('markAsSent')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusUpdate(quote.id, 'Accepted')} disabled={quote.status === 'Accepted'}>
                      {t('markAsAccepted')}
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => handleStatusUpdate(quote.id, 'Declined')} disabled={quote.status === 'Declined'}>
                      {t('markAsDeclined')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-destructive">{t('delete')}</DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                 <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('areYouAbsolutelySure')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('deleteQuoteWarning')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={() => handleDeleteQuote(quote.id)}
                    >
                      {t('delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              {selectedQuote?.id === quote.id && (
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{t('quotePreview')}: {selectedQuote.quoteNumber}</DialogTitle>
                    </DialogHeader>
                    <QuotePreview data={selectedQuote} />
                </DialogContent>
              )}
            </Dialog>
          );
        },
      },
    ];

    const table = useReactTable({
        data: quotes,
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

    if (loading) {
        return (
             <Card>
                <CardContent className="p-6">
                    <Skeleton className="h-10 w-full mb-4" />
                    <SkeletonGrid count={5} itemClassName="h-12 mb-2" />
                </CardContent>
            </Card>
        )
    }
    
    if (quotes.length === 0) {
        return (
            <NoDataEmptyState
                title={t('noStoredQuotes')}
                description={t('createFirstQuoteMessage')}
                variant="card"
            />
        )
    }

    return (
      <div className="w-full">
        <div className="flex items-center py-4">
          <Input
            placeholder={t('filterByClientName')}
            value={(table.getColumn("clientName")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("clientName")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                {t('columns')} <ChevronDown className="ml-2 h-4 w-4" />
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
                        {t('noResults')}.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} {t('of')} {" "}
            {table.getFilteredRowModel().rows.length} {t('rowsSelected')}.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {t('previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {t('next')}
            </Button>
          </div>
        </div>
      </div>
    );
}
