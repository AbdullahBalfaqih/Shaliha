
"use client";

import Link from "next/link";
import { Instagram, Facebook, Twitter, Waves, X } from "lucide-react";
import { useLanguage } from "./language-toggle";
import { Skeleton } from "./ui/skeleton";
import { SiTiktok} from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6"; // هذا هو الرمز الرسمي لـ X

const translations = {
  ar: {
    appName: "شاليها",
    appDescription: "مغامرتك القادمة تبدأ هنا. ابحث واحجز أماكن إقامة فريدة في أي مكان في العالم.",
    hosting: "الاستضافة",
    listYourPlace: "اعرض مكانك",
    addChalet: "أضف شاليه جديد",
    aboutChaleha: "عن شاليها",
    aboutUs: "من نحن",
    contactUs: "تواصل معنا",
    importantLinks: "روابط مهمة",
    browseChalets: "تصفح الشاليهات",
    helpCenter: "مركز المساعدة",
    howItWorks: "كيف يعمل الموقع",
    privacyPolicy: "سياسة الخصوصية",
    termsOfService: "شروط الخدمة",
    copyright: "شاليها، جميع الحقوق محفوظة.",
  },
  en: {
    appName: "Chaleha",
    appDescription: "Your next adventure starts here. Find and book unique accommodations anywhere in the world.",
    hosting: "Hosting",
    listYourPlace: "List your place",
    addChalet: "Add a new chalet",
    aboutChaleha: "About Chaleha",
    aboutUs: "About Us",
    contactUs: "Contact Us",
    importantLinks: "Important Links",
    browseChalets: "Browse Chalets",
    helpCenter: "Help Center",
    howItWorks: "How It Works",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    copyright: "Chaleha, All rights reserved.",
  }
};

export function Footer() {
  const lang = useLanguage();
  const t = translations[lang];

  return (
    <footer className="bg-card text-secondary-foreground border-t">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" style={{textAlign: lang === 'ar' ? 'right' : 'left'}}>
          
          <div className="space-y-4">
                      <Link
                          href="/"
                          className={`flex items-center gap-2 ${lang === "ar" ? "flex-row-reverse justify-end" : "flex-row justify-start"}`}
                      > <Waves className="h-8 w-auto text-primary" />
                          <span className="text-2xl font-bold font-headline text-foreground">
                              {t.appName}
                          </span>
                         
                      </Link>

            <p className="text-muted-foreground">
              {t.appDescription}
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-headline text-foreground">
              {t.importantLinks}
            </h3>
            <nav className="flex flex-col space-y-2 text-muted-foreground">
              <Link href="/search" className="hover:text-primary transition-colors">{t.browseChalets}</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">{t.helpCenter}</Link>
              <Link href="/faq" className="hover:text-primary transition-colors">{t.howItWorks}</Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">{t.privacyPolicy}</Link>
              <Link href="/terms" className="hover:text-primary transition-colors">{t.termsOfService}</Link>
            </nav>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold font-headline text-foreground">
              {t.hosting}
            </h3>
            <nav className="flex flex-col space-y-2 text-muted-foreground">
              <Link href="/host/dashboard" className="hover:text-primary transition-colors">{t.listYourPlace}</Link>
              <Link href="/host/dashboard/add-property" className="hover:text-primary transition-colors">{t.addChalet}</Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-headline text-foreground">
              {t.aboutChaleha}
            </h3>
            <nav className="flex flex-col space-y-2 text-muted-foreground">
              <Link href="/about" className="hover:text-primary transition-colors">{t.aboutUs}</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">{t.contactUs}</Link>
            </nav>
          </div>
        </div>
              <div className="mt-12 border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
                  <p className="text-sm text-muted-foreground order-3 md:order-1 mt-2 md:mt-0">
                      Developed by <a href="mailto:abdullahbalfaqih0@gmail.com" className="underline hover:text-primary">abdullahbalfaqih0@gmail.com</a>
                  </p>
                  <p className="text-sm text-muted-foreground order-2 md:order-2 mt-4 md:mt-0">
                      © {new Date().getFullYear()} {t.copyright}
                  </p>
                  <div className="flex items-center gap-4 order-1 md:order-3">
                      <Link href="https://www.instagram.com/shaliha.ye?utm_source=qr&igsh=aG9tMXA0MGR4YTB0" className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center p-0 m-0">
                          <Instagram className="h-5 w-5" />
                      </Link>
                      <Link
                          href="https://www.tiktok.com/@shaliha.ye?_t=ZS-8yIJLbwEwS7&_r=1" // عدل هذا إلى حسابك الفعلي
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center p-0 m-0"
                      >
                          <SiTiktok className="h-5 w-5" />
                      </Link>
                      <Link href="https://x.com/shalihaye?s=21&t=vnKjXgcVlKTxS7TXudn4Yg" target="_blank" className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center p-0 m-0">
                          <FaXTwitter className="h-5 w-5 m-0 p-0" />
                      </Link>
                  </div>
              </div>
      </div>
    </footer>
  );
}
