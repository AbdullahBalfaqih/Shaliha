
"use client";

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { sendContactMessage } from "./actions";

export default function ContactUsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setSubmitted(false);

    const formData = new FormData(event.currentTarget);
    const result = await sendContactMessage(formData);

    if (result.success) {
      toast({
        title: "تم إرسال الرسالة بنجاح",
        description: "شكرًا لتواصلك معنا. سنقوم بالرد عليك في أقرب وقت ممكن.",
      });
      setSubmitted(true);
      (event.target as HTMLFormElement).reset();
    } else {
      toast({
        title: "حدث خطأ",
        description: result.error || "لم نتمكن من إرسال رسالتك. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };


  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline mb-4">مركز المساعدة</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          نحن هنا لمساعدتك. اعثر على إجابات لأسئلتك أو تواصل مع فريقنا مباشرة.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        {/* Contact Info - Right Column */}
        <div className="md:col-span-1 space-y-6">
          <h2 className="text-2xl font-bold font-headline text-right">معلومات التواصل</h2>
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-start gap-4 text-right">
                <div className="pt-1">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">البريد الإلكتروني</h3>
                  <p className="text-muted-foreground text-sm">تواصل معنا على مدار الساعة.</p>
                  <a href="mailto:support@chaleha.com" className="text-primary hover:underline text-sm">support@chaleha.com</a>
                </div>
              </div>
              <div className="flex items-start gap-4 text-right">
                <div className="pt-1">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">الهاتف</h3>
                  <p className="text-muted-foreground text-sm">من الأحد إلى الخميس، 9 صباحًا - 5 مساءً.</p>
                  <p className="text-foreground text-sm" dir="ltr">+967 776 097 665</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ and Form - Left Column */}
        <div className="md:col-span-2 space-y-8">
          <div>
            <h2 className="text-2xl font-bold font-headline text-right mb-4">الأسئلة الشائعة</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>كيف يمكنني حجز عقار؟</AccordionTrigger>
                <AccordionContent>
                  يمكنك حجز عقار بسهولة عن طريق تصفح القوائم، واختيار العقار الذي يعجبك، وتحديد التواريخ المتاحة، ثم المتابعة إلى صفحة الدفع لإكمال الحجز.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>ما هي طرق الدفع المتاحة؟</AccordionTrigger>
                <AccordionContent>
                  نحن نقبل حاليًا التحويلات البنكية. سيتم توفير تفاصيل الحساب البنكي للمضيف عند متابعة الحجز. نعمل على إضافة خيارات دفع أخرى مثل البطاقات الائتمانية قريبًا.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>كيف يمكنني التواصل مع المضيف بعد الحجز؟</AccordionTrigger>
                <AccordionContent>
                  بعد تأكيد حجزك، سيقوم المضيف بالتواصل معك مباشرة عبر واتساب. كما ستجد معلومات الاتصال الخاصة به في تفاصيل الحجز ضمن لوحة التحكم الخاصة بك.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <Card>
            <CardHeader className="text-right">
              <CardTitle>أرسل لنا رسالة</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم</Label>
                    <Input name="name" id="name" placeholder="اسمك الكامل" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input name="email" id="email" type="email" placeholder="you@example.com" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">الموضوع</Label>
                  <Input name="subject" id="subject" placeholder="بخصوص..." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">رسالتك</Label>
                  <Textarea name="message" id="message" placeholder="اكتب رسالتك هنا..." rows={5} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading || submitted}>
                  {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  {submitted && <Check className="ml-2 h-4 w-4" />}
                  {loading ? 'جاري الإرسال...' : (submitted ? 'تم الإرسال بنجاح' : 'إرسال الرسالة')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    