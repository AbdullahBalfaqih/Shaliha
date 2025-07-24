
"use client";

import { usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

const authRoutes = ['/login', '/signup', '/forgot-password'];

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthRoute = authRoutes.includes(pathname);

    if (isAuthRoute) {
        return <main>{children}</main>;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}
