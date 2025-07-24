
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Home, DollarSign, Calendar, PlusCircle, Banknote, Trash2, Edit, Check, X, Eye, FileText, ToggleLeft, ToggleRight, Edit2, Waves, Star, MessageSquare, CalendarClock, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
    DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import type { Property, Review, CancellationRequest, Currency, RescheduleRequest, BookingPeriod, Booking, BookingStatus } from "@/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getHostDashboardData, deleteProperty, togglePropertyPublish, handleBookingConfirmation, handleCancellationRequest, handleRescheduleRequest, saveBankAccount, deleteBankAccount, deleteBooking, deleteReview } from "./actions";
import type { UserDetails } from '@/context/auth-context';
import { CalendarManagement } from "./calendar-management";
import { createNotification } from "@/lib/notifications";
import { ScrollArea } from "@/components/ui/scroll-area";


type BankAccount = {
    id: string;
    bank_name: string;
    account_holder: string;
    account_number: string;
    user_id: string;
}

const bookingStatusTranslations: Record<BookingStatus, string> = {
    confirmed: 'مؤكد',
    pending: 'قيد الانتظار',
    cancelled: 'ملغي',
    completed: 'مكتمل'
};

const bookingStatusVariants: Record<BookingStatus, "default" | "secondary" | "destructive" | "outline"> = {
    confirmed: 'default',
    pending: 'secondary',
    cancelled: 'destructive',
    completed: 'outline'
};


function HostStats({ properties, bookings }: { properties: Property[], bookings: any[] }) {
    const grossEarningsSAR = bookings.filter((b: Booking) => b.currency === 'SAR' && b.status === 'confirmed').reduce((acc: number, b: Booking) => acc + (b.total_amount || 0), 0);
    const grossEarningsYER = bookings.filter((b: Booking) => b.currency === 'YER' && b.status === 'confirmed').reduce((acc: number, b: Booking) => acc + (b.total_amount || 0), 0);
    const serviceFeesSAR = bookings.filter((b: Booking) => b.currency === 'SAR' && b.status === 'confirmed').reduce((acc: number, b: Booking) => acc + (b.service_fee || 0), 0);
    const serviceFeesYER = bookings.filter((b: Booking) => b.currency === 'YER' && b.status === 'confirmed').reduce((acc: number, b: Booking) => acc + (b.service_fee || 0), 0);

    const statsData = {
        properties: {
            count: properties.length,
            active: properties.filter(p => p.is_active).length,
            inactive: properties.filter(p => !p.is_active).length,
        },
        netEarningsSAR: grossEarningsSAR - serviceFeesSAR,
        netEarningsYER: grossEarningsYER - serviceFeesYER,
        bookingsCount: bookings.filter((b: Booking) => b.status === 'confirmed').length,
        serviceFeesSAR: serviceFeesSAR,
        serviceFeesYER: serviceFeesYER,
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">عقاراتي</CardTitle>
                    <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{statsData.properties.count}</div>
                    <p className="text-xs text-muted-foreground">{statsData.properties.active} نشطة, {statsData.properties.inactive} غير نشطة</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">صافي الأرباح (بعد الرسوم)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold">{statsData.netEarningsSAR.toLocaleString()} ريال سعودي</div>
                    <div className="text-xl font-bold">{statsData.netEarningsYER.toLocaleString()} ريال يمني</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">الحجوزات المؤكدة</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{statsData.bookingsCount}</div>
                    <p className="text-xs text-muted-foreground">في المجمل</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">رسوم الخدمة المستحقة (3%)</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-bold">{statsData.serviceFeesSAR.toLocaleString()} ريال سعودي</div>
                    <div className="text-lg font-bold">{statsData.serviceFeesYER.toLocaleString()} ريال يمني</div>
                </CardContent>
            </Card>
        </div>
    );
}

const periodTranslations: Record<BookingPeriod, string> = {
    full_day: 'ليلة كاملة',
    morning: 'فترة صباحية',
    evening: 'فترة مسائية'
};


