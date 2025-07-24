-- Create enum types for certification workflow
CREATE TYPE public.app_exam_status AS ENUM (
  'pending_submission',
  'submitted', 
  'pending_review',
  'passed',
  'failed'
);

CREATE TYPE public.app_contract_status AS ENUM (
  'not_required',
  'pending_signing',
  'signed',
  'rejected'
);

CREATE TYPE public.app_subscription_status AS ENUM (
  'not_required',
  'pending_payment',
  'paid',
  'cancelled'
);

CREATE TYPE public.app_admin_approval_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

CREATE TYPE public.app_workflow_step AS ENUM (
  'exam',
  'contract',
  'payment',
  'approval',
  'completed'
);

-- Create certification_workflows table
CREATE TABLE public.certification_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  exam_status public.app_exam_status NOT NULL DEFAULT 'pending_submission',
  exam_submission_url TEXT,
  exam_results_json JSONB,
  contract_status public.app_contract_status NOT NULL DEFAULT 'not_required',
  contract_doc_url TEXT,
  subscription_status public.app_subscription_status NOT NULL DEFAULT 'not_required',
  stripe_checkout_session_id TEXT,
  admin_approval_status public.app_admin_approval_status NOT NULL DEFAULT 'pending',
  current_step public.app_workflow_step NOT NULL DEFAULT 'exam',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to ensure one certification workflow per user per level
ALTER TABLE public.certification_workflows 
ADD CONSTRAINT unique_user_level UNIQUE (user_id, level);

-- Enable Row Level Security
ALTER TABLE public.certification_workflows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own certification workflows"
ON public.certification_workflows
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certification workflows"
ON public.certification_workflows
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certification workflows"
ON public.certification_workflows
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all certification workflows"
ON public.certification_workflows
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for automatic updated_at timestamp
CREATE TRIGGER update_certification_workflows_updated_at
BEFORE UPDATE ON public.certification_workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();