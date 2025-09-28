"use client";

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useCallback, memo } from 'react';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';

const HomeClient = memo(function HomeClient({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    const redirectToDashboard = useCallback(() => {
        if (!loading && user) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    useEffect(() => {
        redirectToDashboard();
    }, [redirectToDashboard]);
    
    if (loading || user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-secondary">
                <div className="flex flex-col items-center gap-4">
                    <Logo showTagline={false} />
                    <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
                    <p>Loading your experience...</p>
                </div>
            </div>
        );
    }
    
    return <>{children}</>;
});

export default HomeClient;
