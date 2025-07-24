
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, CalendarCheck, PartyPopper, ArrowDown } from "lucide-react";

export default function FAQPage() {
  return (
    <div className="bg-background text-foreground">
        <div className="container mx-auto px-4 py-16">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold font-headline">كيف يعمل شاليها؟</h1>
                <p className="text-xl text-muted-foreground mt-2 max-w-2xl mx-auto">
                    تجربة حجز سهلة وممتعة في ثلاث خطوات بسيطة فقط.
                </p>
            </div>
            
            <div className="relative">
                <div className="grid md:grid-cols-3 gap-8 text-center">
                    <Card className="bg-card transform hover:scale-105 transition-transform duration-300 shadow-lg">
                        <CardHeader>
                            <div className="mx-auto bg-primary/10 text-primary p-6 rounded-full w-fit mb-4 border-4 border-primary/20">
                                <Search className="h-10 w-10" />
                            </div>
                            <CardTitle className="font-headline text-2xl">1. ابحث</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                استخدم محرك البحث المتقدم والفلاتر للعثور على الشاليه أو المسبح الذي يناسب احتياجاتك وميزانيتك.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card transform hover:scale-105 transition-transform duration-300 shadow-lg">
                        <CardHeader>
                            <div className="mx-auto bg-primary/10 text-primary p-6 rounded-full w-fit mb-4 border-4 border-primary/20">
                                <CalendarCheck className="h-10 w-10" />
                            </div>
                            <CardTitle className="font-headline text-2xl">2. احجز</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                اختر التواريخ المناسبة، راجع التفاصيل، وقم بتأكيد حجزك بكل سهولة وأمان من خلال خطوات بسيطة ومباشرة.
                            </p>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-card transform hover:scale-105 transition-transform duration-300 shadow-lg">
                        <CardHeader>
                            <div className="mx-auto bg-primary/10 text-primary p-6 rounded-full w-fit mb-4 border-4 border-primary/20">
                                <PartyPopper className="h-10 w-10" />
                            </div>
                            <CardTitle className="font-headline text-2xl">3. استمتع</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                كل شيء جاهز! استرخ واستمتع بتجربة لا تُنسى. لقد حان وقت صنع ذكريات جميلة.
                            </p>
                        </CardContent>
                    </Card>
                </div>
                 {/* Decorative arrows for larger screens */}
                <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 w-full">
                    <ArrowDown className="absolute right-1/2 translate-x-[200%] -mt-16 h-12 w-12 text-muted-foreground/20 transform-gpu -rotate-90 animate-pulse" />
                    <ArrowDown className="absolute left-1/2 -translate-x-[200%] -mt-16 h-12 w-12 text-muted-foreground/20 transform-gpu -rotate-90 animate-pulse animation-delay-300" />
                </div>
            </div>
        </div>
    </div>
  );
}
