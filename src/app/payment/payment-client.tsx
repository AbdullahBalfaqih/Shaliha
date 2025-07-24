
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CreditCard, Landmark, Banknote, Copy, UploadCloud, QrCode, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import type { Property, BookingPeriod, Currency } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { getPropertyForPayment, createBooking } from "./actions";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { v4 as uuidv4 } from 'uuid';

type FetchedProperty = Property & {
    hostBankAccounts: { id: string; bank_name: string; account_holder: string; account_number: string }[];
};

// Helper function to format date as YYYY-MM-DD in local timezone
const toLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function PaymentClientPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [property, setProperty] = useState<FetchedProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const propertyId = searchParams.get('propertyId');
  const dateTimestamp = searchParams.get('date');
  
  // Reconstruct date from timestamp to avoid timezone issues
  const bookingDate = dateTimestamp ? new Date(parseInt(dateTimestamp, 10)) : null;

  const period = searchParams.get('period') as BookingPeriod | null;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchProperty() {
        if (propertyId) {
          const fetchedProperty = await getPropertyForPayment(propertyId);
          setProperty(fetchedProperty as FetchedProperty | null);
        }
        setLoading(false);
    }
    fetchProperty();
  }, [propertyId]);
  
  const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer">("transfer");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Set default selected bank account
  useEffect(() => {
      if (property?.hostBankAccounts && property.hostBankAccounts.length > 0) {
          setSelectedAccountId(property.hostBankAccounts[0].id);
      }
  }, [property]);

  if (authLoading || loading) {
     return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <Skeleton className="h-[600px] w-full" />
                <Skeleton className="h-[500px] w-full" />
            </div>
        </div>
     )
  }
  
  if (!property || !bookingDate || !user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">لم يتم العثور على العقار</h1>
        <p className="text-muted-foreground">عذراً، لا يمكننا العثور على تفاصيل الحجز. الرجاء المحاولة مرة أخرى.</p>
        <Button asChild className="mt-4">
          <Link href="/search">العودة للبحث</Link>
        </Button>
      </div>
    )
  }
  
  let price = 0;
  let finalPeriod: BookingPeriod = 'full_day';

  if (property.booking_system === 'dual_period' && period) {
      if (period === 'morning' && property.morning_period) {
          price = (property.morning_period as any).price;
          finalPeriod = 'morning';
      } else if (period === 'evening' && property.evening_period) {
          price = (property.evening_period as any).price;
          finalPeriod = 'evening';
      }
  } else {
      price = property.price_per_night;
      finalPeriod = 'full_day';
  }

  const subtotal = price;
  const serviceFee = subtotal * 0.03;
  const total = subtotal + serviceFee - discount;
  const currencyLabel = property.currency === 'SAR' ? 'ريال سعودي' : 'ريال يمني';
  const amountToPay = property.has_deposit ? property.deposit_amount || total : total;


  const handleApplyCoupon = () => {
      const coupon = (property.discount_codes as any)?.find((c: any) => c.code.toUpperCase() === couponCode.toUpperCase());
      if (coupon) {
          let discountValue = 0;
          if (coupon.type === 'percentage') {
              discountValue = subtotal * (coupon.value / 100);
          } else {
              discountValue = coupon.value;
          }
          setDiscount(discountValue);
          setDiscountApplied(true);
          toast({ title: "تم تطبيق الكوبون بنجاح!", description: `لقد حصلت على خصم بقيمة ${discountValue.toLocaleString()} ${property.currency}.` });
      } else {
          toast({ title: "الكوبون غير صالح", description: "الرجاء التحقق من رمز الكوبون والمحاولة مرة أخرى.", variant: "destructive" });
      }
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast({ title: "الرجاء تسجيل الدخول أولاً", variant: "destructive" });
        return;
    }
    if (paymentMethod === 'transfer' && !receiptFile) {
        toast({ title: "الرجاء إرفاق إيصال التحويل", variant: "destructive" });
        return;
    }
    setSubmitting(true);
    
    let paymentProofUrl: string | null = null;
    if (receiptFile && supabase) {
        const fileName = `${user.id}/${uuidv4()}`;
        const { data, error } = await supabase.storage.from('payment-proofs').upload(fileName, receiptFile);

        if (error) {
            toast({ title: "خطأ في رفع الإيصال", description: error.message, variant: "destructive" });
            setSubmitting(false);
            return;
        }

        const { data: urlData } = supabase.storage.from('payment-proofs').getPublicUrl(data.path);
        paymentProofUrl = urlData.publicUrl;
    }


    const bookingData = {
        property_id: property.id,
        host_id: property.host_id,
        booking_date: toLocalDateString(bookingDate),
        period: finalPeriod,
        price: subtotal,
        service_fee: serviceFee,
        total_amount: total,
        currency: property.currency as Currency,
        payment_proof_url: paymentProofUrl,
    };
    
    const result = await createBooking(bookingData, user.id, property.title, user.full_name || 'مستخدم');

    if (result.success) {
        toast({
            title: "تم إرسال طلب الحجز بنجاح!",
            description: "سيقوم المضيف بمراجعة الحجز. يمكنك متابعة الحالة من لوحة التحكم.",
        });
        router.push("/dashboard?tab=bookings");
    } else {
        toast({
            title: "خطأ في الحجز",
            description: result.error || "حدث خطأ ما، يرجى المحاولة مرة أخرى.",
            variant: "destructive"
        });
    }
    setSubmitting(false);
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "تم النسخ!", description: "تم نسخ رقم الحساب إلى الحافظة." });
  }
  
  const selectedAccount = property.hostBankAccounts.find(acc => acc.id === selectedAccountId);


  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" asChild>
            <Link href={`/properties/${property.id}`}>
                <ArrowLeft className="ml-2 h-4 w-4" />
                العودة إلى صفحة العقار
            </Link>
        </Button>
      </div>
      <form onSubmit={handleConfirmPayment}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="md:col-span-1 order-2 md:order-1">
            <Card>
                <CardHeader>
                <CardTitle>الدفع</CardTitle>
                <CardDescription>اختر طريقة الدفع وأكمل حجزك.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-base">اختر طريقة الدفع</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <Button type="button" variant={paymentMethod === 'transfer' ? 'default' : 'outline'} className="flex-col h-20" onClick={() => setPaymentMethod('transfer')}>
                                <Landmark className="w-6 h-6 mb-1"/>
                                <span>تحويل بنكي</span>
                            </Button>
                            <div className="relative">
                            <Button type="button" variant='outline' className="flex-col h-20 w-full" disabled>
                                <CreditCard className="w-6 h-6 mb-1"/>
                                <span>بطاقة</span>
                            </Button>
                            <div className="absolute top-2 right-2 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">قريباً</div>
                            </div>
                        </div>
                    </div>

                    {paymentMethod === 'transfer' && (
                        <div className="space-y-4 pt-4 border-t">
                            <Label className="text-base">اختر الحساب المراد التحويل إليه</Label>
                            <div className="space-y-3">
                                {property.hostBankAccounts.length > 0 ? property.hostBankAccounts.map(account => (
                                    <div key={account.id} className={`p-4 rounded-lg border cursor-pointer ${selectedAccountId === account.id ? 'border-primary ring-2 ring-primary' : ''}`} onClick={() => setSelectedAccountId(account.id)}>
                                        <div className="flex items-center gap-3">
                                            <Banknote className="h-6 w-6 text-primary" />
                                            <div>
                                                <p className="font-semibold">{account.bank_name}</p>
                                                <p className="text-sm text-muted-foreground">{account.account_holder}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex justify-between items-center bg-secondary p-2 rounded-md">
                                            <p dir="ltr" className="text-lg font-mono tracking-widest">{account.account_number}</p>
                                            <Button type="button" size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); copyToClipboard(account.account_number);}}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-muted-foreground text-center p-4 bg-secondary rounded-md">
                                        لم يقم المضيف بإضافة أي حسابات بنكية بعد.
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2 pt-4 border-t">
                                <Label htmlFor="receipt-upload" className="text-base">إرفاق إيصال التحويل (إجباري)</Label>
                                <label htmlFor="receipt-upload" className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center bg-secondary/50 hover:border-primary transition-colors cursor-pointer block">
                                    <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                                    {receiptFile ? (
                                        <p className="mt-2 text-sm text-green-600 font-semibold">{receiptFile.name}</p>
                                    ) : (
                                        <p className="mt-2 text-sm text-muted-foreground">اسحب وأفلت صورة الإيصال هنا، أو انقر للاختيار</p>
                                    )}
                                    <Input id="receipt-upload" type="file" className="sr-only" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} required accept="image/*"/>
                                </label>
                                <p className="text-xs text-muted-foreground text-center">الرجاء رفع ملف بصيغة صورة فقط (JPG, PNG, etc).</p>
                            </div>
                        </div>
                    )}
                    
                </CardContent>
            </Card>
            </div>
            
            <div className="md:col-span-1 order-1 md:order-2">
                <Card className="bg-secondary sticky top-24">
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <div className="relative w-24 h-20">
                               <Image src={property.images?.[0] || "https://placehold.co/100x80.png"} alt={property.title} className="rounded-lg object-cover" fill data-ai-hint="chalet exterior" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{property.title}</h3>
                                <p className="text-sm text-muted-foreground">{property.location}</p>
                                 <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs text-muted-foreground font-mono">ID: {property.id.substring(0,8)}</p>
                                    <QrCode className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="border-t border-b border-border/50 py-4 space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-muted-foreground">التاريخ</p>
                                    <p className="font-semibold">{bookingDate.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                 <div>
                                    <p className="text-xs text-muted-foreground">الفترة</p>
                                    <p className="font-semibold">{finalPeriod === 'full_day' ? 'يوم كامل' : (finalPeriod === 'morning' ? 'صباحية' : 'مسائية')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                           <Label htmlFor="coupon">أدخل كوبون الخصم</Label>
                            <div className="flex gap-2">
                                <Input 
                                    id="coupon" 
                                    placeholder="رمز الكوبون" 
                                    value={couponCode} 
                                    onChange={e => setCouponCode(e.target.value)}
                                    disabled={discountApplied}
                                />
                                <Button type="button" onClick={handleApplyCoupon} disabled={!couponCode || discountApplied}>تطبيق</Button>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <p>سعر الحجز</p>
                                <p>{subtotal.toLocaleString()} {property.currency}</p>
                            </div>
                            <div className="flex justify-between">
                                <p>رسوم الخدمة (3%)</p>
                                <p>{serviceFee.toLocaleString()} {property.currency}</p>
                            </div>
                             {discount > 0 && (
                                <div className="flex justify-between text-green-500">
                                    <p>خصم الكوبون</p>
                                    <p>-{discount.toLocaleString()} {property.currency}</p>
                                </div>
                            )}
                            <Separator className="my-2"/>
                            <div className="flex justify-between font-bold text-base">
                                <p>الإجمالي ({currencyLabel})</p>
                                <p>{total.toLocaleString()} {property.currency}</p>
                            </div>
                             {property.has_deposit && (
                                <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-md text-center">
                                    <p className="font-bold text-primary">المطلوب دفعه الآن (عربون)</p>
                                    <p className="text-2xl font-bold text-primary">{amountToPay.toLocaleString()} {property.currency}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                     <CardFooter>
                        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-lg" disabled={submitting || (paymentMethod === 'transfer' && !receiptFile)}>
                            {submitting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : 'إرسال طلب الحجز'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
      </form>
    </div>
  );
}

    