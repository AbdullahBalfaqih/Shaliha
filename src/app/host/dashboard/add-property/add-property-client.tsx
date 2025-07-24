
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { UploadCloud, Wifi, Waves, Music, Flame, Tv, Zap, PlusCircle, Trash2, Tag, Sun, Clock, CalendarCheck, ParkingSquare, Home, CookingPot, Image as ImageIcon, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DiscountCode, BookingSystem, Currency } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { addOrUpdateProperty } from "../actions";
import type { Database } from "@/lib/supabase/database.types";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { getPropertyForEdit } from "@/app/properties/actions";
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";


type PropertyData = Omit<Database['public']['Tables']['properties']['Row'], 'id' | 'created_at' | 'host_id' | 'rating' | 'review_count' | 'is_active'>;
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];


const yemeniGovernorates = [
  "أمانة العاصمة",
  "صنعاء",
  "عدن",
  "تعز",
  "الحديدة",
  "حضرموت",
  "إب",
  "ذمار",
  "البيضاء",
  "مأرب",
  "الجوف",
  "صعدة",
  "حجة",
  "المحويت",
  "ريمة",
  "شبوة",
  "المهرة",
  "لحج",
  "أبين",
  "الضالع",
  "عمران",
  "سقطرى",
];

const MapView = dynamic(() => import('@/components/map-view'), { 
  ssr: false,
  loading: () => <Skeleton className="w-full h-[250px] rounded-lg border" />
});


