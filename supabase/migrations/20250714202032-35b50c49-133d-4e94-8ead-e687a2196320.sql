-- Add missing indexes for performance optimization

-- Index for comments by subsection_id (used in CommentThread)
CREATE INDEX IF NOT EXISTS idx_comments_subsection_id ON public.comments(subsection_id);

-- Index for comments by lesson_id (backward compatibility)
CREATE INDEX IF NOT EXISTS idx_comments_lesson_id ON public.comments(lesson_id);

-- Composite index for user progress lookup by user and subsection
CREATE INDEX IF NOT EXISTS idx_user_progress_user_subsection ON public.user_progress(user_id, subsection_id);

-- Composite index for user progress lookup by user and course
CREATE INDEX IF NOT EXISTS idx_user_progress_user_course ON public.user_progress(user_id, course_id);

-- Composite index for subsections by section and order (used for navigation)
CREATE INDEX IF NOT EXISTS idx_subsections_section_order ON public.subsections(section_id, order_index);

-- Composite index for sections by course and order
CREATE INDEX IF NOT EXISTS idx_sections_course_order ON public.sections(course_id, order_index);

-- Index for profiles by user_id (used in comment author lookup)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);