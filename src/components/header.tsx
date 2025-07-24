
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/user-nav";
import { useAuth } from "@/hooks/use-auth";
import { ChevronDown, Menu, User, Waves } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { LanguageToggle, useLanguage } from "./language-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MobileNav } from "./mobile-nav";
import { useState } from "react";
import { NotificationsNav } from "./notifications-nav";


const translations = {
  ar: {
    appName: "شاليها",
    search: "بحث",
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    listYourPlace: "اعرض مكانك",
    importantLinks: "روابط مهمة",
    browseChalets: "تصفح الشاليهات",
    helpCenter: "مركز المساعدة",
    howItWorks: "كيف يعمل الموقع",
    privacyPolicy: "سياسة الخصوصية",
    termsOfService: "شروط الخدمة",
    messages: "الرسائل",
  },
  en: {
    appName: "Chaleha",
    search: "Search",
    login: "Log In",
    signup: "Sign Up",
    listYourPlace: "List your place",
    importantLinks: "Important Links",
    browseChalets: "Browse Chalets",
    helpCenter: "Help Center",
    howItWorks: "How It Works",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    messages: "Messages",
  },
};

export function Header() {
  const { user } = useAuth();
  const lang = useLanguage();
  const t = translations[lang];
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        
        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
                 <span className="font-bold font-headline text-xl text-foreground sm:inline-block">
                    {t.appName}
                 </span>
                 <Waves className="h-7 w-auto text-primary" />
            </Link>
            <nav className="flex items-center gap-4">
                <Link
                    href="/search"
                    className="transition-colors text-foreground/80 hover:text-foreground text-sm font-medium"
                >
                    {t.search}
                </Link>
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-sm font-medium text-foreground/80 hover:text-foreground px-2">
                      {t.importantLinks}
                      <ChevronDown className={cn("relative top-[1px] h-4 w-4 transition duration-200", lang === 'ar' ? "mr-2" : "ml-2")} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem asChild>
                      <Link href="/search">{t.browseChalets}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/contact">{t.helpCenter}</Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/faq">{t.howItWorks}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/privacy">{t.privacyPolicy}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/terms">{t.termsOfService}</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link
                    href="/chat"
                    className="transition-colors text-foreground/80 hover:text-foreground text-sm font-medium"
                >
                    {t.messages}
                </Link>
            </nav>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <NotificationsNav />
              <UserNav />
            </>
          ) : (
            <nav className="flex items-center gap-2">
               <Button asChild variant="ghost">
                 <Link href="/signup?role=host">{t.listYourPlace}</Link>
               </Button>
               <Button asChild variant="ghost">
                <Link href="/login">{t.login}</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">{t.signup}</Link>
              </Button>
            </nav>
          )}
           <div className="flex items-center gap-1">
             <LanguageToggle />
             <ModeToggle />
           </div>
        </div>


        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between w-full">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-9 w-9">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side={lang === "ar" ? "right" : "left"} className="p-0">
                    <MobileNav translations={t} onLinkClick={() => setIsSheetOpen(false)}/>
                </SheetContent>
            </Sheet>

            <Link href="/" className="flex items-center gap-2">
                <span className="font-bold font-headline text-xl text-foreground">
                    {t.appName}
                </span>
                <Waves className="h-7 w-auto text-primary" />
            </Link>
            
            <div className="flex items-center">
                 {user ? (
                   <>
                    <NotificationsNav />
                    <UserNav />
                   </>
                ) : (
                    <Button asChild variant="ghost" size="icon" className="h-9 w-9">
                        <Link href="/login">
                             <User className="h-6 w-6"/>
                             <span className="sr-only">Login</span>
                        </Link>
                    </Button>
                )}
            </div>
        </div>
      </div>
    </header>
  );
}

    