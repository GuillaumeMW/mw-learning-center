export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  province_state: string;
  postal_code: string;
  country: string;
  employment_status: 'employed' | 'self_employed' | 'student' | 'unemployed' | 'other';
  occupation: 'Real Estate Agent' | 'Mortgage Broker' | 'Home Stager' | 'Property Manager' | 'Insurance Broker' | 'Interior Designer' | 'Professional Organizer' | 'Concierge / Lifestyle Manager' | 'Virtual Assistant' | 'Customer Service Representative' | 'Sales Representative' | 'Freelancer / Self-Employed' | 'Relocation Specialist / Retired Mover' | 'Retired Professional' | 'Student' | 'Stay-at-Home Parent' | 'Hospitality Worker (e.g., hotel, Airbnb host)' | 'Event Planner' | 'Social Worker / Community Support' | 'Construction / Renovation Worker' | 'None of the Above – Other' | null;
  service_regions: string[] | null;
  languages_spoken: string[] | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SignUpData {
  first_name: string;
  last_name: string;
  phone_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province_state?: string;
  postal_code?: string;
  country?: string;
  employment_status?: 'employed' | 'self_employed' | 'student' | 'unemployed' | 'other';
  occupation?: 'Real Estate Agent' | 'Mortgage Broker' | 'Home Stager' | 'Property Manager' | 'Insurance Broker' | 'Interior Designer' | 'Professional Organizer' | 'Concierge / Lifestyle Manager' | 'Virtual Assistant' | 'Customer Service Representative' | 'Sales Representative' | 'Freelancer / Self-Employed' | 'Relocation Specialist / Retired Mover' | 'Retired Professional' | 'Student' | 'Stay-at-Home Parent' | 'Hospitality Worker (e.g., hotel, Airbnb host)' | 'Event Planner' | 'Social Worker / Community Support' | 'Construction / Renovation Worker' | 'None of the Above – Other';
  service_regions?: string[];
  languages_spoken?: string[];
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'student' | 'admin';
  created_at: string;
}

export type AppRole = 'student' | 'admin';