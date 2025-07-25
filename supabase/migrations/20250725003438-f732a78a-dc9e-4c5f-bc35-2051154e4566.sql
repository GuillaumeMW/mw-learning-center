-- Add exam-specific fields to courses table
ALTER TABLE public.courses 
ADD COLUMN exam_instructions TEXT,
ADD COLUMN exam_url TEXT,
ADD COLUMN exam_duration_minutes INTEGER DEFAULT 60;

-- Update existing Level 1 course with default exam content
UPDATE public.courses 
SET 
  exam_instructions = 'Please complete this certification exam to demonstrate your knowledge of the Relocation Specialist program. You have unlimited time to complete the exam, but we recommend setting aside at least 30-45 minutes for focused completion. Once you submit your responses, our team will review your submission and notify you of the results within 2-3 business days.',
  exam_url = 'https://docs.google.com/forms/d/e/1FAIpQLSdvFq7iRnUmQQ7iRnUmQQ7iRnUmQQ7iRnUmQQ7iRnUm/viewform',
  exam_duration_minutes = 45
WHERE level = 1;