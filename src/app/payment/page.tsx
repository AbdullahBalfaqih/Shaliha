
import { Suspense } from 'react';
import { PaymentClientPage } from './payment-client';
import { Loader2 } from 'lucide-react';

export default function PaymentPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <PaymentClientPage />
        </Suspense>
    );
}

