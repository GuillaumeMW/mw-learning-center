-- Create a storage bucket for subsection PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('subsection-pdfs', 'subsection-pdfs', true);

-- Create policies for the subsection-pdfs bucket
CREATE POLICY "Admins can upload PDFs" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'subsection-pdfs' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update PDFs" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'subsection-pdfs' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete PDFs" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'subsection-pdfs' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone can view PDFs" ON storage.objects 
FOR SELECT USING (bucket_id = 'subsection-pdfs');

-- Create subsection_attachments table for multiple PDFs per subsection
CREATE TABLE public.subsection_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subsection_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on subsection_attachments table
ALTER TABLE public.subsection_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for subsection_attachments
CREATE POLICY "Anyone can view attachments" ON public.subsection_attachments
FOR SELECT USING (true);

CREATE POLICY "Admins can manage attachments" ON public.subsection_attachments
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_subsection_attachments_updated_at
BEFORE UPDATE ON public.subsection_attachments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();