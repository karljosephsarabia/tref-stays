import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Users,
  BedDouble,
  Bath,
  Heart,
  Share2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
  Utensils,
  Star,
  Building,
  CalendarIcon,
  Loader2,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format, differenceInDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&auto=format&fit=crop";

async function fetchPropertyDetail(propertyId: string | undefined) {
  if (!propertyId) return null;
  
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  
  try {
    const response = await fetch(`${API_URL}/api/properties/${propertyId}`);
    if (!response.ok) return null;
    
    const prop = await response.json();
    if (!prop) return null;
    
    // Fetch property images
    let imageUrls: string[] = [];
    try {
      const imagesResponse = await fetch(`${API_URL}/api/properties/${propertyId}/images`);
      if (imagesResponse.ok) {
        const images = await imagesResponse.json();
        imageUrls = images
          .sort((a: any, b: any) => {
            if (a.is_main && !b.is_main) return -1;
            if (!a.is_main && b.is_main) return 1;
            return a.display_order - b.display_order;
          })
          .map((img: any) => `${API_URL}${img.image_url}`);
      }
    } catch (err) {
      console.error('Error fetching property images:', err);
    }
    
    return {
    id: prop.id,
    title: prop.title,
    location: prop.map_address || [prop.city, prop.state, prop.country].filter(Boolean).join(", ") || prop.address || "",
    city: prop.city || "",
    state: prop.state || "",
    country: prop.country || "",
    type: prop.property_type ? String(prop.property_type).charAt(0).toUpperCase() + String(prop.property_type).slice(1).toLowerCase() : "",
    guests: prop.guest_count ?? 2,
    bedrooms: prop.bedroom_count ?? 0,
    beds: prop.bedroom_count ?? 0,
    baths: prop.bathroom_count ?? 0,
    images: imageUrls.length > 0 ? imageUrls : [PLACEHOLDER_IMAGE],
    price: prop.price ?? 0,
    currency: prop.currency || "USD",
    description: prop.additional_information || "",
    amenities: prop.amenities || [],
    kosherKitchen: prop.kosher_kitchen || false,
    shabbosFriendly: prop.shabbos_friendly || false,
    nearbyShul: prop.nearby_shul || "",
    nearbyShulDistance: prop.nearby_shul_distance || "",
    nearbyMikva: prop.nearby_mikva || "",
    nearbyMikvaDistance: prop.nearby_mikva_distance || "",
    nearbyKosherShops: prop.nearby_kosher_shops || "",
    nearbyKosherShopsDistance: prop.nearby_kosher_shops_distance || "",
    additionalLuxury: prop.additional_luxury || "",
  };
  } catch (error) {
    console.error("Error fetching property:", error);
    return null;
  }
}

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice, preferredCurrency } = useCurrency();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guestCount, setGuestCount] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  const { data: propertyFromDb, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchPropertyDetail(id),
    enabled: !!id,
  });

  const property = useMemo(() => {
    if (propertyFromDb) return propertyFromDb;
    return {
      id: id || "",
      title: "Property",
      location: "",
      city: "",
      state: "",
      country: "",
      type: "",
      guests: 2,
      bedrooms: 0,
      beds: 0,
      baths: 0,
      images: [PLACEHOLDER_IMAGE],
      price: 0,
      currency: "USD",
      description: "",
      amenities: [] as string[],
      kosherKitchen: false,
      shabbosFriendly: false,
      nearbyShul: "",
      nearbyShulDistance: "",
      nearbyMikva: "",
      nearbyMikvaDistance: "",
      nearbyKosherShops: "",
      nearbyKosherShopsDistance: "",      additionalLuxury: "",    };
  }, [propertyFromDb, id]);

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const nights =
    dateRange?.from && dateRange?.to
      ? differenceInDays(dateRange.to, dateRange.from)
      : 0;
  const subtotal = property.price * nights;
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + serviceFee;

  const handleBooking = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Please select check-in and check-out dates");
      return;
    }

    if (!email || !phone) {
      toast.error("Please provide your email and phone number");
      return;
    }

    setIsBooking(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const token = localStorage.getItem('auth_token');

      // Token is optional - guests can book without logging in
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/reservations`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          property_id: property.id,
          check_in_date: format(dateRange.from, "yyyy-MM-dd"),
          check_out_date: format(dateRange.to, "yyyy-MM-dd"),
          guest_count: guestCount,
          total_price: total,
          email: email,
          phone: phone
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Server error' }));
        console.error('Reservation error response:', error);
        throw new Error(error.error || error.details || 'Failed to create reservation');
      }

      const reservation = await response.json();
      console.log('Reservation created:', reservation);

      if (user) {
        toast.success("Booking request submitted successfully! The host will confirm your reservation.");
      } else {
        toast.success("Booking request submitted! We'll contact you at " + email + " to confirm.");
      }
      
      // Reset form
      setDateRange(undefined);
      setGuestCount(1);
      setEmail("");
      setPhone("");
      
      // Navigate to dashboard or reservations page
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.message || "Failed to create booking. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!propertyFromDb && id) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center py-24 px-4">
          <h2 className="text-xl font-semibold mb-2">Property not found</h2>
          <Link to="/">
            <Button variant="outline">Back to listings</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pt-16 md:pt-0">
        {/* Back Navigation */}
        <div className="container mx-auto px-4 py-3 md:py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to listings
          </Link>
        </div>

        {/* Image Gallery */}
        <div className="container mx-auto px-4 mb-6 md:mb-8">
          <div className="relative rounded-lg md:rounded-xl overflow-hidden aspect-[4/3] md:aspect-[16/9] md:max-h-[500px]">
            <img
              src={property.images[currentImageIndex]}
              alt={`${property.title} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full h-8 w-8 md:h-10 md:w-10"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full h-8 w-8 md:h-10 md:w-10"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </Button>

            {/* Image Counter */}
            <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm">
              {currentImageIndex + 1} / {property.images.length}
            </div>

            {/* Action Buttons */}
            <div className="absolute top-3 md:top-4 right-3 md:right-4 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/80 hover:bg-background rounded-full h-8 w-8 md:h-10 md:w-10"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart
                  className={`h-4 w-4 md:h-5 md:w-5 ${isFavorite ? "fill-destructive text-destructive" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/80 hover:bg-background rounded-full h-8 w-8 md:h-10 md:w-10"
              >
                <Share2 className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex gap-2 mt-3 md:mt-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {property.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === currentImageIndex
                    ? "border-primary"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Content Grid */}
        <div className="container mx-auto px-4 pb-8 md:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Property Details */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              {/* Title & Location */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">
                      {property.title}
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      {property.city}, {property.state}, {property.country}
                    </p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground text-base md:text-lg px-3 md:px-4 py-1.5 md:py-2 self-start">
                    {formatPrice(property.price, property.currency)}/night
                  </Badge>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-wrap items-center gap-3 md:gap-6 mt-4 md:mt-6 text-sm md:text-base text-muted-foreground">
                  <span className="flex items-center gap-1.5 md:gap-2">
                    <Users className="h-4 w-4 md:h-5 md:w-5" />
                    {property.guests} guests
                  </span>
                  <span className="flex items-center gap-1.5 md:gap-2">
                    <BedDouble className="h-4 w-4 md:h-5 md:w-5" />
                    {property.bedrooms} bed · {property.beds} beds
                  </span>
                  <span className="flex items-center gap-1.5 md:gap-2">
                    <Bath className="h-4 w-4 md:h-5 md:w-5" />
                    {property.baths} baths
                  </span>
                  <span className="flex items-center gap-1.5 md:gap-2">
                    <Building className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="line-clamp-1">{property.type}</span>
                  </span>
                </div>
              </div>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About this property</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {property.description}
                  </p>
                </CardContent>
              </Card>

              {/* Luxury Features */}
              {property.additionalLuxury && (
                <Card>
                  <CardHeader>
                    <CardTitle>Luxury Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {property.additionalLuxury}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>What this place offers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {property.amenities.map((amenity) => (
                        <div key={amenity} className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Kosher Features */}
              {(property.kosherKitchen || property.shabbosFriendly || property.nearbyShul || property.nearbyKosherShops || property.nearbyMikva) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Kosher Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(property.kosherKitchen || property.shabbosFriendly) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {property.kosherKitchen && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Utensils className="h-5 w-5 text-primary flex-shrink-0" />
                            <span>Kosher Kitchen</span>
                          </div>
                        )}
                        {property.shabbosFriendly && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Check className="h-5 w-5 text-primary flex-shrink-0" />
                            <span>Shabbos Friendly</span>
                          </div>
                        )}
                      </div>
                    )}
                    {(property.nearbyShul || property.nearbyKosherShops || property.nearbyMikva) && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">Nearby Facilities</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {property.nearbyShul && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                              <span>
                                <strong>Shul:</strong> {property.nearbyShul} 
                                {property.nearbyShulDistance && ` (${property.nearbyShulDistance})`}
                              </span>
                            </div>
                          )}
                          {property.nearbyKosherShops && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                              <span>
                                <strong>Kosher Shop:</strong> {property.nearbyKosherShops}
                                {property.nearbyKosherShopsDistance && ` (${property.nearbyKosherShopsDistance})`}
                              </span>
                            </div>
                          )}
                          {property.nearbyMikva && (
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                              <span>
                                <strong>Mikva:</strong> {property.nearbyMikva}
                                {property.nearbyMikvaDistance && ` (${property.nearbyMikvaDistance})`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Booking Form */}
            <div className="lg:col-span-1">
              <Card className="lg:sticky lg:top-24">
                <CardHeader className="pb-3 md:pb-6">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-base md:text-lg">Book this property</span>
                    <span className="text-primary text-lg md:text-xl">
                      {formatPrice(property.price, property.currency)}
                      <span className="text-sm text-muted-foreground font-normal">
                        /night
                      </span>
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Date Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm">Check-in / Check-out</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start font-normal h-11 text-sm"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "MMM d")} -{" "}
                                {format(dateRange.to, "MMM d, yyyy")}
                              </>
                            ) : (
                              format(dateRange.from, "MMM d, yyyy")
                            )
                          ) : (
                            "Select dates"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={1}
                          disabled={(date) => date < new Date()}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Guest Count */}
                  <div className="space-y-2">
                    <Label className="text-sm">Guests</Label>
                    <div className="flex items-center gap-3 md:gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 md:h-10 md:w-10"
                        onClick={() =>
                          setGuestCount((prev) => Math.max(1, prev - 1))
                        }
                        disabled={guestCount <= 1}
                      >
                        -
                      </Button>
                      <span className="text-base md:text-lg font-medium w-10 md:w-12 text-center">
                        {guestCount}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 md:h-10 md:w-10"
                        onClick={() =>
                          setGuestCount((prev) =>
                            Math.min(property.guests, prev + 1)
                          )
                        }
                        disabled={guestCount >= property.guests}
                      >
                        +
                      </Button>
                      <span className="text-xs md:text-sm text-muted-foreground">
                        Max {property.guests}
                      </span>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  {nights > 0 && (
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between text-muted-foreground">
                        <span>
                          {formatPrice(property.price, property.currency)} ×{" "}
                          {nights} nights
                        </span>
                        <span>
                          {formatPrice(subtotal, property.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Service fee</span>
                        <span>
                          {formatPrice(serviceFee, property.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>Total ({preferredCurrency.code})</span>
                        <span className="text-primary">
                          {formatPrice(total, property.currency)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <Label>Your Email</Label>
                    <Input 
                      type="email" 
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input 
                      type="tel" 
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {/* Book Button */}
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="lg"
                    disabled={!dateRange?.from || !dateRange?.to || isBooking}
                    onClick={handleBooking}
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : dateRange?.from && dateRange?.to ? (
                      `Reserve for ${formatPrice(total, property.currency)}`
                    ) : (
                      "Select dates to book"
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    {user ? (
                      "You won't be charged yet. The host will confirm your booking."
                    ) : (
                      "Book as a guest - we'll contact you via email to confirm."
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PropertyDetail;
