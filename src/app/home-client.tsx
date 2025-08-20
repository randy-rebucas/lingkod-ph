"use client";

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '@/components/logo';

export default function HomeClient({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);
    
    if (loading || user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-secondary">
                <div className="flex flex-col items-center gap-4">
                    <Logo />
                    <p>Loading your experience...</p>
                </div>
            </div>
        );
    }
    
    return <>{children}</>;
}
