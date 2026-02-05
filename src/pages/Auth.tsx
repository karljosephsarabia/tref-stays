import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { User, Home, ArrowLeft, ArrowRight, Check, Upload, X, Star, Eye, MapPin, Bed, Bath, Users, DollarSign, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import trefLogo from "@/assets/tref-logo.png";

type Role = "renter" | "owner";
type AuthMode = "signin" | "signup";

interface PropertyFormData {
  // Basic Info
  title: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  price_per_night: string;
  currency: string;
  // Location
  address: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  // Description
  description: string;
  amenities: string[];
  // Kosher amenities
  nearby_shul: string;
  nearby_shul_distance: string;
  nearby_kosher_shops: string;
  nearby_kosher_shops_distance: string;
  nearby_mikva: string;
  nearby_mikva_distance: string;
  kosher_kitchen: boolean;
  shabbos_friendly: boolean;
}

const COUNTRIES = [
  { code: "us", name: "United States", flag: "🇺🇸", currency: "USD", symbol: "$" },
  { code: "ca", name: "Canada", flag: "🇨🇦", currency: "CAD", symbol: "CA$" },
  { code: "uk", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", symbol: "£" },
  { code: "be", name: "Belgium", flag: "🇧🇪", currency: "EUR", symbol: "€" },
  { code: "il", name: "Israel", flag: "🇮🇱", currency: "ILS", symbol: "₪" },
];

const getCurrencyByCountry = (countryCode: string) => {
  const country = COUNTRIES.find(c => c.code === countryCode);
  return country || COUNTRIES[0];
};

interface StepErrors {
  [key: string]: string;
}

const initialPropertyData: PropertyFormData = {
  title: "",
  property_type: "",
  bedrooms: 1,
  bathrooms: 1,
  max_guests: 2,
  price_per_night: "",
  currency: "USD",
  address: "",
  city: "",
  state: "",
  country: "",
  zipcode: "",
  description: "",
  amenities: [],
  nearby_shul: "",
  nearby_shul_distance: "",
  nearby_kosher_shops: "",
  nearby_kosher_shops_distance: "",
  nearby_mikva: "",
  nearby_mikva_distance: "",
  kosher_kitchen: false,
  shabbos_friendly: false,
};

const AMENITIES_OPTIONS = [
  "WiFi", "Air Conditioning", "Heating", "Kitchen", "Washer", "Dryer",
  "Free Parking", "Pool", "Hot Tub", "Gym", "TV", "Workspace",
  "Elevator", "Wheelchair Accessible", "Smoke Detector", "First Aid Kit"
];

const PROPERTY_TYPES = [
  "Apartment", "House", "Condo", "Townhouse", "Villa", "Cottage", "Cabin", "Bungalow"
];

export default function Auth() {
  const navigate = useNavigate();
  const { signUp, signIn, user } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [step, setStep] = useState(0); // 0 = role selection, 1+ = form steps
  const [loading, setLoading] = useState(false);
  const [stepErrors, setStepErrors] = useState<StepErrors>({});
  
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // User form data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Property form data (for owners)
  const [propertyData, setPropertyData] = useState<PropertyFormData>(initialPropertyData);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState<number>(0);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);

  const clearErrors = () => {
    setStepErrors({});
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + uploadedImages.length > 10) {
      setStepErrors({ images: "Maximum 10 images allowed" });
      return;
    }
    
    clearErrors();
    const newImages = [...uploadedImages, ...files];
    setUploadedImages(newImages);
    
    // Create preview URLs
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls([...imagePreviewUrls, ...newPreviewUrls]);
  };

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviewUrls.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    setImagePreviewUrls(newPreviews);
    
    if (mainImageIndex === index) {
      setMainImageIndex(0);
    } else if (mainImageIndex > index) {
      setMainImageIndex(mainImageIndex - 1);
    }
  };

  const setAsMainImage = (index: number) => {
    setMainImageIndex(index);
  };

  const validateRenterSignup = (): boolean => {
    const errors: StepErrors = {};
    
    if (!firstName.trim()) errors.firstName = "First name is required";
    if (!lastName.trim()) errors.lastName = "Last name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Invalid email format";
    if (!phone.trim()) errors.phone = "Phone number is required";
    if (!password) errors.password = "Password is required";
    else if (password.length < 6) errors.password = "Password must be at least 6 characters";
    if (password !== confirmPassword) errors.confirmPassword = "Passwords don't match";
    
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRenterSignup = async () => {
    if (!validateRenterSignup()) return;

    setLoading(true);
    try {
      await signUp(email, password, {
        firstName,
        lastName,
        phone
      });

      toast.success("Account created successfully!");
      navigate("/");
    } catch (error: any) {
      setStepErrors({ general: error.message || "Failed to create account" });
    } finally {
      setLoading(false);
    }
  };

  const validateOwnerStep = (): boolean => {
    const errors: StepErrors = {};
    
    switch (step) {
      case 1: // Account Info
        if (!firstName.trim()) errors.firstName = "First name is required";
        if (!lastName.trim()) errors.lastName = "Last name is required";
        if (!email.trim()) errors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Invalid email format";
        if (!phone.trim()) errors.phone = "Phone number is required";
        if (!password) errors.password = "Password is required";
        else if (password.length < 6) errors.password = "Password must be at least 6 characters";
        if (password !== confirmPassword) errors.confirmPassword = "Passwords don't match";
        break;
      case 2: // Property Basics
        if (!propertyData.title.trim()) errors.title = "Property title is required";
        if (!propertyData.property_type) errors.property_type = "Property type is required";
        if (!propertyData.price_per_night) errors.price_per_night = "Price per night is required";
        else if (parseFloat(propertyData.price_per_night) <= 0) errors.price_per_night = "Price must be greater than 0";
        break;
      case 3: // Location
        if (!propertyData.address.trim()) errors.address = "Street address is required";
        if (!propertyData.city.trim()) errors.city = "City is required";
        if (!propertyData.country) errors.country = "Country is required";
        break;
      case 4: // Photos
        if (uploadedImages.length === 0) errors.images = "Please upload at least one property image";
        break;
      case 5: // Description
        if (!propertyData.description.trim()) errors.description = "Property description is required";
        else if (propertyData.description.length < 20) errors.description = "Description must be at least 20 characters";
        break;
      case 6: // Kosher Amenities
        // Optional step, no required fields
        break;
    }
    
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateOwnerStep()) {
      clearErrors();
      setStep(step + 1);
    }
  };
 
  const handleOwnerSignup = async () => {
    if (!validateOwnerStep()) return;

    setLoading(true);
    try {
      // Create user account
      await signUp(email, password, {
        firstName,
        lastName,
        phone
      });

      // Get the auth token for property creation
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      
      // Step 1: Upload images if any
      let imageUrls: string[] = [];
      if (uploadedImages.length > 0) {
        const formData = new FormData();
        uploadedImages.forEach(file => {
          formData.append('images', file);
        });

        const uploadResponse = await fetch(`${API_URL}/api/upload/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        console.log('Image upload response:', uploadResponse);
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload images');
        }

        const uploadData = await uploadResponse.json();
        imageUrls = uploadData.imageUrls;
      }
      console.log(imageUrls);
      // Step 2: Create property
      const propertyPayload = {
        title: propertyData.title,
        description: propertyData.description,
        property_type: propertyData.property_type,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        max_guests: propertyData.max_guests,
        price_per_night: parseFloat(propertyData.price_per_night),
        currency: propertyData.currency,
        address: propertyData.address,
        city: propertyData.city,
        state: propertyData.state,
        country: propertyData.country,
        zipcode: propertyData.zipcode,
        amenities: propertyData.amenities,
        kosher_kitchen: propertyData.kosher_kitchen,
        shabbos_friendly: propertyData.shabbos_friendly,
        nearby_shul: propertyData.nearby_shul,
        nearby_shul_distance: propertyData.nearby_shul_distance,
        nearby_kosher_shops: propertyData.nearby_kosher_shops,
        nearby_kosher_shops_distance: propertyData.nearby_kosher_shops_distance,
        nearby_mikva: propertyData.nearby_mikva,
        nearby_mikva_distance: propertyData.nearby_mikva_distance,
      };

      const response = await fetch(`${API_URL}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(propertyPayload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create property');
      }

      const createdProperty = await response.json();

      // Step 3: Associate images with property
      if (imageUrls.length > 0) {
        const propertyImages = imageUrls.map((url, index) => ({
          image_url: url,
          is_main: index === mainImageIndex,
          display_order: index
        }));

        const imagesResponse = await fetch(`${API_URL}/api/properties/${createdProperty.id}/images`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ images: propertyImages })
        });

        if (!imagesResponse.ok) {
          console.error('Failed to save property images, but property was created');
        }
      }

      toast.success("Property listed successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error('Signup error:', error);
      setStepErrors({ general: error.message || "Failed to create account or property" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    const errors: StepErrors = {};
    if (!email.trim()) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";
    
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Signed in successfully!");
      navigate("/");
    } catch (error: any) {
      setStepErrors({ general: error.message || "Failed to sign in" });
    } finally {
      setLoading(false);
    }
  };

  const updatePropertyData = (field: keyof PropertyFormData, value: any) => {
    setPropertyData(prev => ({ ...prev, [field]: value }));
    // Clear field-specific error when user types
    if (stepErrors[field]) {
      setStepErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleAmenity = (amenity: string) => {
    const current = propertyData.amenities;
    if (current.includes(amenity)) {
      updatePropertyData("amenities", current.filter(a => a !== amenity));
    } else {
      updatePropertyData("amenities", [...current, amenity]);
    }
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !AMENITIES_OPTIONS.includes(trimmed) && !customAmenities.includes(trimmed)) {
      setCustomAmenities(prev => [...prev, trimmed]);
      updatePropertyData("amenities", [...propertyData.amenities, trimmed]);
      setCustomAmenity("");
    }
  };

  const removeCustomAmenity = (amenity: string) => {
    setCustomAmenities(prev => prev.filter(a => a !== amenity));
    updatePropertyData("amenities", propertyData.amenities.filter(a => a !== amenity));
  };

  // Owner wizard steps
  const ownerSteps = [
    { title: "Account Info", description: "Your personal details" },
    { title: "Property Basics", description: "Type, size & pricing" },
    { title: "Location", description: "Property address" },
    { title: "Photos", description: "Upload property images" },
    { title: "Description", description: "Describe your property" },
    { title: "Kosher Amenities", description: "Nearby religious facilities" },
    { title: "Preview", description: "Review your listing" },
  ];

  const ErrorMessage = ({ field }: { field: string }) => {
    if (!stepErrors[field]) return null;
    return <p className="text-sm text-destructive mt-1">{stepErrors[field]}</p>;
  };

  const GeneralError = () => {
    if (!stepErrors.general) return null;
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{stepErrors.general}</AlertDescription>
      </Alert>
    );
  };

  const renderRoleSelection = () => (
    <Card className="w-full max-w-md mx-auto shadow-xl border-border">
      <CardHeader className="text-center space-y-4">
        <img src={trefLogo} alt="Tref Logo" className="h-12 mx-auto" />
        <CardTitle className="text-2xl font-bold text-primary">Welcome</CardTitle>
        <CardDescription>
          {authMode === "signup" ? "How would you like to use our platform?" : "Sign in to your account"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <GeneralError />
        {authMode === "signup" ? (
          <>
            <RadioGroup
              value={selectedRole || ""}
              onValueChange={(value) => setSelectedRole(value as Role)}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="renter"
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedRole === "renter"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="renter" id="renter" className="sr-only" />
                <User className="h-10 w-10 mb-3 text-primary" />
                <span className="font-semibold">Renter</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  Looking for vacation rentals
                </span>
              </Label>
              <Label
                htmlFor="owner"
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedRole === "owner"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="owner" id="owner" className="sr-only" />
                <Home className="h-10 w-10 mb-3 text-primary" />
                <span className="font-semibold">Property Owner</span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  List your property
                </span>
              </Label>
            </RadioGroup>
            <Button
              onClick={() => setStep(1)}
              disabled={!selectedRole}
              className="w-full"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (stepErrors.email) setStepErrors(prev => ({ ...prev, email: undefined }));
                }}
                placeholder="your@email.com"
                className={stepErrors.email ? "border-destructive" : ""}
              />
              <ErrorMessage field="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (stepErrors.password) setStepErrors(prev => ({ ...prev, password: undefined }));
                }}
                placeholder="••••••••"
                className={stepErrors.password ? "border-destructive" : ""}
              />
              <ErrorMessage field="password" />
            </div>
            <Button onClick={handleSignIn} disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </div>
        )}
        
        <div className="text-center text-sm text-muted-foreground">
          {authMode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setAuthMode("signin");
                  clearErrors();
                }}
                className="text-primary hover:underline font-medium"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setAuthMode("signup");
                  clearErrors();
                }}
                className="text-primary hover:underline font-medium"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderRenterSignup = () => (
    <Card className="w-full max-w-md mx-auto shadow-xl border-border">
      <CardHeader className="text-center space-y-4">
        <img src={trefLogo} alt="Tref Logo" className="h-12 mx-auto" />
        <CardTitle className="text-2xl font-bold text-primary">Create Account</CardTitle>
        <CardDescription>Sign up as a Renter</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GeneralError />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (stepErrors.firstName) setStepErrors(prev => ({ ...prev, firstName: undefined }));
              }}
              placeholder="John"
              className={stepErrors.firstName ? "border-destructive" : ""}
            />
            <ErrorMessage field="firstName" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (stepErrors.lastName) setStepErrors(prev => ({ ...prev, lastName: undefined }));
              }}
              placeholder="Doe"
              className={stepErrors.lastName ? "border-destructive" : ""}
            />
            <ErrorMessage field="lastName" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (stepErrors.email) setStepErrors(prev => ({ ...prev, email: undefined }));
            }}
            placeholder="your@email.com"
            className={stepErrors.email ? "border-destructive" : ""}
          />
          <ErrorMessage field="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (stepErrors.phone) setStepErrors(prev => ({ ...prev, phone: undefined }));
            }}
            placeholder="+1 (555) 000-0000"
            className={stepErrors.phone ? "border-destructive" : ""}
          />
          <ErrorMessage field="phone" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (stepErrors.password) setStepErrors(prev => ({ ...prev, password: undefined }));
            }}
            placeholder="••••••••"
            className={stepErrors.password ? "border-destructive" : ""}
          />
          <ErrorMessage field="password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (stepErrors.confirmPassword) setStepErrors(prev => ({ ...prev, confirmPassword: undefined }));
            }}
            placeholder="••••••••"
            className={stepErrors.confirmPassword ? "border-destructive" : ""}
          />
          <ErrorMessage field="confirmPassword" />
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => { setStep(0); clearErrors(); }} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleRenterSignup} disabled={loading} className="flex-1">
            {loading ? "Creating..." : "Sign Up"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderOwnerStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (stepErrors.firstName) setStepErrors(prev => ({ ...prev, firstName: undefined }));
            }}
            placeholder="John"
            className={stepErrors.firstName ? "border-destructive" : ""}
          />
          <ErrorMessage field="firstName" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (stepErrors.lastName) setStepErrors(prev => ({ ...prev, lastName: undefined }));
            }}
            placeholder="Doe"
            className={stepErrors.lastName ? "border-destructive" : ""}
          />
          <ErrorMessage field="lastName" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (stepErrors.email) setStepErrors(prev => ({ ...prev, email: undefined }));
          }}
          placeholder="your@email.com"
          className={stepErrors.email ? "border-destructive" : ""}
        />
        <ErrorMessage field="email" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (stepErrors.phone) setStepErrors(prev => ({ ...prev, phone: undefined }));
          }}
          placeholder="+1 (555) 000-0000"
          className={stepErrors.phone ? "border-destructive" : ""}
        />
        <ErrorMessage field="phone" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (stepErrors.password) setStepErrors(prev => ({ ...prev, password: undefined }));
          }}
          placeholder="••••••••"
          className={stepErrors.password ? "border-destructive" : ""}
        />
        <ErrorMessage field="password" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (stepErrors.confirmPassword) setStepErrors(prev => ({ ...prev, confirmPassword: undefined }));
          }}
          placeholder="••••••••"
          className={stepErrors.confirmPassword ? "border-destructive" : ""}
        />
        <ErrorMessage field="confirmPassword" />
      </div>
    </div>
  );

  const renderOwnerStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Property Title</Label>
        <Input
          id="title"
          value={propertyData.title}
          onChange={(e) => updatePropertyData("title", e.target.value)}
          placeholder="Beautiful Lakefront Cottage"
          className={stepErrors.title ? "border-destructive" : ""}
        />
        <ErrorMessage field="title" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="propertyType">Property Type</Label>
        <Select
          value={propertyData.property_type}
          onValueChange={(value) => updatePropertyData("property_type", value)}
        >
          <SelectTrigger className={stepErrors.property_type ? "border-destructive" : ""}>
            <SelectValue placeholder="Select property type" />
          </SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPES.map((type) => (
              <SelectItem key={type} value={type.toLowerCase()}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <ErrorMessage field="property_type" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input
            id="bedrooms"
            type="number"
            min="1"
            value={propertyData.bedrooms}
            onChange={(e) => updatePropertyData("bedrooms", parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input
            id="bathrooms"
            type="number"
            min="1"
            value={propertyData.bathrooms}
            onChange={(e) => updatePropertyData("bathrooms", parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxGuests">Max Guests</Label>
          <Input
            id="maxGuests"
            type="number"
            min="1"
            value={propertyData.max_guests}
            onChange={(e) => updatePropertyData("max_guests", parseInt(e.target.value) || 1)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select
          value={propertyData.currency}
          onValueChange={(value) => updatePropertyData("currency", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border z-50">
            {COUNTRIES.map((country) => (
              <SelectItem key={country.currency} value={country.currency}>
                {country.flag} {country.currency} ({country.symbol})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="price">Price per Night ({getCurrencyByCountry(propertyData.country || "us").symbol})</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {COUNTRIES.find(c => c.currency === propertyData.currency)?.symbol || "$"}
          </span>
          <Input
            id="price"
            type="number"
            min="0"
            value={propertyData.price_per_night}
            onChange={(e) => updatePropertyData("price_per_night", e.target.value)}
            placeholder="150"
            className={`pl-10 ${stepErrors.price_per_night ? "border-destructive" : ""}`}
          />
        </div>
        <ErrorMessage field="price_per_night" />
      </div>
    </div>
  );

  const renderOwnerStep3 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address">Street Address</Label>
        <Input
          id="address"
          value={propertyData.address}
          onChange={(e) => updatePropertyData("address", e.target.value)}
          placeholder="123 Main Street"
          className={stepErrors.address ? "border-destructive" : ""}
        />
        <ErrorMessage field="address" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={propertyData.city}
            onChange={(e) => updatePropertyData("city", e.target.value)}
            placeholder="Lakewood"
            className={stepErrors.city ? "border-destructive" : ""}
          />
          <ErrorMessage field="city" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={propertyData.state}
            onChange={(e) => updatePropertyData("state", e.target.value)}
            placeholder="New Jersey"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select
            value={propertyData.country}
            onValueChange={(value) => {
              updatePropertyData("country", value);
              // Auto-set currency based on country
              const country = COUNTRIES.find(c => c.code === value);
              if (country) {
                updatePropertyData("currency", country.currency);
              }
            }}
          >
            <SelectTrigger className={stepErrors.country ? "border-destructive" : ""}>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border z-50">
              {COUNTRIES.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ErrorMessage field="country" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipcode">Zipcode</Label>
          <Input
            id="zipcode"
            value={propertyData.zipcode}
            onChange={(e) => updatePropertyData("zipcode", e.target.value)}
            placeholder="08701"
          />
        </div>
      </div>
    </div>
  );

  const renderOwnerStep4 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Property Photos (Max 10)</Label>
        <p className="text-sm text-muted-foreground">Upload images and click on one to set it as the main photo</p>
        <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG up to 10MB each
            </p>
          </label>
        </div>
        <ErrorMessage field="images" />
      </div>

      {imagePreviewUrls.length > 0 && (
        <div className="space-y-3">
          <Label>Select Main Image</Label>
          <p className="text-sm text-muted-foreground">Click on an image to set it as the main photo for your listing</p>
          <div className="grid grid-cols-3 gap-3">
            {imagePreviewUrls.map((url, index) => (
              <div 
                key={index} 
                className={`relative group aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                  mainImageIndex === index 
                    ? "ring-4 ring-primary ring-offset-2" 
                    : "border border-border hover:border-primary/50"
                }`}
                onClick={() => setAsMainImage(index)}
              >
                <img
                  src={url}
                  alt={`Property ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {mainImageIndex === index && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-medium flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Main
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive/90 hover:bg-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-destructive-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderOwnerStep5 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Property Description</Label>
        <Textarea
          id="description"
          value={propertyData.description}
          onChange={(e) => updatePropertyData("description", e.target.value)}
          placeholder="Describe your property in detail. Mention special features, nearby attractions, and what makes it unique..."
          className={`min-h-[120px] ${stepErrors.description ? "border-destructive" : ""}`}
        />
        <ErrorMessage field="description" />
      </div>
      
      <div className="space-y-2">
        <Label>Amenities</Label>
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES_OPTIONS.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox
                id={amenity}
                checked={propertyData.amenities.includes(amenity)}
                onCheckedChange={() => toggleAmenity(amenity)}
              />
              <Label htmlFor={amenity} className="text-sm font-normal cursor-pointer">
                {amenity}
              </Label>
            </div>
          ))}
          {customAmenities.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2 group">
              <Checkbox
                id={`custom-${amenity}`}
                checked={propertyData.amenities.includes(amenity)}
                onCheckedChange={() => toggleAmenity(amenity)}
              />
              <Label htmlFor={`custom-${amenity}`} className="text-sm font-normal cursor-pointer flex-1">
                {amenity}
              </Label>
              <button
                type="button"
                onClick={() => removeCustomAmenity(amenity)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10"
              >
                <X className="h-3 w-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2 mt-3">
          <Input
            value={customAmenity}
            onChange={(e) => setCustomAmenity(e.target.value)}
            placeholder="Add custom amenity..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomAmenity();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addCustomAmenity}
            disabled={!customAmenity.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderOwnerStep6 = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 p-3 bg-primary/5 rounded-lg">
        <Checkbox
          id="kosherKitchen"
          checked={propertyData.kosher_kitchen}
          onCheckedChange={(checked) => updatePropertyData("kosher_kitchen", checked)}
        />
        <Label htmlFor="kosherKitchen" className="cursor-pointer">
          Kosher Kitchen Available
        </Label>
      </div>
      
      <div className="flex items-center space-x-2 p-3 bg-primary/5 rounded-lg">
        <Checkbox
          id="shabbosFriendly"
          checked={propertyData.shabbos_friendly}
          onCheckedChange={(checked) => updatePropertyData("shabbos_friendly", checked)}
        />
        <Label htmlFor="shabbosFriendly" className="cursor-pointer">
          Shabbos Friendly
        </Label>
      </div>

      <div className="space-y-4 pt-4">
        <h4 className="font-medium">Nearby Shul</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="nearbyShul">Shul Name</Label>
            <Input
              id="nearbyShul"
              value={propertyData.nearby_shul}
              onChange={(e) => updatePropertyData("nearby_shul", e.target.value)}
              placeholder="Beth Israel Synagogue"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nearbyShulDistance">Distance</Label>
            <Input
              id="nearbyShulDistance"
              value={propertyData.nearby_shul_distance}
              onChange={(e) => updatePropertyData("nearby_shul_distance", e.target.value)}
              placeholder="5 min walk"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Nearby Kosher Shops</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="nearbyKosherShops">Shop Name</Label>
            <Input
              id="nearbyKosherShops"
              value={propertyData.nearby_kosher_shops}
              onChange={(e) => updatePropertyData("nearby_kosher_shops", e.target.value)}
              placeholder="Kosher Market"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nearbyKosherShopsDistance">Distance</Label>
            <Input
              id="nearbyKosherShopsDistance"
              value={propertyData.nearby_kosher_shops_distance}
              onChange={(e) => updatePropertyData("nearby_kosher_shops_distance", e.target.value)}
              placeholder="10 min walk"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Nearby Mikva</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="nearbyMikva">Mikva Name</Label>
            <Input
              id="nearbyMikva"
              value={propertyData.nearby_mikva}
              onChange={(e) => updatePropertyData("nearby_mikva", e.target.value)}
              placeholder="Community Mikva"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nearbyMikvaDistance">Distance</Label>
            <Input
              id="nearbyMikvaDistance"
              value={propertyData.nearby_mikva_distance}
              onChange={(e) => updatePropertyData("nearby_mikva_distance", e.target.value)}
              placeholder="3 min walk"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const getCountryName = (code: string) => {
    const country = COUNTRIES.find(c => c.code === code);
    return country?.name || code;
  };

  const getCurrencySymbol = () => {
    const country = COUNTRIES.find(c => c.currency === propertyData.currency);
    return country?.symbol || "$";
  };

  const renderOwnerStep7 = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <Eye className="h-8 w-8 mx-auto text-primary mb-2" />
        <h3 className="font-semibold text-lg">Preview Your Listing</h3>
        <p className="text-sm text-muted-foreground">Review how your property will appear to renters</p>
      </div>

      {/* Main Image Preview */}
      {imagePreviewUrls.length > 0 && (
        <div className="relative aspect-video rounded-xl overflow-hidden">
          <img
            src={imagePreviewUrls[mainImageIndex]}
            alt="Main property"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 right-2 bg-background/80 text-foreground text-xs px-2 py-1 rounded">
            {imagePreviewUrls.length} photos
          </div>
        </div>
      )}

      {/* Property Title & Price */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold">{propertyData.title || "Your Property Title"}</h2>
          <p className="text-muted-foreground flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {[propertyData.city, propertyData.state, getCountryName(propertyData.country)].filter(Boolean).join(", ") || "Location"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">
            {getCurrencySymbol()}{propertyData.price_per_night || "0"}
          </p>
          <p className="text-sm text-muted-foreground">per night ({propertyData.currency})</p>
        </div>
      </div>

      {/* Property Details */}
      <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Bed className="h-5 w-5 text-muted-foreground" />
          <span>{propertyData.bedrooms} bed{propertyData.bedrooms > 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <Bath className="h-5 w-5 text-muted-foreground" />
          <span>{propertyData.bathrooms} bath{propertyData.bathrooms > 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span>{propertyData.max_guests} guest{propertyData.max_guests > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Description */}
      <div>
        <h4 className="font-semibold mb-2">About this property</h4>
        <p className="text-muted-foreground">{propertyData.description || "No description provided"}</p>
      </div>

      {/* Amenities */}
      {propertyData.amenities.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Amenities</h4>
          <div className="flex flex-wrap gap-2">
            {propertyData.amenities.map((amenity) => (
              <span key={amenity} className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Kosher Features */}
      <div>
        <h4 className="font-semibold mb-2">Kosher Features</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {propertyData.kosher_kitchen && (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Kosher Kitchen</span>
            </div>
          )}
          {propertyData.shabbos_friendly && (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span>Shabbos Friendly</span>
            </div>
          )}
          {propertyData.nearby_shul && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Shul: {propertyData.nearby_shul} ({propertyData.nearby_shul_distance})</span>
            </div>
          )}
          {propertyData.nearby_kosher_shops && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Kosher Shop: {propertyData.nearby_kosher_shops} ({propertyData.nearby_kosher_shops_distance})</span>
            </div>
          )}
          {propertyData.nearby_mikva && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>Mikva: {propertyData.nearby_mikva} ({propertyData.nearby_mikva_distance})</span>
            </div>
          )}
        </div>
      </div>

      {/* All Images Preview */}
      {imagePreviewUrls.length > 1 && (
        <div>
          <h4 className="font-semibold mb-2">All Photos</h4>
          <div className="grid grid-cols-4 gap-2">
            {imagePreviewUrls.map((url, index) => (
              <div key={index} className={`aspect-square rounded-lg overflow-hidden ${mainImageIndex === index ? "ring-2 ring-primary" : ""}`}>
                <img src={url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderOwnerWizard = () => (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-border">
      <CardHeader className="text-center space-y-4">
        <img src={trefLogo} alt="Tref Logo" className="h-12 mx-auto" />
        <CardTitle className="text-2xl font-bold text-primary">List Your Property</CardTitle>
        <CardDescription>
          Step {step} of {ownerSteps.length}: {ownerSteps[step - 1]?.title}
        </CardDescription>
        
        {/* Progress bar */}
        <div className="flex gap-2 pt-2">
          {ownerSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full transition-colors ${
                index + 1 <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <GeneralError />
        {step === 1 && renderOwnerStep1()}
        {step === 2 && renderOwnerStep2()}
        {step === 3 && renderOwnerStep3()}
        {step === 4 && renderOwnerStep4()}
        {step === 5 && renderOwnerStep5()}
        {step === 6 && renderOwnerStep6()}
        {step === 7 && renderOwnerStep7()}

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => { setStep(step - 1); clearErrors(); }}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {step < ownerSteps.length ? (
            <Button
              onClick={handleNextStep}
              className="flex-1"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleOwnerSignup}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Creating..." : "Complete Listing"}
              <Check className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      {step === 0 && renderRoleSelection()}
      {step === 1 && selectedRole === "renter" && renderRenterSignup()}
      {step >= 1 && selectedRole === "owner" && renderOwnerWizard()}
    </div>
  );
}
