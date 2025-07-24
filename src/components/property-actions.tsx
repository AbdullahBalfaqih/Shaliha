

"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Share2, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { useLanguage } from "./language-toggle";
import { toggleWishlist } from "@/app/properties/actions";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

const translations = {
    ar: {
        shareProperty: "مشاركة العقار",
        addToWishlist: "إضافة لقائمة الرغبات",
        linkCopied: "تم نسخ الرابط",
        linkCopiedDescription: "يمكنك الآن مشاركة رابط العقار مع أصدقائك.",
        wishlistAdded: "تمت الإضافة إلى قائمة الرغبات",
        wishlistRemoved: "تمت الإزالة من قائمة الرغبات"
    },
    en: {
        shareProperty: "Share Property",
        addToWishlist: "Add to wishlist",
        linkCopied: "Link Copied",
        linkCopiedDescription: "You can now share the property link with your friends.",
        wishlistAdded: "Added to wishlist",
        wishlistRemoved: "Removed from wishlist"
    }
}

export function PropertyActions({ propertyId, initialIsWishlisted, onWishlistToggle }: { propertyId: string, initialIsWishlisted: boolean, onWishlistToggle: () => void }) {
    const { toast } = useToast();
    const { user } = useAuth();
    const router = useRouter();
    const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
    const lang = useLanguage();
    const t = translations[lang];

    useEffect(() => {
        setIsWishlisted(initialIsWishlisted);
    }, [initialIsWishlisted]);


    const handleShare = async () => {
        const shareData = {
            title: document.title,
            text: `ألق نظرة على هذا العقار: ${document.title}`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                 if (err instanceof DOMException && (err.name === 'AbortError' || err.name === 'PermissionDeniedError')) {
                    // User cancelled the share sheet or denied permission, do nothing.
                 } else {
                    // Fallback to clipboard for other errors or browsers that don't support share API well
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                        title: t.linkCopied,
                        description: t.linkCopiedDescription,
                    });
                 }
            }
        } else {
            // Fallback for browsers that do not support the Web Share API
            navigator.clipboard.writeText(window.location.href);
            toast({
                title: t.linkCopied,
                description: t.linkCopiedDescription,
            });
        }
    };

    const handleWishlist = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        const result = await toggleWishlist(propertyId, user.id);
        if (result.success) {
            setIsWishlisted(!!result.added);
            toast({
                title: result.added ? t.wishlistAdded : t.wishlistRemoved,
            });
            onWishlistToggle(); // Re-fetch data on parent component
        } else {
            toast({
                title: "خطأ",
                description: result.error,
                variant: 'destructive',
            })
        }
    }

    return (
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
                <span className="mr-2">{t.shareProperty}</span>
            </Button>
            <Button variant="outline" size="icon" onClick={handleWishlist} aria-label={t.addToWishlist}>
                <Heart className={`w-5 h-5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                <span className="sr-only">{t.addToWishlist}</span>
            </Button>
        </div>
    );
}
