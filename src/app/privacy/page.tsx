
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Database, Share2, ShieldCheck, UserCog } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-secondary/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-right">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold font-headline mb-4">سياسة الخصوصية</h1>
            <p className="text-muted-foreground">آخر تحديث: 25 يوليو 2024</p>
          </div>

          <Card className="overflow-hidden shadow-lg">
            <CardHeader className="bg-card flex flex-row items-center gap-4 p-6">
              <div className="bg-primary/10 text-primary p-3 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-right text-xl">مقدمة</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">نلتزم في "شاليها" بحماية خصوصيتك وبياناتك الشخصية.</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-muted-foreground bg-background">
              <p>
                تنطبق سياسة الخصوصية هذه على جميع المعلومات التي نجمعها من خلال منصتنا. باستخدامك لمنصة "شاليها"، فإنك توافق على جمع واستخدام المعلومات وفقًا لهذه السياسة.
              </p>
            </CardContent>
          </Card>

          <Card className="mt-8 overflow-hidden shadow-lg">
            <CardHeader className="bg-card flex flex-row items-center gap-4 p-6">
              <div className="bg-primary/10 text-primary p-3 rounded-lg">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-right text-xl">المعلومات التي نجمعها</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">نجمع البيانات الضرورية لتقديم وتحسين خدماتنا.</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-muted-foreground bg-background">
              <p>نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند استخدامك للمنصة. هذا يشمل:</p>
              <ul className="list-disc list-inside pr-4 space-y-2">
                <li>**معلومات الحساب:** الاسم، البريد الإلكتروني، رقم الهاتف، وكلمة المرور.</li>
                <li>**معلومات الحجز:** تفاصيل الحجوزات التي تقوم بها.</li>
                <li>**معلومات التواصل:** أي معلومات ترسلها عند الاتصال بفريق الدعم.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mt-8 overflow-hidden shadow-lg">
            <CardHeader className="bg-card flex flex-row items-center gap-4 p-6">
              <div className="bg-primary/10 text-primary p-3 rounded-lg">
                <UserCog className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-right text-xl">كيف نستخدم معلوماتك</CardTitle>
                 <p className="text-muted-foreground text-sm mt-1">نستخدم بياناتك لتشغيل وتأمين وتحسين تجربتك.</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-muted-foreground bg-background">
              <p>نستخدم المعلومات التي نجمعها من أجل:</p>
              <ul className="list-disc list-inside pr-4 space-y-2">
                <li>توفير خدماتنا وصيانتها وتحسينها.</li>
                <li>معالجة المعاملات وتأكيد الحجوزات.</li>
                <li>التواصل معك بخصوص حسابك أو حجوزاتك.</li>
                <li>تخصيص وتحسين الخدمة لمنحك تجربة أفضل.</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="mt-8 overflow-hidden shadow-lg">
            <CardHeader className="bg-card flex flex-row items-center gap-4 p-6">
              <div className="bg-primary/10 text-primary p-3 rounded-lg">
                <Share2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-right text-xl">مشاركة المعلومات</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">نحن لا نبيع بياناتك الشخصية أبدًا.</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-muted-foreground bg-background">
              <p>قد نشارك معلوماتك مع المضيفين لتمكينهم من تقديم الخدمات التي تطلبها. على سبيل المثال، نشارك اسمك ورقم هاتفك مع المضيف عند تأكيد الحجز.</p>
              <p>لن نشارك معلوماتك الشخصية مع أطراف ثالثة لأغراض التسويق المباشر الخاصة بهم دون موافقتك الصريحة.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
