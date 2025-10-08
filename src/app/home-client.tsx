"use client";

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useCallback, memo } from 'react';
import { Logo } from '@/components/logo';
import { PageLoading } from '@/components/ui/loading-states';

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
                    <PageLoading text="Loading your experience..." className="min-h-0" />
                </div>
            </div>
        );
    }
    
    return <>{children}</>;
});

export default HomeClient;
