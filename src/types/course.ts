export interface Course {
  id: string;
  title: string;
  description: string | null;
  level: number;
  is_available: boolean;
  is_coming_soon: boolean;
  created_at: string;
  updated_at: string;
  sections?: Section[];
}

export interface Section {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  subsections?: Subsection[];
}

export interface Subsection {
  id: string;
  section_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  quiz_url: string | null;
  quiz_height: number | null;
  subsection_type: 'content' | 'quiz';
  order_index: number;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
  attachments?: SubsectionAttachment[];
}

export interface SubsectionAttachment {
  id: string;
  subsection_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  order_index: number;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  lesson_id?: string; // Optional for backward compatibility
  subsection_id?: string; // New field for sections structure
  user_id: string;
  parent_comment_id?: string;
  content: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  replies?: Comment[];
}

export interface UserProgress {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id?: string | null; // Optional for backward compatibility
  subsection_id?: string | null; // New field for sections structure
  completed_at: string | null;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface CourseCompletion {
  id: string;
  user_id: string;
  course_id: string;
  completed_at: string;
  certificate_url: string | null;
}

export type CourseStatus = 'available' | 'locked' | 'coming-soon' | 'completed';