-- Create sections table
CREATE TABLE public.sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subsections table (replaces lessons but with section reference)
CREATE TABLE public.subsections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  subsection_type TEXT NOT NULL DEFAULT 'content', -- 'content' or 'quiz'
  order_index INTEGER NOT NULL,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subsections ENABLE ROW LEVEL SECURITY;

-- Create policies for sections
CREATE POLICY "Anyone can view sections" 
ON public.sections 
FOR SELECT 
USING (true);

-- Create policies for subsections
CREATE POLICY "Anyone can view subsections" 
ON public.subsections 
FOR SELECT 
USING (true);

-- Add foreign key constraint
ALTER TABLE public.sections 
ADD CONSTRAINT sections_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

ALTER TABLE public.subsections 
ADD CONSTRAINT subsections_section_id_fkey 
FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE CASCADE;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_sections_updated_at
BEFORE UPDATE ON public.sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subsections_updated_at
BEFORE UPDATE ON public.subsections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update user_progress table to reference subsections instead of lessons
ALTER TABLE public.user_progress 
ADD COLUMN subsection_id UUID;

-- Update comments table to reference subsections instead of lessons
ALTER TABLE public.comments 
ADD COLUMN subsection_id UUID;