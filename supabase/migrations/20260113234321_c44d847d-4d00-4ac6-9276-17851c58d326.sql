-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests_count INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  guest_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create host_messages table for questions to hosts
CREATE TABLE public.host_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sender_id UUID,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_messages ENABLE ROW LEVEL SECURITY;

-- Bookings policies
CREATE POLICY "Guests can view their own bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = guest_id);

CREATE POLICY "Owners can view bookings for their properties"
ON public.bookings FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Owners can update booking status"
ON public.bookings FOR UPDATE
USING (auth.uid() = owner_id);

-- Host messages policies
CREATE POLICY "Anyone can send messages to hosts"
ON public.host_messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Senders can view their own messages"
ON public.host_messages FOR SELECT
USING (auth.uid() = sender_id OR sender_email IS NOT NULL);

CREATE POLICY "Property owners can view messages for their properties"
ON public.host_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = host_messages.property_id 
  AND properties.owner_id = auth.uid()
));

CREATE POLICY "Property owners can reply to messages"
ON public.host_messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM properties 
  WHERE properties.id = host_messages.property_id 
  AND properties.owner_id = auth.uid()
));

-- Add trigger for updated_at on bookings
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();