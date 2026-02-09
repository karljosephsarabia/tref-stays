import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format, eachDayOfInterval, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";

interface PropertyCalendarProps {
  propertyId: string;
}

interface BlockedRange {
  id: number;
  start_date: string;
  end_date: string;
  notes?: string;
  created_at: string;
}

interface UnavailableDate {
  start_date: string;
  end_date: string;
  status: 'blocked' | 'booked';
  notes?: string;
}

const PropertyCalendar = ({ propertyId }: PropertyCalendarProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [notes, setNotes] = useState("");
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [blockedRanges, setBlockedRanges] = useState<BlockedRange[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDates, setIsLoadingDates] = useState(true);

  const getToken = () => localStorage.getItem('auth_token');

  // Fetch unavailable dates (both blocked and booked)
  const fetchUnavailableDates = async () => {
    try {
      setIsLoadingDates(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/properties/${propertyId}/unavailable-dates`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch unavailable dates');
      }

      const data: UnavailableDate[] = await response.json();

      // Convert date ranges to individual Date objects for calendar display
      const dates: Date[] = [];
      data.forEach((range) => {
        const start = parseISO(range.start_date);
        const end = parseISO(range.end_date);
        const datesInRange = eachDayOfInterval({ start, end });
        dates.push(...datesInRange);
      });

      setUnavailableDates(dates);
    } catch (error) {
      console.error('Error fetching unavailable dates:', error);
      toast.error('Failed to load unavailable dates');
    } finally {
      setIsLoadingDates(false);
    }
  };

  // Fetch blocked date ranges (owner's blocks only)
  const fetchBlockedRanges = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/properties/${propertyId}/blocked-dates`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch blocked dates');
      }

      const data: BlockedRange[] = await response.json();
      setBlockedRanges(data);
    } catch (error) {
      console.error('Error fetching blocked ranges:', error);
      toast.error('Failed to load blocked dates');
    }
  };

  useEffect(() => {
    fetchUnavailableDates();
    fetchBlockedRanges();
  }, [propertyId]);

  const handleBlockDates = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Please select a date range');
      return;
    }

    const token = getToken();
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/properties/${propertyId}/block-dates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            start_date: format(dateRange.from, 'yyyy-MM-dd'),
            end_date: format(dateRange.to, 'yyyy-MM-dd'),
            notes: notes || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error('Date range conflicts with existing bookings or blocks');
        } else {
          throw new Error(data.error || 'Failed to block dates');
        }
        return;
      }

      toast.success('Dates blocked successfully');
      setDateRange(undefined);
      setNotes('');
      
      // Refresh both lists
      await fetchUnavailableDates();
      await fetchBlockedRanges();
    } catch (error: any) {
      console.error('Error blocking dates:', error);
      toast.error(error.message || 'Failed to block dates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblockDates = async (range: BlockedRange) => {
    const token = getToken();
    if (!token) {
      toast.error('Authentication required');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/properties/${propertyId}/block-dates`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            start_date: range.start_date,
            end_date: range.end_date,
            unblock: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to unblock dates');
      }

      toast.success('Dates unblocked successfully');
      
      // Refresh both lists
      await fetchUnavailableDates();
      await fetchBlockedRanges();
    } catch (error: any) {
      console.error('Error unblocking dates:', error);
      toast.error(error.message || 'Failed to unblock dates');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Calendar Picker */}
      <Card>
        <CardHeader>
          <CardTitle>Block Dates</CardTitle>
          <CardDescription>
            Select date ranges to block for maintenance or personal use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingDates ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex justify-center">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                disabled={(date) => {
                  // Disable past dates
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  if (date < today) return true;
                  
                  // Disable unavailable dates
                  return unavailableDates.some(
                    unavailableDate => 
                      unavailableDate.getTime() === date.getTime()
                  );
                }}
                numberOfMonths={1}
                className="rounded-md"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Input
              id="notes"
              placeholder="e.g., Property maintenance, family use"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">
              {dateRange?.from && dateRange?.to && (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
            </div>
            <Button
              onClick={handleBlockDates}
              disabled={!dateRange?.from || !dateRange?.to || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Block Dates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Right: Blocked Ranges List */}
      <Card>
        <CardHeader>
          <CardTitle>Blocked Date Ranges</CardTitle>
          <CardDescription>
            Your manually blocked dates (bookings not shown here)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockedRanges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No blocked dates yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedRanges.map((range) => (
                <div
                  key={range.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">
                      {format(parseISO(range.start_date), 'MMM dd, yyyy')} -{' '}
                      {format(parseISO(range.end_date), 'MMM dd, yyyy')}
                    </div>
                    {range.notes && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {range.notes}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Blocked on {format(parseISO(range.created_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUnblockDates(range)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyCalendar;
