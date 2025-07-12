-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  level INTEGER NOT NULL UNIQUE,
  is_available BOOLEAN NOT NULL DEFAULT false,
  is_coming_soon BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  order_index INTEGER NOT NULL,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, order_index)
);

-- Create user progress table
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id, lesson_id)
);

-- Create course completions table for tracking overall course completion
CREATE TABLE public.course_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  certificate_url TEXT,
  UNIQUE(user_id, course_id)
);

-- Enable Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses (public read access)
CREATE POLICY "Anyone can view courses" 
ON public.courses 
FOR SELECT 
USING (true);

-- RLS Policies for lessons (public read access)
CREATE POLICY "Anyone can view lessons" 
ON public.lessons 
FOR SELECT 
USING (true);

-- RLS Policies for user_progress (users can only see their own progress)
CREATE POLICY "Users can view their own progress" 
ON public.user_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress" 
ON public.user_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for course_completions (users can only see their own completions)
CREATE POLICY "Users can view their own completions" 
ON public.course_completions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own completions" 
ON public.course_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the 4 MovingWaldo Relocation Specialist courses
INSERT INTO public.courses (title, description, level, is_available, is_coming_soon) VALUES
('MovingWaldo Relocation Specialist - Level 1', 'Foundation course covering basic relocation principles and practices', 1, true, false),
('MovingWaldo Relocation Specialist - Level 2', 'Intermediate course building on Level 1 fundamentals', 2, false, true),
('MovingWaldo Relocation Specialist - Level 3', 'Advanced relocation strategies and specialized techniques', 3, false, true),
('MovingWaldo Relocation Specialist - Level 4', 'Expert-level course for senior relocation specialists', 4, false, true);

-- Create a function to check if user can access a course (sequential access)
CREATE OR REPLACE FUNCTION public.can_access_course(user_id_param UUID, course_level_param INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  -- Level 1 is always accessible (if available)
  IF course_level_param = 1 THEN
    RETURN (SELECT is_available FROM public.courses WHERE level = 1);
  END IF;
  
  -- For other levels, check if previous level is completed
  RETURN EXISTS (
    SELECT 1 FROM public.course_completions cc
    JOIN public.courses c ON cc.course_id = c.id
    WHERE cc.user_id = user_id_param 
    AND c.level = course_level_param - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;