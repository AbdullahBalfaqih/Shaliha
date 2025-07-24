
import { Suspense } from 'react';
import { DashboardClientPage } from './dashboard-client';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <DashboardClientPage />
        </Suspense>
    );
}
