import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, Eye } from "lucide-react";

export default function AboutUsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline mb-4">من نحن</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          في "شاليها"، نحن ملتزمون بتوفير تجربة حجز سهلة وموثوقة لأفضل الشاليهات والمسابح في المنطقة.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 text-center">
        <Card>
          <CardHeader>
            <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
              <Users className="h-8 w-8" />
            </div>
            <CardTitle className="font-headline">فريقنا</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              فريق من الخبراء الشغوفين بالسفر والضيافة، نعمل معًا لضمان حصولك على أفضل تجربة ممكنة.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
              <Target className="h-8 w-8" />
            </div>
            <CardTitle className="font-headline">مهمتنا</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              مهمتنا هي تبسيط عملية العثور على أماكن إقامة فريدة وحجزها، مما يتيح لك التركيز على الاستمتاع بعطلتك.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="mx-auto bg-primary/10 text-primary p-4 rounded-full w-fit mb-4">
              <Eye className="h-8 w-8" />
            </div>
            <CardTitle className="font-headline">رؤيتنا</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              أن نكون المنصة الرائدة لحجوزات الشاليهات والمسابح، معروفين بموثوقيتنا وجودة خدماتنا.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
