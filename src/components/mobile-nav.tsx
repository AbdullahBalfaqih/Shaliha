
"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "./ui/separator";
import { ModeToggle } from "./mode-toggle";
import { LanguageToggle } from "./language-toggle";
import { Button } from "./ui/button";
import { Waves } from "lucide-react";
import { SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";

interface MobileNavProps {
    translations: Record<string, string>;
    onLinkClick: () => void;
}

export function MobileNav({ translations, onLinkClick }: MobileNavProps) {
    const { user } = useAuth();
    
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        onLinkClick();
    };

    return (
        <div className="flex flex-col h-full">
             <SheetHeader className="p-4 border-b">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
                 <Link href="/" className="flex items-center gap-2" onClick={handleLinkClick}>
                    <span className="font-bold font-headline text-xl text-foreground">
                        {translations.appName}
                    </span>
                    <Waves className="h-7 w-auto text-primary" />
                 </Link>
            </SheetHeader>
            <nav className="flex-grow p-4 space-y-2">
                <Link href="/search" className="flex items-center p-2 rounded-md hover:bg-secondary" onClick={handleLinkClick}>{translations.browseChalets}</Link>
                <Link href="/chat" className="flex items-center p-2 rounded-md hover:bg-secondary" onClick={handleLinkClick}>{translations.messages}</Link>
                <Link href="/faq" className="flex items-center p-2 rounded-md hover:bg-secondary" onClick={handleLinkClick}>{translations.howItWorks}</Link>
                <Link href="/contact" className="flex items-center p-2 rounded-md hover:bg-secondary" onClick={handleLinkClick}>{translations.helpCenter}</Link>
                {!user &&
                    <Link href="/signup?role=host" className="flex items-center p-2 rounded-md hover:bg-secondary" onClick={handleLinkClick}>{translations.listYourPlace}</Link>
                }
                <Separator />
                <Link href="/privacy" className="flex items-center p-2 rounded-md hover:bg-secondary" onClick={handleLinkClick}>{translations.privacyPolicy}</Link>
                <Link href="/terms" className="flex items-center p-2 rounded-md hover:bg-secondary" onClick={handleLinkClick}>{translations.termsOfService}</Link>
            </nav>
            <div className="p-4 border-t space-y-4">
                 {!user && (
                    <div className="grid grid-cols-2 gap-2">
                       <Button asChild variant="outline" onClick={onLinkClick}>
                         <Link href="/login">{translations.login}</Link>
                       </Button>
                       <Button asChild onClick={onLinkClick}>
                         <Link href="/signup">{translations.signup}</Link>
                       </Button>
                    </div>
                )}
                 <div className="flex justify-between items-center bg-secondary p-2 rounded-md">
                    <p className="text-sm">المظهر واللغة</p>
                    <div className="flex items-center">
                        <LanguageToggle />
                        <ModeToggle />
                    </div>
                 </div>
            </div>
        </div>
    );
}

    