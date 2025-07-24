
'use client';

import { useState, useEffect, useCallback } from "react";
import { PropertyCard } from "@/components/property-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Search, SlidersHorizontal, Tv, Wifi, Waves, CookingPot, ParkingSquare, Sun, Zap, X, MapPin, Home, Building } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose, SheetFooter } from "@/components/ui/sheet";
import { arSA } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Amenity, Property } from "@/types";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getProperties } from "../properties/actions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface FiltersProps {
  city: string;
  setCity: (city: string) => void;
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
  propertyType: string;
  setPropertyType: (type: string) => void;
  dedicatedFor: string;
  setDedicatedFor: (type: string) => void;
  amenities: Record<Amenity, boolean>;
  setAmenities: (amenities: Record<Amenity, boolean>) => void;
}

const amenityList: { id: Amenity; label: string, icon: React.ElementType }[] = [
    { id: "wifi", label: "واي فاي", icon: Wifi },
    { id: "pool", label: "مسبح", icon: Waves },
    { id: "kitchen", label: "مطبخ", icon: CookingPot },
    { id: "parking", label: "موقف سيارات", icon: ParkingSquare },
    { id: "ac", label: "تكييف", icon: Sun },
    { id: "tv", label: "تلفزيون", icon: Tv },
    { id: "power_backup", label: "مزود طاقة", icon: Zap },
];

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