function BookingsList({ bookings, onUpdate }: { bookings: any[], onUpdate: () => void }) {
    const { toast } = useToast();

    const handleBookingAction = async (id: string, newStatus: 'confirmed' | 'cancelled') => {
        const booking = bookings.find(b => b.id === id);
        if (!booking || !booking.guest || !booking.guest.phone) return;

        const result = await handleBookingConfirmation(id, newStatus);
        if (result.success) {
            onUpdate();
            const actionText = newStatus === 'confirmed' ? 'قبول' : 'رفض';
            const message = newStatus === 'confirmed'
                ? `مرحباً ${booking.guest.full_name}, تم تأكيد حجزكم للعقار "${booking.properties.title}" لتاريخ ${booking.booking_date}. نتطلع لاستقبالكم!`
                : `مرحباً ${booking.guest.full_name}, نأسف لإبلاغكم بأنه تم رفض طلب حجزكم للعقار "${booking.properties.title}" لتاريخ ${booking.booking_date}.`;

            const whatsappUrl = `https://wa.me/${booking.guest.phone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');


            // Create notification
            await createNotification({
                user_id: booking.guest_id,
                title: newStatus === 'confirmed' ? 'تم تأكيد حجزك!' : 'تم تحديث حالة الحجز',
                message: `قام المضيف ب${actionText} حجزك لعقار "${booking.properties.title}".`,
                link: '/dashboard?tab=bookings'
            });


            toast({
                title: `تم ${actionText} الحجز بنجاح`,
                description: `تم فتح واتساب لإرسال رسالة للعميل: "${booking.guest.full_name}".`,
            });
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
    };

    const handleDeleteBookingAction = async (id: string) => {
        const result = await deleteBooking(id);
        if (result.success) {
            onUpdate();
            toast({
                title: "تم حذف الحجز بنجاح",
            });
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
    }

    const getDayOfWeek = (dateString: string) => {
        const date = new Date(dateString);
        // The 'ar-EG' locale is commonly used for Arabic day names
        return date.toLocaleDateString('ar-EG', { weekday: 'long' });
    };

    const getDepositInfo = (booking: any) => {
        const propertyDetails = booking.properties;
        if (propertyDetails?.has_deposit && propertyDetails?.deposit_amount) {
            return `${propertyDetails.deposit_amount.toLocaleString()} ${booking.currency}`;
        }
        return "لا يوجد";
    }

    const getGuestName = (booking: any) => {
        if (booking.type === 'manual' || booking.type === 'blocked') {
            return (booking.guest_details as any)?.name || (booking.type === 'blocked' ? 'يوم معطل' : 'حجز يدوي');
        }
        return booking.guest?.full_name || 'ضيف المنصة';
    };

    const getGuestPhone = (booking: any) => {
        if (booking.type === 'manual') {
            return (booking.guest_details as any)?.phone || 'غير متوفر';
        }
        return booking.guest?.phone || 'غير متوفر';
    };

    return (
        <Card>
            <CardHeader className="text-right">
                <CardTitle>قائمة الحجوزات</CardTitle>
                <CardDescription>عرض وإدارة جميع حجوزاتك.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-primary/10 hover:bg-primary/10 border-b-primary/20">
                            <TableHead className="text-right text-primary">العقار</TableHead>
                            <TableHead className="text-right text-primary">الضيف</TableHead>
                            <TableHead className="text-right text-primary">رقم الضيف</TableHead>
                            <TableHead className="text-right text-primary">تفاصيل الحجز</TableHead>
                            <TableHead className="text-center text-primary">الحالة</TableHead>
                            <TableHead className="text-right text-primary">المبلغ الإجمالي</TableHead>
                            <TableHead className="text-right text-primary">العربون المطلوب</TableHead>
                            <TableHead className="text-center text-primary">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bookings.length > 0 ? bookings.map((booking) => (
                            <TableRow key={booking.id}>
                                <TableCell className="font-medium text-right">{booking.properties?.title}</TableCell>
                                <TableCell className="text-right">{getGuestName(booking)}</TableCell>
                                <TableCell className="text-right" dir="ltr">{booking.type !== 'blocked' ? getGuestPhone(booking) : 'N/A'}</TableCell>
                                <TableCell className="text-right">
                                    <div>{booking.booking_date}</div>
                                    <div className="text-xs text-muted-foreground">{getDayOfWeek(booking.booking_date)} - {periodTranslations[booking.period as BookingPeriod]}</div>
                                </TableCell>
                                <TableCell className="text-center"><Badge variant={bookingStatusVariants[booking.status as BookingStatus]}>{bookingStatusTranslations[booking.status as BookingStatus]}</Badge></TableCell>
                                <TableCell className="text-right">{(booking.total_amount || 0).toLocaleString()} {booking.currency}</TableCell>
                                <TableCell className="text-right">{getDepositInfo(booking)}</TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center gap-1">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm" title="عرض تفاصيل الدفع" disabled={!booking.payment_proof_url}>
                                                    <Eye className="ml-2 h-4 w-4" />
                                                    عرض التفاصيل
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent dir="rtl" className="sm:max-w-md">
                                                <DialogHeader className="text-right pb-4 border-b">
                                                    <DialogTitle className="text-xl">تفاصيل الحجز وإثبات الدفع</DialogTitle>
                                                    <DialogClose className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                                                        <X className="h-4 w-4" />
                                                        <span className="sr-only">Close</span>
                                                    </DialogClose>
                                                </DialogHeader>
                                                <div className="space-y-4 text-right py-4">
                                                    <div className="space-y-2">
                                                        <p><span className="font-bold text-muted-foreground">العقار:</span> {booking.properties?.title}</p>
                                                        <p><span className="font-bold text-muted-foreground">الضيف:</span> {getGuestName(booking)}</p>
                                                        <p><span className="font-bold text-muted-foreground">رقم الهاتف:</span> <span dir="ltr">{getGuestPhone(booking)}</span></p>
                                                        <p><span className="font-bold text-muted-foreground">التاريخ:</span> {booking.booking_date}</p>
                                                        <p><span className="font-bold text-muted-foreground">المبلغ:</span> {(booking.total_amount || 0).toLocaleString()} {booking.currency}</p>
                                                    </div>
                                                    {booking.payment_proof_url &&
                                                        <div className="space-y-2 pt-4 border-t">
                                                            <h4 className="font-bold text-muted-foreground">إثبات الدفع:</h4>
                                                            <div className="relative w-full h-96 bg-secondary rounded-md">
                                                                <Image src={booking.payment_proof_url} layout="fill" objectFit="contain" alt="إثبات الدفع" data-ai-hint="receipt document" />
                                                            </div>
                                                        </div>
                                                    }
                                                </div>
                                                <DialogFooter className="pt-4 border-t">
                                                    <DialogClose asChild>
                                                        <Button variant="outline" className="w-full">إغلاق</Button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>

                                        {booking.status === 'pending' && (
                                            <>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600" title="قبول الحجز">
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent dir="rtl">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                هل تريد بالتأكيد قبول هذا الحجز؟ سيتم إرسال رسالة تأكيد إلى العميل.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleBookingAction(booking.id, 'confirmed')} className="bg-green-600 hover:bg-green-700">
                                                                نعم، قبول
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" title="رفض الحجز">
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent dir="rtl">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                هل تريد بالتأكيد رفض هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleBookingAction(booking.id, 'cancelled')} className="bg-destructive hover:bg-destructive/90">
                                                                نعم، رفض
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </>
                                        )}

                                        {booking.status === 'cancelled' && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="حذف الحجز">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent dir="rtl">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            سيتم حذف هذا الحجز نهائياً من القائمة. لا يمكن التراجع عن هذا الإجراء.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteBookingAction(booking.id)} className="bg-destructive hover:bg-destructive/90">
                                                            نعم، حذف
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center">لا توجد حجوزات لعرضها.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

function AccountFormDialog({
    isOpen,
    onOpenChange,
    account,
    onSave,
}: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    account: BankAccount | null;
    onSave: (accountData: Omit<BankAccount, 'id' | 'user_id' | 'created_at'>) => void;
}) {
    const [formData, setFormData] = useState({
        bank_name: "",
        account_holder: "",
        account_number: "",
    });

    useEffect(() => {
        if (account) {
            setFormData({
                bank_name: account.bank_name,
                account_holder: account.account_holder,
                account_number: account.account_number,
            });
        } else {
            setFormData({ bank_name: "", account_holder: "", account_number: "" });
        }
    }, [account, isOpen]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as any);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle>{account ? "تعديل الحساب البنكي" : "إضافة حساب بنكي جديد"}</DialogTitle>
                    <DialogClose className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="bank_name">اسم البنك</Label>
                        <Input
                            id="bank_name"
                            value={formData.bank_name}
                            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                            placeholder="مثال: بنك الكريمي"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="account_holder">اسم صاحب الحساب</Label>
                        <Input
                            id="account_holder"
                            value={formData.account_holder}
                            onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                            placeholder="الاسم الكامل كما يظهر في كشف الحساب"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="account_number">رقم الحساب</Label>
                        <Input
                            id="account_number"
                            value={formData.account_number}
                            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                            placeholder="أدخل رقم الحساب"
                            required
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">إلغاء</Button>
                        </DialogClose>
                        <Button type="submit">حفظ التغييرات</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function BankAccountsList({ user, initialAccounts, onUpdate }: { user: UserDetails, initialAccounts: BankAccount[], onUpdate: () => void }) {
    const { toast } = useToast();
    const [accounts, setAccounts] = useState(initialAccounts);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

    useEffect(() => {
        setAccounts(initialAccounts);
    }, [initialAccounts]);

    const handleAddAccount = () => {
        setEditingAccount(null);
        setIsDialogOpen(true);
    };

    const handleEditAccount = (account: BankAccount) => {
        setEditingAccount(account);
        setIsDialogOpen(true);
    };

    const handleDeleteAccount = async (accountId: string) => {
        if (!user?.id) return;
        const result = await deleteBankAccount(accountId, user.id);
        if (result.success) {
            onUpdate();
            toast({
                title: "تم حذف الحساب البنكي",
                description: "تم حذف الحساب بنجاح.",
                variant: "destructive"
            });
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
    };

    const handleSaveAccount = async (data: Omit<BankAccount, 'id' | 'created_at' | 'user_id'>) => {
        if (!user?.id) return;
        const result = await saveBankAccount(data as any, user.id, editingAccount?.id);
        if (result.success) {
            onUpdate();
            toast({ title: editingAccount ? "تم تحديث الحساب بنجاح" : "تم إضافة الحساب بنجاح" });
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
    };

    return (
        <Card>
            <CardHeader className="flex-row justify-between items-center text-right">
                <div>
                    <CardTitle>إدارة الحسابات البنكية</CardTitle>
                    <CardDescription>أضف أو قم بتعديل حساباتك البنكية لتلقي المدفوعات.</CardDescription>
                </div>
                <Button onClick={handleAddAccount}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة حساب جديد
                </Button>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg" dir="rtl">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-primary/10 hover:bg-primary/10 border-b-primary/20">
                                <TableHead className="text-right text-primary">اسم البنك</TableHead>
                                <TableHead className="text-right text-primary">صاحب الحساب</TableHead>
                                <TableHead className="text-right text-primary">رقم الحساب</TableHead>
                                <TableHead className="text-center text-primary">إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {accounts.length > 0 ? accounts.map(acc => (
                                <TableRow key={acc.id}>
                                    <TableCell className="font-medium flex items-center gap-2 justify-end">
                                        {acc.bank_name}
                                        <Banknote className="h-5 w-5 text-muted-foreground" />
                                    </TableCell>
                                    <TableCell className="text-right">{acc.account_holder}</TableCell>
                                    <TableCell dir="ltr" className="text-right">{acc.account_number}</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-2">
                                            <Button variant="ghost" size="icon" title="تعديل الحساب" onClick={() => handleEditAccount(acc)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="حذف الحساب">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent dir="rtl">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            هذا الإجراء سيقوم بحذف حسابك البنكي نهائياً. لا يمكن التراجع عن هذا الإجراء.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteAccount(acc.id)} className="bg-destructive hover:bg-destructive/90">
                                                            نعم، حذف
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">لا توجد حسابات بنكية لعرضها.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <AccountFormDialog
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                account={editingAccount}
                onSave={handleSaveAccount}
            />
        </Card>
    );
}

function MyPropertiesList({ properties, onUpdate }: { properties: Property[], onUpdate: () => void }) {
    const { user } = useAuth();
    const { toast } = useToast();

    const handleDeleteProperty = async (propertyId: string) => {
        if (!user?.id) return;
        const result = await deleteProperty(propertyId, user.id);
        if (result.success) {
            onUpdate();
            toast({
                title: "تم حذف العقار",
                description: "تم حذف العقار بنجاح من قائمتك.",
                variant: "destructive"
            });
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
    };

    const handleTogglePublish = async (propertyId: string, currentStatus: boolean) => {
        if (!user?.id) return;
        const result = await togglePropertyPublish(propertyId, user.id, !currentStatus);
        if (result.success) {
            onUpdate();
            toast({
                title: `تم ${!currentStatus ? 'نشر' : 'إلغاء نشر'} العقار`,
                description: `أصبح العقار الآن ${!currentStatus ? 'نشطًا' : 'غير نشط'}.`
            });
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
    };

    return (
        <Card>
            <CardHeader className="text-right">
                <CardTitle>إدارة العقارات</CardTitle>
                <CardDescription>عرض وتعديل وحذف عقاراتك المدرجة.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {properties.length > 0 ? properties.map(property => {
                    const displayPrice = property.booking_system === 'single_period'
                        ? property.price_per_night
                        : (property.morning_period as any)?.price || 0;

                    return (
                        <Card key={property.id} className="grid grid-cols-1 md:grid-cols-[150px_1fr_auto] items-start gap-4 p-4 overflow-hidden">
                            <div className="relative w-full aspect-[4/3] md:aspect-square md:w-[150px] md:h-[150px]">
                                <Image
                                    src={property.images?.[0] || 'https://placehold.co/400x300.png'}
                                    alt={property.title}
                                    fill
                                    className="rounded-md object-cover"
                                    sizes="(max-width: 768px) 100vw, 150px"
                                    data-ai-hint="chalet exterior"
                                />
                            </div>
                            <div className="flex-grow space-y-2 text-right">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-bold">{property.title}</h3>
                                    <Badge variant={property.is_active ? "default" : "secondary"}>
                                        {property.is_active ? "نشط" : "غير نشط"}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{property.location}</p>

                                <div className="flex items-center gap-2 justify-end pt-1">
                                    <Star className="h-4 w-4 text-accent" />
                                    <span className="font-semibold">{property.rating ? property.rating.toFixed(1) : '0'}</span>
                                    <span className="text-xs text-muted-foreground">({property.review_count} تقييم)</span>
                                </div>
                                <div className="text-right pt-2">
                                    <p className="font-bold text-lg text-primary">
                                        {property.booking_system === 'single_period' ? 'السعر/الليلة:' : 'يبدأ من:'}
                                        <span className="font-semibold text-foreground mx-2">{displayPrice.toLocaleString()} {property.currency}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto self-center md:self-start flex-shrink-0">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" className="w-full justify-center md:justify-between">
                                            <span>{property.is_active ? 'إلغاء النشر' : 'نشر'}</span>
                                            {property.is_active ? <ToggleRight className="mr-2 h-4 w-4" /> : <ToggleLeft className="mr-2 h-4 w-4" />}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent dir="rtl">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                هل تريد بالتأكيد {property.is_active ? 'إلغاء نشر' : 'نشر'} هذا العقار؟
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleTogglePublish(property.id, property.is_active)}>
                                                نعم، تأكيد
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <Button variant="outline" className="w-full justify-center md:justify-between" asChild>
                                    <Link href={`/host/dashboard/add-property?edit=${property.id}`}>
                                        <span>تعديل</span>
                                        <Edit2 className="mr-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-full justify-center md:justify-between">
                                            <span>حذف</span>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent dir="rtl">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                هذا الإجراء سيقوم بحذف العقار نهائياً. لا يمكن التراجع عن هذا الإجراء.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteProperty(property.id)} className="bg-destructive hover:bg-destructive/90">
                                                نعم، حذف
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </Card>
                    )
                }) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <p>لم تقم بإضافة أي عقارات بعد.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


function ReviewsList({ reviews, onUpdate }: { reviews: (Review & { author: any, properties: any })[], onUpdate: () => void }) {
    const { toast } = useToast();
    const { user } = useAuth();

    const handleDeleteReview = async (reviewId: string) => {
        if (!user?.id) return;
        const result = await deleteReview(reviewId, user.id);
        if (result.success) {
            onUpdate();
            toast({
                title: "تم حذف التقييم بنجاح",
                variant: "destructive"
            });
        } else {
            toast({
                title: "خطأ في حذف التقييم",
                description: result.error,
                variant: "destructive"
            });
        }
    };
    return (
        <Card>
            <CardHeader className="text-right">
                <CardTitle>آراء وتقييمات العملاء</CardTitle>
                <CardDescription>عرض التقييمات التي تركها الضيوف لعقاراتك.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {reviews.length > 0 ? reviews.map(review => (
                    <div key={review.id} className="p-4 border rounded-lg relative">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <Image src={review.author?.avatar_url || 'https://avatar.vercel.sh/user.png'} width={40} height={40} alt={review.author?.full_name || ''} className="rounded-full" data-ai-hint="person portrait" />
                                <div>
                                    <p className="font-bold">{review.author?.full_name}</p>
                                    <p className="text-xs text-muted-foreground">{review.properties?.title}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-bold">{review.rating}</span>
                                <Star className="h-5 w-5 text-accent fill-accent" />
                            </div>
                        </div>
                        <p className="mt-4 text-muted-foreground italic">"{review.comment}"</p>
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-muted-foreground text-left">{new Date(review.created_at).toLocaleDateString('ar-EG')}</p>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent dir="rtl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>هل أنت متأكد من حذف هذا الرأي؟</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            لا يمكن التراجع عن هذا الإجراء. سيتم حذف تقييم العميل نهائياً.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>تراجع</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteReview(review.id)} className="bg-destructive hover:bg-destructive/90">تأكيد الحذف</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-10 text-muted-foreground">
                        <MessageSquare className="mx-auto h-12 w-12" />
                        <p className="mt-4">لا توجد تقييمات لعرضها حالياً.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function RescheduleRequestsList({ requests, onUpdate }: { requests: RescheduleRequest[], onUpdate: () => void }) {
    const { toast } = useToast();

    const handleRequestAction = async (id: string, action: 'accepted' | 'rejected') => {
        const result = await handleRescheduleRequest(id, action);
        if (result.success) {
            onUpdate();
            toast({
                title: `تم ${action === 'accepted' ? 'قبول' : 'رفض'} طلب تغيير الموعد`,
            });
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
    };

    const periodTranslations: Record<BookingPeriod, string> = {
        full_day: "يوم كامل",
        morning: "صباحي",
        evening: "مسائي",
    };

    const statusTranslations: Record<RescheduleRequest['status'], string> = {
        pending: 'قيد المراجعة',
        accepted: 'مقبول',
        rejected: 'مرفوض',
    };

    const statusVariants: Record<RescheduleRequest['status'], "default" | "secondary" | "destructive"> = {
        accepted: 'default',
        pending: 'secondary',
        rejected: 'destructive',
    };

    return (
        <Card>
            <CardHeader className="text-right">
                <CardTitle>طلبات تغيير المواعيد</CardTitle>
                <CardDescription>مراجعة طلبات العملاء لتغيير مواعيد حجوزاتهم.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center">الضيف</TableHead>
                            <TableHead className="text-center">العقار</TableHead>
                            <TableHead className="text-center">الموعد الجديد المقترح</TableHead>
                            <TableHead className="text-center">الحالة</TableHead>
                            <TableHead className="text-center">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.length > 0 ? requests.map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="text-center">{req.guest?.full_name}</TableCell>
                                <TableCell className="text-center">{req.properties?.title}</TableCell>
                                <TableCell className="text-center">{req.new_date}<br /><span className="text-xs text-muted-foreground">{periodTranslations[req.new_period as BookingPeriod]}</span></TableCell>
                                <TableCell className="text-center"><Badge variant={statusVariants[req.status as keyof typeof statusVariants]}>{statusTranslations[req.status as keyof typeof statusTranslations]}</Badge></TableCell>
                                <TableCell className="text-center">
                                    {req.status === 'pending' && (
                                        <div className="flex justify-center gap-2">
                                            <Button size="sm" onClick={() => handleRequestAction(req.id, 'accepted')}>قبول</Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleRequestAction(req.id, 'rejected')}>رفض</Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">لا توجد طلبات تغيير مواعيد حالياً.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function CancellationRequestsList({ requests, onUpdate }: { requests: CancellationRequest[], onUpdate: () => void }) {
    const { toast } = useToast();

    const handleRequestAction = async (id: string, action: 'accepted' | 'rejected') => {
        const request = requests.find(req => req.id === id);
        if (!request || !request.guest || !request.guest.phone) return;

        const result = await handleCancellationRequest(id, action);

        if (result.success) {
            onUpdate();
            const message = action === 'accepted'
                ? `مرحباً ${request.guest.full_name}, تم قبول طلبكم لإلغاء حجزكم للعقار "${request.properties?.title}". سيتم التواصل معكم لترتيب إعادة المبلغ.`
                : `مرحباً ${request.guest.full_name}, نأسف لإبلاغكم بأنه تم رفض طلبكم لإلغاء حجزكم للعقار "${request.properties?.title}" وذلك لمخالفته سياسة الإلغاء.`;

            const whatsappUrl = `https://wa.me/${request.guest.phone}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');


            await createNotification({
                user_id: request.guest_id,
                title: 'تحديث بشأن طلب الإلغاء',
                message: `قام المضيف بالرد على طلب إلغاء حجزك لعقار "${request.properties?.title}".`,
                link: '/dashboard?tab=bookings'
            });


            toast({
                title: `تم ${action === 'accepted' ? 'قبول' : 'رفض'} الطلب`,
                description: "تم فتح واتساب لإرسال رسالة للعميل.",
            });
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
    };

    const statusTranslations: Record<CancellationRequest['status'], string> = {
        pending: 'قيد المراجعة',
        accepted: 'مقبول',
        rejected: 'مرفوض',
    };

    const statusVariants: Record<CancellationRequest['status'], "default" | "secondary" | "destructive"> = {
        accepted: 'default',
        pending: 'secondary',
        rejected: 'destructive',
    };


    return (
        <Card>
            <CardHeader className="text-right">
                <CardTitle>طلبات إلغاء الحجز</CardTitle>
                <CardDescription>مراجعة طلبات الإلغاء من العملاء واتخاذ الإجراء المناسب.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-primary/10 hover:bg-primary/10 border-b-primary/20">
                            <TableHead className="text-center text-primary">العقار</TableHead>
                            <TableHead className="text-center text-primary">اسم الضيف</TableHead>
                            <TableHead className="text-center text-primary">رقم الضيف</TableHead>
                            <TableHead className="text-center text-primary">تاريخ الطلب</TableHead>
                            <TableHead className="text-center text-primary">الحالة</TableHead>
                            <TableHead className="text-center text-primary">الإجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.length > 0 ? requests.map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="text-center">{req.properties?.title}</TableCell>
                                <TableCell className="text-center">{req.guest?.full_name}</TableCell>
                                <TableCell className="text-center" dir="ltr">{req.guest?.phone}</TableCell>
                                <TableCell className="text-center">{new Date(req.created_at).toLocaleDateString('ar-EG')}</TableCell>
                                <TableCell className="text-center"><Badge variant={statusVariants[req.status as keyof typeof statusVariants]}>{statusTranslations[req.status as keyof typeof statusTranslations]}</Badge></TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center gap-2">
                                        {req.status === 'pending' ? (
                                            <>
                                                <Button size="sm" onClick={() => handleRequestAction(req.id, 'accepted')}>قبول</Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleRequestAction(req.id, 'rejected')}>رفض</Button>
                                            </>
                                        ) : (
                                            <span>تمت المعالجة</span>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">لا توجد طلبات إلغاء حالياً.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function HostComprehensiveReport({ user, data }: { user: UserDetails, data: any }) {
    const generateReportHTML = () => {
        const { properties, bookings, reviews, bankAccounts } = data;

        const userHtml = `
            <h2>بيانات المضيف</h2>
            <table>
                <tr><th>الاسم</th><td>${user.full_name}</td></tr>
                <tr><th>البريد الإلكتروني</th><td>${user.email || 'غير متوفر'}</td></tr>
                <tr><th>رقم الهاتف</th><td>${user.phone}</td></tr>
            </table>
        `;

        const propertiesHtml = properties.map((p: Property) => `
            <tr>
                <td>${p.id}</td>
                <td>${p.title}</td>
                <td>${p.location}</td>
                <td>${p.price_per_night.toLocaleString()} ${p.currency}</td>
                <td>${p.rating} (${p.review_count})</td>
            </tr>
        `).join('');

        const bookingsHtml = bookings.map((b: any) => `
            <tr>
                <td>${b.id}</td>
                <td>${b.properties.title}</td>
                <td>${b.guest.full_name}</td>
                <td>${b.booking_date}</td>
                <td>${(b.total_amount || 0).toLocaleString()} ${b.currency}</td>
                <td>${bookingStatusTranslations[b.status as BookingStatus]}</td>
            </tr>
        `).join('');

        const reviewsHtml = reviews.map((r: any) => `
            <tr>
                <td>${r.properties.title}</td>
                <td>${r.author.full_name}</td>
                <td>${r.rating}</td>
                <td>${r.comment}</td>
            </tr>
        `).join('');

        const bankAccountsHtml = bankAccounts.map((acc: BankAccount) => `
            <tr>
                <td>${acc.bank_name}</td>
                <td>${acc.account_holder}</td>
                <td>${acc.account_number}</td>
            </tr>
        `).join('');

        const reportContent = `
            ${userHtml}
            
            <h2>قائمة العقارات (${properties.length})</h2>
            <table>
                <thead><tr><th>ID</th><th>الاسم</th><th>الموقع</th><th>السعر/الليلة</th><th>التقييم</th></tr></thead>
                <tbody>${propertiesHtml || '<tr><td colspan="5">لا توجد عقارات.</td></tr>'}</tbody>
            </table>
            
            <h2>قائمة الحجوزات (${bookings.length})</h2>
            <table>
                <thead><tr><th>ID</th><th>العقار</th><th>الضيف</th><th>التاريخ</th><th>المبلغ</th><th>الحالة</th></tr></thead>
                <tbody>${bookingsHtml || '<tr><td colspan="6">لا توجد حجوزات.</td></tr>'}</tbody>
            </table>
            
            <h2>آراء العملاء (${reviews.length})</h2>
            <table>
                <thead><tr><th>العقار</th><th>الضيف</th><th>التقييم</th><th>التعليق</th></tr></thead>
                <tbody>${reviewsHtml || '<tr><td colspan="4">لا توجد آراء.</td></tr>'}</tbody>
            </table>
            
            <h2>الحسابات البنكية (${bankAccounts.length})</h2>
            <table>
                <thead><tr><th>اسم البنك</th><th>صاحب الحساب</th><th>رقم الحساب</th></tr></thead>
                <tbody>${bankAccountsHtml || '<tr><td colspan="3">لا توجد حسابات بنكية.</td></tr>'}</tbody>
            </table>
        `;

        return `
            <html>
                <head>
                    <title>الكشف الشامل للمضيف: ${user.full_name}</title>
                    <meta charset="UTF-8">
                     <style>
                        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
                        body { 
                            font-family: 'Tajawal', sans-serif; 
                            direction: rtl;
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                            color: #333;
                        }
                        .page {
                            width: 210mm;
                            min-height: 297mm;
                            padding: 20mm;
                            margin: 10mm auto;
                            box-shadow: 0 0 0.5cm rgba(0,0,0,0.5);
                            background: white;
                        }
                        .header {
                           display: flex;
                           justify-content: space-between;
                           align-items: center;
                           border-bottom: 2px solid hsl(210, 100%, 50%);
                           padding-bottom: 10px;
                        }
                        .header .logo-container {
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        }
                        .header .logo-container .logo-text {
                           font-size: 28px;
                           font-weight: bold;
                           color: hsl(210, 100%, 50%);
                        }
                        .header .logo-container .logo-icon {
                            width: 32px;
                            height: 32px;
                            color: hsl(210, 100%, 50%);
                        }
                        .header .report-title h1 {
                           margin: 0; font-size: 22px;
                        }
                        .header .report-title p {
                           margin: 0; font-size: 12px; color: #666;
                        }
                        h2 {
                            font-size: 20px;
                            border-bottom: 2px solid hsl(210, 100%, 50%);
                            padding-bottom: 8px;
                            margin-top: 25px;
                            margin-bottom: 15px;
                            color: hsl(210, 100%, 50%);
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 15px;
                            font-size: 12px;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: right;
                        }
                        th {
                            background-color: #f2f2f2;
                            font-weight: bold;
                        }
                        tr:nth-child(even) {
                            background-color: #f9f9f9;
                        }
                        @media print {
                           html, body {
                                width: 210mm;
                                height: 297mm;
                                -webkit-print-color-adjust: exact; 
                                print-color-adjust: exact;
                           }
                           .page {
                                margin: 0;
                                box-shadow: none;
                           }
                           button { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="page">
                         <div class="header">
                            <div class="logo-container">
                                <svg class="logo-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>
                                <div class="logo-text">شاليها</div>
                            </div>
                            <div class="report-title">
                                <h1>الكشف الشامل للمضيف: ${user.full_name}</h1>
                                <p>تاريخ الإنشاء: ${new Date().toLocaleString('ar-EG')}</p>
                            </div>
                        </div>
                        ${reportContent}
                    </div>
                    <script> window.onload = () => setTimeout(() => window.print(), 500); </script>
                </body>
            </html>
        `;
    };

    const handlePrint = () => {
        const reportHtml = generateReportHTML();
        const reportWindow = window.open('', '_blank');
        reportWindow?.document.write(reportHtml);
        reportWindow?.document.close();
    };

    return (
        <Button onClick={handlePrint}>
            <FileText className="ml-2 h-4 w-4" />
            طباعة الكشف الشامل
        </Button>
    );
}


export default function HostDashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [pageLoading, setPageLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<any>({
        properties: [],
        bookings: [],
        reviews: [],
        cancellationRequests: [],
        rescheduleRequests: [],
        bankAccounts: [],
    });

    const fetchDashboardData = useCallback(async (userId: string) => {
        if (!userId) return;
        setPageLoading(true);
        const data = await getHostDashboardData(userId);
        if (data && !data.error) {
            setDashboardData(data);
        } else {
            toast({ title: "خطأ", description: data.error || "لم يتمكن من جلب بيانات لوحة التحكم.", variant: "destructive" });
        }
        setPageLoading(false);
    }, [toast]);

    useEffect(() => {
        if (!loading) {
            if (user && (user.role === 'admin' || user.role === 'host')) {
                fetchDashboardData(user.id);
            } else {
                router.push('/login');
                toast({
                    title: 'غير مصرح به',
                    description: 'يجب أن تكون مضيفًا للوصول إلى هذه الصفحة.',
                    variant: 'destructive',
                });
            }
        }
    }, [user, loading, router, toast, fetchDashboardData]);

    const onUpdate = useCallback(() => {
        if (user) {
            fetchDashboardData(user.id);
        }
    }, [user, fetchDashboardData]);


    if (loading || pageLoading || !user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const { properties, bookings, reviews, cancellationRequests, rescheduleRequests, bankAccounts } = dashboardData;
    const platformBookings = bookings.filter((b: any) => b.type === 'platform');

    return (
        <div className="container mx-auto px-4 py-8" dir="rtl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-headline">لوحة تحكم المضيف</h1>
                <div className="flex items-center gap-2">
                    <HostComprehensiveReport user={user} data={dashboardData} />
                    <Button asChild>
                        <Link href="/host/dashboard/add-property">
                            <PlusCircle className="ml-2 h-4 w-4" />
                            أضف عقارًا جديدًا
                        </Link>
                    </Button>
                </div>
            </div>

            <HostStats properties={properties} bookings={bookings} />

            <Tabs defaultValue="properties" className="w-full">
                <TabsList className="flex flex-wrap h-auto justify-start">
                    <TabsTrigger value="properties">عقاراتي</TabsTrigger>
                    <TabsTrigger value="calendar">التقويم وإدارة التوفر</TabsTrigger>
                    <TabsTrigger value="bookings">الحجوزات</TabsTrigger>
                    <TabsTrigger value="reschedules">تغيير المواعيد</TabsTrigger>
                    <TabsTrigger value="cancellations">طلبات الإلغاء</TabsTrigger>
                    <TabsTrigger value="reviews">آراء وتقييمات العملاء</TabsTrigger>
                    <TabsTrigger value="bank-accounts">الحسابات البنكية</TabsTrigger>
                </TabsList>
                <TabsContent value="properties">
                    <MyPropertiesList properties={properties} onUpdate={onUpdate} />
                </TabsContent>
                <TabsContent value="calendar">
                    <CalendarManagement properties={properties} hostId={user.id} onUpdate={onUpdate} />
                </TabsContent>
                <TabsContent value="bookings">
                    <BookingsList bookings={platformBookings} onUpdate={onUpdate} />
                </TabsContent>
                <TabsContent value="reschedules">
                    <RescheduleRequestsList requests={rescheduleRequests} onUpdate={onUpdate} />
                </TabsContent>
                <TabsContent value="cancellations">
                    <CancellationRequestsList requests={cancellationRequests} onUpdate={onUpdate} />
                </TabsContent>
                <TabsContent value="reviews">
                    <ReviewsList reviews={reviews} onUpdate={onUpdate} />
                </TabsContent>
                <TabsContent value="bank-accounts">
                    <BankAccountsList user={user!} initialAccounts={bankAccounts} onUpdate={onUpdate} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

