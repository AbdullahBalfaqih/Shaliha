
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";
import { Waves } from "lucide-react";
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { ar } from '@/lib/phone-labels';

export default function LoginPage() {
    const { login, loading } = useAuth();
    const [phone, setPhone] = useState<string | undefined>("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phone) {
            await login({ phone, password });
        }
    };

    return (
        <div className="w-full flex items-center justify-center min-h-screen p-4">
            <div className="container mx-auto max-w-4xl w-full">
                <div className="grid lg:grid-cols-2 items-center gap-8 bg-card border rounded-xl shadow-lg overflow-hidden">
                    <div className="p-8 lg:p-12">
                        <div className="grid gap-2 text-center mb-8">
                            <Waves className="h-10 w-10 text-primary mx-auto mb-2" />
                            <h1 className="text-3xl font-bold font-headline">
                                مرحباً بعودتك في شاليها
                            </h1>
                            <p className="text-muted-foreground">
                                أدخل رقم هاتفك وكلمة المرور للمتابعة
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="grid gap-4">
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
                            <div className="grid gap-2 text-right">
                                <div className="flex items-center">
                                    <Label htmlFor="password">كلمة المرور</Label>
                                    <Link
                                        href="/forgot-password"
                                        className="mr-auto inline-block text-sm underline"
                                    >
                                        نسيت كلمة المرور؟
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="text-left"
                                    dir="ltr"
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'جاري...' : 'تسجيل الدخول'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            ليس لديك حساب؟{" "}
                            <Link href="/signup" className="underline text-primary">
                                إنشاء حساب
                            </Link>
                        </div>
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
