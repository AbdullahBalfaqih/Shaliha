
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Waves, Home, User, X } from "lucide-react";
import Image from "next/image";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import PrivacyPolicyPage from "@/app/privacy/page";
import TermsOfServicePage from "@/app/terms/page";
import { sendOtpAction, verifyOtpAction } from "./actions";
import PhoneInput, { isPossiblePhoneNumber, getCountryCallingCode } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { ar } from '@/lib/phone-labels';


export default function SignupPage() {
    const { signUp } = useAuth();
    const { toast } = useToast();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState<string | undefined>("");
    const [userType, setUserType] = useState<"user" | "host">("user");
    const [step, setStep] = useState<'details' | 'otp'>('details');
    const [otp, setOtp] = useState("");
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!agreedToTerms) {
            toast({
                title: "الموافقة على الشروط مطلوبة",
                description: "يجب عليك الموافقة على شروط الخدمة وسياسة الخصوصية للمتابعة.",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        if (!firstName || !lastName || !phone || !password) {
            toast({
                title: "الحقول الأساسية مطلوبة",
                description: "الرجاء ملء الاسم، رقم الهاتف، وكلمة المرور.",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            toast({
                title: "كلمة المرور ضعيفة",
                description: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        if (!phone || !isPossiblePhoneNumber(phone)) {
            toast({
                title: "رقم هاتف غير صالح",
                description: "الرجاء إدخال رقم هاتف صحيح.",
                variant: "destructive",
            });
            setIsLoading(false);
            return;
        }

        try {
            const countryCode = getCountryCallingCode(phone);
            if (countryCode === '967') {
                // Yemen specific validation
                const nationalNumber = phone.substring(phone.indexOf(countryCode) + countryCode.length);
                const validPrefixes = ["77", "78", "70", "71", "73"];
                const phonePrefix = nationalNumber.substring(0, 2);

                if (nationalNumber.length !== 9 || !validPrefixes.includes(phonePrefix)) {
                    toast({
                        title: "رقم هاتف يمني غير صالح",
                        description: "يجب أن يكون الرقم اليمني مكونًا من 9 أرقام بعد رمز الدولة ويبدأ بأحد الأرقام التالية: 70, 71, 73, 77, 78.",
                        variant: "destructive",
                    });
                    setIsLoading(false);
                    return;
                }
            }
        } catch (error) {
            // This can happen if the number is not a valid E.164 format, even if isPossiblePhoneNumber passed.
            // We can ignore this for non-Yemeni numbers as the library handles general validation.
            console.warn("Could not get country calling code, proceeding without Yemen-specific validation.", error);
        }


        if (userType === 'host') {
            if (!email) {
                toast({
                    title: "البريد الإلكتروني مطلوب للمضيفين",
                    description: "الرجاء إدخال بريدك الإلكتروني للمتابعة.",
                    variant: "destructive",
                });
                setIsLoading(false);
                return;
            }

            try {
                const response = await sendOtpAction({ email, name: `${firstName} ${lastName}` });
                if (response.success) {
                    setStep('otp');
                    toast({
                        title: "تم إرسال رمز التحقق",
                        description: "لقد أرسلنا رمزًا إلى بريدك الإلكتروني. الرجاء التحقق منه (أو من طرفية الخادم).",
                    });
                } else {
                    toast({
                        title: "فشل إرسال الرمز",
                        description: response.message || "حدث خطأ ما. حاول مرة أخرى.",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                toast({
                    title: "خطأ في الشبكة",
                    description: "لا يمكن الاتصال بالخادم. حاول مرة أخرى.",
                    variant: "destructive",
                });
            }

        } else {
            // Customer signs up directly without OTP
            await signUp({ phone, password, fullName: `${firstName} ${lastName}`, role: 'user', email: null });
        }
        setIsLoading(false);
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const isVerified = await verifyOtpAction({ email, otp });

        if (isVerified) {
            await signUp({ phone: phone!, password, fullName: `${firstName} ${lastName}`, role: userType, email: email });
        } else {
            toast({
                title: "رمز تحقق غير صحيح",
                description: "الرجاء إدخال الرمز الصحيح المكون من 6 أرقام.",
                variant: "destructive",
            });
        }
        setIsLoading(false);
    };


    return (
        <div className="w-full flex items-center justify-center min-h-screen p-4">
            <div className="container mx-auto max-w-4xl w-full">
                <div className="grid lg:grid-cols-2 items-center gap-8 bg-card border rounded-xl shadow-lg overflow-hidden">
                    <div className="p-8 lg:p-12">
                        {step === 'details' ? (
                            <>
                                <div className="grid gap-2 text-center mb-8">
                                    <Waves className="mx-auto h-8 w-auto text-primary" />
                                    <span className="text-2xl font-bold font-headline text-foreground sm:inline-block">
                                        شاليها
                                    </span>
                                    <h1 className="text-3xl font-bold font-headline">
                                        إنشاء حساب جديد
                                    </h1>
                                    <p className="text-muted-foreground">
                                        أدخل معلوماتك لإنشاء حساب جديد
                                    </p>
                                </div>
                                <form onSubmit={handleDetailsSubmit} className="space-y-4">
                                    <div className="grid gap-2 text-right">
                                        <Label>حدد نوع الحساب</Label>
                                        <RadioGroup defaultValue="user" onValueChange={(value: "user" | "host") => setUserType(value)} className="grid grid-cols-2 gap-4">
                                            <div>
                                                <RadioGroupItem value="user" id="user" className="sr-only" />
                                                <Label htmlFor="user" className={cn("flex flex-col items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer aspect-square", userType === 'user' && "border-primary")}>
                                                    <User className="h-8 w-8" />
                                                    عميل
                                                </Label>
                                            </div>
                                            <div>
                                                <RadioGroupItem value="host" id="host" className="sr-only" />
                                                <Label htmlFor="host" className={cn("flex flex-col items-center justify-center gap-2 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer aspect-square", userType === 'host' && "border-primary")}>
                                                    <Home className="h-8 w-8" />
                                                    مضيف
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2 text-right">
                                            <Label htmlFor="first-name">الاسم الأول</Label>
                                            <Input id="first-name" placeholder="خالد" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2 text-right">
                                            <Label htmlFor="last-name">الاسم الأخير</Label>
                                            <Input id="last-name" placeholder="الأحمد" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="grid gap-2 text-right">
                                        <Label htmlFor="phone">رقم الهاتف</Label>
                                        <PhoneInput
                                            id="phone"
                                            placeholder="أدخل رقم الهاتف"
                                            value={phone}
                                            onChange={setPhone}
                                            defaultCountry="YE"
                                            international
                                            className="phone-input"
                                            labels={ar}
                                        />
                                    </div>

                                    {userType === 'host' && (
                                        <div className="grid gap-2 text-right">
                                            <Label htmlFor="email">البريد الإلكتروني</Label>
                                            <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required={userType === 'host'} />
                                        </div>
                                    )}

                                    <div className={"grid gap-2 text-right"}>
                                        <Label htmlFor="password">كلمة المرور</Label>
                                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                        <p className="text-xs text-muted-foreground">يجب أن تكون كلمة المرور 6 أحرف على الأقل.</p>
                                    </div>

                                    <div className="items-center flex space-x-2 space-x-reverse">
                                        <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(!!checked)} />
                                        <label
                                            htmlFor="terms"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            أوافق على{" "}
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <span className="underline hover:text-primary cursor-pointer">شروط الخدمة</span>
                                                </DialogTrigger>
                                                <DialogContent dir="rtl" className="max-w-3xl">
                                                    <DialogHeader className="text-right">
                                                        <DialogTitle dir="rtl" className="text-right">شروط الخدمة</DialogTitle>
                                                        <DialogClose
                                                            className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100
                   focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none
                   data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                                                        >
                                                            <X className="h-4 w-4" />
                                                            <span className="sr-only">Close</span>
                                                        </DialogClose>
                                                    </DialogHeader>
                                                    <ScrollArea
                                                        className="h-[70vh] pr-6"  // بدّل padding-left (pl-6) إلى padding-right (pr-6)
                                                        style={{ direction: 'rtl' }}  // تأكد من أن المحتوى داخل ScrollArea يتبع الاتجاه RTL
                                                    >
                                                        <TermsOfServicePage />
                                                    </ScrollArea>
                                                </DialogContent>
                                            </Dialog>
                                            {" "}
                                            و{" "}
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <span className="underline hover:text-primary cursor-pointer">سياسة الخصوصية</span>
                                                </DialogTrigger>
                                                <DialogContent dir="rtl" className="max-w-3xl">
                                                    <DialogHeader className="text-right">
                                                        <DialogTitle dir="rtl" className="text-right">سياسة الخصوصية</DialogTitle>

                                                        <DialogClose
                                                            className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100
                   focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none
                   data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                                                        >
                                                            <X className="h-4 w-4" />
                                                            <span className="sr-only">Close</span>
                                                        </DialogClose>
                                                    </DialogHeader>
                                                    <ScrollArea
                                                        className="h-[70vh] pr-6"  // نفس التعديل هنا
                                                        style={{ direction: 'rtl' }}
                                                    >
                                                        <PrivacyPolicyPage />
                                                    </ScrollArea>
                                                </DialogContent>
                                            </Dialog>

                                            .
                                        </label>
                                    </div>

                                    <Button type="submit" className="w-full h-11 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!agreedToTerms || isLoading}>
                                        {isLoading ? 'جاري...' : (userType === 'host' ? 'التحقق من البريد' : 'إنشاء الحساب')}
                                    </Button>
                                </form>
                                <div className="mt-6 text-center text-sm">
                                    هل لديك حساب بالفعل؟{" "}
                                    <Link href="/login" className="underline text-primary">
                                        تسجيل الدخول
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <Waves className="h-10 w-10 text-primary mx-auto mb-2" />
                                <h1 className="text-3xl font-bold font-headline mb-2">التحقق من البريد الإلكتروني</h1>
                                <p className="text-muted-foreground mb-6">
                                    لقد أرسلنا رمزًا مكونًا من 6 أرقام إلى <span className="font-bold text-foreground">{email}</span>. أدخله أدناه للتحقق.
                                </p>
                                <form onSubmit={handleOtpSubmit} className="space-y-6">
                                    <InputOTP
                                        maxLength={6}
                                        value={otp}
                                        onChange={(value) => setOtp(value)}
                                        dir="ltr"
                                        containerClassName="justify-center"
                                    >
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                            <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                    </InputOTP>
                                    <Button type="submit" className="w-full h-11" disabled={isLoading}>
                                        {isLoading ? 'جاري التحقق...' : 'التحقق وإنشاء الحساب'}
                                    </Button>
                                    <Button variant="link" onClick={() => setStep('details')} disabled={isLoading}>
                                        العودة وتعديل المعلومات
                                    </Button>
                                </form>
                            </div>
                        )}
                    </div>
                    <div className="hidden lg:block relative h-full">
                        <Image
                            src="/images/2.png"
                            alt="مسبح فاخر"
                            width={600}
                            height={800}
                            className="object-cover w-full h-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
