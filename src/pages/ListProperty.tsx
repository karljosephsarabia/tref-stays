import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight, Upload, X, Star, Loader2, Check, MapPin, Bed, Bath, Users, Eye, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import trefLogo from "@/assets/tref-logo.png";

const PROPERTY_TYPES = [
  "Apartment",
  "House",
  "Condo",
  "Townhouse",
  "Villa",
  "Cottage",
  "Cabin",
  "Bungalow",
];

const COUNTRIES = [
  { code: "us", name: "United States", flag: "🇺🇸", currency: "USD", symbol: "$" },
  { code: "ca", name: "Canada", flag: "🇨🇦", currency: "CAD", symbol: "CA$" },
  { code: "uk", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", symbol: "£" },
  { code: "be", name: "Belgium", flag: "🇧🇪", currency: "EUR", symbol: "€" },
  { code: "il", name: "Israel", flag: "🇮🇱", currency: "ILS", symbol: "₪" },
];

const AMENITIES_OPTIONS = [
  "WiFi", "Air Conditioning", "Heating", "Kitchen", "Washer", "Dryer",
  "Free Parking", "Pool", "Hot Tub", "Gym", "TV", "Workspace",
  "Elevator", "Wheelchair Accessible", "Smoke Detector", "First Aid Kit"
];

interface FormData {
  // Basic Info
  title: string;
  property_type: string;
  bedroom_count: number;
  bathroom_count: number;
  guest_count: number;
  price: string;
  currency: string;
  // Location
  street_name: string;
  house_number: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  map_lat: string;
  map_lng: string;
  map_address: string;
  // Description
  additional_information: string;
  additional_luxury: string;
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

const initialFormData: FormData = {
  title: "",
  property_type: "",
  bedroom_count: 1,
  bathroom_count: 1,
  guest_count: 2,
  price: "",
  currency: "USD",
  street_name: "",
  house_number: "",
  address: "",
  city: "",
  state: "",
  country: "",
  zipcode: "",
  map_lat: "",
  map_lng: "",
  map_address: "",
  additional_information: "",
  additional_luxury: "",
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

interface FormErrors {
  [key: string]: string;
}

export default function ListProperty() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Steps: 1=Property Basics, 2=Location, 3=Photos, 4=Description, 5=Preview
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [customAmenity, setCustomAmenity] = useState("");
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [customKosherAmenity, setCustomKosherAmenity] = useState("");
  const [customKosherAmenities, setCustomKosherAmenities] = useState<{ name: string; checked: boolean }[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const wizardSteps = [
    { title: "Property Basics", description: "Type, size & pricing" },
    { title: "Location", description: "Property address" },
    { title: "Photos", description: "Upload property images" },
    { title: "Description", description: "Describe your property" },
    { title: "Kosher Amenities", description: "Nearby religious facilities" },
    { title: "Preview", description: "Review your listing" },
  ];

  const toggleAmenity = (amenity: string) => {
    const current = formData.amenities;
    if (current.includes(amenity)) {
      updateField("amenities", current.filter(a => a !== amenity));
    } else {
      updateField("amenities", [...current, amenity]);
    }
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !AMENITIES_OPTIONS.includes(trimmed) && !customAmenities.includes(trimmed)) {
      setCustomAmenities(prev => [...prev, trimmed]);
      updateField("amenities", [...formData.amenities, trimmed]);
      setCustomAmenity("");
    }
  };

  const removeCustomAmenity = (amenity: string) => {
    setCustomAmenities(prev => prev.filter(a => a !== amenity));
    updateField("amenities", formData.amenities.filter(a => a !== amenity));
  };

  const addCustomKosherAmenity = () => {
    const trimmed = customKosherAmenity.trim();
    if (trimmed && !customKosherAmenities.find(a => a.name === trimmed)) {
      setCustomKosherAmenities(prev => [...prev, { name: trimmed, checked: true }]);
      setCustomKosherAmenity("");
    }
  };

  const removeCustomKosherAmenity = (name: string) => {
    setCustomKosherAmenities(prev => prev.filter(a => a.name !== name));
  };

  const toggleCustomKosherAmenity = (name: string) => {
    setCustomKosherAmenities(prev => 
      prev.map(a => a.name === name ? { ...a, checked: !a.checked } : a)
    );
  };

  const clearErrors = () => {
    setErrors({});
  };

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (): boolean => {
    const newErrors: FormErrors = {};
    
    switch (step) {
      case 1: // Property Basics
        if (!formData.title.trim()) newErrors.title = "Property title is required";
        if (!formData.property_type) newErrors.property_type = "Property type is required";
        if (!formData.price) newErrors.price = "Price per night is required";
        else if (parseFloat(formData.price) <= 0) newErrors.price = "Price must be greater than 0";
        break;
      case 2: // Location
        if (!formData.address.trim()) newErrors.address = "Street address is required";
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.country) newErrors.country = "Country is required";
        break;
      case 3: // Photos
        if (uploadedImages.length === 0) newErrors.images = "Please upload at least one property image";
        break;
      case 4: // Description
        if (!formData.additional_information.trim()) newErrors.additional_information = "Property description is required";
        else if (formData.additional_information.length < 20) newErrors.additional_information = "Description must be at least 20 characters";
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      clearErrors();
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    clearErrors();
    setStep(step - 1);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + uploadedImages.length > 10) {
      setErrors({ images: "Maximum 10 images allowed" });
      return;
    }
    
    clearErrors();
    const newImages = [...uploadedImages, ...files];
    setUploadedImages(newImages);
    
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setImagePreviewUrls((prev) => [...prev, ...newPreviews]);
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

  const handleSubmit = async () => {
    if (!user || !validateStep()) return;

    setLoading(true);
    setErrors({});

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const token = localStorage.getItem('auth_token');

      // Step 1: Upload images
      let imageUrls: string[] = [];
      if (uploadedImages.length > 0) {
        const formDataImages = new FormData();
        uploadedImages.forEach((file) => formDataImages.append('images', file));

        const uploadResponse = await fetch(`${API_URL}/api/upload/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataImages
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload images');
        }

        const uploadData = await uploadResponse.json();
        imageUrls = uploadData.imageUrls;
      }

      // Step 2: Create property
      const propertyPayload = {
        title: formData.title,
        property_type: formData.property_type,
        bedroom_count: formData.bedroom_count,
        bathroom_count: formData.bathroom_count,
        guest_count: formData.guest_count,
        price: parseFloat(formData.price),
        currency: formData.currency,
        street_name: formData.street_name,
        house_number: formData.house_number,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        zipcode: formData.zipcode,
        map_lat: formData.map_lat || null,
        map_lng: formData.map_lng || null,
        map_address: formData.map_address || null,
        additional_luxury: formData.additional_luxury || null,
        additional_information: formData.additional_information,
        amenities: formData.amenities,
        kosher_kitchen: formData.kosher_kitchen,
        shabbos_friendly: formData.shabbos_friendly,
        nearby_shul: formData.nearby_shul,
        nearby_shul_distance: formData.nearby_shul_distance,
        nearby_kosher_shops: formData.nearby_kosher_shops,
        nearby_kosher_shops_distance: formData.nearby_kosher_shops_distance,
        nearby_mikva: formData.nearby_mikva,
        nearby_mikva_distance: formData.nearby_mikva_distance,
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create property');
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
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create property";
      setErrors({ general: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const ErrorMessage = ({ field }: { field: string }) => {
    if (!errors[field]) return null;
    return <p className="text-sm text-destructive mt-1">{errors[field]}</p>;
  };

  const GeneralError = () => {
    if (!errors.general) return null;
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{errors.general}</AlertDescription>
      </Alert>
    );
  };

  const getCountryName = (code: string) => {
    const country = COUNTRIES.find(c => c.code === code);
    return country?.name || code;
  };

  const getCurrencySymbol = () => {
    const country = COUNTRIES.find(c => c.currency === formData.currency);
    return country?.symbol || "$";
  };

  // Step 1: Property Basics (from Auth.tsx step 2)
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Property Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Beautiful Lakefront Cottage"
          className={errors.title ? "border-destructive" : ""}
        />
        <ErrorMessage field="title" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="propertyType">Property Type</Label>
        <Select
          value={formData.property_type}
          onValueChange={(value) => updateField("property_type", value)}
        >
          <SelectTrigger className={errors.property_type ? "border-destructive" : ""}>
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
            value={formData.bedroom_count}
            onChange={(e) => updateField("bedroom_count", parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input
            id="bathrooms"
            type="number"
            min="1"
            value={formData.bathroom_count}
            onChange={(e) => updateField("bathroom_count", parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxGuests">Max Guests</Label>
          <Input
            id="maxGuests"
            type="number"
            min="1"
            value={formData.guest_count}
            onChange={(e) => updateField("guest_count", parseInt(e.target.value) || 1)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select
          value={formData.currency}
          onValueChange={(value) => updateField("currency", value)}
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
        <Label htmlFor="price">Price per Night ({COUNTRIES.find(c => c.currency === formData.currency)?.symbol || "$"})</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {COUNTRIES.find(c => c.currency === formData.currency)?.symbol || "$"}
          </span>
          <Input
            id="price"
            type="number"
            min="0"
            value={formData.price}
            onChange={(e) => updateField("price", e.target.value)}
            placeholder="150"
            className={`pl-10 ${errors.price ? "border-destructive" : ""}`}
          />
        </div>
        <ErrorMessage field="price" />
      </div>
    </div>
  );

  // Step 2: Location (from Auth.tsx step 3)
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address">Street Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => updateField("address", e.target.value)}
          placeholder="123 Main Street"
          className={errors.address ? "border-destructive" : ""}
        />
        <ErrorMessage field="address" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="Lakewood"
            className={errors.city ? "border-destructive" : ""}
          />
          <ErrorMessage field="city" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => updateField("state", e.target.value)}
            placeholder="New Jersey"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select
            value={formData.country}
            onValueChange={(value) => {
              updateField("country", value);
              const country = COUNTRIES.find(c => c.code === value);
              if (country) {
                updateField("currency", country.currency);
              }
            }}
          >
            <SelectTrigger className={errors.country ? "border-destructive" : ""}>
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
            value={formData.zipcode}
            onChange={(e) => updateField("zipcode", e.target.value)}
            placeholder="08701"
          />
        </div>
      </div>
    </div>
  );

  // Step 3: Photos (from Auth.tsx step 4)
  const renderStep3 = () => (
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

  // Step 4: Description (from Auth.tsx step 5)
  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Property Description</Label>
        <Textarea
          id="description"
          value={formData.additional_information}
          onChange={(e) => updateField("additional_information", e.target.value)}
          placeholder="Describe your property in detail. Mention special features, nearby attractions, and what makes it unique..."
          className={`min-h-[120px] ${errors.additional_information ? "border-destructive" : ""}`}
        />
        <ErrorMessage field="additional_information" />
      </div>
      
      {/* <div className="space-y-2">
        <Label htmlFor="luxury">Luxury Features (Optional)</Label>
        <Textarea
          id="luxury"
          value={formData.additional_luxury}
          onChange={(e) => updateField("additional_luxury", e.target.value)}
          placeholder="List any luxury amenities or special features (e.g., pool, hot tub, chef's kitchen, etc.)"
          className="min-h-[80px]"
        />
      </div> */}

      <div className="space-y-2">
        <Label>Amenities</Label>
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES_OPTIONS.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox
                id={amenity}
                checked={formData.amenities.includes(amenity)}
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
                checked={formData.amenities.includes(amenity)}
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

  // Step 5: Kosher Amenities (from Auth.tsx step 6)
  const renderStep5 = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 p-3 bg-primary/5 rounded-lg">
        <Checkbox
          id="kosherKitchen"
          checked={formData.kosher_kitchen}
          onCheckedChange={(checked) => updateField("kosher_kitchen", checked)}
        />
        <Label htmlFor="kosherKitchen" className="cursor-pointer">
          Kosher Kitchen Available
        </Label>
      </div>
      
      <div className="flex items-center space-x-2 p-3 bg-primary/5 rounded-lg">
        <Checkbox
          id="shabbosFriendly"
          checked={formData.shabbos_friendly}
          onCheckedChange={(checked) => updateField("shabbos_friendly", checked)}
        />
        <Label htmlFor="shabbosFriendly" className="cursor-pointer">
          Shabbos Friendly
        </Label>
      </div>

      {/* Custom Kosher Amenities */}
      {customKosherAmenities.map((amenity) => (
        <div key={amenity.name} className="flex items-center space-x-2 p-3 bg-primary/5 rounded-lg group">
          <Checkbox
            id={`custom-kosher-${amenity.name}`}
            checked={amenity.checked}
            onCheckedChange={() => toggleCustomKosherAmenity(amenity.name)}
          />
          <Label htmlFor={`custom-kosher-${amenity.name}`} className="cursor-pointer flex-1">
            {amenity.name}
          </Label>
          <button
            type="button"
            onClick={() => removeCustomKosherAmenity(amenity.name)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-destructive/10"
          >
            <X className="h-4 w-4 text-destructive" />
          </button>
        </div>
      ))}

      {/* Add Custom Kosher Amenity Input */}
      <div className="flex gap-2">
        <Input
          value={customKosherAmenity}
          onChange={(e) => setCustomKosherAmenity(e.target.value)}
          placeholder="Add custom kosher amenity..."
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustomKosherAmenity();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addCustomKosherAmenity}
          disabled={!customKosherAmenity.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 pt-4">
        <h4 className="font-medium">Nearby Shul</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="nearbyShul">Shul Name</Label>
            <Input
              id="nearbyShul"
              value={formData.nearby_shul}
              onChange={(e) => updateField("nearby_shul", e.target.value)}
              placeholder="Beth Israel Synagogue"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nearbyShulDistance">Distance</Label>
            <Input
              id="nearbyShulDistance"
              value={formData.nearby_shul_distance}
              onChange={(e) => updateField("nearby_shul_distance", e.target.value)}
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
              value={formData.nearby_kosher_shops}
              onChange={(e) => updateField("nearby_kosher_shops", e.target.value)}
              placeholder="Kosher Market"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nearbyKosherShopsDistance">Distance</Label>
            <Input
              id="nearbyKosherShopsDistance"
              value={formData.nearby_kosher_shops_distance}
              onChange={(e) => updateField("nearby_kosher_shops_distance", e.target.value)}
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
              value={formData.nearby_mikva}
              onChange={(e) => updateField("nearby_mikva", e.target.value)}
              placeholder="Community Mikva"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nearbyMikvaDistance">Distance</Label>
            <Input
              id="nearbyMikvaDistance"
              value={formData.nearby_mikva_distance}
              onChange={(e) => updateField("nearby_mikva_distance", e.target.value)}
              placeholder="3 min walk"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Step 6: Preview (from Auth.tsx step 7)
  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <Eye className="h-8 w-8 mx-auto text-primary mb-2" />
        <h3 className="font-semibold text-lg">Preview Your Listing</h3>
        <p className="text-sm text-muted-foreground">Review how your property will appear to renters</p>
      </div>

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

      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold">{formData.title || "Your Property Title"}</h2>
          <p className="text-muted-foreground flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {[formData.city, formData.state, COUNTRIES.find(c => c.code === formData.country)?.name].filter(Boolean).join(", ") || formData.address || "Location"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">
            {COUNTRIES.find(c => c.currency === formData.currency)?.symbol || "$"}{formData.price || "0"}
          </p>
          <p className="text-sm text-muted-foreground">per night ({formData.currency})</p>
        </div>
      </div>

      <div className="flex gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Bed className="h-5 w-5 text-muted-foreground" />
          <span>{formData.bedroom_count} bed{formData.bedroom_count > 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <Bath className="h-5 w-5 text-muted-foreground" />
          <span>{formData.bathroom_count} bath{formData.bathroom_count > 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <span>{formData.guest_count} guest{formData.guest_count > 1 ? "s" : ""}</span>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2">About this property</h4>
        <p className="text-muted-foreground">{formData.additional_information || "No description provided"}</p>
      </div>

      {formData.additional_luxury && (
        <div>
          <h4 className="font-semibold mb-2">Luxury Features</h4>
          <p className="text-muted-foreground">{formData.additional_luxury}</p>
        </div>
      )}

      {formData.amenities.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">Amenities</h4>
          <div className="flex flex-wrap gap-2">
            {formData.amenities.map((amenity) => (
              <span key={amenity} className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      {(formData.kosher_kitchen || formData.shabbos_friendly || customKosherAmenities.filter(k => k.checked).length > 0 || formData.nearby_shul || formData.nearby_kosher_shops || formData.nearby_mikva) && (
        <div>
          <h4 className="font-semibold mb-2">Kosher Features</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {formData.kosher_kitchen && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Kosher Kitchen</span>
              </div>
            )}
            {formData.shabbos_friendly && (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Shabbos Friendly</span>
              </div>
            )}
            {customKosherAmenities.filter(k => k.checked).map((kosher, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>{kosher.name}</span>
              </div>
            ))}
            {formData.nearby_shul && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Shul: {formData.nearby_shul} ({formData.nearby_shul_distance})</span>
              </div>
            )}
            {formData.nearby_kosher_shops && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Kosher Shop: {formData.nearby_kosher_shops} ({formData.nearby_kosher_shops_distance})</span>
              </div>
            )}
            {formData.nearby_mikva && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Mikva: {formData.nearby_mikva} ({formData.nearby_mikva_distance})</span>
              </div>
            )}
          </div>
        </div>
      )}

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

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/30">
      <Header />
      <main className="flex-1 pt-20 pb-12 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link> */}

          <Card className="shadow-xl border-border">
            <CardHeader className="text-center space-y-4">
              <img src={trefLogo} alt="Tref Logo" className="h-12 mx-auto" />
              <CardTitle className="text-2xl font-bold text-primary">List Your Property</CardTitle>
              <CardDescription>
                Step {step} of {wizardSteps.length}: {wizardSteps[step - 1]?.title}
              </CardDescription>
              
              {/* Progress bar */}
              <div className="flex gap-2 pt-2">
                {wizardSteps.map((_, index) => (
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
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
              {step === 5 && renderStep5()}
              {step === 6 && renderStep6()}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={step === 1}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                {step < wizardSteps.length ? (
                  <Button
                    onClick={handleNextStep}
                    className="flex-1"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Complete Listing
                        <Check className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
