import { useState } from "react";
import { motion } from "framer-motion";
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
import { Search, MapPin, ChevronDown, SlidersHorizontal, Map } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

const SearchFilters = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(Date.now() + 86400000),
  });
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-background border-b border-border py-4">
      <div className="container mx-auto px-4">
        {/* Main Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Zipcode Input */}
          <div className="relative flex-1 min-w-[180px] max-w-[220px]">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter Zipcode"
              className="pl-9 bg-background border-border focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200"
            />
          </div>

          {/* Rental Type */}
          <Select defaultValue="short-term">
            <SelectTrigger className="w-[180px] bg-background border-border">
              <SelectValue placeholder="Rental Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short-term">Short Term Rent</SelectItem>
              <SelectItem value="long-term">Long Term Rent</SelectItem>
              <SelectItem value="sale">Sale</SelectItem>
            </SelectContent>
          </Select>

          {/* Property Type */}
          <Select>
            <SelectTrigger className="w-[200px] bg-background border-border">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="house-apt">House and Apt. Rooms</SelectItem>
              <SelectItem value="full-hotel">Full Hotel after the season</SelectItem>
              <SelectItem value="simche-hall">Simche Hall</SelectItem>
              <SelectItem value="parking">Parking</SelectItem>
              <SelectItem value="swimming-pools">Swimming Pools</SelectItem>
            </SelectContent>
          </Select>

          {/* Other Filters Toggle */}
          <Button
            variant="outline"
            className="gap-2 border-border"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Other filters
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="border-border text-muted-foreground font-normal">
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MM/dd/yyyy")} - {format(dateRange.to, "MM/dd/yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "MM/dd/yyyy")
                  )
                ) : (
                  "Select dates"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Search Button */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:opacity-95 gap-2 shadow-md focus:ring-2 focus:ring-primary/30">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </motion.div>

          {/* Map Toggle */}
          <Button variant="outline" className="gap-2 border-border">
            <Map className="h-4 w-4" />
            Map
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
          <div className="mt-4 p-4 bg-secondary rounded-lg border border-border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Check in/out */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Check in / Check out
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start border-border font-normal">
                      {dateRange?.from && dateRange?.to ? (
                        `${format(dateRange.from, "MM/dd/yyyy")} - ${format(dateRange.to, "MM/dd/yyyy")}`
                      ) : (
                        "Select dates"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Guests */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Guests
                </label>
                <Input placeholder="Add Guests" className="bg-background border-border" />
              </div>

              {/* Beds */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Beds
                </label>
                <Input placeholder="Add Beds" className="bg-background border-border" />
              </div>

              {/* Amenities */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Amenities
                </label>
                <Input placeholder="Select amenities" className="bg-background border-border" />
              </div>
            </div>
          </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SearchFilters;
