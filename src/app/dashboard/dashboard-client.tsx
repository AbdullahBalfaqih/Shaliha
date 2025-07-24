
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PropertyCard } from "@/components/property-card";
import { Badge } from "@/components/ui/badge";
import type { Booking, Property, BookingPeriod, BookingStatus } from "@/types";
import Link from "next/link";
import { Star, Trash2, XCircle, Eye, X, Calendar, Clock, AlertTriangle, CalendarClock, Loader2 } from "lucide-react";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription as AlertDialogDescriptionComponent, AlertDialogTrigger, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { arSA } from "date-fns/locale";
import { format, isBefore, startOfToday, parseISO } from 'date-fns';
import { getUserDashboardData, requestBookingCancellation, requestBookingReschedule, submitReview, updateProfile } from "./actions";
import type { UserDetails } from '@/context/auth-context';
import { getPropertyById } from "@/app/properties/actions";


const statusTranslations: Record<BookingStatus, string> = {
  confirmed: 'مؤكد',
  pending: 'قيد المعالجة',
  cancelled: 'ملغي',
  completed: 'منقضي',
};

const statusVariants: Record<BookingStatus, "default" | "secondary" | "destructive" | "outline"> = {
    confirmed: 'default',
    pending: 'secondary',
    cancelled: 'destructive',
    completed: 'outline',
};

