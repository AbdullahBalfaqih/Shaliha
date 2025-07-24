
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyCard } from "@/components/property-card";
import { Search, SlidersHorizontal, Home as HomeIcon, CalendarCheck, Wallet, Sun, PartyPopper, ArrowLeft, ArrowRight, Building2, Tent, Waves as WavesIcon } from "lucide-react";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filters } from "@/app/search/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useState, useEffect } from "react";
import type { Amenity, Property } from "@/types";
import type { DateRange } from "react-day-picker";
import { useRouter } from "next/navigation";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useLanguage } from "@/components/language-toggle";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { getProperties } from "@/app/properties/actions";


function HomepageFilters() {
    const router = useRouter();
    const [city, setCity] = useState("any");
    const [date, setDate] = useState<DateRange | undefined>();
    const [priceRange, setPriceRange] = useState([1000000]);
    const [propertyType, setPropertyType] = useState("any");
    const [dedicatedFor, setDedicatedFor] = useState("any");
    const [amenities, setAmenities] = useState<Record<Amenity, boolean>>({
        wifi: false, pool: false, kitchen: false, parking: false, ac: false, tv: false, power_backup: false, speakers: false, bbq: false
    });

    const applyFilters = () => {
        const params = new URLSearchParams();
        if (city !== 'any') params.set('city', city);
        if (propertyType !== 'any') params.set('type', propertyType);
        // In a real app, you would handle more complex filter states
        router.push(`/search?${params.toString()}`);
    };

    return (
        <Filters
            city={city}
            setCity={setCity}
            date={date}
            setDate={setDate}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            propertyType={propertyType}
            setPropertyType={setPropertyType}
            dedicatedFor={dedicatedFor}
            setDedicatedFor={setDedicatedFor}
            amenities={amenities}
            setAmenities={setAmenities}
            applyFilters={applyFilters}
        />
    );
}

const translations = {
  ar: {
    heroTitle: "اعثر على عطلتك المثالية",
    heroSubtitle: "احجز شاليهات ومسابح حصرية لإجازتك القادمة.",
    searchPlaceholder: "ابحث حسب الموقع (مثال: 'صنعاء')",
    searchButton: "بحث",
    filters: "الفلاتر",
    browseByCategory: "تصفح حسب الفئة",
    specialOffers: "عروض مميزة",
    newlyAdded: "المضافة حديثاً",
    exploreNew: "إستكشف جديد شاليها!",
    startHosting: "ابدأ الاستضافة معنا",
    startHostingSubtitle: "انضم إلى مجتمع المضيفين لدينا وابدأ في كسب المال من خلال عرض الممتلكات الخاصة بك. العملية بسيطة ومجزية.",
    addProperty: "1. أضف عقارك",
    addPropertyDesc: "أنشئ صفحة لعقارك بسهولة، مع صور ووصف جذاب وتفاصيل.",
    receiveBookings: "2. استقبل الحجوزات",
    receiveBookingsDesc: "قم بإدارة حجوزاتك وتقويمك بسهولة من خلال لوحة تحكم المضيف البديهية.",
    getPaid: "3. استلم أرباحك",
    getPaidDesc: "نحن نضمن لك عملية دفع آمنة وسريعة مباشرة إلى حسابك البنكي.",
    joinAsHost: "انضم كمضيف الآن",
    smartExperience: "تجربة ذكية بين يديك!",
        smartExperienceDesc: "تحكم بحجوزاتك، استعرض العقارات، وجرب تجربة سهلة وسريعة من خلال موقعنا. كل ما تحتاجه في مكان واحد، في أي وقت ومن أي مكان. قريبًا سيكون لدينا تطبيق متاح للاندرويد والايفون لتجربة أسهل وأسرع.",
    browseNow: "ابدأ التصفح الآن",
    appName: "شاليها"
  },
  en: {
    heroTitle: "Find Your Perfect Getaway",
    heroSubtitle: "Book exclusive chalets and pools for your next vacation.",
    searchPlaceholder: "Search by location (e.g., 'Sana'a')",
    searchButton: "Search",
    filters: "Filters",
    browseByCategory: "Browse by Category",
    specialOffers: "Special Offers",
    newlyAdded: "Newly Added",
    exploreNew: "Explore new stays!",
    startHosting: "Start Hosting With Us",
    startHostingSubtitle: "Join our community of hosts and start earning money by listing your properties. The process is simple and rewarding.",
    addProperty: "1. List Your Property",
    addPropertyDesc: "Easily create a page for your property with attractive photos, a description, and complete details.",
    receiveBookings: "2. Receive Bookings",
    receiveBookingsDesc: "Manage your bookings and calendar easily through our intuitive host dashboard.",
    getPaid: "3. Get Paid",
    getPaidDesc: "We guarantee a secure and fast payment process directly to your bank account.",
    joinAsHost: "Join as a Host Now",
    smartExperience: "A Smart Experience in Your Hands!",
      smartExperienceDesc: "Control your bookings, browse properties, and enjoy a quick and easy experience through our website. Everything you need in one place, anytime, anywhere. Soon, we will launch an app for Android and iPhone for an even better experience.",
    browseNow: "Start Browsing Now",
    appName: "Chaleha"
  }
};


