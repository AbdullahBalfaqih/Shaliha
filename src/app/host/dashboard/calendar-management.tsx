
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { arSA } from "date-fns/locale";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Property, Booking, BookingPeriod } from '@/types';
import { getPropertyBookings, addOrUpdateManualBooking, removeManualBooking } from './actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription as AlertDialogDescriptionComponent, AlertDialogTrigger, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


interface CalendarManagementProps {
    properties: Property[];
    hostId: string;
    onUpdate: () => void;
}

const periodTranslations: Record<BookingPeriod, string> = {
    full_day: 'ليلة كاملة',
    morning: 'فترة صباحية',
    evening: 'فترة مسائية'
};

export function CalendarManagement({ properties, hostId, onUpdate }: CalendarManagementProps) {
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>(properties[0]?.id);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    const [bookingType, setBookingType] = useState<'manual' | 'blocked'>('manual');
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState<BookingPeriod>('full_day');

    const fetchBookings = useCallback(async () => {
        if (!selectedPropertyId) return;
        setLoading(true);
        const { data, error } = await getPropertyBookings(selectedPropertyId);
        if (error) {
            toast({ title: "خطأ في جلب الحجوزات", description: error, variant: "destructive" });
        } else {
            setBookings(data as any || []);
        }
        setLoading(false);
    }, [selectedPropertyId, toast]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const selectedProperty = useMemo(() => properties.find(p => p.id === selectedPropertyId), [properties, selectedPropertyId]);

    const bookedModifiers = useMemo(() => {
        const modifiers: Record<string, Date[]> = {
            platform: [],
            manual: [],
            blocked: [],
            fully_booked: [],
        };
        const periodCounts: Record<string, Set<BookingPeriod>> = {};

        bookings.forEach(booking => {
            const date = new Date(booking.booking_date);
            const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dateStr = localDate.toISOString().split('T')[0];

            if (!periodCounts[dateStr]) {
                periodCounts[dateStr] = new Set();
            }

            periodCounts[dateStr].add(booking.period as BookingPeriod);

            if (booking.type && modifiers[booking.type]) {
                modifiers[booking.type].push(localDate);
            } else if (modifiers.platform) {
                modifiers.platform.push(localDate);
            }
        });

        Object.keys(periodCounts).forEach(dateStr => {
            const periods = periodCounts[dateStr];
            if (selectedProperty?.booking_system === 'single_period' || periods.has('full_day') || (periods.has('morning') && periods.has('evening'))) {
                const date = new Date(dateStr);
                const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                modifiers.fully_booked.push(localDate);
            }
        });

        return modifiers;
    }, [bookings, selectedProperty]);

    const openAddModal = (date: Date) => {
        setEditingBooking(null);
        setSelectedDate(date);
        setBookingType('manual');
        setGuestName('');
        setGuestPhone('');
        setSelectedPeriod(selectedProperty?.booking_system === 'dual_period' ? 'morning' : 'full_day');
        setIsModalOpen(true);
    };

    const openEditModal = (booking: Booking) => {
        setEditingBooking(booking);
        setSelectedDate(new Date(booking.booking_date));
        setBookingType(booking.type as 'manual' | 'blocked');
        setGuestName((booking.guest_details as any)?.name || '');
        setGuestPhone((booking.guest_details as any)?.phone || '');
        setSelectedPeriod(booking.period as BookingPeriod);
        setIsModalOpen(true);
    };

    const handleManualBookingSubmit = async () => {
        if (!selectedPropertyId || !selectedDate) return;

        const payload = {
            id: editingBooking?.id,
            property_id: selectedPropertyId,
            host_id: hostId,
            booking_date: format(selectedDate, 'yyyy-MM-dd'),
            period: selectedPeriod,
            type: bookingType,
            guest_details: bookingType === 'manual' ? { name: guestName, phone: guestPhone } : undefined,
        };

        const result = await addOrUpdateManualBooking(payload);
        if (result.success) {
            toast({ title: "تمت العملية بنجاح!" });
            setIsModalOpen(false);
            fetchBookings();
            onUpdate();
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
    };

    const handleRemoveBooking = async (bookingId: string) => {
        const result = await removeManualBooking(bookingId, hostId);
        if (result.success) {
            toast({ title: "تم الحذف بنجاح" });
            fetchBookings();
            onUpdate();
        } else {
            toast({ title: "خطأ", description: result.error, variant: "destructive" });
        }
    };

    const DayContent = (props: { date: Date }) => {
        const dateBookings = bookings.filter(b => {
            const bookingDate = new Date(b.booking_date);
            const localBookingDate = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());
            return isSameDay(localBookingDate, props.date);
        });

        if (dateBookings.length === 0) return <div className="text-sm">{props.date.getDate()}</div>;

        return (
            <div className="flex flex-col items-center justify-center h-full w-full">
                <span>{props.date.getDate()}</span>
                <div className="flex gap-0.5 mt-1">
                    {dateBookings.map(b => {
                        let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
                        if (b.type === 'manual') variant = 'default';
                        if (b.type === 'blocked') variant = 'destructive';
                        const text = b.period === 'full_day' ? 'محجوز' : (b.period === 'morning' ? 'ص' : 'م');
                        return (
                            <Badge key={b.id} variant={variant} className="text-xs">{text}</Badge>
                        );
                    })}
                </div>
            </div>
        )
    };

    const bookingsForCurrentMonth = useMemo(() => {
        return bookings.filter(b => {
            const bookingDate = new Date(b.booking_date);
            return bookingDate >= startOfMonth(currentMonth) && bookingDate <= endOfMonth(currentMonth);
        }).sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());
    }, [bookings, currentMonth]);

    const getBookingTypeName = (type: string) => {
        if (type === 'manual') return 'حجز يدوي';
        if (type === 'blocked') return 'يوم معطل';
        return 'حجز من المنصة';
    }

    const getGuestName = (booking: Booking) => {
        if (booking.type === 'manual' || booking.type === 'blocked') {
            return (booking.guest_details as any)?.name || (booking.type === 'blocked' ? 'يوم معطل' : 'N/A');
        }
        return (booking as any).guest?.full_name || 'N/A';
    };

    const getGuestPhone = (booking: Booking) => {
        if (booking.type === 'manual') {
            return (booking.guest_details as any)?.phone || 'N/A';
        }
        return (booking as any).guest?.phone || 'N/A';
    };

    return (
        <Card>
            <CardHeader className="text-right">
                <CardTitle>التقويم وإدارة التوفر</CardTitle>
                <CardDescription>عرض حجوزاتك وإضافة حجوزات يدوية أو تعطيل أيام معينة.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="w-full md:w-1/3">
                        <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر عقارًا..." />
                            </SelectTrigger>
                            <SelectContent>
                                {properties.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-secondary border" /><span>حجز من المنصة</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /><span>حجز يدوي</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-destructive" /><span>يوم معطل</span></div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-400" /><span>محجوز بالكامل</span></div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-96">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="p-1 border rounded-md bg-card">
                        <Calendar
                            mode="multiple"
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                            numberOfMonths={2}
                            locale={arSA}
                            dir="rtl"
                            onDayClick={openAddModal}
                            modifiers={{
                                platform: bookedModifiers.platform,
                                manual: bookedModifiers.manual,
                                blocked: bookedModifiers.blocked,
                                fully_booked: bookedModifiers.fully_booked,
                            }}
                            modifiersClassNames={{
                                platform: 'is-platform',
                                manual: 'is-manual',
                                blocked: 'is-blocked',
                                fully_booked: 'is-fully-booked',
                            }}
                            components={{ DayContent: DayContent }}
                        />
                    </div>
                )}
                <style jsx global>{`
                    .is-platform:not(.is-fully-booked) { background-color: hsl(var(--secondary)); border-radius: 0.5rem; }
                    .is-manual:not(.is-fully-booked) { background-color: hsl(var(--primary) / 0.8); color: hsl(var(--primary-foreground)); border-radius: 0.5rem; }
                    .is-blocked:not(.is-fully-booked) { background-color: hsl(var(--destructive) / 0.8); color: hsl(var(--destructive-foreground)); border-radius: 0.5rem; }
                    .is-fully-booked { background-color: #9ca3af; color: white; border-radius: 0.5rem; text-decoration: line-through; pointer-events: none; }
                 `}</style>
            </CardContent>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent dir="rtl">
                    <DialogHeader className="text-right">
                        <DialogTitle>{editingBooking ? 'تعديل الحجز' : `إضافة حجز ليوم ${selectedDate && format(selectedDate, "d MMMM yyyy", { locale: arSA })}`}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <RadioGroup value={bookingType} onValueChange={(v: 'manual' | 'blocked') => setBookingType(v)} className="grid grid-cols-2 gap-4">
                            <Label className={cn("flex items-center justify-center rounded-md border p-3 cursor-pointer", bookingType === 'manual' ? 'border-primary' : '')}>
                                <RadioGroupItem value="manual" id="manual" className="sr-only" />
                                حجز يدوي
                            </Label>
                            <Label className={cn("flex items-center justify-center rounded-md border p-3 cursor-pointer", bookingType === 'blocked' ? 'border-primary' : '')}>
                                <RadioGroupItem value="blocked" id="blocked" className="sr-only" />
                                تعطيل اليوم
                            </Label>
                        </RadioGroup>

                        {bookingType === 'manual' && (
                            <div className="space-y-4 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label htmlFor="guest-name">اسم العميل</Label>
                                    <Input id="guest-name" value={guestName} onChange={e => setGuestName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="guest-phone">رقم هاتف العميل</Label>
                                    <Input id="guest-phone" type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
                                </div>
                            </div>
                        )}

                        {selectedProperty?.booking_system === 'dual_period' && (
                            <div className="space-y-2 pt-4 border-t">
                                <Label>الفترة</Label>
                                <RadioGroup value={selectedPeriod} onValueChange={(v: BookingPeriod) => setSelectedPeriod(v)} className="grid grid-cols-3 gap-2">
                                    <Label className={cn("flex items-center justify-center rounded-md border p-2 cursor-pointer", selectedPeriod === 'morning' ? 'border-primary' : '')}>
                                        <RadioGroupItem value="morning" id="morning" className="sr-only" /> صباحي
                                    </Label>
                                    <Label className={cn("flex items-center justify-center rounded-md border p-2 cursor-pointer", selectedPeriod === 'evening' ? 'border-primary' : '')}>
                                        <RadioGroupItem value="evening" id="evening" className="sr-only" /> مسائي
                                    </Label>
                                    <Label className={cn("flex items-center justify-center rounded-md border p-2 cursor-pointer", selectedPeriod === 'full_day' ? 'border-primary' : '')}>
                                        <RadioGroupItem value="full_day" id="full_day" className="sr-only" /> يوم كامل
                                    </Label>
                                </RadioGroup>
                            </div>
                        )}

                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                        <Button onClick={handleManualBookingSubmit}>
                            {editingBooking ? 'حفظ التعديلات' : 'تأكيد الحجز'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <CardHeader className="text-right border-t mt-6 pt-6">
                <CardTitle>تفاصيل حجوزات الشهر الحالي</CardTitle>
                <CardDescription>عرض جميع الحجوزات للشهر المحدد في التقويم.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>التاريخ</TableHead>
                            <TableHead>نوع الحجز</TableHead>
                            <TableHead>الاسم</TableHead>
                            <TableHead>الهاتف</TableHead>
                            <TableHead>الفترة</TableHead>
                            <TableHead className="text-center">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                        ) : bookingsForCurrentMonth.length > 0 ? bookingsForCurrentMonth.map(booking => (
                            <TableRow key={booking.id}>
                                <TableCell>{format(new Date(booking.booking_date), "d MMM yyyy", { locale: arSA })}</TableCell>
                                <TableCell>{getBookingTypeName(booking.type)}</TableCell>
                                <TableCell>{getGuestName(booking)}</TableCell>
                                <TableCell>{getGuestPhone(booking)}</TableCell>
                                <TableCell>{periodTranslations[booking.period as BookingPeriod]}</TableCell>
                                <TableCell className="text-center">
                                    {(booking.type === 'manual' || booking.type === 'blocked') && (
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEditModal(booking)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent dir="rtl">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                        <AlertDialogDescriptionComponent>
                                                            سيتم حذف هذا الإدخال نهائياً. لا يمكن التراجع عن هذا الإجراء.
                                                        </AlertDialogDescriptionComponent>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleRemoveBooking(booking.id)} className="bg-destructive hover:bg-destructive/90">
                                                            نعم، حذف
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">لا توجد حجوزات يدوية أو معطلة لهذا الشهر.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

}
