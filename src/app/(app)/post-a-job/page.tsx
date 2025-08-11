
"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, getDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";

import { postJobAction, type PostJobInput } from "./actions";
import { generateJobDetails, type JobDetailQuestion } from "@/ai/flows/generate-job-details";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
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
import { Switch } from "@/components/ui/switch";


const postJobSchema = z.object({
  title: z.string().min(10, "Job title must be at least 10 characters."),
  description: z.string().min(20, "Description must be at least 20 characters."),
  categoryId: z.string().min(1, "Please select a category."),
  budgetAmount: z.coerce.number().positive("Budget must be a positive number."),
  budgetType: z.enum(['Fixed', 'Daily', 'Monthly']),
  isNegotiable: z.boolean().default(false),
  location: z.string().min(5, "Please provide a specific location."),
  deadline: z.date().optional(),
});

type PostJobFormValues = z.infer<typeof postJobSchema>;

type Category = {
    id: string;
    name: string;
};

export default function PostAJobPage() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editJobId = searchParams.get("edit");

  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isAiPending, startAiTransition] = useTransition();

  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<JobDetailQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoadingJob, setIsLoadingJob] = useState(!!editJobId);

  const form = useForm<PostJobFormValues>({
    resolver: zodResolver(postJobSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      budgetAmount: '' as any,
      budgetType: 'Fixed',
      isNegotiable: false,
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
        const fetchJobData = async () => {
            if (!editJobId || !user) return;
            setIsLoadingJob(true);
            const jobRef = doc(db, "jobs", editJobId);
            const jobSnap = await getDoc(jobRef);
            if (jobSnap.exists() && jobSnap.data().clientId === user.uid) {
                const jobData = jobSnap.data();
                form.reset({
                    title: jobData.title,
                    description: jobData.description,
                    categoryId: jobData.categoryId,
                    budgetAmount: jobData.budget.amount,
                    budgetType: jobData.budget.type,
                    isNegotiable: jobData.budget.negotiable,
                    location: jobData.location,
                    deadline: jobData.deadline?.toDate(),
                });
                if (jobData.additionalDetails) {
                    const loadedQuestions = jobData.additionalDetails.map((q: any) => ({ question: q.question, example: '', type: 'text' }));
                    const loadedAnswers = jobData.additionalDetails.reduce((acc: any, q: any) => ({ ...acc, [q.question]: q.answer }), {});
                    setQuestions(loadedQuestions);
                    setAnswers(loadedAnswers);
                }
            } else {
                 toast({ variant: "destructive", title: "Error", description: "Job not found or you don't have permission to edit it." });
                 router.push("/my-job-posts");
            }
            setIsLoadingJob(false);
        };
        fetchJobData();
    }, [editJobId, user, form, router, toast]);

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
                form.setValue('budgetAmount', result.suggestedBudget, { shouldValidate: true });
            }
            if (result.questions) {
                setQuestions(result.questions);
                 setAnswers({}); // Reset answers when new questions are generated
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

  const onSubmit = (values: PostJobFormValues) => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to post a job." });
        return;
    }

    startSubmitTransition(async () => {
        const additionalDetailsJSON = JSON.stringify(questions.map(q => ({
            question: q.question,
            answer: answers[q.question] || ''
        })));
        
        const payload: PostJobInput = {
            ...values,
            userId: user.uid,
            additionalDetails: additionalDetailsJSON,
            ...(editJobId && { jobId: editJobId }),
        };

        const result = await postJobAction(payload);
        
        if (result.error) {
            toast({
                title: "Error",
                description: result.message,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Success!",
                description: result.message,
            });
            form.reset();
            setQuestions([]);
            setAnswers({});
            router.push(editJobId ? '/my-job-posts' : '/dashboard');
        }
    });
  }

  const pageTitle = editJobId ? "Edit Job Post" : "Post a New Job";
  const pageDescription = editJobId ? "Update the details of your job post." : "Fill out the details below to find the perfect provider for your needs.";

  if (isLoadingJob) {
    return <div>Loading job details...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">{pageTitle}</h1>
        <p className="text-muted-foreground">{pageDescription}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
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
                                    <Input id={`q-${index}`} placeholder={q.example} value={answers[q.question] || ''} onChange={e => handleAnswerChange(q.question, e.target.value)} />
                                ) : (
                                    <Textarea id={`q-${index}`} placeholder={q.example} value={answers[q.question] || ''} onChange={e => handleAnswerChange(q.question, e.target.value)} />
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
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a service category" /></SelectTrigger></FormControl>
                                <SelectContent>{categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <div className="space-y-2">
                        <FormLabel>Budget (PHP)</FormLabel>
                        <div className="grid grid-cols-2 gap-2">
                            <FormField control={form.control} name="budgetAmount" render={({ field }) => (
                                <FormItem><FormControl><Input type="number" placeholder="e.g., 1500" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="budgetType" render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Fixed">Fixed</SelectItem>
                                            <SelectItem value="Daily">Daily</SelectItem>
                                            <SelectItem value="Monthly">Monthly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                        </div>
                         <FormField control={form.control} name="isNegotiable" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-start space-x-2 pt-2">
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <FormLabel className="m-0">Budget is negotiable</FormLabel>
                            </FormItem>
                        )} />
                    </div>
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
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {editJobId ? 'Updating Job...' : 'Posting Job...'}</>
                    ) : (
                    <><Briefcase className="mr-2 h-4 w-4" /> {editJobId ? 'Update Job' : 'Post Job'}</>
                    )}
                </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
