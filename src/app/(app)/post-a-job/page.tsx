
"use client";

import { useActionState, useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

import { handlePostJob, type PostJobFormState } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Briefcase } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const postJobSchema = z.object({
  title: z.string().min(10, "Job title must be at least 10 characters."),
  description: z.string().min(20, "Description must be at least 20 characters."),
  categoryId: z.string().min(1, "Please select a category."),
  budget: z.coerce.number().positive("Budget must be a positive number."),
  location: z.string().min(5, "Please provide a specific location."),
  deadline: z.date().optional(),
});

type PostJobFormValues = z.infer<typeof postJobSchema>;

type Category = {
    id: string;
    name: string;
};

const initialState: PostJobFormState = {
  error: null,
  message: "",
};

export default function PostAJobPage() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(handlePostJob, initialState);
  const [categories, setCategories] = useState<Category[]>([]);

  const form = useForm<PostJobFormValues>({
    resolver: zodResolver(postJobSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      budget: 0,
      location: "",
      deadline: undefined,
    },
  });

  useEffect(() => {
    if (userRole !== 'client' && userRole !== 'agency') {
      toast({ variant: 'destructive', title: 'Access Denied', description: 'Only clients and agencies can post jobs.' });
      router.push('/dashboard');
    }
  }, [userRole, router, toast]);

   useEffect(() => {
        const fetchCategories = async () => {
            try {
                const categoriesRef = collection(db, "categories");
                const q = query(categoriesRef, orderBy("name"));
                const querySnapshot = await getDocs(q);
                const fetchedCategories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
                setCategories(fetchedCategories);
            } catch (error) {
                console.error("Error fetching categories: ", error);
            }
        };
        fetchCategories();
    }, []);

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.error ? "Error" : "Success!",
        description: state.message,
        variant: state.error ? "destructive" : "default",
      });
      if (!state.error) {
        form.reset();
        router.push('/dashboard'); // Or a "My Jobs" page
      }
    }
  }, [state, toast, form, router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Post a New Job</h1>
        <p className="text-muted-foreground">
          Fill out the details below to find the perfect provider for your needs.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Your job posting will be visible to relevant service providers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form action={formAction} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Need a Plumber to Fix a Leaky Faucet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a service category" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the job in detail. Include what needs to be done, any specific requirements, and the desired outcome."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Budget (PHP)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="e.g., 1500" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField control={form.control} name="deadline" render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel className="mb-1">Deadline (Optional)</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()}/>
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )} />
              </div>

               <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location / Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 Rizal St, Brgy. Poblacion, Quezon City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting Job...</>
                ) : (
                  <><Briefcase className="mr-2 h-4 w-4" /> Post Job</>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
