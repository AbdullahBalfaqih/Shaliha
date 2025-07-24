

"use client";

import Image from "next/image";
import dynamic from 'next/dynamic';
import { useParams, notFound, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star, MapPin, Users, BedDouble, Bath, Wifi, Waves, CookingPot, ParkingSquare, Tv, Sun, Menu, Calendar as CalendarIcon, Shield, Sofa, Flame, Music, Zap, RefreshCw, X, Share2, ArrowLeft, Moon, AlertCircle, Clock, MessageSquare } from "lucide-react";
import type { Amenity, Property, BookingPeriod, Currency } from "@/types";
import { PropertyActions } from "@/components/property-actions";
import { arSA, enUS } from "date-fns/locale";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogTrigger, DialogClose, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays, parseISO } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-toggle";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { getPropertyById, checkIfWishlisted } from "../actions";
import { createOrGetConversation } from "@/app/chat/actions";
import { Skeleton } from "@/components/ui/skeleton";


const MapView = dynamic(() => import('@/components/map-view'), { 
  ssr: false,
  loading: () => <Skeleton className="w-full h-[400px] rounded-xl" />
});


const amenityIcons: Record<string, React.ElementType> = {
  wifi: Wifi,
  pool: Waves,
  kitchen: CookingPot,
  parking: ParkingSquare,
  tv: Tv,
  ac: Sun,
  power_backup: Zap,
  speakers: Music,
  bbq: Flame,
};

const amenityTranslations = {
  ar: { wifi: "إنترنت", pool: "مسبح", kitchen: "مطبخ", parking: "موقف سيارات", tv: "تلفزيون", ac: "تكييف", power_backup: "مزود طاقة", speakers: "سماعات", bbq: "ركن شواء" },
  en: { wifi: "Wi-Fi", pool: "Pool", kitchen: "Kitchen", parking: "Parking", tv: "TV", ac: "Air Conditioning", power_backup: "Power Backup", speakers: "Speakers", bbq: "BBQ" }
}

