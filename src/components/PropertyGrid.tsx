import { useQuery } from "@tanstack/react-query";
import PropertyCard from "./PropertyCard";
import CurrencySelector from "./CurrencySelector";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin } from "lucide-react";
import { useState, useMemo } from "react";

const PROPERTY_TYPES = [
  "All types",
  "apartment",
  "house",
  "condo",
  "townhouse",
  "villa",
  "cottage",
  "cabin",
  "bungalow",
  "commercial",
];

interface PropertyWithImage {
  id: string;
  title: string;
  property_type: string | number; // Can be string or integer from database
  bedroom_count: number | null;
  bathroom_count: number | null;
  guest_count: number | null;
  price: number | null;
  currency: string | null;
  street_name: string | null;
  house_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  map_address: string | null;
  zipcode: string | null;
  main_image: string | null;
}

async function fetchProperties(
  filters: { 
    type: string; 
    minPrice: string; 
    maxPrice: string; 
    location: string;
    country: string;
    zipcode: string;
  }
): Promise<PropertyWithImage[]> {
  console.log('Fetching properties with filters:', filters);
  const params = new URLSearchParams();
  
  if (filters.type && filters.type !== "All types") {
    params.append("type", filters.type);
  }
  if (filters.minPrice) {
    params.append("minPrice", filters.minPrice);
  }
  if (filters.maxPrice) {
    params.append("maxPrice", filters.maxPrice);
  }
  if (filters.location.trim()) {
    params.append("city", filters.location.trim());
  }
  if (filters.country) {
    params.append("country", filters.country);
    console.log('Adding country filter:', filters.country);
  }
  if (filters.zipcode.trim()) {
    params.append("zipcode", filters.zipcode.trim());
    console.log('Adding zipcode filter:', filters.zipcode);
  }

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const url = `${API_URL}/api/properties?${params.toString()}`;
  console.log('Fetching from URL:', url);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch properties: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Fetch images for each property
    const propertiesWithImages = await Promise.all(
      data.map(async (p: any) => {
        try {
          const imagesResponse = await fetch(`${API_URL}/api/properties/${p.id}/images`);
          if (imagesResponse.ok) {
            const images = await imagesResponse.json();
            const mainImage = images.find((img: any) => img.is_main) || images[0];
            
            // Handle both local paths and full URLs (Vercel Blob)
            const imageUrl = mainImage?.image_url 
              ? (mainImage.image_url.startsWith('http') 
                  ? mainImage.image_url 
                  : `${API_URL}${mainImage.image_url}`)
              : null;
            
            return {
              id: p.id,
              title: p.title,
              property_type: p.property_type,
              bedroom_count: p.bedroom_count,
              bathroom_count: p.bathroom_count,
              guest_count: p.guest_count,
              price: p.price,
              currency: p.currency || 'USD',
              street_name: p.street_name,
              house_number: p.house_number,
              address: p.address,
              city: p.city,
              state: p.state,
              country: p.country,
              map_address: p.map_address,
              zipcode: p.zipcode,
              main_image: imageUrl,
            };
          }
        } catch (err) {
          console.error(`Error fetching images for property ${p.id}:`, err);
        }
        
        return {
          id: p.id,
          title: p.title,
          property_type: p.property_type,
          bedroom_count: p.bedroom_count,
          bathroom_count: p.bathroom_count,
          guest_count: p.guest_count,
          price: p.price,
          currency: p.currency || 'USD',
          street_name: p.street_name,
          house_number: p.house_number,
          address: p.address,
          city: p.city,
          state: p.state,
          country: p.country,
          map_address: p.map_address,
          zipcode: p.zipcode,
          main_image: null,
        };
      })
    );
    
    return propertiesWithImages;
  } catch (error) {
    console.error("Error fetching properties:", error);
    return [];
  }
}

interface PropertyGridProps {
  country?: string;
  zipcode?: string;
}

const PropertyGrid = ({ country = "", zipcode = "" }: PropertyGridProps) => {
  const { preferredCurrency } = useCurrency();
  const [typeFilter, setTypeFilter] = useState("All types");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [appliedLocation, setAppliedLocation] = useState("");

  const filters = useMemo(
    () => ({
      type: typeFilter,
      minPrice,
      maxPrice,
      location: appliedLocation,
      country,
      zipcode,
    }),
    [typeFilter, minPrice, maxPrice, appliedLocation, country, zipcode]
  );

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties", filters],
    queryFn: () => fetchProperties(filters),
  });
  console.log(properties);
  const locationDisplay = (p: PropertyWithImage) =>
    p.map_address || [p.city, p.state, p.country].filter(Boolean).join(", ") || p.address || "-";
  
  const formatPropertyType = (type: any) => {
    if (!type) return "Property";
    const typeStr = String(type); // Convert to string if it's a number
    return typeStr.charAt(0).toUpperCase() + typeStr.slice(1).toLowerCase();
  };
  
  const cardProps = useMemo(
    () =>
      properties.map((p, i) => ({
        id: p.id,
        title: p.title,
        location: locationDisplay(p),
        type: formatPropertyType(p.property_type),
        guests: p.guest_count ?? 2,
        bedrooms: p.bedroom_count ?? 0,
        beds: p.bedroom_count ?? 0,
        baths: p.bathroom_count ?? 0,
        image:
          p.main_image ||
          "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop",
        price: p.price ?? undefined,
        currency: p.currency || "USD",
        country: p.country,
        zipcode: p.zipcode,
        badge: (["NEW", "FEATURED", "HOT DEAL", null] as const)[i % 4 === 0 ? 0 : i % 4 === 1 ? 1 : i % 4 === 2 ? 2 : 3],
      })),
    [properties]
  );
  console.log('CardProps with filters:', { filters, cardPropsCount: cardProps.length, cardProps });
  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Available Properties
        </h2>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <CurrencySelector />
          <p className="text-sm text-muted-foreground">
            {properties.length} properties · {preferredCurrency.code}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6 p-4 bg-muted/30 rounded-lg border border-border">
        <div className="relative flex-1 min-w-[160px] max-w-[220px]">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Location (city, address...)"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setAppliedLocation(locationInput)}
            className="pl-9 bg-background border-border"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] bg-background border-border">
            <SelectValue placeholder="Property type" />
          </SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t === "All types" ? t : t.charAt(0).toUpperCase() + t.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            placeholder="Min price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-28 bg-background border-border"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min="0"
            placeholder="Max price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-28 bg-background border-border"
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setAppliedLocation(locationInput)}
          className="gap-2"
        >
          <Search className="h-4 w-4" />
          Apply
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-border">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {cardProps.map((props) => (
            <PropertyCard key={props.id} {...props} />
          ))}
        </div>
      )}

      {!isLoading && properties.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No properties match your filters. Try adjusting filters or check back later.
        </p>
      )}
    </div>
  );
};

export default PropertyGrid;
