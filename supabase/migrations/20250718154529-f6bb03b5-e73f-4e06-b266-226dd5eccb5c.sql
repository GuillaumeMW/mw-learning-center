-- First, delete existing content in correct order (due to foreign key constraints)
DELETE FROM public.subsections;
DELETE FROM public.sections;
DELETE FROM public.courses;

-- Insert the new course
INSERT INTO public.courses (id, title, description, level, is_available, is_coming_soon)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Complete Course', 'A comprehensive course covering all topics', 1, true, false);

-- Insert sections
INSERT INTO public.sections (id, course_id, title, description, order_index) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Introduction', 'Getting started with the basics', 1),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Fundamentals', 'Core concepts and principles', 2),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Advanced Topics', 'Deep dive into complex subjects', 3),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Practical Applications', 'Real-world implementation', 4),
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'Expert Techniques', 'Advanced methodologies', 5),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440000', 'Case Studies', 'Real examples and analysis', 6),
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440000', 'Best Practices', 'Industry standards and guidelines', 7),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440000', 'Tools and Resources', 'Essential tools and references', 8),
('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440000', 'Project Work', 'Hands-on project development', 9),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'Conclusion', 'Final thoughts and next steps', 10);

-- Insert all subsections
INSERT INTO public.subsections (id, section_id, title, content, video_url, subsection_type, order_index, duration_minutes) VALUES
-- Introduction section subsections
('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Welcome', 'Welcome to the course! This introduction will help you understand what we''ll cover.', 'https://example.com/video1', 'content', 1, 10),
('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'Course Overview', 'Overview of the entire course structure and learning objectives.', 'https://example.com/video2', 'content', 2, 15),
('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440001', 'Prerequisites', 'What you need to know before starting this course.', NULL, 'content', 3, 5),
('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440001', 'Getting Started', 'Setting up your environment and tools.', 'https://example.com/video3', 'content', 4, 20),
('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440001', 'Introduction Quiz', 'Test your understanding of the introduction material.', NULL, 'quiz', 5, 10),

-- Fundamentals section subsections
('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440002', 'Basic Concepts', 'Understanding the fundamental concepts and terminology.', 'https://example.com/video4', 'content', 1, 25),
('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440002', 'Core Principles', 'The main principles that guide our approach.', 'https://example.com/video5', 'content', 2, 30),
('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440002', 'First Steps', 'Your first practical steps in the subject.', 'https://example.com/video6', 'content', 3, 35),
('550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440002', 'Common Mistakes', 'Avoiding typical beginner errors.', NULL, 'content', 4, 15),
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440002', 'Practice Exercise', 'Hands-on practice with the fundamentals.', NULL, 'content', 5, 40),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', 'Fundamentals Quiz', 'Test your understanding of fundamental concepts.', NULL, 'quiz', 6, 15),

-- Advanced Topics section subsections
('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', 'Complex Concepts', 'Diving deeper into advanced theoretical concepts.', 'https://example.com/video7', 'content', 1, 45),
('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440003', 'Advanced Techniques', 'Sophisticated methods and approaches.', 'https://example.com/video8', 'content', 2, 50),
('550e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440003', 'Expert Insights', 'Insights from industry experts and thought leaders.', 'https://example.com/video9', 'content', 3, 35),
('550e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440003', 'Research Methods', 'Advanced research and analysis techniques.', NULL, 'content', 4, 30),
('550e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440003', 'Case Analysis', 'Analyzing complex real-world cases.', 'https://example.com/video10', 'content', 5, 55),
('550e8400-e29b-41d4-a716-446655440027', '550e8400-e29b-41d4-a716-446655440003', 'Advanced Quiz', 'Challenge yourself with advanced questions.', NULL, 'quiz', 6, 20),

-- Practical Applications section subsections
('550e8400-e29b-41d4-a716-446655440028', '550e8400-e29b-41d4-a716-446655440004', 'Real-World Examples', 'Practical examples from various industries.', 'https://example.com/video11', 'content', 1, 40),
('550e8400-e29b-41d4-a716-446655440029', '550e8400-e29b-41d4-a716-446655440004', 'Implementation Strategies', 'How to implement concepts in practice.', 'https://example.com/video12', 'content', 2, 45),
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440004', 'Problem Solving', 'Systematic approaches to solving problems.', NULL, 'content', 3, 30),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440004', 'Team Collaboration', 'Working effectively with teams and stakeholders.', 'https://example.com/video13', 'content', 4, 25),
('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440004', 'Quality Assurance', 'Ensuring high-quality outcomes in your work.', NULL, 'content', 5, 20),
('550e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440004', 'Practical Quiz', 'Apply your knowledge to practical scenarios.', NULL, 'quiz', 6, 25),

-- Expert Techniques section subsections
('550e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440005', 'Cutting-Edge Methods', 'The latest techniques and methodologies.', 'https://example.com/video14', 'content', 1, 60),
('550e8400-e29b-41d4-a716-446655440035', '550e8400-e29b-41d4-a716-446655440005', 'Innovation Strategies', 'Approaches to innovation and creative thinking.', 'https://example.com/video15', 'content', 2, 50),
('550e8400-e29b-41d4-a716-446655440036', '550e8400-e29b-41d4-a716-446655440005', 'Advanced Analytics', 'Sophisticated data analysis and interpretation.', NULL, 'content', 3, 45),
('550e8400-e29b-41d4-a716-446655440037', '550e8400-e29b-41d4-a716-446655440005', 'Optimization Techniques', 'Methods for optimizing processes and outcomes.', 'https://example.com/video16', 'content', 4, 40),
('550e8400-e29b-41d4-a716-446655440038', '550e8400-e29b-41d4-a716-446655440005', 'Future Trends', 'Emerging trends and future directions.', NULL, 'content', 5, 35),
('550e8400-e29b-41d4-a716-446655440039', '550e8400-e29b-41d4-a716-446655440005', 'Expert Quiz', 'Master-level questions for expert practitioners.', NULL, 'quiz', 6, 30),