const translations = {
  ar: {
    showAllImages: "عرض كل الصور",
    propertyDetailsTitle: (type: string) => `تفاصيل ${type}`,
    guests: "ضيوف",
    bedrooms: "غرف نوم",
    lounges: "مجالس",
    bathrooms: "حمامات",
    description: "الوصف",
    showMore: "أظهر المزيد",
    showLess: "أظهر أقل",
    amenities: "ما يوفره هذا المكان",
    whereYouWillBe: "أين ستكون",
    bookingDetails: "بيانات الحجز",
    checkIn: "الوصول",
    checkOut: "المغادرة",
    selectDate: "اختر تاريخ",
    selectPeriod: "اختر الفترة",
    morning: "صباحي",
    evening: "مسائي",
    costLine: (price: string, currency: string, nights: number) => `${price} ${currency} × ${nights} ${nights === 1 ? 'ليلة' : 'ليالٍ'}`,
    costPerPeriod: (price: string, currency: string) => `${price} ${currency} / للفترة`,
    serviceFee: "رسوم الخدمة",
    total: "الإجمالي",
    bookNow: "متابعة الحجز",
    deposit: (amount: string, currency: string) => `يتطلب عربون بقيمة ${amount} ${currency}`,
    pricePerPeriod: "| فترة",
    pricePerNight: "| ليلة",
    selectDateAndPeriod: "الرجاء تحديد تاريخ وفترة",
    selectDates: "الرجاء تحديد تواريخ الحجز",
    nights: (count: number) => count === 1 ? 'ليلة واحدة' : (count === 2 ? 'ليلتان' : `${count} ليالٍ`),
    SAR: "ريال",
    YER: "ريال",
    shareProperty: "مشاركة العقار",
    linkCopied: "تم نسخ الرابط",
    linkCopiedDescription: "يمكنك الآن مشاركة رابط العقار مع أصدقائك.",
    cancellationPolicyTitle: "شروط الحجز و الالغاء",
    propertyRules: "قوانين هذا المبيت",
    cancellationPolicy: "سياسة الإلغاء",
    noCancellation: "لا يمكن الغاء الحجز أو تعديله.",
    approximateLocation: "الموقع الذي ستقيم فيه",
    approximateLocationDesc: "سيظهر الان الموقع التقريبي للمكان وليس الموقع الدقيق ",
    dayBooked: "هذا اليوم محجوز بالكامل",
    reviews: (count: number) => count === 1 ? 'تقييم واحد' : (count === 2 ? 'تقييمين' : `${count} تقييمات`),
    noReviews: "لا توجد تقييمات بعد",
    periodBooked: "هذه الفترة محجوزة",
    bookingNotAvailable: "الحجز غير متاح",
    refreshingAvailability: "جاري تحديث التوفر...",
    contactHost: "تواصل مع المضيف",
    contactingHost: "جاري إنشاء المحادثة..."
  },
  en: {
    showAllImages: "Show all images",
    propertyDetailsTitle: (type: string) => `${type} Details`,
    guests: "guests",
    bedrooms: "bedrooms",
    lounges: "lounges",
    bathrooms: "bathrooms",
    description: "Description",
    showMore: "Show more",
    showLess: "Show less",
    amenities: "What this place offers",
    whereYouWillBe: "Where you'll be",
    bookingDetails: "Booking Details",
    checkIn: "Check-in",
    checkOut: "Checkout",
    selectDate: "Select date",
    selectPeriod: "Select Period",
    morning: "Morning",
    evening: "Evening",
    costLine: (price: string, currency: string, nights: number) => `${currency} ${price} × ${nights} ${nights === 1 ? 'night' : 'nights'}`,
    costPerPeriod: (price: string, currency: string) => `${currency} ${price} / period`,
    serviceFee: "Service fee",
    total: "Total",
    bookNow: "Continue to book",
    deposit: (amount: string, currency: string) => `Requires a deposit of ${amount} ${currency}`,
    pricePerPeriod: "| period",
    pricePerNight: "| night",
    selectDateAndPeriod: "Please select a date and period",
    selectDates: "Please select your booking dates",
    nights: (count: number) => `${count} ${count === 1 ? 'night' : 'nights'}`,
    SAR: "SAR",
    YER: "YER",
    shareProperty: "Share Property",
    linkCopied: "Link Copied",
    linkCopiedDescription: "You can now share the property link with your friends.",
    cancellationPolicyTitle: "Booking & Cancellation Policy",
    propertyRules: "House Rules",
    cancellationPolicy: "Cancellation Policy",
    noCancellation: "Cancellation or modification is not possible.",
    approximateLocation: "The location where you'll be staying",
    approximateLocationDesc: "The approximate location will be shown now, not the exact location.",
    dayBooked: "This day is fully booked",
    reviews: (count: number) => count === 1 ? '1 review' : `${count} reviews`,
    noReviews: "No reviews yet",
    periodBooked: "This period is booked",
    bookingNotAvailable: "Booking not available",
    refreshingAvailability: "Refreshing availability...",
    contactHost: "Contact Host",
    contactingHost: "Creating conversation..."
  }
};

const formatTime = (time: string | undefined, locale: Locale): string => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return new Intl.DateTimeFormat(locale.code, { hour: 'numeric', minute: 'numeric', hour12: true }).format(date);
};

