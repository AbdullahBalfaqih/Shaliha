
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Home, DollarSign, Activity, Trash2, FileText, MessageCircle, Waves, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import type { Database } from '@/lib/supabase/database.types';
import { getAllUsers, deleteUser, getSystemStats, getAllPropertiesForAdmin, getSystemReportData } from './actions';
import type { UserDetails } from '@/lib/supabase/client';
import type { Booking, CancellationRequest, Property, RescheduleRequest, Review } from '@/types';


type BankAccount = Database['public']['Tables']['bank_accounts']['Row'];
type PropertyAdmin = Database['public']['Tables']['properties']['Row'] & { rating: number, review_count: number };


const roleTranslations: Record<UserDetails['role'], string> = {
    host: 'مضيف',
    user: 'عميل',
    admin: 'مدير',
};

const roleVariants: Record<UserDetails['role'], "default" | "secondary" | "destructive"> = {
    host: 'default',
    user: 'secondary',
    admin: 'destructive',
};

export default function AdminDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [pageLoading, setPageLoading] = useState(true);

    const [users, setUsers] = useState<UserDetails[]>([]);
    const [properties, setProperties] = useState<PropertyAdmin[]>([]);
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalHosts: 0,
        totalCustomers: 0,
        totalProperties: 0,
        totalRevenue: 0,
        activeBookings: 0,
    });

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== 'admin') {
            router.push('/login');
            toast({
                title: 'غير مصرح به',
                description: 'يجب أن تكون مديرًا للوصول إلى هذه الصفحة.',
                variant: 'destructive',
            });
            return;
        }

        async function fetchData() {
            setPageLoading(true);
            try {
                const { data: bookingsData } = await (await import('@/lib/supabase/client')).supabase!.from('bookings').select('*').eq('status', 'confirmed');

                const [usersData, propertiesData, statsData] = await Promise.all([
                    getAllUsers(),
                    getAllPropertiesForAdmin(),
                    getSystemStats()
                ]);

                setUsers(usersData as UserDetails[]);
                setProperties(propertiesData as PropertyAdmin[]);
                setAllBookings((bookingsData as any) || []);
                setStats({
                    totalUsers: statsData.totalUsers,
                    totalHosts: statsData.totalHosts,
                    totalCustomers: statsData.totalCustomers,
                    totalProperties: statsData.totalProperties,
                    totalRevenue: statsData.totalRevenue,
                    activeBookings: statsData.activeBookings,
                });

            } catch (error) {
                toast({
                    title: 'خطأ في جلب البيانات',
                    description: 'حدث خطأ أثناء تحميل بيانات لوحة التحكم.',
                    variant: 'destructive',
                });
            } finally {
                setPageLoading(false);
            }
        }

        fetchData();
    }, [user, authLoading, router, toast]);

    if (authLoading || pageLoading || !user || user.role !== 'admin') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }


    const handleDeleteUser = async (userId: string) => {
        const result = await deleteUser(userId);
        if (result.success) {
            setUsers(users.filter(u => u.id !== userId));
            toast({
                title: "تم حذف المستخدم",
                description: "تم حذف المستخدم من النظام بنجاح.",
            });
        } else {
            toast({
                title: "فشل حذف المستخدم",
                description: result.error || "حدث خطأ غير متوقع.",
                variant: "destructive",
            });
        }
    };

    const handleSendReminder = (hostUser: UserDetails) => {
        if (!hostUser.phone) return;
        const hostBookings = allBookings.filter(b => b.host_id === hostUser.id);
        const serviceFeeDue = hostBookings.reduce((sum, b) => sum + b.service_fee, 0);
        const currency = hostBookings.length > 0 ? hostBookings[0].currency : 'YER';

        const message = `مرحباً ${hostUser.full_name}, نود تذكيركم بأن لديكم رسوم خدمة مستحقة بقيمة ${serviceFeeDue.toLocaleString()} ${currency}. يرجى السداد في أقرب وقت ممكن. شكراً لتعاونكم، فريق شاليها.`;
        const whatsappUrl = `https://wa.me/${hostUser.phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        toast({
            title: "تم إرسال التذكير",
            description: `تم فتح واتساب لإرسال رسالة تذكير إلى ${hostUser.full_name}.`,
        });
    };

    const generateReportHTML = (title: string, content: string) => {
        return `
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
                <head>
                    <title>${title}</title>
                    <meta charset="UTF-8">
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        body { 
                            font-family: 'Tajawal', sans-serif; 
                            margin: 0;
                            padding: 0;
                            background-color: #f4f4f4;
                            color: #333;
                            -webkit-print-color-adjust: exact; 
                            print-color-adjust: exact;
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
                           border-bottom: 2px solid #3b82f6;
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
                           color: #3b82f6;
                        }
                        .header .logo-container .logo-icon {
                            width: 32px;
                            height: 32px;
                            color: #3b82f6;
                            fill: none;
                            stroke: currentColor;
                            stroke-width: 2;
                            stroke-linecap: round;
                            stroke-linejoin: round;
                        }
                        .header .report-title h1 {
                           margin: 0; font-size: 22px; text-align: left;
                        }
                        .header .report-title p {
                           margin: 0; font-size: 12px; color: #666; text-align: left;
                        }
                        h2 {
                            font-size: 20px;
                            border-bottom: 2px solid #3b82f6;
                            padding-bottom: 8px;
                            margin-top: 25px;
                            margin-bottom: 15px;
                            color: #3b82f6;
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
                            word-break: break-word;
                        }
                        th {
                            background-color: #f2f2f2;
                            font-weight: bold;
                        }
                        tr:nth-child(even) {
                            background-color: #f9f9f9;
                        }
                        .stats-grid {
                            display: grid;
                            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                            gap: 20px;
                            margin-bottom: 20px;
                        }
                        .stat-card {
                            border: 1px solid #ddd;
                            padding: 15px;
                            border-radius: 8px;
                            background-color: #f9f9f9;
                            text-align: center;
                        }
                        .stat-card h3 {
                            margin: 0 0 10px 0;
                            font-size: 16px;
                            color: #555;
                        }
                        .stat-card p {
                             margin: 0;
                             font-size: 20px;
                             font-weight: bold;
                             color: #3b82f6;
                        }
                        @media print {
                           .page {
                                margin: 0;
                                box-shadow: none;
                                page-break-after: always;
                           }
                           button { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="page">
                         <div class="header">
                            <div class="logo-container">
                                <svg class="logo-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>
                                <div class="logo-text">شاليها</div>
                            </div>
                            <div class="report-title">
                                <h1>${title}</h1>
                                <p>تاريخ الإنشاء: ${new Date().toLocaleString('ar-EG')}</p>
                            </div>
                        </div>
                        ${content}
                    </div>
                </body>
            </html>
        `;
    };

    const downloadReport = (htmlContent: string, filename: string) => {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    const handleGenerateHostReport = (hostUser: UserDetails) => {
        const hostProperties = properties.filter(p => p.host_id === hostUser.id);
        const hostBookings = allBookings.filter(b => b.host_id === hostUser.id);

        const reportContent = `
            <h2>بيانات المضيف</h2>
            <table>
                <tr><th>الاسم</th><td>${hostUser.full_name}</td></tr>
                <tr><th>البريد الإلكتروني</th><td>${hostUser.email || 'غير متوفر'}</td></tr>
                <tr><th>رقم الهاتف</th><td>${hostUser.phone}</td></tr>
            </table>
            
            <h2>العقارات (${hostProperties.length})</h2>
            <table>
                <thead><tr><th>اسم العقار</th><th>الموقع</th><th>السعر/الليلة</th><th>التقييم</th></tr></thead>
                <tbody>
                    ${hostProperties.length > 0 ? hostProperties.map(p => `<tr><td>${p.title}</td><td>${p.location}</td><td>${p.price_per_night.toLocaleString()} ${p.currency}</td><td>${p.rating.toFixed(1)} (${p.review_count} مراجعة)</td></tr>`).join('') : '<tr><td colspan="4">لا توجد عقارات مسجلة لهذا المضيف.</td></tr>'}
                </tbody>
            </table>
            
            <h2>الحجوزات (${hostBookings.length})</h2>
            <table>
                <thead><tr><th>تاريخ الحجز</th><th>العقار</th><th>المبلغ</th><th>الحالة</th></tr></thead>
                <tbody>
                    ${hostBookings.length > 0 ? hostBookings.map(b => `<tr><td>${b.booking_date}</td><td>${(properties.find(p => p.id === b.property_id) as any)?.title || 'غير معروف'}</td><td>${b.total_amount.toLocaleString()} ${b.currency}</td><td>${b.status}</td></tr>`).join('') : '<tr><td colspan="4">لا توجد حجوزات لهذا المضيف.</td></tr>'}
                </tbody>
            </table>
        `;
        const reportHtml = generateReportHTML(`تقرير المضيف: ${hostUser.full_name}`, reportContent);
        downloadReport(reportHtml, `host-report-${hostUser.id}.html`);
        toast({ title: "تم إنشاء تقرير المضيف", description: "بدأ تنزيل الملف." });
    };

    const handleGenerateSystemReport = async () => {
        toast({ title: "جاري إنشاء التقرير...", description: "قد يستغرق هذا بعض الوقت." });
        const data = await getSystemReportData();
        if (data.error) {
            toast({ title: "خطأ", description: data.error, variant: "destructive" });
            return;
        }

        const { users, properties, bookings, reviews, cancellationRequests, rescheduleRequests, bankAccounts } = data;

        const usersHtml = (users || []).map((user: UserDetails) => `
            <tr>
                <td>${user.id}</td>
                <td>${user.full_name}</td>
                <td>${user.email || 'غير متوفر'}</td>
                <td>${user.phone || 'غير متوفر'}</td>
                <td><span style="background-color: ${user.role === 'host' ? '#2563eb' : (user.role === 'admin' ? '#dc2626' : '#64748b')}; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 12px;">${roleTranslations[user.role!]}</span></td>
            </tr>
        `).join('');

        const propertiesHtml = (properties || []).map((p: PropertyAdmin) => `
            <tr>
                <td>${p.id}</td>
                <td>${p.title}</td>
                <td>${p.location}</td>
                <td>${p.host_id}</td>
                <td>${p.price_per_night.toLocaleString()} ${p.currency}</td>
                <td>${p.rating.toFixed(1)} (${p.review_count})</td>
                <td>${p.is_active ? 'نشط' : 'غير نشط'}</td>
            </tr>
        `).join('');

        const bookingsHtml = (bookings || []).map((b: Booking) => `
            <tr>
                <td>${b.id}</td>
                <td>${(b as any).properties?.title || 'غير متوفر'}</td>
                <td>${(b as any).guest?.full_name || 'حجز يدوي'}</td>
                <td>${b.booking_date}</td>
                <td>${b.total_amount?.toLocaleString() || 'N/A'} ${b.currency || ''}</td>
                <td>${b.status}</td>
            </tr>
        `).join('');

        const reviewsHtml = (reviews || []).map((r: Review) => `
             <tr>
                <td>${r.id}</td>
                <td>${(r as any).properties?.title}</td>
                <td>${(r as any).author?.full_name}</td>
                <td>${r.rating}</td>
                <td>${r.comment || 'لا يوجد تعليق'}</td>
            </tr>
        `).join('');

        const cancellationsHtml = (cancellationRequests || []).map((c: CancellationRequest) => `
            <tr>
                <td>${c.id}</td>
                <td>${(c as any).properties.title}</td>
                <td>${(c as any).guest.full_name}</td>
                <td>${new Date(c.created_at).toLocaleDateString()}</td>
                <td>${c.status}</td>
            </tr>
        `).join('');

        const reschedulesHtml = (rescheduleRequests || []).map((r: RescheduleRequest) => `
            <tr>
                <td>${r.id}</td>
                <td>${(r as any).properties.title}</td>
                <td>${(r as any).guest.full_name}</td>
                <td>${r.new_date}</td>
                <td>${r.new_period}</td>
                <td>${r.status}</td>
            </tr>
        `).join('');

        const bankAccountsHtml = (bankAccounts || []).map((acc: BankAccount) => `
            <tr>
                <td>${acc.id}</td>
                <td>${acc.bank_name}</td>
                <td>${acc.account_holder}</td>
                <td>${acc.account_number}</td>
                <td>${acc.user_id}</td>
            </tr>
        `).join('');

        const reportContent = `
            <h2>ملخص النظام</h2>
             <div class="stats-grid">
                <div class="stat-card"><h3>إجمالي المستخدمين</h3><p>${stats.totalUsers}</p></div>
                <div class="stat-card"><h3>إجمالي المضيفين</h3><p>${stats.totalHosts}</p></div>
                <div class="stat-card"><h3>إجمالي العملاء</h3><p>${stats.totalCustomers}</p></div>
                <div class="stat-card"><h3>إجمالي العقارات</h3><p>${stats.totalProperties}</p></div>
                 <div class="stat-card"><h3>إجمالي الإيرادات</h3><p>${stats.totalRevenue.toLocaleString()}</p></div>
                <div class="stat-card"><h3>الحجوزات النشطة</h3><p>${stats.activeBookings}</p></div>
            </div>
            
            <h2>قائمة المستخدمين (${(users || []).length})</h2>
            <table>
                <thead><tr><th>ID</th><th>الاسم</th><th>البريد الإلكتروني</th><th>رقم الهاتف</th><th>الدور</th></tr></thead>
                <tbody>${usersHtml}</tbody>
            </table>
            
            <h2>قائمة العقارات (${(properties || []).length})</h2>
            <table>
                <thead><tr><th>ID</th><th>الاسم</th><th>الموقع</th><th>المضيف</th><th>السعر/الليلة</th><th>التقييم</th><th>الحالة</th></tr></thead>
                <tbody>${propertiesHtml}</tbody>
            </table>

            <h2>قائمة الحجوزات (${(bookings || []).length})</h2>
            <table>
                <thead><tr><th>ID</th><th>العقار</th><th>الضيف</th><th>التاريخ</th><th>المبلغ</th><th>الحالة</th></tr></thead>
                <tbody>${bookingsHtml}</tbody>
            </table>

            <h2>قائمة التقييمات (${(reviews || []).length})</h2>
            <table>
                <thead><tr><th>ID</th><th>العقار</th><th>الضيف</th><th>التقييم</th><th>التعليق</th></tr></thead>
                <tbody>${reviewsHtml}</tbody>
            </table>

            <h2>طلبات الإلغاء (${(cancellationRequests || []).length})</h2>
            <table>
                <thead><tr><th>ID</th><th>العقار</th><th>الضيف</th><th>تاريخ الطلب</th><th>الحالة</th></tr></thead>
                <tbody>${cancellationsHtml}</tbody>
            </table>

            <h2>طلبات تغيير الموعد (${(rescheduleRequests || []).length})</h2>
            <table>
                <thead><tr><th>ID</th><th>العقار</th><th>الضيف</th><th>التاريخ الجديد</th><th>الفترة الجديدة</th><th>الحالة</th></tr></thead>
                <tbody>${reschedulesHtml}</tbody>
            </table>
            
            <h2>الحسابات البنكية (${(bankAccounts || []).length})</h2>
            <table>
                <thead><tr><th>ID</th><th>البنك</th><th>صاحب الحساب</th><th>رقم الحساب</th><th>معرف المضيف</th></tr></thead>
                <tbody>${bankAccountsHtml}</tbody>
            </table>
        `;
        const reportHtml = generateReportHTML('تقرير النظام الشامل', reportContent);
        downloadReport(reportHtml, 'system-report.html');
        toast({ title: "تم إنشاء تقرير النظام", description: "بدأ تنزيل الملف." });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-headline">لوحة تحكم المدير</h1>
                <Button onClick={handleGenerateSystemReport} className="bg-primary hover:bg-primary/90">
                    <FileText className="ml-2 h-4 w-4" />
                    إنشاء تقرير للنظام
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">{stats.totalHosts} مضيف, {stats.totalCustomers} عميل</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي العقارات</CardTitle>
                        <Home className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalProperties}</div>
                        <p className="text-xs text-muted-foreground">+0 منذ الأسبوع الماضي</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الإيرادات (رسوم خدمة)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">+0% عن الشهر الماضي</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">الحجوزات النشطة</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeBookings}</div>
                        <p className="text-xs text-muted-foreground">+0 حاليًا</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>إدارة مستخدمي النظام</CardTitle>
                    <CardDescription>عرض وإدارة جميع المستخدمين والمضيفين في المنصة.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الاسم</TableHead>
                                <TableHead>البريد الإلكتروني</TableHead>
                                <TableHead>رقم الهاتف</TableHead>
                                <TableHead className="text-center">الدور</TableHead>
                                <TableHead className="text-center">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length > 0 ? users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.full_name}</TableCell>
                                    <TableCell>{user.email || 'غير متوفر'}</TableCell>
                                    <TableCell dir="ltr">{user.phone || 'غير متوفر'}</TableCell>
                                    <TableCell className="text-center"><Badge variant={roleVariants[user.role!]}>{roleTranslations[user.role!]}</Badge></TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center gap-2">
                                            {user.role === 'host' && (
                                                <>
                                                    <Button variant="outline" size="sm" onClick={() => handleGenerateHostReport(user)}>
                                                        <FileText className="ml-2 h-4 w-4" />
                                                        تقرير
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => handleSendReminder(user)}>
                                                        <MessageCircle className="ml-2 h-4 w-4" />
                                                        تذكير
                                                    </Button>
                                                </>
                                            )}
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" disabled={user.role === 'admin'}>
                                                        <Trash2 className="ml-2 h-4 w-4" />
                                                        حذف
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent dir="rtl">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>هل أنت متأكد من حذف المستخدم؟</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            سيتم حذف حساب "{user.full_name}" وجميع البيانات المرتبطة به نهائياً. لا يمكن التراجع عن هذا الإجراء.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>تراجع</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">تأكيد الحذف</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">لا يوجد مستخدمون لعرضهم.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}