export default function HomePage() {
  const lang = useLanguage();
  const t = translations[lang];
  const [specialOffers, setSpecialOffers] = useState<Property[]>([]);
  const [newlyAdded, setNewlyAdded] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHomepageProperties() {
        setLoading(true);
        const [offers, newProps] = await Promise.all([
            getProperties({ limit: 4, orderBy: 'rating' }),
            getProperties({ limit: 4, orderBy: 'created_at' })
        ]);
        setSpecialOffers(offers);
        setNewlyAdded(newProps);
        setLoading(false);
    }
    fetchHomepageProperties();
  }, []);


  const categories = [
    { name: lang === 'ar' ? "شاليه & استراحه" : "Chalet & Rest House", href: "/search?type=شاليه", icon: HomeIcon },
    { name: lang === 'ar' ? "شقق, فلل, استيديو" : "Apartments, Villas, Studios", href: "/search?type=فيلا", icon: Building2 },
    { name: lang === 'ar' ? "مزارع & مخيمات" : "Farms & Camps", href: "/search?type=مزرعة", icon: Tent },
    { name: lang === 'ar' ? "شاليهات على البحر" : "Seaside Chalets", href: "/search?type=شاليه&view=sea", icon: WavesIcon },
  ];
  
  const renderPropertyCarousel = (propertyList: Property[], title: string) => (
    <Carousel
      opts={{
        align: "start",
        loop: false, // Loop is not ideal for real data unless it's a large set
        direction: lang === 'ar' ? 'rtl' : 'ltr',
      }}
      className="w-full"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-headline font-bold text-center">
          {title}
        </h2>
        <div className="flex gap-2">
          <CarouselPrevious className="relative top-auto left-auto -translate-y-0 rounded-full" />
          <CarouselNext className="relative top-auto right-auto -translate-y-0 rounded-full" />
        </div>
      </div>
      <CarouselContent className={cn("pl-0", lang === 'ar' ? "-ml-8" : "-mr-8")}>
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <CarouselItem key={index} className={cn("basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4", lang === 'ar' ? "pl-8" : "pr-8")}>
                <div className="flex flex-col h-full bg-card shadow-sm rounded-lg overflow-hidden">
                    <Skeleton className="w-full h-56" />
                    <div className="p-4 flex flex-col flex-grow gap-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full mt-2" />
                        <div className="flex justify-between items-end mt-auto pt-2">
                            <Skeleton className="h-8 w-1/4" />
                            <Skeleton className="h-8 w-1/3" />
                        </div>
                    </div>
                </div>
            </CarouselItem>
          ))
        ) : propertyList.length > 0 ? (
          propertyList.map((property) => (
            <CarouselItem key={property.id} className={cn("basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4", lang === 'ar' ? "pl-8" : "pr-8")}>
              <PropertyCard property={property} />
            </CarouselItem>
          ))
        ) : (
          <div className="w-full text-center py-10 text-muted-foreground">
             <p>لا توجد عقارات لعرضها حاليًا.</p>
          </div>
        )}
      </CarouselContent>
    </Carousel>
  );

  return (
    <div className="flex flex-col gap-16">
      <section className="relative h-[500px] flex items-center justify-center">
              <div
                  className="absolute inset-0 bg-no-repeat bg-center bg-cover"
                  style={{
                      backgroundImage: "url('/images/home.png')",
                      backgroundSize: "cover", // تغطي الخلفية بشكل مناسب
                      backgroundPosition: "center", // توسيط الصورة
                      height: "100%", // تأكد من أن الحاوية تأخذ كل الارتفاع
                      width: "100%",  // تأكد من أن الحاوية تأخذ كل العرض
                  }}
              ></div>

        <div className="relative z-10 text-center text-background-foreground p-4">
          <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 text-white drop-shadow-lg">
            {t.heroTitle}
          </h1>
          <p className="text-lg md:text-xl mb-8 text-white drop-shadow-md">
            {t.heroSubtitle}
          </p>
          <div className="max-w-3xl mx-auto">
             <form className="relative bg-background p-2 rounded-full shadow-xl flex items-center gap-2" action="/search">
                <Input
                    type="text"
                    name="q"
                    placeholder={t.searchPlaceholder}
                    className="flex-grow h-12 rounded-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg bg-transparent placeholder:text-foreground/70"
                    style={{textAlign: lang === 'ar' ? 'right' : 'left'}}
                />
                 <Sheet>
                    <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                        <SlidersHorizontal className="h-5 w-5" />
                        <span className="sr-only">{t.filters}</span>
                    </Button>
                    </SheetTrigger>
                    <SheetContent side={lang === 'ar' ? 'right' : 'left'} className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                        <SheetTitle>{t.filters}</SheetTitle>
                    </SheetHeader>
                    <div className="p-4 overflow-y-auto">
                        <HomepageFilters />
                    </div>
                    </SheetContent>
                </Sheet>
                <Button type="submit" size="lg" className="rounded-full h-12 bg-accent hover:bg-accent/90 px-6 flex-shrink-0">
                    <Search className="h-5 w-5" style={{marginRight: lang === 'ar' ? '0' : '0.5rem', marginLeft: lang === 'ar' ? '0.5rem' : '0'}} />
                    <span>{t.searchButton}</span>
                </Button>
            </form>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-headline font-bold text-center mb-8">
          {t.browseByCategory}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link href={category.href} key={category.name} className="block group">
              <Card className="text-center hover:shadow-lg hover:border-primary transition-all duration-300 h-full bg-card/80 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center p-6 gap-3">
                  <category.icon className="h-10 w-10 text-primary mb-2 transition-transform duration-300 group-hover:scale-110" />
                  <h3 className="text-base font-bold font-headline">{category.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      
      <section className="container mx-auto px-4">
         {renderPropertyCarousel(specialOffers, t.specialOffers)}
      </section>

      <section className="container mx-auto px-4">
        {renderPropertyCarousel(newlyAdded, t.newlyAdded)}
      </section>

      <section className="container mx-auto px-4 py-12 bg-secondary/30 rounded-lg">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-headline font-bold">{t.startHosting}</h2>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                {t.startHostingSubtitle}
            </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 text-center">
            <Card className="bg-background/70">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
                        <HomeIcon className="h-8 w-8" />
                    </div>
                    <CardTitle className="font-headline">{t.addProperty}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        {t.addPropertyDesc}
                    </p>
                </CardContent>
            </Card>
            <Card className="bg-background/70">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
                        <CalendarCheck className="h-8 w-8" />
                    </div>
                    <CardTitle className="font-headline">{t.receiveBookings}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        {t.receiveBookingsDesc}
                    </p>
                </CardContent>
            </Card>
            <Card className="bg-background/70">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
                        <Wallet className="h-8 w-8" />
                    </div>
                    <CardTitle className="font-headline">{t.getPaid}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        {t.getPaidDesc}
                    </p>
                </CardContent>
            </Card>
        </div>
        <div className="text-center mt-12">
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/signup">{t.joinAsHost}</Link>
            </Button>
        </div>
      </section>

          <section className="bg-background dark:bg-card">
              <div className="container mx-auto px-4 py-16">
                  <div className="bg-primary rounded-3xl p-8 md:p-12 lg:p-16 relative overflow-hidden">
                      <div className="grid md:grid-cols-2 gap-8 items-center">

                          {/* العمود الأول: النص */}
                          <div
                              className="relative z-10"
                              style={{ textAlign: lang === 'ar' ? 'right' : 'left' }}
                          >
                              <h3 className="text-lg font-semibold text-primary-foreground/90">
                                  {t.appName}
                              </h3>
                              <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mt-2 mb-4 leading-tight">
                                  {t.smartExperience}
                              </h2>

                              <p
                                  className="text-primary-foreground/80 max-w-md"
                                  style={{
                                      marginLeft: lang === 'ar' ? 'auto' : '0',
                                      marginRight: lang === 'ar' ? '0' : 'auto',
                                  }}
                              >
                                  {t.smartExperienceDesc}
                              </p>

                              <div
                                  className="flex items-center gap-4 mt-8"
                                  style={{ justifyContent: lang === 'ar' ? 'flex-end' : 'flex-start' }}
                              >
                                  <Button
                                      asChild
                                      size="lg"
                                      variant="secondary"
                                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                                  >
                                      <Link href="/search" aria-label={t.browseNow}>
                                          {t.browseNow}
                                      </Link>
                                  </Button>

                                  <Image
                                      src="/images/4.png"
                                      alt="تحميل من Google Play و App Store"
                                      width={370}
                                      height={300}
                                      className="cursor-pointer"
                                  />
                              </div>
                          </div>

                          {/* العمود الثاني: الصورة */}
                          <div className="w-full">
                              <Image
                                  src="/images/5.png"
                                  alt="Website demo"
                                  width={1860}
                                  height={1740}
                                  style={{ width: '150%', height: 'auto', objectFit: 'cover' }}
                              />

                          </div>

                      </div>
                  </div>
              </div>
          </section>

    </div>
  );
}