export function Filters({
  city, setCity,
  date, setDate,
  priceRange, setPriceRange,
  propertyType, setPropertyType,
  dedicatedFor, setDedicatedFor,
  amenities, setAmenities
}: FiltersProps) {
  
  const handleAmenityChange = (amenity: Amenity, checked: boolean) => {
    setAmenities({ ...amenities, [amenity]: checked });
  };

  return (
    <div className="space-y-6" dir="rtl">
       <div>
        <Label htmlFor="city" className="font-semibold">المحافظة</Label>
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger id="city" className="w-full mt-2">
            <SelectValue placeholder="اختر محافظة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">كل المحافظات</SelectItem>
            {yemeniGovernorates.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label className="font-semibold">التواريخ</Label>
         <Popover>
            <PopoverTrigger asChild>
               <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal mt-2",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="ml-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y", { locale: arSA })} -{" "}
                      {format(date.to, "LLL dd, y", { locale: arSA })}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y", { locale: arSA })
                  )
                ) : (
                  <span>اختر نطاق التاريخ</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarPicker
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={1}
                locale={arSA}
                dir="rtl"
                disabled={{ before: new Date() }}
              />
            </PopoverContent>
          </Popover>
      </div>

      <div>
        <Label className="font-semibold">نطاق السعر (بالريال اليمني)</Label>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span>10 ألف</span>
          <Slider 
            value={priceRange} 
            onValueChange={setPriceRange} 
            min={10000}
            max={1000000} 
            step={10000} 
            dir="rtl"
          />
          <span>+1م</span>
        </div>
         <div className="text-center mt-2 text-muted-foreground">
            حتى {priceRange[0].toLocaleString()} ريال
        </div>
      </div>

      <div>
        <Label className="font-semibold">نوع العقار</Label>
        <Select value={propertyType} onValueChange={setPropertyType}>
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="الكل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">الكل</SelectItem>
            <SelectItem value="شاليه">شاليه</SelectItem>
            <SelectItem value="مسبح">مسبح</SelectItem>
            <SelectItem value="فيلا">فيلا</SelectItem>
            <SelectItem value="مزرعة">مزرعة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="font-semibold">مخصص لـ</Label>
        <Select value={dedicatedFor} onValueChange={setDedicatedFor}>
          <SelectTrigger className="w-full mt-2">
            <SelectValue placeholder="الكل" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">الكل</SelectItem>
            <SelectItem value="عوائل">عوائل</SelectItem>
            <SelectItem value="عزاب">عزاب</SelectItem>
            <SelectItem value="كلاهما">كلاهما</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label className="font-semibold">المرافق</Label>
        <div className="mt-2 space-y-3">
          {amenityList.map((amenity) => (
             <div key={amenity.id} className="flex items-center justify-between">
                <Label htmlFor={amenity.id} className="font-normal flex-grow cursor-pointer">{amenity.label}</Label>
                <Checkbox 
                  id={amenity.id} 
                  checked={amenities[amenity.id]}
                  onCheckedChange={(checked) => handleAmenityChange(amenity.id, !!checked)}
                />
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}


export default function SearchPage() {
  const searchParams = useSearchParams();
  
  const [city, setCity] = useState(searchParams.get('city') || "any");
  const [date, setDate] = useState<DateRange | undefined>();
  const [priceRange, setPriceRange] = useState([1000000]);
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || "any");
  const [dedicatedFor, setDedicatedFor] = useState("any");
  const [amenities, setAmenities] = useState<Record<Amenity, boolean>>({
    wifi: false, pool: false, kitchen: false, parking: false, ac: false, tv: false, power_backup: false, speakers: false, bbq: false
  });

  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const fetchAndFilterProperties = useCallback(async () => {
      setLoading(true);
      const selectedAmenities = Object.entries(amenities)
          .filter(([, isSelected]) => isSelected)
          .map(([key]) => key);

      const filters = {
          city: city === 'any' ? undefined : city,
          type: propertyType === 'any' ? undefined : propertyType,
          dedicatedFor: dedicatedFor === 'any' ? undefined : dedicatedFor,
          maxPrice: priceRange[0],
          amenities: selectedAmenities,
          q: searchParams.get('q') || undefined,
          dateRange: date
      };
      
      const results = await getProperties(filters);
      setFilteredProperties(results);
      setLoading(false);
  }, [amenities, city, dedicatedFor, priceRange, propertyType, searchParams, date]);
  
  useEffect(() => {
    fetchAndFilterProperties();
  }, [fetchAndFilterProperties]);
  
  const applyFilters = () => {
    fetchAndFilterProperties();
    setIsSheetOpen(false);
  };
  
  const filterProps = {
    city, setCity,
    date, setDate,
    priceRange, setPriceRange,
    propertyType, setPropertyType,
    dedicatedFor, setDedicatedFor,
    amenities, setAmenities
  };

  const resetFilters = () => {
    setCity("any");
    setDate(undefined);
    setPriceRange([1000000]);
    setPropertyType("any");
    setDedicatedFor("any");
    setAmenities({ wifi: false, pool: false, kitchen: false, parking: false, ac: false, tv: false, power_backup: false, speakers: false, bbq: false });
    // After resetting, fetch again
    fetchAndFilterProperties();
  };

  return (
    <div className="container mx-auto px-4 py-8">
       {/* New Top Search Bar */}
       <div className="p-4 bg-card rounded-xl shadow-lg mb-8 border">
          <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4">
              {/* City */}
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary"/>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="border-0 focus:ring-0">
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">كل المدن</SelectItem>
                    {yemeniGovernorates.map(c => ( <SelectItem key={c} value={c}>{c}</SelectItem> ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator orientation="vertical" className="hidden md:block h-8"/>
              {/* Property Type */}
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary"/>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="border-0 focus:ring-0">
                    <SelectValue placeholder="نوع العقار" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">الكل</SelectItem>
                    <SelectItem value="شاليه">شاليه</SelectItem>
                    <SelectItem value="مسبح">مسبح</SelectItem>
                    <SelectItem value="فيلا">فيلا</SelectItem>
                    <SelectItem value="مزرعة">مزرعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator orientation="vertical" className="hidden md:block h-8"/>
              {/* Date */}
               <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary"/>
                  <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                            {date?.from ? (date.to ? `${format(date.from, "d MMM", { locale: arSA })} - ${format(date.to, "d MMM", { locale: arSA })}` : format(date.from, "d MMMM yyyy", { locale: arSA })) : (<span>اختر تاريخ</span>)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarPicker initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} locale={arSA} dir="rtl" disabled={{ before: new Date() }} />
                      </PopoverContent>
                  </Popover>
               </div>
              {/* Search Button */}
              <Button size="lg" className="rounded-full h-14 w-14 p-0 md:col-start-5" onClick={applyFilters}>
                  <Search className="h-6 w-6" />
              </Button>
          </div>
       </div>

      <main>
          <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-headline font-bold">نتائج البحث</h1>
             <div className="flex items-center gap-4">
              {!loading && <p className="text-muted-foreground">تم العثور على {filteredProperties.length} عقار</p>}
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    الفلاتر
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col p-0" dir="rtl">
                    <SheetHeader className="p-4 border-b flex flex-row items-center justify-between text-right">
                      <SheetTitle>الفلاتر المتقدمة</SheetTitle>
                       <SheetClose>
                          <X className="h-5 w-5" />
                          <span className="sr-only">Close</span>
                      </SheetClose>
                    </SheetHeader>
                    <ScrollArea className="flex-grow p-4">
                        <Filters {...filterProps} />
                    </ScrollArea>
                    <SheetFooter className="p-4 border-t bg-background">
                        <Button onClick={applyFilters} className="w-full bg-accent hover:bg-accent/90 text-lg py-6">
                            <Search className="ml-2 h-5 w-5" />
                            تطبيق الفلاتر
                        </Button>
                    </SheetFooter>
                </SheetContent>
              </Sheet>
             </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
               {Array.from({ length: 6 }).map((_, index) => (
                 <div key={index} className="flex flex-col h-full bg-card shadow-sm rounded-lg overflow-hidden">
                    <Skeleton className="w-full h-56" />
                    <div className="p-4 flex flex-col flex-grow gap-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full mt-2" />
                        <div className="flex justify-between items-end mt-auto pt-2">
                            <Skeleton className="h-8 w-1/4" />
                            <Skeleton className="h-8 w-1/3" />
                        </div>
                    </div>
                </div>
              ))}
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground">لم يتم العثور على نتائج تطابق بحثك.</p>
              <Button variant="link" onClick={resetFilters}>إعادة تعيين الفلاتر</Button>
            </div>
          )}
        </main>
    </div>
  );
}
