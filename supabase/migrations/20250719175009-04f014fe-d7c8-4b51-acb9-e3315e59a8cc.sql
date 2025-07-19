-- Add quiz_height field to subsections table for storing custom quiz heights
ALTER TABLE public.subsections 
ADD COLUMN quiz_height INTEGER DEFAULT 800;

-- Add a comment to document the new field
COMMENT ON COLUMN public.subsections.quiz_height IS 'Height in pixels for embedded quiz iframes (used when subsection_type is quiz)';