import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RenterDashboard from "./RenterDashboard";
import PropertyCalendar from "@/components/PropertyCalendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  LayoutDashboard,
  PlusCircle,
  MapPin,
  BedDouble,
  Bath,
  Pencil,
  Trash2,
  Eye,
  Loader2,
  Home,
  RefreshCw,
  AlertCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

interface PropertyWithImage {
  id: string;
  title: string;
  property_type: string;
  street_name?: string;
  house_number?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  map_address?: string;
  zipcode?: string;
  price: number;
  currency?: string;
  bedroom_count: number;
  bathroom_count: number;
  status: string;
  active?: boolean;
  main_image?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<PropertyWithImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [calendarPropertyId, setCalendarPropertyId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!user) return;

    fetchProperties();
  }, [user, authLoading, navigate]);

  const fetchProperties = async () => {
    if (!user) return;
    
    setLoading(true);
    setFetchError(null);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_URL}/api/properties?includeInactive=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }

      const allProperties = await response.json();
      
      // Filter properties by owner_id
      const userProperties = allProperties.filter((p: any) => p.owner_id === user.id);

      // Fetch images for each property
      const propertiesWithImages = await Promise.all(
        userProperties.map(async (p: any) => {
          try {
            const imagesResponse = await fetch(`${API_URL}/api/properties/${p.id}/images`);
            if (imagesResponse.ok) {
              const images = await imagesResponse.json();
              const mainImage = images.find((img: any) => img.is_main) || images[0];
              return {
                ...p,
                main_image: mainImage ? `${API_URL}${mainImage.image_url}` : undefined,
              };
            }
          } catch (err) {
            console.error(`Error fetching images for property ${p.id}:`, err);
          }
          return p;
        })
      );

      setProperties(propertiesWithImages);
      setFetchError(null);
    } catch (error: any) {
      console.error("Dashboard: failed to load properties", error);
      setFetchError(error.message || "Could not load your properties.");
      setProperties([]);
      toast.error("Couldn't load your properties. Use Retry below.");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (!user) return;
    fetchProperties();
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    
    setDeleting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_URL}/api/properties/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete property');
      }

      setProperties((prev) => prev.filter((p) => p.id !== id));
      toast.success("Property deleted");
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error("Failed to delete property");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleToggleDisplay = async (id: string, currentState: boolean) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_URL}/api/properties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: !currentState })
      });

      if (!response.ok) {
        throw new Error('Failed to update property visibility');
      }

      setProperties((prev) => 
        prev.map((p) => p.id === id ? { ...p, active: !currentState } : p)
      );
      toast.success(!currentState ? "Property displayed" : "Property hidden");
    } catch (error) {
      console.error('Error toggling property display:', error);
      toast.error("Failed to update property");
    }
  };

  const locationStr = (p: PropertyWithImage) => {
    const parts = [];
    if (p.city) parts.push(p.city);
    if (p.state) parts.push(p.state);
    if (p.country) parts.push(p.country.toUpperCase());
    return parts.length > 0 ? parts.join(", ") : "-";
  };

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

  // Check role: 4 = owner, 5 = renter
  if (user?.roleId === 5) {
    return <RenterDashboard />;
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
                Owner Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your listed properties
              </p>
            </div>
            <Link to="/list-property">
              <Button className="bg-primary hover:bg-primary/90 gap-2">
                <PlusCircle className="h-4 w-4" />
                List property
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total listings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{properties.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {properties.filter((p) => p.status === "active" || p.status === "approved").length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {properties.filter((p) => p.status === "pending").length}
                </p>
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
                <h3 className="text-lg font-semibold mb-2">Couldn't load your properties</h3>
                <p className="text-muted-foreground mb-4 max-w-md text-sm">
                  {fetchError}
                </p>
                <p className="text-muted-foreground mb-6 max-w-md text-xs">
                  Check that your Supabase project is set up and env vars (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY) are correct. If you just listed a property, try Retry after a moment.
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
                  <Link to="/list-property">
                    <Button className="bg-primary hover:bg-primary/90 gap-2">
                      <PlusCircle className="h-4 w-4" />
                      List property
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : properties.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Home className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No properties yet</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  List your first property to start receiving bookings.
                </p>
                <Link to="/list-property">
                  <Button className="bg-primary hover:bg-primary/90 gap-2">
                    <PlusCircle className="h-4 w-4" />
                    List property
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Card key={property.id} className="overflow-hidden border-border">
                  <div className="aspect-[4/3] bg-muted relative">
                    {property.main_image ? (
                      <img
                        src={property.main_image}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <Badge
                      className="absolute top-2 left-2 capitalize"
                      variant={property.status === "active" || property.status === "approved" ? "default" : "secondary"}
                    >
                      {property.status || "pending"}
                    </Badge>
                    <div className="absolute top-2 right-2 bg-background/95 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className={`text-xs font-medium whitespace-nowrap w-14 text-center ${property.active !== false ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {property.active !== false ? 'ACTIVE' : 'OFF'}
                      </span>
                      <Switch
                        checked={property.active !== false}
                        onCheckedChange={() => handleToggleDisplay(property.id, property.active !== false)}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1">{property.title}</CardTitle>
                    <CardDescription className="flex items-center gap-1 line-clamp-1">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      {locationStr(property)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BedDouble className="h-4 w-4" />
                        {property.bedroom_count ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="h-4 w-4" />
                        {property.bathroom_count ?? 0}
                      </span>
                      {property.price != null && (
                        <span className="font-medium text-foreground">
                          {property.currency === 'USD' ? '$' : property.currency === 'CAD' ? 'C$' : property.currency === 'GBP' ? '£' : property.currency === 'EUR' ? '€' : property.currency === 'ILS' ? '₪' : '$'}{Number(property.price)}/night
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/property/${property.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-1"
                        onClick={() => setCalendarPropertyId(property.id)}
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        Schedule
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1" disabled>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(property.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Calendar Dialog */}
      <Dialog open={!!calendarPropertyId} onOpenChange={() => setCalendarPropertyId(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Property Calendar</DialogTitle>
            <DialogDescription>
              Block dates for maintenance or personal use. Booked dates are automatically marked as unavailable.
            </DialogDescription>
          </DialogHeader>
          {calendarPropertyId && <PropertyCalendar propertyId={calendarPropertyId} />}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => !deleting && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete property?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the listing and its images. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
