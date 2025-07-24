-- Fix the app_workflow_step enum to have the correct order
-- First remove the default constraint
ALTER TABLE public.certification_workflows ALTER COLUMN current_step DROP DEFAULT;

-- Rename existing enum
ALTER TYPE public.app_workflow_step RENAME TO app_workflow_step_old;

-- Create new enum with correct order
CREATE TYPE public.app_workflow_step AS ENUM (
  'exam',
  'approval', 
  'contract',
  'payment',
  'completed'
);

-- Update the table to use the new enum
ALTER TABLE public.certification_workflows 
ALTER COLUMN current_step TYPE public.app_workflow_step 
USING current_step::text::public.app_workflow_step;

-- Set the new default
ALTER TABLE public.certification_workflows 
ALTER COLUMN current_step SET DEFAULT 'exam'::public.app_workflow_step;

-- Drop the old enum
DROP TYPE public.app_workflow_step_old;