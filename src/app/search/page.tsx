
import { Suspense } from 'react';
import { SearchClientPage } from './search-client';
import { Loader2 } from 'lucide-react';

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <SearchClientPage />
        </Suspense>
    );
}
