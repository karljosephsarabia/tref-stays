import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BedDouble, Bath, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PropertyCardProps {
  id: number | string;
  title: string;
  location: string;
  type: string;
  guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  image: string;
  price?: number;
  currency?: string;
  badge?: "NEW" | "FEATURED" | "HOT DEAL" | null;
}

const badgeStyles = {
  NEW: "bg-tref-teal text-white border-0",
  FEATURED: "bg-gradient-to-r from-tref-purple to-primary text-white border-0",
  "HOT DEAL": "bg-gradient-to-r from-tref-orange to-tref-gold text-white border-0",
};

const PropertyCard = ({
  id,
  title,
  location,
  type,
  guests,
  bedrooms,
  beds,
  baths,
  image,
  price,
  currency = "USD",
  badge = null,
}: PropertyCardProps) => {
  const { preferredCurrency, formatPrice } = useCurrency();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  // Check if property is saved on mount
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user || !id) return;
      
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const token = localStorage.getItem('auth_token');
        
        if (!token) return;
        
        const response = await fetch(`${API_URL}/api/saved-properties/check/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsFavorite(data.isSaved);
        }
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };
    
    checkIfSaved();
  }, [id, user]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please log in to save properties");
      return;
    }

    if (user.roleId !== 5) {
      toast.error("Only renters can save properties");
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const token = localStorage.getItem('auth_token');

      if (isFavorite) {
        // Unsave the property
        const response = await fetch(`${API_URL}/api/saved-properties/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setIsFavorite(false);
          toast.success("Removed from favorites");
        }
      } else {
        // Save the property
        const response = await fetch(`${API_URL}/api/saved-properties/${id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setIsFavorite(true);
          toast.success("Added to favorites");
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error("Failed to update favorites");
    }
  };

  const showConversion = price && currency !== preferredCurrency.code;
  const originalPrice = price
    ? `${currency === "USD" ? "$" : currency === "CAD" ? "C$" : currency === "GBP" ? "£" : currency === "EUR" ? "€" : "₪"}${price}`
    : null;

  return (
    <Link to={`/property/${id}`}>
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        whileHover={{ y: -6 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="h-full"
      >
        <Card className="group h-full overflow-hidden border-border bg-card shadow-md hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 cursor-pointer relative border-2 hover:border-primary/40 rounded-xl">
          {/* Shine overlay on hover */}
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
          </div>

          {/* Image Container */}
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <motion.img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
            {/* Color overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {badge && (
              <Badge
                className={cn(
                  "absolute top-3 left-3 font-semibold text-xs shadow-lg",
                  badgeStyles[badge]
                )}
              >
                {badge}
              </Badge>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full shadow-md z-20"
              onClick={handleToggleFavorite}
            >
              <motion.div
                animate={{ scale: isFavorite ? 1.2 : 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isFavorite ? "fill-destructive text-destructive" : "text-muted-foreground hover:text-destructive"
                  )}
                />
              </motion.div>
            </Button>

            {price && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="absolute bottom-3 left-3"
                  >
                    <Badge className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground cursor-help shadow-lg border-0 px-3 py-1.5 text-sm font-medium">
                      {formatPrice(price, currency)}/night
                      {showConversion && (
                        <span className="ml-1 text-xs opacity-90">({originalPrice})</span>
                      )}
                    </Badge>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Original: {originalPrice}/night</p>
                  <p>Converted: {formatPrice(price, currency)}/night</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Content */}
          <CardContent className="p-3 sm:p-4 relative">
            <p className="text-xs sm:text-sm text-primary font-medium mb-1 line-clamp-1">
              {type} in {location}
            </p>
            <h3 className="font-semibold text-foreground text-base sm:text-lg mb-2 sm:mb-3 line-clamp-1 group-hover:text-primary transition-colors duration-300">
              {title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-tref-teal" />
                {guests}
              </span>
              <span className="flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-tref-purple" />
                {bedrooms}bd · {beds}b
              </span>
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                {baths}ba
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
};

export default PropertyCard;