function RatingDialog({ open, onOpenChange, onSubmit }: { open: boolean, onOpenChange: (open: boolean) => void, onSubmit: (rating: number, comment: string) => void }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    const handleSubmit = () => {
        onSubmit(rating, comment);
        onOpenChange(false);
        setRating(0);
        setComment("");
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle>تقييم تجربتك</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div className="space-y-2">
                        <Label>تقييمك العام</Label>
                        <div className="flex justify-center items-center gap-1" dir="ltr">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`h-8 w-8 cursor-pointer transition-colors ${rating >= star ? 'text-accent fill-accent' : 'text-muted-foreground/50'}`}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="comment">اكتب رأيك (اختياري)</Label>
                        <Textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="صف لنا كيف كانت تجربتك..." />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={rating === 0}>إرسال التقييم</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function RescheduleDialog({ booking, open, onOpenChange, onSubmit }: { booking: Booking | null, open: boolean, onOpenChange: (open: boolean) => void, onSubmit: (bookingId: string, newDate: Date, newPeriod: BookingPeriod) => void }) {
    const [newDate, setNewDate] = useState<Date | undefined>();
    const [newPeriod, setNewPeriod] = useState<BookingPeriod | undefined>();
    const [propertyDetails, setPropertyDetails] = useState<Property | null>(null);

    useEffect(() => {
        const fetchPropertyDetails = async () => {
            if (booking && booking.properties) {
                const details = await getPropertyById(booking.properties.id);
                setPropertyDetails(details);
            }
        };

        if (open) {
            fetchPropertyDetails();
        } else {
            // Reset state when dialog closes
            setNewDate(undefined);
            setNewPeriod(undefined);
            setPropertyDetails(null);
        }
    }, [open, booking]);
    
    useEffect(() => {
        if(propertyDetails && propertyDetails.booking_system === 'single_period') {
            setNewPeriod('full_day');
        }
    }, [propertyDetails]);

    const handleSubmit = () => {
        if (booking && newDate && newPeriod) {
            onSubmit(booking.id, newDate, newPeriod);
            onOpenChange(false);
        }
    };
    
    if (!booking || !propertyDetails) return null;

    const isPeriodBooked = (period: BookingPeriod) => {
        if (!newDate) return false;
        const dateString = newDate.toISOString().split('T')[0];
        
        return propertyDetails.bookedDates?.some((d: any) => d.date === dateString && d.periods.includes(period));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle>طلب تغيير موعد الحجز</DialogTitle>
                    <DialogDescription>اختر تاريخاً وفترة جديدة لحجزك.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     <div className="space-y-2">
                        <Label>اختر التاريخ الجديد</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                               <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !newDate && "text-muted-foreground")}>
                                    <Calendar className="ml-2 h-4 w-4" />
                                    {newDate ? format(newDate, "d MMMM yyyy", { locale: arSA }) : <span>اختر تاريخاً</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <CalendarPicker
                                    mode="single"
                                    selected={newDate}
                                    onSelect={setNewDate}
                                    disabled={[{ before: new Date() }]}
                                    initialFocus
                                    locale={arSA}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                     {newDate && propertyDetails.booking_system === 'dual_period' && (
                        <div className="space-y-2">
                            <Label>اختر الفترة الجديدة</Label>
                            <RadioGroup
                                value={newPeriod}
                                onValueChange={(value: BookingPeriod) => setNewPeriod(value)}
                                className="grid grid-cols-2 gap-2 mt-2"
                            >
                                <Label className={cn("flex items-center justify-center rounded-md border p-3 cursor-pointer text-sm h-12", newPeriod === 'morning' ? 'border-primary bg-primary/10' : 'border-muted', isPeriodBooked('morning') && 'opacity-50 cursor-not-allowed')}>
                                    <RadioGroupItem value="morning" id="morning" className="sr-only" disabled={isPeriodBooked('morning')} />
                                    صباحي
                                </Label>
                                <Label className={cn("flex items-center justify-center rounded-md border p-3 cursor-pointer text-sm h-12", newPeriod === 'evening' ? 'border-primary bg-primary/10' : 'border-muted', isPeriodBooked('evening') && 'opacity-50 cursor-not-allowed')}>
                                    <RadioGroupItem value="evening" id="evening" className="sr-only" disabled={isPeriodBooked('evening')} />
                                    مسائي
                                </Label>
                            </RadioGroup>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                    <Button onClick={handleSubmit} disabled={!newDate || !newPeriod}>إرسال طلب التغيير</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function BookingDetailsDialog({ booking, open, onOpenChange }: { booking: Booking | null, open: boolean, onOpenChange: (open: boolean) => void }) {
    if (!booking) return null;
    const property = booking.properties as any;
    if (!property) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl" className="sm:max-w-md">
                <DialogHeader className="text-right pb-4 border-b">
                    <DialogTitle className="text-xl">تفاصيل الحجز</DialogTitle>
                    <DialogClose className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </DialogHeader>
                <div className="space-y-4 text-right py-4">
                    <div className="space-y-2">
                        <p><span className="font-bold text-muted-foreground">العقار:</span> {property.title}</p>
                        <p className="flex items-center justify-end gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><span className="font-bold text-muted-foreground">التاريخ:</span> {booking.booking_date}</p>
                        <p className="flex items-center justify-end gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><span className="font-bold text-muted-foreground">الفترة:</span> {booking.period === 'full_day' ? 'يوم كامل' : (booking.period === 'morning' ? 'صباحي' : 'مسائي')}</p>
                        <p><span className="font-bold text-muted-foreground">الحالة:</span> {statusTranslations[booking.status]}</p>
                    </div>
                    {booking.payment_proof_url && (
                        <div className="space-y-2 pt-4 border-t">
                            <h4 className="font-bold text-muted-foreground">إثبات الدفع:</h4>
                            <div className="relative w-full h-96 bg-secondary rounded-md">
                                <Image src={booking.payment_proof_url} layout="fill" objectFit="contain" alt="إثبات الدفع" data-ai-hint="receipt document" />
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter className="pt-4 border-t">
                    <DialogClose asChild>
                        <Button variant="outline" className="w-full">إغلاق</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function DashboardClientPage() {
  const { user: authUser, loading, updateUserInContext } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishlist, setWishlist] = useState<Property[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserDetails | null>(authUser);
  
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [fullName, setFullName] = useState(authUser?.full_name || '');


  const fetchData = useCallback(async (userId: string) => {
      setPageLoading(true);
      const { bookings, wishlist, user, error } = await getUserDashboardData(userId);
      if(error) {
        toast({ title: "خطأ", description: error, variant: 'destructive'});
      } else {
        setBookings(bookings as any);
        setWishlist(wishlist as any);
        setCurrentUser(user as UserDetails | null);
        setFullName(user?.full_name || '');
      }
      setPageLoading(false);
  }, [toast]);
  
  useEffect(() => {
    if (loading) return;
    if (!authUser) {
        router.push('/login');
        return;
    }
    
    fetchData(authUser.id);
  }, [authUser, loading, router, fetchData]);
  
  useEffect(() => {
    setCurrentUser(authUser);
    setFullName(authUser?.full_name || '');
  }, [authUser]);

  const processedBookings = useMemo(() => {
      if (!bookings) return [];
      const today = startOfToday();
      return bookings.map(booking => {
          const bookingDate = parseISO(booking.booking_date);
          const isCompleted = isBefore(bookingDate, today) && booking.status !== 'cancelled';
          return {
              ...booking,
              status: isCompleted ? 'completed' : booking.status,
          };
      }).sort((a, b) => parseISO(b.booking_date).getTime() - parseISO(a.booking_date).getTime());
  }, [bookings]);
  
  const handleRatingSubmit = async (rating: number, comment: string) => {
      if (!selectedBooking || !currentUser) return;
      const property = selectedBooking.properties as any;
      if (!property?.host_id) {
          toast({ title: "خطأ", description: "معلومات المضيف غير متوفرة.", variant: 'destructive'});
          return;
      }
      const result = await submitReview(currentUser.id, selectedBooking.id, property.id, property.host_id, rating, comment);
      if(result.success) {
        toast({
            title: "تم إرسال تقييمك بنجاح!",
            description: "شكرًا لك على مشاركة رأيك.",
        });
        fetchData(currentUser.id);
      } else {
        toast({ title: "خطأ", description: result.error, variant: 'destructive'});
      }
  };

  const handleOpenRatingDialog = (booking: Booking) => {
      setSelectedBooking(booking);
      setIsRatingDialogOpen(true);
  };
  
  const handleOpenRescheduleDialog = (booking: Booking) => {
      setSelectedBooking(booking);
      setIsRescheduleDialogOpen(true);
  }
  
  const handleRescheduleSubmit = async (bookingId: string, newDate: Date, newPeriod: BookingPeriod) => {
      if (!currentUser) return;
      const result = await requestBookingReschedule(currentUser.id, bookingId, newDate.toISOString().split('T')[0], newPeriod);
      if(result.success) {
        toast({
            title: "تم إرسال طلب تغيير الموعد",
            description: `تم إرسال طلبك لتغيير الحجز إلى ${format(newDate, "d MMMM yyyy", { locale: arSA })}.`,
        });
        fetchData(currentUser.id);
      } else {
         toast({ title: "خطأ", description: result.error, variant: 'destructive'});
      }
  };

  const handleOpenDetailsDialog = (booking: Booking) => {
      setSelectedBooking(booking);
      setIsDetailsDialogOpen(true);
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!currentUser) return;
    const result = await requestBookingCancellation(currentUser.id, bookingId);
    if(result.success) {
        toast({
          title: "تم إرسال طلب الإلغاء",
          description: "سيقوم المضيف بمراجعة طلبك والرد عليك قريباً.",
        });
        fetchData(currentUser.id);
    } else {
        toast({ title: "خطأ", description: result.error, variant: 'destructive'});
    }
  };

  const handleDeleteBooking = (bookingId: string) => {
    // This is a UI-only operation for now as there's no BE endpoint
    setBookings(bookings.filter(b => b.id !== bookingId));
    toast({
      title: "تم إخفاء الحجز",
      description: "تم إخفاء الحجز الملغي من قائمتك.",
    });
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    const result = await updateProfile(currentUser.id, fullName);
     if (result.success && result.updatedUser) {
        toast({ title: "تم تحديث الملف الشخصي بنجاح" });
        updateUserInContext(result.updatedUser as UserDetails);
        fetchData(currentUser.id);
     } else {
        toast({ title: "خطأ", description: result.error, variant: "destructive" });
    }
  };
  
  if (loading || pageLoading || !currentUser) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }
  
  const todaysBookings = processedBookings.filter(b => b.booking_date === new Date().toISOString().split('T')[0] && b.status === 'confirmed');
  const name = currentUser?.full_name;
  const defaultTab = searchParams.get('tab') || "bookings";

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="mb-8 text-right">
        <h1 className="text-3xl font-bold font-headline">أهلاً بعودتك، {name ? name.split(" ")[0] : 'زائرنا'}!</h1>
        <p className="text-muted-foreground">إدارة حجوزاتك وإعدادات حسابك من هنا.</p>
      </div>
      
       {todaysBookings.length > 0 && (
          <Card className="mb-8 bg-primary/10 border-primary/20">
              <CardContent className="p-4 flex items-center gap-4">
                  <div className="bg-primary/20 text-primary p-3 rounded-full">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">تذكير بموعد الحضور!</h3>
                    <p className="text-sm text-muted-foreground">
                        لديك حجز اليوم في "{(todaysBookings[0].properties as any).title}". نتمنى لك وقتاً ممتعاً!
                        {todaysBookings.length > 1 && ` ولديك ${todaysBookings.length - 1} حجوزات أخرى اليوم.`}
                    </p>
                  </div>
              </CardContent>
          </Card>
      )}

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bookings">حجوزاتي</TabsTrigger>
          <TabsTrigger value="profile">إعدادات الملف الشخصي</TabsTrigger>
          <TabsTrigger value="wishlist">قائمة الرغبات</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <Card>
            <CardHeader className="text-right">
              <CardTitle>حجوزاتي</CardTitle>
              <CardDescription>عرض حجوزاتك السابقة والقادمة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {processedBookings.length > 0 ? processedBookings.map((booking) => {
                const property = booking.properties as any;
                if (!property) return null;
                const hasReview = (booking as any).hasReview;
                return (
                <div key={booking.id} className="flex flex-col sm:flex-row-reverse items-center gap-6 p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <Image src={property.images?.[0] || 'https://placehold.co/160x160.png'} width={160} height={160} alt={property.title} className="w-full sm:w-40 h-40 object-cover rounded-md" data-ai-hint="chalet exterior"/>
                  <div className="flex-grow space-y-2 text-center sm:text-right">
                    <h3 className="text-xl font-bold">{property.title}</h3>
                    <p className="text-sm text-muted-foreground">{property.location}</p>
                    <div className="text-sm mt-1 flex gap-4 justify-center sm:justify-end">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {booking.booking_date}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {booking.period === 'full_day' ? 'يوم كامل' : (booking.period === 'morning' ? 'صباحي' : 'مسائي')}</span>
                    </div>
                     <Badge variant={statusVariants[booking.status]}>{statusTranslations[booking.status]}</Badge>
                  </div>
                   <div className="flex-shrink-0 flex flex-col gap-2 w-full sm:w-auto self-center sm:self-auto">
                    <Button variant="outline" asChild>
                      <Link href={`/properties/${property.id}`}>عرض العقار</Link>
                    </Button>
                    <Button variant="outline" onClick={() => handleOpenDetailsDialog(booking)}>
                        <Eye className="ml-2 h-4 w-4" />
                        عرض التفاصيل
                    </Button>
                     {booking.status === 'completed' && !hasReview && (
                        <Button onClick={() => handleOpenRatingDialog(booking)}>
                            <Star className="ml-2 h-4 w-4" />
                            قيّم تجربتك
                        </Button>
                     )}
                     { (booking.status === 'confirmed' || booking.status === 'pending') && property.allow_reschedule && (
                        <Button variant="outline" onClick={() => handleOpenRescheduleDialog(booking)}>
                          <CalendarClock className="ml-2 h-4 w-4" />
                          تغيير الموعد
                        </Button>
                      )}
                      {(booking.status === 'confirmed' || booking.status === 'pending') && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="destructive">
                                 <XCircle className="ml-2 h-4 w-4" />
                                 إلغاء الحجز
                               </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>هل أنت متأكد من إلغاء الحجز؟</AlertDialogTitle>
                                    <AlertDialogDescriptionComponent>
                                        سيتم إرسال طلب إلغاء إلى المضيف. قد يتم تطبيق رسوم الإلغاء بناءً على سياسة العقار.
                                    </AlertDialogDescriptionComponent>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>تراجع</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleCancelBooking(booking.id)} className="bg-destructive hover:bg-destructive/90">تأكيد الإلغاء</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     )}
                     {booking.status === 'cancelled' && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="destructive" className="bg-red-800 hover:bg-red-900">
                                 <Trash2 className="ml-2 h-4 w-4" />
                                 حذف الحجز
                               </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>هل أنت متأكد من حذف الحجز؟</AlertDialogTitle>
                                    <AlertDialogDescriptionComponent>
                                        سيتم حذف هذا الحجز نهائياً من قائمتك. لا يمكن التراجع عن هذا الإجراء.
                                    </AlertDialogDescriptionComponent>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>تراجع</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteBooking(booking.id)} className="bg-destructive hover:bg-destructive/90">نعم، حذف</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                     )}
                  </div>
                </div>
              )}) : (
                <p className="text-muted-foreground text-center py-8">لم يتم العثور على حجوزات.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

              <TabsContent value="profile">
                  <Card dir="rtl">
                      <CardHeader className="text-right">
                          <CardTitle>إعدادات الملف الشخصي</CardTitle>
                          <CardDescription>تحديث معلوماتك الشخصية.</CardDescription>
                      </CardHeader>
                      <form onSubmit={handleProfileUpdate}>
                          <CardContent className="space-y-4 text-right">
                              <div className="space-y-2">
                                  <Label htmlFor="name">الاسم</Label>
                                  <Input id="name" name="name" value={fullName || ''} onChange={e => setFullName(e.target.value)} />
                              </div>

                              {currentUser.email && (
                                  <div className="space-y-2">
                                      <Label htmlFor="email">البريد الإلكتروني</Label>
                                      <Input id="email" type="email" value={currentUser.email} disabled />
                                  </div>
                              )}

                              {currentUser.phone && (
                                  <div className="space-y-2">
                                      <Label htmlFor="phone">رقم الهاتف</Label>
                                      <Input id="phone" type="tel" value={currentUser.phone} disabled dir="ltr" />
                                  </div>
                              )}
                          </CardContent>
                          <CardFooter className="justify-start">
                              <Button type="submit">حفظ التغييرات</Button>
                          </CardFooter>
                      </form>
                  </Card>
              </TabsContent>


              <TabsContent value="wishlist" dir="rtl">
                  <Card className="text-right">
                      <CardHeader>
                          <CardTitle>قائمة رغباتك</CardTitle>
                          <CardDescription>العقارات التي قمت بحفظها لوقت لاحق.</CardDescription>
                      </CardHeader>
                      <CardContent>
                          {wishlist.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {wishlist.map((property) => (
                                      <PropertyCard key={property.id} property={property} />
                                  ))}
                              </div>
                          ) : (
                              <p className="text-muted-foreground text-center py-8">
                                  قائمة رغباتك فارغة.
                              </p>
                          )}
                      </CardContent>
                  </Card>
              </TabsContent>

      </Tabs>
       <RatingDialog 
          open={isRatingDialogOpen} 
          onOpenChange={setIsRatingDialogOpen} 
          onSubmit={handleRatingSubmit}
      />
      
      <BookingDetailsDialog
          booking={selectedBooking}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
      />
      
      {selectedBooking && (
        <RescheduleDialog
            booking={selectedBooking}
            open={isRescheduleDialogOpen}
            onOpenChange={setIsRescheduleDialogOpen}
            onSubmit={handleRescheduleSubmit}
        />
      )}
    </div>
  );
}
