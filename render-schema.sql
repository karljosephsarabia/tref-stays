-- Standalone PostgreSQL schema for Render (without Supabase dependencies)

-- Create users table (replacing auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  encrypted_password TEXT,
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('renter', 'owner');

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  max_guests INTEGER DEFAULT 2,
  price_per_night DECIMAL(10,2),
  square_feet INTEGER,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  zipcode TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  amenities TEXT[] DEFAULT '{}',
  nearby_shul TEXT,
  nearby_shul_distance TEXT,
  nearby_kosher_shops TEXT,
  nearby_kosher_shops_distance TEXT,
  nearby_mikva TEXT,
  nearby_mikva_distance TEXT,
  kosher_kitchen BOOLEAN DEFAULT FALSE,
  shabbos_friendly BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create property_images table
CREATE TABLE IF NOT EXISTS public.property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for testing
INSERT INTO public.properties (title, description, property_type, bedrooms, bathrooms, max_guests, price_per_night, square_feet, city, state, country, status, kosher_kitchen, shabbos_friendly)
VALUES 
  ('Kosher Luxury Villa', 'Beautiful villa with fully kosher kitchen and walking distance to shul', 'villa', 4, 3, 8, 350.00, 2500, 'Miami Beach', 'FL', 'USA', 'approved', true, true),
  ('Shabbos-Friendly Apartment', 'Modern apartment with timer switches and nearby eruv', 'apartment', 2, 2, 4, 180.00, 1200, 'Brooklyn', 'NY', 'USA', 'approved', true, true),
  ('Lakeside Cottage', 'Peaceful cottage near kosher restaurants and mikva', 'cottage', 3, 2, 6, 220.00, 1800, 'Monsey', 'NY', 'USA', 'approved', true, true);

COMMENT ON TABLE public.properties IS 'Properties available for rent on Tref Stays';
