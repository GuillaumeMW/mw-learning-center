-- Allow admins to manage courses
CREATE POLICY "Admins can manage courses" 
ON public.courses 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage sections
CREATE POLICY "Admins can manage sections" 
ON public.sections 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage subsections
CREATE POLICY "Admins can manage subsections" 
ON public.subsections 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage lessons (for backward compatibility)
CREATE POLICY "Admins can manage lessons" 
ON public.lessons 
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sections_course_id ON public.sections(course_id);
CREATE INDEX IF NOT EXISTS idx_sections_order_index ON public.sections(order_index);
CREATE INDEX IF NOT EXISTS idx_subsections_section_id ON public.subsections(section_id);
CREATE INDEX IF NOT EXISTS idx_subsections_order_index ON public.subsections(order_index);