-- Case Studies section subsections
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440006', 'Industry Case Study 1', 'Detailed analysis of a successful implementation.', 'https://example.com/video17', 'content', 1, 50),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440006', 'Industry Case Study 2', 'Learning from challenges and setbacks.', 'https://example.com/video18', 'content', 2, 45),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440006', 'Comparative Analysis', 'Comparing different approaches and outcomes.', NULL, 'content', 3, 40),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440006', 'Lessons Learned', 'Key takeaways from multiple case studies.', 'https://example.com/video19', 'content', 4, 35),
('550e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440006', 'Case Study Exercise', 'Analyze your own case study scenario.', NULL, 'content', 5, 60),
('550e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440006', 'Case Study Quiz', 'Test your analytical skills with case scenarios.', NULL, 'quiz', 6, 25),

-- Best Practices section subsections
('550e8400-e29b-41d4-a716-446655440046', '550e8400-e29b-41d4-a716-446655440007', 'Industry Standards', 'Understanding and applying industry standards.', 'https://example.com/video20', 'content', 1, 30),
('550e8400-e29b-41d4-a716-446655440047', '550e8400-e29b-41d4-a716-446655440007', 'Quality Guidelines', 'Guidelines for maintaining high quality work.', NULL, 'content', 2, 25),
('550e8400-e29b-41d4-a716-446655440048', '550e8400-e29b-41d4-a716-446655440007', 'Ethical Considerations', 'Ethical frameworks and decision-making.', 'https://example.com/video21', 'content', 3, 35),
('550e8400-e29b-41d4-a716-446655440049', '550e8400-e29b-41d4-a716-446655440007', 'Continuous Improvement', 'Methods for ongoing learning and development.', NULL, 'content', 4, 30),
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440007', 'Documentation Standards', 'Best practices for documentation and reporting.', 'https://example.com/video22', 'content', 5, 20),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440007', 'Best Practices Quiz', 'Evaluate your understanding of best practices.', NULL, 'quiz', 6, 15),

-- Tools and Resources section subsections
('550e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440008', 'Essential Tools', 'Overview of must-have tools and software.', 'https://example.com/video23', 'content', 1, 40),
('550e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440008', 'Resource Library', 'Building your personal resource collection.', NULL, 'content', 2, 25),
('550e8400-e29b-41d4-a716-446655440054', '550e8400-e29b-41d4-a716-446655440008', 'Online Communities', 'Connecting with professional communities.', 'https://example.com/video24', 'content', 3, 20),
('550e8400-e29b-41d4-a716-446655440055', '550e8400-e29b-41d4-a716-446655440008', 'Learning Resources', 'Additional resources for continued learning.', NULL, 'content', 4, 30),
('550e8400-e29b-41d4-a716-446655440056', '550e8400-e29b-41d4-a716-446655440008', 'Tool Comparison', 'Comparing different tools and their applications.', 'https://example.com/video25', 'content', 5, 35),
('550e8400-e29b-41d4-a716-446655440057', '550e8400-e29b-41d4-a716-446655440008', 'Tools Quiz', 'Test your knowledge of tools and resources.', NULL, 'quiz', 6, 20),

-- Project Work section subsections
('550e8400-e29b-41d4-a716-446655440058', '550e8400-e29b-41d4-a716-446655440009', 'Project Planning', 'How to plan and structure your projects.', 'https://example.com/video26', 'content', 1, 45),
('550e8400-e29b-41d4-a716-446655440059', '550e8400-e29b-41d4-a716-446655440009', 'Project Execution', 'Best practices for project implementation.', 'https://example.com/video27', 'content', 2, 50),
('550e8400-e29b-41d4-a716-446655440060', '550e8400-e29b-41d4-a716-446655440009', 'Project Management', 'Managing timelines, resources, and stakeholders.', NULL, 'content', 3, 40),
('550e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440009', 'Risk Management', 'Identifying and mitigating project risks.', 'https://example.com/video28', 'content', 4, 35),
('550e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440009', 'Project Evaluation', 'Measuring success and learning from outcomes.', NULL, 'content', 5, 30),
('550e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440009', 'Project Quiz', 'Apply project management concepts.', NULL, 'quiz', 6, 25),

-- Conclusion section subsections
('550e8400-e29b-41d4-a716-446655440064', '550e8400-e29b-41d4-a716-446655440010', 'Course Summary', 'Review of all major topics covered in the course.', 'https://example.com/video29', 'content', 1, 30),
('550e8400-e29b-41d4-a716-446655440065', '550e8400-e29b-41d4-a716-446655440010', 'Key Takeaways', 'The most important lessons and insights.', NULL, 'content', 2, 20),
('550e8400-e29b-41d4-a716-446655440066', '550e8400-e29b-41d4-a716-446655440010', 'Next Steps', 'Where to go from here and continue learning.', 'https://example.com/video30', 'content', 3, 25),
('550e8400-e29b-41d4-a716-446655440067', '550e8400-e29b-41d4-a716-446655440010', 'Final Assessment', 'Comprehensive final assessment of your learning.', NULL, 'quiz', 4, 45);