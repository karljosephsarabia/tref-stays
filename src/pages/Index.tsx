import { useState, useRef } from "react";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import PropertyGrid from "@/components/PropertyGrid";
import TrustSection from "@/components/TrustSection";
import { DateRange } from "react-day-picker";

const Index = () => {
  const [searchFilters, setSearchFilters] = useState<{
    country: string;
    zipcode: string;
    startDate?: Date;
    endDate?: Date;
  }>({ country: "", zipcode: "" });
  const propertyGridRef = useRef<HTMLDivElement>(null);

  const handleSearch = (country: string, zipcode: string, dateRange?: DateRange) => {
    console.log('Search triggered:', { country, zipcode, dateRange });
    setSearchFilters({ 
      country, 
      zipcode,
      startDate: dateRange?.from,
      endDate: dateRange?.to
    });
    
    // Scroll to property grid
    setTimeout(() => {
      propertyGridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <HeroBanner onSearch={handleSearch} />
      {/* Gradient divider */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-tref-gold to-tref-purple opacity-80" aria-hidden />
      <main className="flex-1">
        <div ref={propertyGridRef}>
          <PropertyGrid 
            country={searchFilters.country} 
            zipcode={searchFilters.zipcode}
            startDate={searchFilters.startDate}
            endDate={searchFilters.endDate}
          />
        </div>
        <TrustSection />
      </main>
    </div>
  );
};

export default Index;