function ImageGallery({ images, title }: { images: string[], title: string }) {
    const lang = useLanguage();
    const t = translations[lang];
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    if (!images || images.length === 0) return <Skeleton className="aspect-video w-full rounded-xl" />;
    const normalizedImages = images.map(src => src.startsWith('/') ? src : '/' + src);

    const handleShare = async () => {
        try {
            await navigator.share({ title, url: window.location.href });
        } catch (err) {
            navigator.clipboard.writeText(window.location.href);
            toast({
                title: t.linkCopied,
                description: t.linkCopiedDescription,
            });
        }
    };

    return (
        <>
            <Dialog>
                <DialogTrigger asChild>
                    <div className="relative aspect-video overflow-hidden rounded-xl cursor-pointer">
                        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-full">
                            <div className="col-span-2 row-span-2 relative">
                                <Image
                                    src={images[0]}
                                    alt={`${title} main image`}
                                    fill
                                    priority
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                                    className="object-cover hover:opacity-90 transition-opacity"
                                    data-ai-hint={title.includes('شاليه') || title.toLowerCase().includes('chalet') ? 'chalet interior' : 'swimming pool'}
                                />
                            </div>
                            {images.slice(1, 5).map((src, index) => (
                                <div key={index} className={cn("relative", index > 1 && "hidden md:block")}>
                                    <Image
                                        src={src}
                                        alt={`${title} image ${index + 1}`}
                                        fill
                                        sizes="(max-width: 1200px) 25vw, 400px"
                                        className="object-cover hover:opacity-90 transition-opacity"
                                        data-ai-hint={title.includes('شاليه') || title.toLowerCase().includes('chalet') ? 'chalet interior' : 'swimming pool'}
                                    />
                                </div>
                            ))}
                        </div>
                        <Button variant="secondary" className="absolute bottom-4 left-4 z-10">
                            <Menu className="ml-2 h-4 w-4" />
                            {t.showAllImages}
                        </Button>
                    </div>
                </DialogTrigger>
                <DialogContent className="bg-background/95 border-0 p-0 w-full max-w-screen-lg h-[90vh] sm:h-[620px] flex flex-col">
                    <DialogHeader className="p-4 flex-row items-center justify-between border-b shrink-0">
                        <DialogTitle className="text-base sm:text-lg font-semibold truncate">{title}</DialogTitle>
                        <DialogClose className="relative right-0 top-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </DialogClose>
                    </DialogHeader>

                    <div className="p-4 flex-1 min-h-0">
                        <Carousel
                            opts={{
                                align: "start",
                                direction: lang === "ar" ? "rtl" : "ltr",
                            }}
                            className="w-full relative"
                        >
                            <CarouselContent className="h-[70vh] sm:h-[500px]">
                                {images.map((src, idx) => (
                                    <CarouselItem key={idx} className="basis-full relative">
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={src}
                                                alt={`Image ${idx + 1}`}
                                                fill
                                                style={{ objectFit: "contain" }}
                                                className="rounded-xl"
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>

                            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-20" />
                            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-20" />
                        </Carousel>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}


function BookingCard({ property, onDataRefresh, isRefreshing }: { property: Property, onDataRefresh: () => void, isRefreshing: boolean }) {
    const { user } = useAuth();
    const router = useRouter();
    const lang = useLanguage();
    const t = translations[lang];
    const { toast } = useToast();

    const [date, setDate] = useState<Date | undefined>();
    const [selectedPeriod, setSelectedPeriod] = useState<BookingPeriod | undefined>();

    const bookedStatusByDate = useMemo(() => {
        const status: { [key: string]: { bookedPeriods: BookingPeriod[], isFull: boolean } } = {};
        if (!property.bookedDates) return status;

        property.bookedDates.forEach(booking => {
            const dateStr = booking.date;
            if (!status[dateStr]) {
                status[dateStr] = { bookedPeriods: [], isFull: false };
            }
            booking.periods.forEach(p => status[dateStr].bookedPeriods.push(p));

            status[dateStr].isFull = property.booking_system === 'single_period' ||
                status[dateStr].bookedPeriods.includes('full_day') ||
                (status[dateStr].bookedPeriods.includes('morning') && status[dateStr].bookedPeriods.includes('evening'));
        });
        return status;
    }, [property.bookedDates, property.booking_system]);

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        if (selectedDate) {
            setSelectedPeriod(undefined);
            const selectedDayStr = format(selectedDate, 'yyyy-MM-dd');
            if (bookedStatusByDate[selectedDayStr]?.isFull) {
                toast({
                    title: t.dayBooked,
                    variant: "destructive",
                });
            }
        }
    };
    
    const locale = lang === 'ar' ? arSA : enUS;
    
    const fullyBookedDays = Object.keys(bookedStatusByDate)
        .filter(dateStr => bookedStatusByDate[dateStr].isFull)
        .map(dateStr => parseISO(dateStr));

    const isPeriodBooked = (period: BookingPeriod) => {
        if (!date) return false;
        const selectedDayStr = format(date, 'yyyy-MM-dd');
        const dayStatus = bookedStatusByDate[selectedDayStr];
        return dayStatus?.bookedPeriods.includes(period) || false;
    };
    
    const isSingleDayBooking = !!date;

    let price = 0;
    let pricePerUnit = property.price_per_night || (property.morning_period as any)?.price || 0;
    
    if (isSingleDayBooking && property.booking_system === 'dual_period' && selectedPeriod) {
        if (selectedPeriod === 'morning' && property.morning_period) {
            price = (property.morning_period as any).price;
            pricePerUnit = price;
        } else if (selectedPeriod === 'evening' && property.evening_period) {
            price = (property.evening_period as any).price;
            pricePerUnit = price;
        }
    } else if(isSingleDayBooking && property.booking_system === 'single_period') {
        price = property.price_per_night;
    }

    const serviceFee = price > 0 ? price * 0.03 : 0;
    const total = price + serviceFee;
    
    const isCheckoutOnNextDay = (checkIn: string, checkOut: string): boolean => {
      if (!checkIn || !checkOut) return false;
      const checkInHour = parseInt(checkIn.split(':')[0], 10);
      const checkOutHour = parseInt(checkOut.split(':')[0], 10);
      return checkOutHour < checkInHour;
    };
    
    let checkInTime: string | undefined, checkOutTime: string | undefined;

    if (isSingleDayBooking) {
        if (property.booking_system === 'dual_period') {
            if (selectedPeriod === 'morning') {
                checkInTime = (property.morning_period as any)?.checkIn;
                checkOutTime = (property.morning_period as any)?.checkOut;
            } else if (selectedPeriod === 'evening') {
                checkInTime = (property.evening_period as any)?.checkIn;
                checkOutTime = (property.evening_period as any)?.checkOut;
            }
        } else { // single_period
            checkInTime = (property.morning_period as any)?.checkIn || "16:00";
            checkOutTime = (property.morning_period as any)?.checkOut || "10:00";
        }
    }
    
    const checkoutDate = date && checkInTime && checkOutTime
        ? isCheckoutOnNextDay(checkInTime, checkOutTime)
            ? addDays(date, 1)
            : date
        : null;


    const isDateSelectionBooked = useMemo(() => {
        if (!isSingleDayBooking || !date) return false;
        const selectedDayStr = format(date, 'yyyy-MM-dd');
        const dayStatus = bookedStatusByDate[selectedDayStr];
        if (dayStatus?.isFull) return true;
        if (property.booking_system === 'dual_period' && selectedPeriod) {
            return dayStatus?.bookedPeriods.includes(selectedPeriod) || false;
        }
        if (property.booking_system === 'single_period' && dayStatus?.bookedPeriods.length > 0) {
            return true;
        }
        return false;
    }, [date, selectedPeriod, property.booking_system, bookedStatusByDate, isSingleDayBooking]);

    const isBookingReady = total > 0 && !isDateSelectionBooked;
    
    const handleBooking = () => {
        if (!user) {
            router.push('/login');
        } else {
             const params = new URLSearchParams();
             params.set('propertyId', property.id);
             if (date) {
                params.set('date', date.getTime().toString());
             }
             if (selectedPeriod) {
                 params.set('period', selectedPeriod);
             }
             router.push(`/payment?${params.toString()}`);
        }
    };
    
    return (
        <Card className="sticky top-24 shadow-lg bg-card border border-border">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                     <div className="text-2xl font-semibold text-primary text-right">
                        {pricePerUnit.toLocaleString()} {t[property.currency as Currency]}
                        <span className="text-base text-muted-foreground font-normal">
                            {` ${t.pricePerPeriod}`}
                        </span>
                    </div>
                     <Button variant="ghost" size="icon" onClick={onDataRefresh} disabled={isRefreshing} title={t.refreshingAvailability}>
                        <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label className="font-semibold text-sm">{t.bookingDetails}</Label>
                    <div className="mt-2 border rounded-lg p-3 flex justify-between items-center">
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">{t.checkIn}</p>
                            <p className="font-semibold">{date ? format(date, "d MMM", { locale }) : '--'}</p>
                        </div>
                        <ArrowLeft className="w-5 h-5 text-muted-foreground shrink-0" />
                        <div className="text-center">
                            <p className="text-xs text-muted-foreground">{t.checkOut}</p>
                            <p className="font-semibold">{checkoutDate ? format(checkoutDate, "d MMM", { locale }) : '--'}</p>
                        </div>
                    </div>
                </div>
                
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full"
                        >
                            <CalendarIcon className="ml-2 h-4 w-4" />
                            <span>{date ? format(date, "d MMMM yyyy", { locale }) : t.selectDate}</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            locale={locale}
                            dir={lang}
                            numberOfMonths={1}
                            disabled={[{ before: new Date() }, ...fullyBookedDays]}
                        />
                    </PopoverContent>
                </Popover>

                {isSingleDayBooking && property.booking_system === 'dual_period' && (
                    <div>
                        <RadioGroup
                            value={selectedPeriod}
                            onValueChange={(value: BookingPeriod) => setSelectedPeriod(value)}
                            className="grid grid-cols-2 gap-2 mt-2"
                        >
                            <Label className={cn("flex items-center justify-center rounded-md border p-3 cursor-pointer text-sm h-24 flex-col gap-1", selectedPeriod === 'morning' ? 'border-primary bg-primary/10' : 'border-muted', isPeriodBooked('morning') && 'opacity-50 cursor-not-allowed')}>
                                <RadioGroupItem value="morning" id="morning" className="sr-only" disabled={isPeriodBooked('morning')} />
                                <Sun className="w-8 h-8 mb-1" />
                                {t.morning}
                                {property.morning_period && <span className="text-xs font-bold text-muted-foreground">{formatTime((property.morning_period as any)?.checkIn, locale)} - {formatTime((property.morning_period as any)?.checkOut, locale)}</span>}
                            </Label>
                            <Label className={cn("flex items-center justify-center rounded-md border p-3 cursor-pointer text-sm h-24 flex-col gap-1", selectedPeriod === 'evening' ? 'border-primary bg-primary/10' : 'border-muted', isPeriodBooked('evening') && 'opacity-50 cursor-not-allowed')}>
                                <RadioGroupItem value="evening" id="evening" className="sr-only" disabled={isPeriodBooked('evening')} />
                                <Moon className="w-8 h-8 mb-1" />
                                {t.evening}
                                {property.evening_period && <span className="text-xs font-bold text-muted-foreground">{formatTime((property.evening_period as any)?.checkIn, locale)} - {formatTime((property.evening_period as any)?.checkOut, locale)}</span>}
                            </Label>
                        </RadioGroup>
                        {isPeriodBooked(selectedPeriod!) && <p className="text-destructive text-xs text-center mt-2 flex items-center justify-center gap-1"><AlertCircle className="w-3 h-3"/> {t.periodBooked}</p>}
                    </div>
                )}

                {isBookingReady && (
                    <div className="space-y-2 text-sm pt-4 border-t">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.costPerPeriod(pricePerUnit.toLocaleString(), '')}</span>
                            <span>{price.toLocaleString()} {t[property.currency as Currency]}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t.serviceFee}</span>
                            <span>{serviceFee.toLocaleString()} {t[property.currency as Currency]}</span>
                        </div>
                        <Separator className="my-3"/>
                        <div className="flex justify-between font-bold text-base">
                            <span>{t.total}</span>
                            <span>{total.toLocaleString()} {t[property.currency as Currency]}</span>
                        </div>
                        {property.has_deposit && property.deposit_amount && (
                            <p className="text-center text-xs text-muted-foreground pt-2">
                                {t.deposit(property.deposit_amount.toLocaleString(), t[property.currency as Currency])}
                            </p>
                        )}
                    </div>
                )}

                <Button
                    className="w-full bg-accent text-accent-foreground text-lg h-12 hover:bg-accent/90"
                    disabled={!isBookingReady}
                    onClick={handleBooking}
                >
                    {isDateSelectionBooked ? t.bookingNotAvailable : (isBookingReady ? t.bookNow : t.selectDateAndPeriod)}
                </Button>
            </CardContent>
        </Card>
    );
}

export default function PropertyDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isContacting, setIsContacting] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isInitiallyWishlisted, setIsInitiallyWishlisted] = useState(false);
  const lang = useLanguage();
  const t = translations[lang];
  const { toast } = useToast();

  const fetchPropertyData = useCallback(async (isRefresh = false) => {
      if (!id) return;
      if (isRefresh) setIsRefreshing(true);
      else setLoading(true);

      const [propertyData, wishlistedResult] = await Promise.all([
          getPropertyById(id),
          user ? checkIfWishlisted(id, user.id) : Promise.resolve({ isWishlisted: false })
      ]);
      
      setProperty(propertyData as Property | null);
      if (!isRefresh) {
        setIsInitiallyWishlisted(wishlistedResult.isWishlisted);
      }
      
      if (isRefresh) setIsRefreshing(false);
      else setLoading(false);
  }, [id, user]);

  useEffect(() => {
    fetchPropertyData();
  }, [id, user, fetchPropertyData]);

  const handleContactHost = async () => {
    if (!user) {
        router.push('/login');
        return;
    }
    if (!property || user.id === property.host_id) return;

    setIsContacting(true);
    const result = await createOrGetConversation({
        propertyId: property.id, 
        hostId: property.host_id, 
        guestId: user.id 
    });
    setIsContacting(false);

    if (result.success) {
        router.push('/chat');
    } else {
        console.error("Error creating conversation:", result.error);
        toast({ title: "خطأ", description: result.error, variant: "destructive" });
    }
  };


  if (loading) {
    return (
        <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-6" />
            <Skeleton className="aspect-video w-full rounded-xl mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                <div className="lg:col-span-2 space-y-8">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <div className="lg:col-span-1">
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        </div>
    );
  }
  
  if (!property) {
    notFound();
  }

  const { lat, lng } = property.coordinates as { lat: number; lng: number; };
  const title = lang === 'ar' ? property.title : property.title_en;
  const location = lang === 'ar' ? property.location : property.location_en;
  const description = lang === 'ar' ? property.description : property.description_en;
  const type = lang === 'ar' ? property.type : property.type_en;
    const dedicatedFor = lang === 'ar' ? property.dedicated_for : property.dedicated_for_en;
  const cancellationPolicy = lang === 'ar' ? property.cancellation_policy : property.cancellation_policy_en;
  const reviewCount = property.review_count || 0;
  const rating = property.rating || 0;
  
  const locale = lang === 'ar' ? arSA : enUS;

  const getBookingTimes = () => {
    if (property.booking_system === 'single_period') {
        const checkIn = (property.morning_period as any)?.checkIn || "16:00";
        const checkOut = (property.morning_period as any)?.checkOut || "10:00";
        return { 
            checkIn: formatTime(checkIn, locale),
            checkOut: formatTime(checkOut, locale)
        };
    } else { // dual_period
        const morningCheckIn = (property.morning_period as any)?.checkIn;
        const morningCheckOut = (property.morning_period as any)?.checkOut;
        const eveningCheckIn = (property.evening_period as any)?.checkIn;
        const eveningCheckOut = (property.evening_period as any)?.checkOut;

        const checkIn = `${t.morning}: ${formatTime(morningCheckIn, locale)} | ${t.evening}: ${formatTime(eveningCheckIn, locale)}`;
        const checkOut = `${t.morning}: ${formatTime(morningCheckOut, locale)} | ${t.evening}: ${formatTime(eveningCheckOut, locale)}`;
        return { checkIn, checkOut };
    }
  };
  const { checkIn: checkInTimes, checkOut: checkOutTimes } = getBookingTimes();

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-headline font-bold">{title}</h1>
           <PropertyActions propertyId={property.id} initialIsWishlisted={isInitiallyWishlisted} onWishlistToggle={fetchPropertyData}/>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground mt-2">
           <div className="flex items-center gap-1">
                {reviewCount > 0 ? (
                    <>
                        <Star className="w-4 h-4 text-accent fill-accent" />
                        <span className="font-bold text-foreground">{rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({t.reviews(reviewCount)})</span>
                    </>
                ) : (
                    <span className="text-muted-foreground">{t.noReviews}</span>
                )}
           </div>
           <span className="text-muted-foreground">·</span>
           <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <a href="#location" className="underline hover:text-foreground">{location}</a>
          </div>
        </div>
      </header>

      <ImageGallery images={property.images ?? []} title={title} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-16 mt-8">
        <main className="lg:col-span-2 space-y-8">
            <section className="pb-6 border-b">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-headline font-semibold">{t.propertyDetailsTitle(type)}</h2>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground mt-2">
                            <div className="flex items-center gap-2"> <Users /> {property.guests} {t.guests} </div>
                            {property.lounges && property.lounges > 0 && <div className="flex items-center gap-2"> <Sofa /> {property.lounges} {t.lounges} </div>}
                            {property.bedrooms > 0 && <div className="flex items-center gap-2"> <BedDouble /> {property.bedrooms} {t.bedrooms} </div>}
                            {property.bathrooms > 0 && <div className="flex items-center gap-2"> <Bath /> {property.bathrooms} {t.bathrooms} </div>}
                        </div>
                    </div>
                          <Badge variant="secondary" className="px-4 py-2 text-base bg-accent/20 text-black border-accent">
                              {dedicatedFor}
                          </Badge>

                </div>
            </section>
            
            <section className="pb-6 border-b">
                <h3 className="text-2xl font-headline font-semibold mb-6">{t.bookingDetails}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex items-center gap-4">
                        <Clock className="w-8 h-8 text-primary"/>
                        <div>
                            <h4 className="font-semibold">{t.checkIn}</h4>
                            <p className="text-muted-foreground">{checkInTimes}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Clock className="w-8 h-8 text-primary"/>
                        <div>
                            <h4 className="font-semibold">{t.checkOut}</h4>
                            <p className="text-muted-foreground">{checkOutTimes}</p>
                        </div>
                    </div>
                </div>
            </section>
            
            {description && (
                <section className="pb-6 border-b">
                     <h3 className="text-2xl font-headline font-semibold mb-4">{t.description}</h3>
                     <p className={cn(
                        "text-foreground/80 whitespace-pre-line leading-relaxed",
                        !isDescriptionExpanded && "max-h-32 overflow-hidden relative",
                        !isDescriptionExpanded && "after:absolute after:bottom-0 after:left-0 after:w-full after:h-12 after:bg-gradient-to-t after:from-background"
                     )}>
                        {description}
                     </p>
                     <Button variant="link" className="p-0 mt-2" onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                        {isDescriptionExpanded ? t.showLess : t.showMore}
                     </Button>
                </section>
            )}
            
            {property.amenities && property.amenities.length > 0 &&
              <section className="pb-6 border-b">
                  <h3 className="text-2xl font-headline font-semibold mb-4">{t.amenities}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {property.amenities.map((amenity) => {
                      const Icon = amenityIcons[amenity];
                      const label = amenityTranslations[lang][amenity as keyof typeof amenityTranslations['ar']];
                      if (!Icon || !label) return null;
                      return (
                          <div key={amenity} className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-primary" />
                            <span className="font-medium text-sm">{label}</span>
                          </div>
                      );
                      })}
                  </div>
              </section>
            }

            <section id="location" className="pb-6 border-b">
                <h3 className="text-2xl font-headline font-semibold mb-4">{t.whereYouWillBe}</h3>
                <div className="h-[400px] rounded-xl overflow-hidden border">
                    <MapView position={[lat, lng]} />
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">{t.approximateLocationDesc}</p>
            </section>

            <section>
                <h3 className="text-2xl font-headline font-semibold mb-4">{t.cancellationPolicyTitle}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-semibold mb-2">{t.cancellationPolicy}</h4>
                        <p className="text-muted-foreground">{cancellationPolicy || t.noCancellation}</p>
                    </div>
                    <div>
                     
                         {user && user.id !== property.host_id && (
                            <Button onClick={handleContactHost} variant="outline" className="mt-4" disabled={isContacting}>
                                <MessageSquare className="ml-2 h-4 w-4" />
                                {isContacting ? t.contactingHost : t.contactHost}
                            </Button>
                         )}
                    </div>
                </div>
            </section>
        </main>

        <aside>
            <BookingCard property={property} onDataRefresh={() => fetchPropertyData(true)} isRefreshing={isRefreshing} />
        </aside>
      </div>
    </div>
  )
}
