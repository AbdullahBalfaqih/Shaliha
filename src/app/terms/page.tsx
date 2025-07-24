
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gavel, UserCheck, CreditCard, Ban } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="bg-secondary/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-right">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-headline mb-4">شروط الخدمة</h1>
            <p className="text-muted-foreground">آخر تحديث: 25 يوليو 2024</p>
          </div>

          <Card className="overflow-hidden shadow-lg">
            <CardHeader className="bg-card flex flex-row items-center gap-4 p-6">
              <div className="bg-primary/10 text-primary p-3 rounded-lg">
                <Gavel className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-right text-xl">1. الموافقة على الشروط</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">باستخدامك لمنصتنا، فإنك توافق على هذه الشروط.</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-muted-foreground bg-background">
              <p>
                مرحبًا بك في "شاليها". تحكم هذه الشروط والأحكام استخدامك لمنصتنا. من خلال الوصول إلى خدماتنا أو استخدامها، فإنك توافق على الالتزام الكامل بهذه الشروط. إذا كنت لا توافق على أي جزء من الشروط، فلا يجوز لك استخدام خدماتنا.
              </p>
            </CardContent>
          </Card>

          <Card className="mt-8 overflow-hidden shadow-lg">
            <CardHeader className="bg-card flex flex-row items-center gap-4 p-6">
              <div className="bg-primary/10 text-primary p-3 rounded-lg">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-right text-xl">2. استخدام الخدمات</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">أنت مسؤول عن حسابك والأنشطة التي تتم من خلاله.</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-muted-foreground bg-background">
              <p>
                يجب أن يكون عمرك 18 عامًا على الأقل لإنشاء حساب أو إجراء حجز. أنت مسؤول عن الحفاظ على سرية معلومات حسابك، بما في ذلك كلمة المرور، وعن جميع الأنشطة التي تحدث تحت حسابك.
              </p>
              <p>
                توافق على تقديم معلومات دقيقة وكاملة عند إنشاء حسابك وتحديثها باستمرار.
              </p>
            </CardContent>
          </Card>

          <Card className="mt-8 overflow-hidden shadow-lg">
            <CardHeader className="bg-card flex flex-row items-center gap-4 p-6">
              <div className="bg-primary/10 text-primary p-3 rounded-lg">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-right text-xl">3. الحجوزات والمدفوعات</CardTitle>
                 <p className="text-muted-foreground text-sm mt-1">توضح هذه الفقرة مسؤولياتك المالية.</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-muted-foreground bg-background">
              <p>
                عند حجز عقار، فإنك تدخل في اتفاقية مباشرة مع المضيف. "شاليها" تعمل كوسيط لتسهيل هذه العملية. أنت توافق على دفع جميع الرسوم المرتبطة بالحجز، بما في ذلك سعر العقار وأي رسوم خدمة مطبقة.
              </p>
              <p>
                تخضع سياسات الإلغاء للشروط المحددة من قبل المضيف لكل عقار على حدة، والتي يتم عرضها بوضوح قبل إتمام الحجز.
              </p>
            </CardContent>
          </Card>
          
          <Card className="mt-8 overflow-hidden shadow-lg">
            <CardHeader className="bg-card flex flex-row items-center gap-4 p-6">
              <div className="bg-primary/10 text-primary p-3 rounded-lg">
                <Ban className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-right text-xl">4. الاستخدام المحظور</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">التزامك باستخدام المنصة بشكل قانوني وأخلاقي.</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-muted-foreground bg-background">
                <p>
                  لا يجوز لك استخدام خدماتنا لأي غرض غير قانوني أو غير مصرح به. أنت توافق على عدم استخدام المنصة بطريقة قد تضر أو تعطل أو تضعف خدماتنا أو تتداخل مع استخدام أي طرف آخر للمنصة.
                </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
