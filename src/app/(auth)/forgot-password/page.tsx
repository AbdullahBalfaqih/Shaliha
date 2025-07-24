
"use client";

import { useState } from "react";
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Waves, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendPasswordByEmailAction } from "./actions";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const result = await sendPasswordByEmailAction({ email });

        if (result.success) {
            toast({
                title: "تم استلام طلبك",
                description: result.message,
            });
            setEmail("");
        } else {
            toast({
                title: "خطأ",
                description: result.message,
                variant: "destructive",
            });
        }
        setIsLoading(false);
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center p-4">
            <Card className="mx-auto max-w-sm">
                <CardHeader className="text-center">
                    <Waves className="h-10 w-10 text-primary mx-auto mb-2" />
                    <CardTitle className="text-2xl font-headline">
                        نسيت كلمة المرور؟
                    </CardTitle>
                    <CardDescription>
                        لا تقلق، يحدث ذلك. أدخل بريدك الإلكتروني المسجل وسنرسل لك كلمة المرور.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">البريد الإلكتروني</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إرسال كلمة المرور'}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        تذكرت كلمة المرور؟{" "}
                        <Link href="/login" className="underline">
                            تسجيل الدخول
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
