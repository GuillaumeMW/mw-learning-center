export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  address: string | null;
  employment_status: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'student' | 'admin';
  created_at: string;
}

export type AppRole = 'student' | 'admin';