-- Fix the app_workflow_step enum to have the correct order
-- Drop and recreate the enum with correct values
ALTER TYPE public.app_workflow_step RENAME TO app_workflow_step_old;

CREATE TYPE public.app_workflow_step AS ENUM (
  'exam',
  'approval', 
  'contract',
  'payment',
  'completed'
);

-- Update the certification_workflows table to use the new enum
ALTER TABLE public.certification_workflows 
ALTER COLUMN current_step TYPE public.app_workflow_step 
USING current_step::text::public.app_workflow_step;

-- Drop the old enum
DROP TYPE public.app_workflow_step_old;