export function AddPropertyClientPage() {
    const { user, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const editId = searchParams.get('edit');

    // Form state
    const [propertyData, setPropertyData] = useState<Partial<PropertyData>>({ type: 'شاليه', booking_system: 'single_period', currency: 'SAR', allow_reschedule: true, amenities: [], has_deposit: false });
    const [isEditMode, setIsEditMode] = useState(false);
    const [coordinatesString, setCoordinatesString] = useState("");
    const [coordinates, setCoordinates] = useState<{ lat: number, lng: number } | null>(null);
    const [coupons, setCoupons] = useState<DiscountCode[]>([]);
    const [currentCoupon, setCurrentCoupon] = useState<{ code: string; value: string; type: 'percentage' | 'fixed' }>({ code: '', value: '', type: 'percentage' });
    const [governorate, setGovernorate] = useState('');
    const [city, setCity] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingData, setIsFetchingData] = useState(true);

     useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== 'host') {
            router.push('/login');
            toast({
                title: 'غير مصرح به',
                description: 'يجب أن تكون مضيفًا للوصول إلى هذه الصفحة.',
                variant: 'destructive',
            });
            return;
        }
        
        const fetchPropertyData = async () => {
            if (editId) {
                setIsFetchingData(true);
                const dataToEdit = await getPropertyForEdit(editId);
                if (dataToEdit) {
                    setIsEditMode(true);
                    setPropertyData(dataToEdit);
                    setGovernorate(dataToEdit.governorate);
                    setCity(dataToEdit.city);
                    setCoupons((dataToEdit.discount_codes as any) || []);
                    setExistingImageUrls(dataToEdit.images || []);
                    if (dataToEdit.coordinates) {
                        const coords = dataToEdit.coordinates as { lat: number, lng: number };
                        setCoordinates(coords);
                        setCoordinatesString(`${coords.lat}, ${coords.lng}`);
                    }
                } else {
                    toast({ title: "العقار غير موجود", variant: "destructive" });
                    router.push('/host/dashboard');
                }
                setIsFetchingData(false);
            } else {
                setIsFetchingData(false);
            }
        };
        fetchPropertyData();
    }, [editId, router, toast, authLoading, user]);

    const handleFileChange = useCallback((files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files);
        setImageFiles(prev => [...prev, ...newFiles]);

        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
    }, []);

    const handleRemoveNewImage = (index: number) => {
        const urlToRemove = imagePreviews[index];
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        URL.revokeObjectURL(urlToRemove);
    };

    const handleRemoveExistingImage = (url: string) => {
        setExistingImageUrls(prev => prev.filter(u => u !== url));
        setImagesToRemove(prev => [...prev, url]);
    };
    
    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        handleFileChange(e.dataTransfer.files);
    };

    const handleCoordinatesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCoordinatesString(value);
        const parts = value.split(',').map(s => s.trim());
        if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
                setCoordinates({ lat, lng });
            } else {
                setCoordinates(null);
            }
        } else {
            setCoordinates(null);
        }
    };
    
    const handleAddCoupon = () => {
        if (currentCoupon.code && currentCoupon.value) {
            setCoupons([...coupons, { ...currentCoupon, value: parseFloat(currentCoupon.value) }]);
            setCurrentCoupon({ code: '', value: '', type: 'percentage' });
        }
    };

    const handleRemoveCoupon = (code: string) => {
        setCoupons(coupons.filter(c => c.code !== code));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.id || !supabase) {
            toast({ title: "الرجاء تسجيل الدخول أولاً", description: "يجب عليك تسجيل الدخول لإضافة عقار.", variant: "destructive" });
            return;
        }

        if (imageFiles.length === 0 && existingImageUrls.length === 0) {
             toast({ title: "الصور مطلوبة", description: "الرجاء رفع صورة واحدة على الأقل للعقار.", variant: "destructive" });
             return;
        }
        
        if (!coordinates) {
             toast({ title: "الإحداثيات مطلوبة", description: "الرجاء إدخال إحداثيات صحيحة.", variant: "destructive" });
             return;
        }

        setIsLoading(true);

        // Remove images marked for deletion from storage
        if (imagesToRemove.length > 0) {
            const filePathsToRemove = imagesToRemove.map(url => {
                const parts = url.split('/');
                return parts.slice(parts.length - 2).join('/');
            });
            await supabase.storage.from('payment-proofs').remove(filePathsToRemove);
        }

        let newImageUrls: string[] = [];
        if (imageFiles.length > 0) {
            const uploadPromises = imageFiles.map(file => {
                const fileName = `${user.id}/${uuidv4()}`;
                return supabase.storage.from('payment-proofs').upload(fileName, file);
            });

            const uploadResults = await Promise.all(uploadPromises);
            
            const failedUploads = uploadResults.filter(res => res.error);
            if (failedUploads.length > 0) {
                 toast({
                    title: "خطأ في رفع الصور",
                    description: `فشل رفع ${failedUploads.length} صورة. ${failedUploads[0].error.message}`,
                    variant: "destructive",
                });
                setIsLoading(false);
                return;
            }

            newImageUrls = uploadResults.map(res => {
                const { data } = supabase.storage.from('payment-proofs').getPublicUrl(res.data!.path);
                return data.publicUrl;
            });
        }
        
        const finalImageUrls = [...existingImageUrls, ...newImageUrls];

        const formData = new FormData(e.target as HTMLFormElement);
        const amenities = Array.from(formData.keys()).filter(key => 
            key.startsWith("amenity-") && formData.get(key) === 'on'
        ).map(key => key.replace("amenity-", ""));
        
        const dataToSave: Omit<PropertyInsert, 'created_at' | 'rating' | 'review_count' | 'is_active'> = {
            id: isEditMode ? editId! : undefined,
            title: formData.get('title') as string,
            title_en: formData.get('title') as string,
            type: formData.get('property-type') as any,
            type_en: formData.get('property-type') as any, 
            governorate: governorate,
            city: city,
            location: `${governorate}, ${city}`,
            location_en: `${governorate}, ${city}`,
            area: Number(formData.get('area')),
            dedicated_for: formData.get('dedicatedFor') as any,
            dedicated_for_en: formData.get('dedicatedFor') as any,
            booking_system: propertyData.booking_system!,
            price_per_night: Number(formData.get('price_per_night') || 0),
            currency: propertyData.currency!,
            morning_period: propertyData.booking_system === 'dual_period' ? { checkIn: formData.get('morning_checkin') || '', checkOut: formData.get('morning_checkout') || '', price: Number(formData.get('morning_price')) } as any : null,
            evening_period: propertyData.booking_system === 'dual_period' ? { checkIn: formData.get('evening_checkin') || '', checkOut: formData.get('evening_checkout') || '', price: Number(formData.get('evening_price')) } as any : null,
            description: formData.get('description') as string,
            description_en: formData.get('description') as string,
            guests: Number(formData.get('capacity')),
            bedrooms: Number(formData.get('bedrooms')),
            bathrooms: Number(formData.get('bathrooms')),
            lounges: Number(formData.get('lounges')),
            amenities: amenities,
            discount_codes: coupons as any,
            allow_reschedule: propertyData.allow_reschedule!,
            has_deposit: propertyData.has_deposit!,
            deposit_amount: propertyData.has_deposit! ? Number(formData.get('deposit_amount')) : null,
            cancellation_policy: formData.get('terms') as string,
            cancellation_policy_en: formData.get('terms') as string, 
            coordinates: coordinates,
            images: finalImageUrls,
            host_id: user.id
        };

        const result = await addOrUpdateProperty(dataToSave as any, user.id, isEditMode ? editId! : undefined);

        if (result.success) {
            toast({
                title: isEditMode ? "تم حفظ التعديلات بنجاح!" : "تمت إضافة العقار بنجاح!",
                description: `تم تحديث بيانات "${dataToSave.title}".`,
            });
            router.push('/host/dashboard');
        } else {
            toast({
                title: "حدث خطأ",
                description: result.error || "فشل حفظ بيانات العقار. الرجاء المحاولة مرة أخرى.",
                variant: "destructive",
            });
        }
        setIsLoading(false);
    }
    
     if (isFetchingData || authLoading || !user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold font-headline">{isEditMode ? 'تعديل العقار' : 'إضافة عقار جديد'}</h1>
                    <p className="text-muted-foreground mt-2">
                        {isEditMode ? 'قم بتحديث تفاصيل عقارك أدناه.' : 'املأ التفاصيل أدناه لإضافة منشأة جديدة إلى ملفك الشخصي.'}
                    </p>
                </div>

                <form className="space-y-8" onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>المعلومات الأساسية</CardTitle>
                            <CardDescription>أخبرنا عن موقع عقارك ومساحته.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <Label htmlFor="title">اسم العقار</Label>
                                <Input name="title" id="title" placeholder="مثال: شاليه الأحلام" defaultValue={propertyData.title || ''} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="property-type">نوع العقار</Label>
                                <Select name="property-type" value={propertyData.type || 'شاليه'} onValueChange={(v: any) => setPropertyData(p => ({...p, type: v}))} required>
                                  <SelectTrigger id="property-type">
                                    <SelectValue placeholder="اختر نوع العقار" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="شاليه">شاليه</SelectItem>
                                    <SelectItem value="فيلا">فيلا</SelectItem>
                                    <SelectItem value="مزرعة">مزرعة</SelectItem>
                                    <SelectItem value="مسبح">مسبح</SelectItem>
                                    <SelectItem value="شقة">شقة</SelectItem>
                                  </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="governorate">المحافظة</Label>
                                <Select name="governorate" value={governorate} onValueChange={setGovernorate} required>
                                  <SelectTrigger id="governorate">
                                    <SelectValue placeholder="اختر المحافظة" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {yemeniGovernorates.map(gov => (
                                      <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">المدينة / الحي</Label>
                                <Input name="city" id="city" placeholder="مثال: حي الرمال" value={city} onChange={e => setCity(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="area">المساحة (بالمتر المربع)</Label>
                                <Input name="area" id="area" type="number" placeholder="500" defaultValue={propertyData.area || 500} required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="lounges">عدد المجالس</Label>
                                <Input name="lounges" id="lounges" type="number" placeholder="2" defaultValue={propertyData.lounges || 2} required/>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>مخصص لـ</Label>
                                <RadioGroup name="dedicatedFor" defaultValue={propertyData.dedicated_for || "عوائل"} className="flex gap-4 pt-2" required>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="عوائل" id="families" />
                                        <Label htmlFor="families" className="font-normal">عوائل</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="عزاب" id="singles" />
                                        <Label htmlFor="singles" className="font-normal">عزاب</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <RadioGroupItem value="كلاهما" id="both" />
                                        <Label htmlFor="both" className="font-normal">كلاهما</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>نظام الحجز والأسعار</CardTitle>
                            <CardDescription>حدد نظام الحجز، الأسعار، وعملة الدفع.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label>فترة الحجز</Label>
                                    <RadioGroup name="bookingSystem" value={propertyData.booking_system} onValueChange={(v:any) => setPropertyData(p => ({...p, booking_system: v}))} className="grid grid-cols-2 gap-4 mt-2">
                                        <Label htmlFor="single_period" className={cn("flex flex-col items-center justify-center gap-2 rounded-md border-2 p-4 cursor-pointer", propertyData.booking_system === 'single_period' ? 'border-primary' : 'border-muted')}>
                                            <RadioGroupItem value="single_period" id="single_period" className="sr-only" />
                                            <Clock className="h-8 w-8" />
                                            فترة واحدة (24 ساعة)
                                        </Label>
                                        <Label htmlFor="dual_period" className={cn("flex flex-col items-center justify-center gap-2 rounded-md border-2 p-4 cursor-pointer", propertyData.booking_system === 'dual_period' ? 'border-primary' : 'border-muted')}>
                                            <RadioGroupItem value="dual_period" id="dual_period" className="sr-only" />
                                            <Sun className="h-8 w-8" />
                                            فترتان (صباحي ومسائي)
                                        </Label>
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency">عملة التسعير</Label>
                                    <Select name="currency" value={propertyData.currency} onValueChange={(v: any) => setPropertyData(p => ({...p, currency: v}))} required>
                                      <SelectTrigger id="currency">
                                        <SelectValue placeholder="اختر العملة" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                                        <SelectItem value="YER">ريال يمني (YER)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {propertyData.booking_system === 'single_period' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                    <div className="space-y-2">
                                        <Label htmlFor="checkin">وقت الدخول</Label>
                                        <Input name="checkin" id="checkin" type="time" defaultValue="16:00" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="checkout">وقت الخروج</Label>
                                        <Input name="checkout" id="checkout" type="time" defaultValue="10:00" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price_per_night">السعر / الليلة</Label>
                                        <Input name="price_per_night" id="price_per_night" type="number" placeholder="950" defaultValue={propertyData.price_per_night || ''} required />
                                    </div>
                                </div>
                            )}

                            {propertyData.booking_system === 'dual_period' && (
                                <div className="space-y-6 pt-4 border-t">
                                    <div className="p-4 border rounded-lg">
                                        <h4 className="font-semibold mb-4">الفترة الصباحية</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="morning_checkin">وقت الدخول</Label>
                                                <Input name="morning_checkin" id="morning_checkin" type="time" defaultValue={(propertyData.morning_period as any)?.checkIn || "08:00"} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="morning_checkout">وقت الخروج</Label>
                                                <Input name="morning_checkout" id="morning_checkout" type="time" defaultValue={(propertyData.morning_period as any)?.checkOut || "18:00"} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="morning_price">السعر</Label>
                                                <Input name="morning_price" id="morning_price" type="number" placeholder="600" defaultValue={(propertyData.morning_period as any)?.price || ''} required />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 border rounded-lg">
                                        <h4 className="font-semibold mb-4">الفترة المسائية</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="evening_checkin">وقت الدخول</Label>
                                                <Input name="evening_checkin" id="evening_checkin" type="time" defaultValue={(propertyData.evening_period as any)?.checkIn || "20:00"} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="evening_checkout">وقت الخروج</Label>
                                                <Input name="evening_checkout" id="evening_checkout" type="time" defaultValue={(propertyData.evening_period as any)?.checkOut || "06:00"} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="evening_price">السعر</Label>
                                                <Input name="evening_price" id="evening_price" type="number" placeholder="550" defaultValue={(propertyData.evening_period as any)?.price || ''} required />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                         <CardHeader>
                            <CardTitle>تفاصيل ومميزات العقار</CardTitle>
                            <CardDescription>صف عقارك بالتفصيل لجذب المستأجرين.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="space-y-2">
                                <Label htmlFor="description">وصف العقار</Label>
                                <Textarea name="description" id="description" placeholder="اكتب وصفاً جذاباً عن الشاليه أو المسبح..." rows={5} defaultValue={propertyData.description || ''} required />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                <div className="space-y-2"><Label htmlFor="capacity">الطاقة الاستيعابية</Label><Input name="capacity" id="capacity" type="number" placeholder="15" defaultValue={propertyData.guests || ''} required/></div>
                                <div className="space-y-2"><Label htmlFor="bedrooms">غرف النوم</Label><Input name="bedrooms" id="bedrooms" type="number" placeholder="2" defaultValue={propertyData.bedrooms || ''} required/></div>
                                <div className="space-y-2"><Label htmlFor="bathrooms">دورات المياه</Label><Input name="bathrooms" id="bathrooms" type="number" placeholder="3" defaultValue={propertyData.bathrooms || ''} required/></div>
                            </div>
                             <div>
                               <Label className="text-base font-semibold">المرافق والإضافات</Label>
                               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg"><Wifi className="text-primary"/><Label htmlFor="amenity-wifi" className="font-normal">إنترنت</Label><Checkbox name="amenity-wifi" id="amenity-wifi" className="mr-auto" defaultChecked={propertyData.amenities?.includes('wifi')}/></div>
                                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg"><CookingPot className="text-primary"/><Label htmlFor="amenity-kitchen" className="font-normal">مطبخ</Label><Checkbox name="amenity-kitchen" id="amenity-kitchen" className="mr-auto" defaultChecked={propertyData.amenities?.includes('kitchen')}/></div>
                                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg"><Waves className="text-primary"/><Label htmlFor="amenity-pool" className="font-normal">مسبح</Label><Checkbox name="amenity-pool" id="amenity-pool" className="mr-auto" defaultChecked={propertyData.amenities?.includes('pool')}/></div>
                                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg"><ParkingSquare className="text-primary"/><Label htmlFor="amenity-parking" className="font-normal">موقف سيارات</Label><Checkbox name="amenity-parking" id="amenity-parking" className="mr-auto" defaultChecked={propertyData.amenities?.includes('parking')}/></div>
                                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg"><Sun className="text-primary"/><Label htmlFor="amenity-ac" className="font-normal">تكييف</Label><Checkbox name="amenity-ac" id="amenity-ac" className="mr-auto" defaultChecked={propertyData.amenities?.includes('ac')}/></div>
                                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg"><Tv className="text-primary"/><Label htmlFor="amenity-tv" className="font-normal">تلفزيون</Label><Checkbox name="amenity-tv" id="amenity-tv" className="mr-auto" defaultChecked={propertyData.amenities?.includes('tv')}/></div>
                                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg"><Zap className="text-primary"/><Label htmlFor="amenity-power_backup" className="font-normal">مزود طاقة</Label><Checkbox name="amenity-power_backup" id="amenity-power_backup" className="mr-auto" defaultChecked={propertyData.amenities?.includes('power_backup')}/></div>
                                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg"><Music className="text-primary"/><Label htmlFor="amenity-speakers" className="font-normal">سماعات</Label><Checkbox name="amenity-speakers" id="amenity-speakers" className="mr-auto" defaultChecked={propertyData.amenities?.includes('speakers')}/></div>
                                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg"><Flame className="text-primary"/><Label htmlFor="amenity-bbq" className="font-normal">ركن شواء</Label><Checkbox name="amenity-bbq" id="amenity-bbq" className="mr-auto" defaultChecked={propertyData.amenities?.includes('bbq')}/></div>
                               </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>أكواد الخصم (اختياري)</CardTitle>
                            <CardDescription>أنشئ كوبونات خصم لتشجيع الحجوزات.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-grow space-y-2">
                                    <Label htmlFor="coupon_code">رمز الكوبون</Label>
                                    <Input id="coupon_code" placeholder="SUMMER24" value={currentCoupon.code} onChange={e => setCurrentCoupon({...currentCoupon, code: e.target.value})} />
                                </div>
                                <div className="space-y-2 w-full md:w-32">
                                    <Label htmlFor="coupon_value">قيمة الخصم</Label>
                                    <Input id="coupon_value" type="number" placeholder="50" value={currentCoupon.value} onChange={e => setCurrentCoupon({...currentCoupon, value: e.target.value})} />
                                </div>
                                <div className="space-y-2 w-full md:w-40">
                                    <Label>نوع الخصم</Label>
                                    <Select value={currentCoupon.type} onValueChange={(value: 'percentage' | 'fixed') => setCurrentCoupon({...currentCoupon, type: value})}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                                            <SelectItem value="fixed">مبلغ ثابت ({propertyData.currency})</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="self-end">
                                    <Button type="button" onClick={handleAddCoupon}>
                                        <PlusCircle className="ml-2 h-4 w-4" />
                                        إضافة كوبون
                                    </Button>
                                </div>
                            </div>
                             {coupons.length > 0 && (
                                <div className="space-y-2 pt-4 border-t">
                                    <Label>الكوبونات المضافة</Label>
                                    <ul className="space-y-2">
                                        {coupons.map(coupon => (
                                            <li key={coupon.code} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                                                <div className="flex items-center gap-2 font-mono">
                                                    <Tag className="h-4 w-4 text-primary" />
                                                    <span>{coupon.code}</span>
                                                    <span className="text-muted-foreground text-xs">({coupon.value}{coupon.type === 'percentage' ? '%' : ` ${propertyData.currency}`})</span>
                                                </div>
                                                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveCoupon(coupon.code)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>الصور والسياسات</CardTitle>
                             <CardDescription>أضف صورًا عالية الجودة وحدد سياساتك.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <Label htmlFor="has_deposit" className="text-base font-semibold flex items-center gap-2">
                                        تفعيل نظام العربون
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        عند التفعيل، سيُطلب من العميل دفع عربون لتأكيد الحجز.
                                    </p>
                                </div>
                                <Switch
                                    id="has_deposit"
                                    checked={propertyData.has_deposit}
                                    onCheckedChange={(checked) => setPropertyData(prev => ({ ...prev, has_deposit: checked }))}
                                />
                            </div>

                            {propertyData.has_deposit && (
                                <div className="space-y-2 pl-4">
                                    <Label htmlFor="deposit_amount">قيمة العربون ({propertyData.currency})</Label>
                                    <Input 
                                        name="deposit_amount"
                                        id="deposit_amount" 
                                        type="number" 
                                        placeholder="200" 
                                        defaultValue={propertyData.deposit_amount || ''}
                                        required={propertyData.has_deposit}
                                    />
                                </div>
                            )}
                            
                             <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <Label htmlFor="allow-reschedule" className="text-base font-semibold flex items-center gap-2">
                                        <CalendarCheck className="h-5 w-5 text-primary" />
                                        السماح للعميل بتغيير موعد الحجز
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        عند تفعيل هذا الخيار، يمكن للعملاء طلب تغيير تاريخ أو وقت حجزهم.
                                    </p>
                                </div>
                                <Switch
                                    name="allow_reschedule"
                                    id="allow-reschedule"
                                    checked={propertyData.allow_reschedule}
                                    onCheckedChange={(checked) => setPropertyData(prev => ({ ...prev, allow_reschedule: checked }))}
                                />
                            </div>
                            <div>
                                <Label className="text-base font-semibold">صور العقار</Label>
                                <input 
                                    id="file-upload" 
                                    type="file" 
                                    multiple 
                                    accept="image/*" 
                                    className="sr-only" 
                                    onChange={(e) => handleFileChange(e.target.files)}
                                />
                                <div 
                                    className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center bg-secondary/50 hover:border-primary transition-colors cursor-pointer"
                                    onDragOver={onDragOver}
                                    onDrop={onDrop}
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="mt-4 text-muted-foreground">اسحب وأفلت الصور هنا، أو انقر للتصفح</p>
                                </div>
                                 {(imagePreviews.length > 0 || existingImageUrls.length > 0) && (
                                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {existingImageUrls.map((url, index) => (
                                            <div key={index} className="relative group aspect-square">
                                                <Image src={url} alt={`Existing ${index}`} layout="fill" objectFit="cover" className="rounded-md" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => handleRemoveExistingImage(url)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                        {imagePreviews.map((src, index) => (
                                            <div key={index} className="relative group aspect-square">
                                                <Image src={src} alt={`Preview ${index}`} layout="fill" objectFit="cover" className="rounded-md" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => handleRemoveNewImage(index)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="terms">الشروط وسياسة الإلغاء</Label>
                                <Textarea name="terms" id="terms" placeholder="مثال: يمنع إدخال الحيوانات الأليفة. في حال الإلغاء قبل 48 ساعة يتم استرجاع 50% من المبلغ." rows={4} defaultValue={propertyData.cancellation_policy || ''} required/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="coordinates">الإحداثيات (خط العرض، خط الطول)</Label>
                                <Input 
                                    id="coordinates" 
                                    placeholder="15.95049, 48.80372"
                                    value={coordinatesString}
                                    onChange={handleCoordinatesChange}
                                    required
                                    dir="ltr"
                                />
                                <p className="text-xs text-muted-foreground">أدخل خط العرض ثم خط الطول، وبينهما فاصلة.</p>
                            </div>
                            {coordinates && (
                                <div className="mt-4 h-[250px] w-full rounded-lg overflow-hidden border">
                                    <MapView position={[coordinates.lat, coordinates.lng]} />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4">
                        <Button size="lg" type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                          {isLoading ? 'جاري الحفظ...' : (isEditMode ? 'حفظ التعديلات' : 'حفظ وإضافة العقار')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
