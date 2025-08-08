
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { useActionState } from "react";
import { createAdminAction, type FormState } from "./actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";

const Logo = () => (
  <h1 className="text-3xl font-bold font-headline text-primary">
    Local<span className="text-accent">Pro</span>
  </h1>
);

const initialState: FormState = {
  error: null,
  message: "",
};

export default function SetupPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const [state, formAction, isPending] = useActionState(createAdminAction, initialState);

    useEffect(() => {
        const checkUsers = async () => {
            const querySnapshot = await getDocs(collection(db, "users"));
            // If users exist, this page is not accessible
            if (!querySnapshot.empty) {
                router.push('/login');
            }
        };
        checkUsers();
    }, [router]);
    
    useEffect(() => {
        if (!authLoading && user) {
            router.push('/dashboard');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.error ? "Error" : "Success!",
                description: state.message,
                variant: state.error ? "destructive" : "default",
            });
            if (!state.error) {
                // The action should handle the redirect after successful login
                router.push('/dashboard');
            }
        }
    }, [state, toast, router]);

    if (authLoading || user) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-secondary">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center space-y-2">
                    <Logo />
                    <CardTitle className="text-2xl">Welcome to LocalPro!</CardTitle>
                    <CardDescription>Let's set up your administrator account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" placeholder="Juan Dela Cruz" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" placeholder="admin@example.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isPending ? "Creating Account..." : "Create Admin Account"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
