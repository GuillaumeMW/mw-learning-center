-- Make lesson_id nullable in comments table to support both old lessons and new subsections
ALTER TABLE public.comments 
ALTER COLUMN lesson_id DROP NOT NULL;