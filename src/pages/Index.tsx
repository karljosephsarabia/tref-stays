import { useState, useRef } from "react";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import PropertyGrid from "@/components/PropertyGrid";
import TrustSection from "@/components/TrustSection";

const Index = () => {
  const [searchFilters, setSearchFilters] = useState<{
    country: string;
    zipcode: string;
  }>({ country: "", zipcode: "" });
  const propertyGridRef = useRef<HTMLDivElement>(null);

  const handleSearch = (country: string, zipcode: string) => {
    console.log('Search triggered:', { country, zipcode });
    setSearchFilters({ country, zipcode });
    
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
          <PropertyGrid country={searchFilters.country} zipcode={searchFilters.zipcode} />
        </div>
        <TrustSection />
      </main>
    </div>
  );
};

export default Index;
