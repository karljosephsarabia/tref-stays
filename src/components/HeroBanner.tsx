import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, MapPin, CalendarIcon, Users, Minus, Plus } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import heroBg from "@/assets/hero-bg.jpg";
import { CountUp } from "./CountUp";

const heroStagger = { staggerChildren: 0.1, delayChildren: 0.2 };
const itemUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

interface HeroBannerProps {
  onSearch: (country: string, zipcode: string) => void;
}

const HeroBanner = ({ onSearch }: HeroBannerProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(Date.now() + 86400000),
  });
  const [country, setCountry] = useState("us");
  const [zipcode, setZipcode] = useState("");
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [babies, setBabies] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const yParallax = useTransform(scrollYProgress, [0, 0.5], [0, 80]);
  const opacityParallax = useTransform(scrollYProgress, [0, 0.4], [1, 0.3]);

  const totalGuests = adults + kids + babies;

  const GuestCounter = ({
    label,
    description,
    value,
    onChange,
    min = 0,
  }: {
    label: string;
    description: string;
    value: number;
    onChange: (val: number) => void;
    min?: number;
  }) => (
    <div className="flex justify-between py-3">
      <div>
        <div className="font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const stats = [
    { value: "10K+", label: "Properties" },
    { value: "50K+", label: "Happy Guests" },
    { value: "100+", label: "Cities" },
    { value: "4.9★", label: "Rating" },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[85svh] md:min-h-[90vh] flex flex-col overflow-hidden"
    >
      {/* Background Image - unchanged */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        {/* Dark blue to transparent gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(211,80%,25%)]/90 via-[hsl(211,70%,30%)]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.25)_100%)]" />
      </div>

      {/* Decorative blurs */}
      <div className="hidden md:block absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
      <div className="hidden md:block absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

      {/* Content with parallax */}
      <motion.div
        style={{ y: yParallax, opacity: opacityParallax }}
        className="relative z-10 flex-1 flex flex-col items-center justify-center px-3 pt-14 md:pt-24 pb-4 md:pb-8"
      >
        <motion.div
          className="flex flex-col items-center max-w-5xl"
          variants={heroStagger}
          initial="hidden"
          animate="show"
        >
          <motion.h1
            variants={itemUp}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-center text-white mb-2 md:mb-6 leading-tight"
          >
            Tref Your Perfect
            <br />
            <span className="relative inline-block mt-0.5 md:mt-2">
              <span className="relative z-10 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                Rental Home
              </span>
              <span className="absolute -bottom-0.5 md:-bottom-2 left-0 right-0 h-1.5 md:h-4 bg-gradient-to-r from-primary to-tref-gold rounded-sm -skew-x-3" />
            </span>
          </motion.h1>

          <motion.p
            variants={itemUp}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-xs sm:text-base md:text-lg lg:text-xl text-white/80 text-center max-w-2xl mb-4 md:mb-12 leading-relaxed px-2"
          >
            Discover unique stays and experiences around the world.
          </motion.p>

          {/* Search card - matching the design image */}
          <motion.div
            variants={itemUp}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="w-full max-w-6xl px-2"
          >
            <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/50 border border-white/20">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center">
                {/* Location Section */}
                <div className="flex-1 p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-white/20">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-start gap-3 cursor-pointer group">
                        <MapPin className="h-5 w-5 text-white/70 group-hover:text-white transition-colors flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white/60 mb-1">Location</div>
                          <div className="text-sm lg:text-base font-medium text-white truncate">
                            {country === "us" && "US United States"}
                            {country === "ca" && "Canada"}
                            {country === "uk" && "United Kingdom"}
                            {country === "be" && "Belgium"}
                            {country === "il" && "Israel"}
                            {zipcode ? ` - ${zipcode}` : " or Enter Zipcode"}
                          </div>
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4 bg-background border-border" align="start">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Country</label>
                          <Select value={country} onValueChange={setCountry}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="us">US United States</SelectItem>
                              <SelectItem value="ca">Canada</SelectItem>
                              <SelectItem value="uk">United Kingdom</SelectItem>
                              <SelectItem value="be">Belgium</SelectItem>
                              <SelectItem value="il">Israel</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Zipcode</label>
                          <Input
                            type="text"
                            placeholder="Enter Zipcode"
                            value={zipcode}
                            onChange={(e) => setZipcode(e.target.value)}
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date Range Section */}
                <div className="flex-1 p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-white/10">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-start gap-3 cursor-pointer group">
                        <CalendarIcon className="h-5 w-5 text-white/70 group-hover:text-white transition-colors flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white/60 mb-1">Date Range</div>
                          <div className="text-sm lg:text-base font-medium text-white truncate">
                            {dateRange?.from && dateRange?.to
                              ? `${format(dateRange.from, "MM/dd/yyyy")} - ${format(dateRange.to, "MM/dd/yyyy")}`
                              : "Select dates"}
                          </div>
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background border-border" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        className="p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Guests/Type Section */}
                <div className="flex-1 p-4 lg:p-6 lg:pr-32">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-start gap-3 cursor-pointer group">
                        <Users className="h-5 w-5 text-white/70 group-hover:text-white transition-colors flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white/60 mb-1">Guests/Type</div>
                          <div className="text-sm lg:text-base font-medium text-white truncate">
                            Short Term Rent, {totalGuests} Guest{totalGuests !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0 bg-background border-border" align="start">
                      <div className="p-4 border-b border-border">
                        <label className="text-sm font-medium mb-2 block">Property Type</label>
                        <Select defaultValue="short-term">
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short-term">Short Term Rent</SelectItem>
                            <SelectItem value="long-term">Long Term Rent</SelectItem>
                            <SelectItem value="sale">Sale</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="p-4">
                        <div className="text-sm font-medium mb-3">Guests</div>
                        <div className="space-y-1">
                          <GuestCounter label="Adults" description="Ages 13+" value={adults} onChange={setAdults} min={1} />
                          <div className="border-t border-border" />
                          <GuestCounter label="Children" description="Ages 2-12" value={kids} onChange={setKids} />
                          <div className="border-t border-border" />
                          <GuestCounter label="Infants" description="Under 2" value={babies} onChange={setBabies} />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Search Button - Positioned absolutely on desktop */}
                <div className="p-4 lg:absolute lg:right-[-74px] lg:top-1/2 lg:-translate-y-1/2 flex justify-center">
                  <Button
                    onClick={() => onSearch(country, zipcode)}
                    className="w-full lg:w-40 lg:h-40 h-14 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 active:scale-95 flex flex-row lg:flex-col items-center justify-center gap-1 lg:gap-2 font-bold"
                  >
                    <Search className="!h-6 !w-6 lg:!h-10 lg:!w-10" />
                    <span className="text-base lg:text-xl">Search</span>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Stats with count-up and animated borders */}
      <div className="relative z-10 pb-4 md:pb-10">
        <div className="flex justify-center items-center gap-3 sm:gap-6 md:gap-12 lg:gap-20 px-3">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
              className="text-center group cursor-default px-4 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all duration-300"
            >
              <div className="text-base sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white group-hover:scale-110 transition-transform duration-300">
                <CountUp value={stat.value} duration={1.2} />
              </div>
              <div className="text-[9px] sm:text-xs md:text-sm text-white/70 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
