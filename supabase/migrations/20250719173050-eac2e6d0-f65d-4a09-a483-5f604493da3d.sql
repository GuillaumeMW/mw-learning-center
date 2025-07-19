
-- Add quiz_url field to subsections table for dedicated quiz URL storage
ALTER TABLE public.subsections 
ADD COLUMN quiz_url TEXT;

-- Add a comment to document the new field
COMMENT ON COLUMN public.subsections.quiz_url IS 'URL for embedded quiz forms (e.g., Google Forms) when subsection_type is quiz';
