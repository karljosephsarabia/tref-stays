import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  Loader2,
  Home,
  RefreshCw,
  AlertCircle,
  Search,
  Heart,
} from "lucide-react";
import { Link } from "react-router-dom";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&auto=format&fit=crop";

interface Booking {
  id: string;
  property_id: string;
  property_title: string;
  property_address: string;
  city: string;
  date_start: string;
  date_end: string;
  total_price: number;
  currency: string;
  status?: string;
  main_image?: string;
}

interface SavedProperty {
  saved_id: string;
  saved_at: string;
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  country: string;
  price: number;
  currency: string;
  property_type: string;
  bedroom_count: number;
  bathroom_count: number;
  guest_count: number;
  main_image?: string;
}

export default function RenterDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'favorites'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!user) return;

    fetchBookings();
    fetchSavedProperties();
  }, [user, authLoading, navigate]);

  const fetchBookings = async () => {
    if (!user) return;
    
    setLoading(true);
    setFetchError(null);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_URL}/api/reservations/my`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const allBookings = await response.json();
      setBookings(allBookings);
      setFetchError(null);
    } catch (error: any) {
      console.error("RenterDashboard: failed to load bookings", error);
      setFetchError(error.message || "Could not load your bookings.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedProperties = async () => {
    if (!user) return;
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        console.log('No auth token found, skipping saved properties fetch');
        setSavedProperties([]);
        return;
      }
      
      console.log('Fetching saved properties from:', `${API_URL}/api/saved-properties`);
      const response = await fetch(`${API_URL}/api/saved-properties`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Saved properties response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch saved properties:', response.status, errorText);
        
        // If it's a 500 error, the table might not exist
        if (response.status === 500) {
          toast.error('Favorites feature not available. Please run the database migration.');
        }
        
        setSavedProperties([]);
        return;
      }

      const saved = await response.json();
      console.log('Saved properties loaded:', saved.length, 'items');
      setSavedProperties(saved);
    } catch (error: any) {
      console.error("Failed to load saved properties", error);
      setSavedProperties([]);
    }
  };

  const handleRetry = () => {
    if (!user) return;
    fetchBookings();
    fetchSavedProperties();
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'secondary';
    switch (status) {
      case 'confirmed':
      case 'approved':
        return 'default';
      case 'completed':
        return 'outline';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status?: string) => {
    if (!status) return 'Pending';
    switch (status) {
      case 'confirmed':
      case 'approved':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      case 'completed':
        return 'Completed';
      default:
        return 'Pending';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFilteredBookings = () => {
    switch (filter) {
      case 'confirmed':
        return bookings.filter((b) => b.status === 'confirmed' || b.status === 'approved');
      case 'pending':
        return bookings.filter((b) => b.status === 'pending');
      case 'favorites':
        return null; // Will show saved properties instead
      case 'all':
      default:
        return bookings;
    }
  };

  const filteredBookings = getFilteredBookings();
  const displayItems = filter === 'favorites' ? savedProperties : filteredBookings;

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header hideMenu />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header hideMenu />
      <main className="flex-1 pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <LayoutDashboard className="h-7 w-7 text-primary" />
                My Bookings
              </h1>
              <p className="text-muted-foreground mt-1">
                View and manage your reservations
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/">
                <Button className="bg-primary hover:bg-primary/90 gap-2">
                  <Search className="h-4 w-4" />
                  Find Properties
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                filter === 'all' ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => setFilter('all')}
            >
              <CardHeader className="pb-2">
                <CardDescription>Total Bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{bookings.length}</p>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                filter === 'confirmed' ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => setFilter('confirmed')}
            >
              <CardHeader className="pb-2">
                <CardDescription>Confirmed</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {bookings.filter((b) => b.status === "confirmed" || b.status === "approved").length}
                </p>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                filter === 'pending' ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => setFilter('pending')}
            >
              <CardHeader className="pb-2">
                <CardDescription>Pending</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {bookings.filter((b) => b.status === "pending").length}
                </p>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-all hover:shadow-md ${
                filter === 'favorites' ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => setFilter('favorites')}
            >
              <CardHeader className="pb-2">
                <CardDescription>Favorites</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{savedProperties.length}</p>
              </CardContent>
            </Card>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : fetchError ? (
            <Card className="border-destructive/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-semibold mb-2">Couldn't load your bookings</h3>
                <p className="text-muted-foreground mb-4 max-w-md text-sm">
                  {fetchError}
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleRetry}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry
                  </Button>
                  <Link to="/">
                    <Button className="bg-primary hover:bg-primary/90 gap-2">
                      <Search className="h-4 w-4" />
                      Find Properties
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : !displayItems || displayItems.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Home className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {filter === 'all' ? 'No bookings yet' : 
                   filter === 'confirmed' ? 'No confirmed bookings' : 
                   filter === 'pending' ? 'No pending bookings' : 
                   'No favorites yet'}
                </h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  {filter === 'all' ? 'Start exploring properties and make your first booking!' :
                   filter === 'favorites' ? 'Save properties to your favorites to see them here.' :
                   `You don't have any ${filter} bookings at the moment.`}
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {filter !== 'all' && (
                    <Button variant="outline" onClick={() => setFilter('all')} className="gap-2">
                      View All Bookings
                    </Button>
                  )}
                  <Link to="/">
                    <Button className="bg-primary hover:bg-primary/90 gap-2">
                      <Search className="h-4 w-4" />
                      Find Properties
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {filter !== 'all' && (
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-semibold text-foreground">{displayItems?.length || 0}</span> {filter === 'favorites' ? 'favorite' : filter} {(displayItems?.length || 0) === 1 ? (filter === 'favorites' ? 'property' : 'booking') : (filter === 'favorites' ? 'properties' : 'bookings')}
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setFilter('all')}
                    className="text-xs"
                  >
                    Clear filter
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filter === 'favorites' ? (savedProperties as SavedProperty[]).map((property) => (
                <Card key={property.saved_id} className="overflow-hidden border-border">
                  <div className="aspect-[4/3] bg-muted relative">
                    <img
                      src={property.main_image 
                        ? `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${property.main_image}`
                        : PLACEHOLDER_IMAGE
                      }
                      alt={property.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    <Badge
                      className="absolute top-2 left-2 capitalize bg-red-500 hover:bg-red-600"
                    >
                      <Heart className="h-3 w-3 fill-white" />
                    </Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1">{property.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 line-clamp-1">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      {property.city}, {property.state}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Price per night</span>
                      <span className="font-semibold text-lg text-primary">
                        {property.currency === 'USD' ? '$' : property.currency === 'CAD' ? 'C$' : property.currency === 'GBP' ? '£' : property.currency === 'EUR' ? '€' : property.currency === 'ILS' ? '₪' : '$'}
                        {property.price}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link to={`/property/${property.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-1">
                          <Home className="h-3.5 w-3.5" />
                          View Property
                        </Button>
                      </Link>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="gap-1"
                        onClick={async () => {
                          try {
                            const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
                            const token = localStorage.getItem('auth_token');
                            const response = await fetch(`${API_URL}/api/saved-properties/${property.id}`, {
                              method: 'DELETE',
                              headers: {
                                'Authorization': `Bearer ${token}`
                              }
                            });
                            if (response.ok) {
                              toast.success('Removed from favorites');
                              fetchSavedProperties();
                            }
                          } catch (error) {
                            toast.error('Failed to remove from favorites');
                          }
                        }}
                      >
                        <Heart className="h-3.5 w-3.5" />
                        Unsave
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) : (displayItems as Booking[]).map((booking) => (
                <Card key={booking.id} className="overflow-hidden border-border">
                  <div className="aspect-[4/3] bg-muted relative">
                    <img
                      src={booking.main_image 
                        ? `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${booking.main_image}`
                        : PLACEHOLDER_IMAGE
                      }
                      alt={booking.property_title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    {booking.status && (
                      <Badge
                        className="absolute top-2 left-2 capitalize"
                        variant={getStatusColor(booking.status)}
                      >
                        {getStatusLabel(booking.status)}
                      </Badge>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1">{booking.property_title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 line-clamp-1">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      {booking.city || booking.property_address || "Location"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{formatDate(booking.date_start)} - {formatDate(booking.date_end)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-semibold text-lg text-primary">
                        {booking.currency === 'USD' ? '$' : booking.currency === 'CAD' ? 'C$' : booking.currency === 'GBP' ? '£' : booking.currency === 'EUR' ? '€' : booking.currency === 'ILS' ? '₪' : '$'}
                        {booking.total_price}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Link to={`/property/${booking.property_id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-1">
                          <Home className="h-3.5 w-3.5" />
                          View Property
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
