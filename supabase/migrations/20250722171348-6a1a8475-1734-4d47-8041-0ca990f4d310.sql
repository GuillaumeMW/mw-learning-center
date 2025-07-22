-- Create new enum types
CREATE TYPE public.app_employment_status AS ENUM (
  'employed',
  'self_employed', 
  'student',
  'unemployed',
  'other'
);

CREATE TYPE public.app_occupation AS ENUM (
  'Real Estate Agent',
  'Mortgage Broker',
  'Home Stager',
  'Property Manager',
  'Insurance Broker',
  'Interior Designer',
  'Professional Organizer',
  'Concierge / Lifestyle Manager',
  'Virtual Assistant',
  'Customer Service Representative',
  'Sales Representative',
  'Freelancer / Self-Employed',
  'Relocation Specialist / Retired Mover',
  'Retired Professional',
  'Student',
  'Stay-at-Home Parent',
  'Hospitality Worker (e.g., hotel, Airbnb host)',
  'Event Planner',
  'Social Worker / Community Support',
  'Construction / Renovation Worker',
  'None of the Above – Other'
);

-- Alter the profiles table
ALTER TABLE public.profiles 
  -- Remove existing address column
  DROP COLUMN IF EXISTS address,
  
  -- Add new address fields
  ADD COLUMN address_line1 TEXT NOT NULL DEFAULT '',
  ADD COLUMN address_line2 TEXT,
  ADD COLUMN city TEXT NOT NULL DEFAULT '',
  ADD COLUMN province_state TEXT NOT NULL DEFAULT '',
  ADD COLUMN postal_code TEXT NOT NULL DEFAULT '',
  ADD COLUMN country TEXT NOT NULL DEFAULT 'Canada',
  
  -- Add new contact field
  ADD COLUMN phone_number TEXT,
  
  -- Add new business area fields
  ADD COLUMN service_regions TEXT[],
  ADD COLUMN languages_spoken TEXT[],
  
  -- Add new occupation field
  ADD COLUMN occupation app_occupation;

-- Update employment_status column to use the new enum
-- First, update any existing data to match enum values or set to 'other'
UPDATE public.profiles 
SET employment_status = 'other' 
WHERE employment_status IS NOT NULL 
  AND employment_status NOT IN ('employed', 'self_employed', 'student', 'unemployed', 'other');

-- Change the column type to use the enum
ALTER TABLE public.profiles 
  ALTER COLUMN employment_status TYPE app_employment_status 
  USING CASE 
    WHEN employment_status IN ('employed', 'self_employed', 'student', 'unemployed', 'other') 
    THEN employment_status::app_employment_status
    ELSE 'other'::app_employment_status
  END;

-- Set default for employment_status if it doesn't have one
ALTER TABLE public.profiles 
  ALTER COLUMN employment_status SET DEFAULT 'other'::app_employment_status;