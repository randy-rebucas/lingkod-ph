
"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

import { handlePostJob, type PostJobFormState } from "./actions";
import { generateJobDetails, type JobDetailQuestion } from "@/ai/flows/generate-job-details";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Briefcase, Sparkles, Wand2 } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";


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
  const { userRole } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [state, formAction, isSubmitting] = useActionState(handlePostJob, initialState);
  const [isAiPending, startAiTransition] = useTransition();
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<JobDetailQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});

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
    if (userRole && userRole !== 'client' && userRole !== 'agency') {
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
    if (state.message && !isSubmitting) {
      toast({
        title: state.error ? "Error" : "Success!",
        description: state.message,
        variant: state.error ? "destructive" : "default",
      });
      if (!state.error) {
        form.reset();
        setQuestions([]);
        setAnswers({});
        router.push('/dashboard');
      }
    }
  }, [state, toast, form, router, isSubmitting]);

  const handleGenerateDetails = () => {
    const jobDescription = form.getValues('description');
    if (jobDescription.length < 20) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please provide a more detailed job description (at least 20 characters).' });
        return;
    }

    startAiTransition(async () => {
        try {
            const result = await generateJobDetails({ jobDescription });
            if (result.suggestedBudget) {
                form.setValue('budget', result.suggestedBudget, { shouldValidate: true });
            }
            if (result.questions) {
                setQuestions(result.questions);
            }
            toast({
              title: "AI Details Generated",
              description: "A budget has been suggested and job-specific questions have been added below."
            })
        } catch(e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'AI Error', description: 'Could not generate details at this time.' });
        }
    });
  }
  
  const handleAnswerChange = (question: string, answer: string) => {
    setAnswers(prev => ({...prev, [question]: answer}));
  }
  
  const additionalDetailsForForm = JSON.stringify(questions.map(q => ({
    question: q.question,
    answer: answers[q.question] || ''
  })));


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Post a New Job</h1>
        <p className="text-muted-foreground">
          Fill out the details below to find the perfect provider for your needs.
        </p>
      </div>

      <Form {...form}>
        <form action={formAction} className="space-y-6">
           <input type="hidden" name="additionalDetails" value={additionalDetailsForForm} />
           <input type="hidden" name="deadline" value={form.watch('deadline')?.toISOString() ?? ''} />
            
          <Card>
            <CardHeader>
              <CardTitle>1. Describe the Job</CardTitle>
              <CardDescription>Start with the basic details of the job you need done.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl><Input placeholder="e.g., Need a Plumber to Fix a Leaky Faucet" {...field} /></FormControl>
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
                        <FormControl><Textarea placeholder="Describe the job in detail. Include what needs to be done, any specific requirements, and the desired outcome." rows={5} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
                <CardTitle>2. Add Specific Details</CardTitle>
                <CardDescription>Generate questions to add more context, and set your budget.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertTitle>Get AI Assistance!</AlertTitle>
                    <AlertDescription>
                        Click the button below to generate specific questions for your job and get a budget suggestion based on your description.
                    </AlertDescription>
                    <Button type="button" size="sm" onClick={handleGenerateDetails} disabled={isAiPending} className="mt-2">
                        {isAiPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        {isAiPending ? 'Generating...' : 'Generate Details'}
                    </Button>
                </Alert>
                
                {questions.length > 0 && (
                    <div className="space-y-4 pt-4">
                        <h3 className="font-semibold">Job-Specific Questions</h3>
                        {questions.map((q, index) => (
                             <div key={index} className="space-y-2">
                                <Label htmlFor={`q-${index}`}>{q.question}</Label>
                                {q.type === 'text' ? (
                                    <Input id={`q-${index}`} placeholder={q.example} onChange={e => handleAnswerChange(q.question, e.target.value)} />
                                ) : (
                                    <Textarea id={`q-${index}`} placeholder={q.example} onChange={e => handleAnswerChange(q.question, e.target.value)} />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
          </Card>

          <Card>
             <CardHeader>
                <CardTitle>3. Finalize Job Details</CardTitle>
                <CardDescription>Set your budget, location, and timeline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Service Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} name={field.name}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a service category" /></SelectTrigger></FormControl>
                                <SelectContent>{categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Budget (PHP)</FormLabel>
                            <FormControl><Input type="number" placeholder="e.g., 1500" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Location / Address</FormLabel>
                            <FormControl><Input placeholder="e.g., 123 Rizal St, Brgy. Poblacion, Quezon City" {...field} /></FormControl>
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
            </CardContent>
            <CardFooter>
                 <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting Job...</>
                    ) : (
                    <><Briefcase className="mr-2 h-4 w-4" /> Post Job</>
                    )}
                </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
