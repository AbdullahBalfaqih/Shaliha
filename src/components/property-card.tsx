
import Link from "next/link";
import Image from "next/image";
import type { Property } from "@/types";
import { Star, Users, BedDouble, Bath } from "lucide-react";
import { useLanguage } from "./language-toggle";

interface PropertyCardProps {
  property: Property;
}

const translations = {
    ar: {
        pricePerNight: "/ليلة",
        priceFrom: "يبدأ من",
        SAR: "ريال",
        YER: "ريال"
    },
    en: {
        pricePerNight: "/night",
        priceFrom: "Starts from",
        SAR: "SAR",
        YER: "YER"
    }
}

export function PropertyCard({ property }: PropertyCardProps) {
  const lang = useLanguage();
  const t = translations[lang];

  const title = lang === 'ar' ? property.title : property.title_en;
  const location = lang === 'ar' ? property.location : property.location_en;
  const dedicatedFor = lang === 'ar' ? property.dedicated_for : property.dedicated_for_en;
  
  const displayPrice = property.price_per_night || (property.morning_period as any)?.price || 0;
  const isFromPrice = !property.price_per_night && (property.morning_period as any)?.price;

  return (
    <Link href={`/properties/${property.id}`} className="group block">
      <div className="flex flex-col h-full bg-card shadow-sm rounded-lg overflow-hidden transition-shadow hover:shadow-xl">
        <div className="relative overflow-hidden">
          <Image
            src={property.images?.[0] || 'https://placehold.co/400x300.png'}
            alt={title}
            width={400}
            height={250}
            className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint={property.type === 'شاليه' ? 'chalet exterior' : 'swimming pool'}
          />
           {property.review_count > 0 && (
            <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full p-1.5 flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span className="font-bold text-foreground">{(property.rating || 0).toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({property.review_count})</span>
            </div>
           )}
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-bold truncate group-hover:text-primary transition-colors">
              {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{location}</p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground my-3">
              {property.guests > 0 && 
              <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{property.guests}</span>
              </div>
              }
              {property.bedrooms > 0 &&
              <div className="flex items-center gap-1.5">
                  <BedDouble className="w-4 h-4" />
                  <span>{property.bedrooms}</span>
              </div>
              }
              {property.bathrooms > 0 &&
              <div className="flex items-center gap-1.5">
                  <Bath className="w-4 h-4" />
                  <span>{property.bathrooms}</span>
              </div>
              }
          </div>

          <div className="flex justify-between items-end mt-auto pt-2">
              <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-xs">
                  <Users className="w-4 h-4 text-primary" />
                  <span>{dedicatedFor}</span>
              </div>
              <div className="text-right">
                  {isFromPrice && <p className="text-xs text-muted-foreground">{t.priceFrom}</p>}
                  <p className="font-bold text-lg">
                      {displayPrice.toLocaleString()}
                      <span className="text-sm font-normal text-muted-foreground mx-1">{t[property.currency]}</span>
                      {!isFromPrice && <span className="text-sm font-normal text-muted-foreground">{t.pricePerNight}</span>}
                  </p>
              </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
