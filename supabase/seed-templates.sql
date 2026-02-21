-- Seed Templates for Lovable Clone
-- Run this after templates-schema.sql

-- Note: Replace 'YOUR_ADMIN_USER_ID' with actual admin user ID from profiles table

-- 1. Simple Todo App
INSERT INTO public.templates (id, name, description, category, tags, is_official, author_id) VALUES
('11111111-1111-1111-1111-111111111111', 
 'Simple Todo App', 
 'A clean and minimal todo application with add, complete, and delete functionality. Perfect for learning the basics.',
 'app',
 ARRAY['beginner', 'todo', 'react', 'tailwind'],
 true,
 NULL);

-- 2. SaaS Landing Page
INSERT INTO public.templates (id, name, description, category, tags, is_official) VALUES
('22222222-2222-2222-2222-222222222222',
 'SaaS Landing Page',
 'Modern landing page with hero section, features, pricing tables, testimonials, and CTA. Fully responsive.',
 'landing',
 ARRAY['landing', 'saas', 'marketing', 'responsive'],
 true);

-- 3. Dashboard Analytics
INSERT INTO public.templates (id, name, description, category, tags, is_official) VALUES
('33333333-3333-3333-3333-333333333333',
 'Analytics Dashboard',
 'Professional analytics dashboard with charts, stats cards, and data tables. Uses mock data.',
 'dashboard',
 ARRAY['dashboard', 'analytics', 'charts', 'business'],
 true);

-- 4. Portfolio Website
INSERT INTO public.templates (id, name, description, category, tags, is_official) VALUES
('44444444-4444-4444-4444-444444444444',
 'Portfolio Website',
 'Personal portfolio with projects showcase, about section, skills, and contact form. Perfect for developers and designers.',
 'landing',
 ARRAY['portfolio', 'personal', 'showcase', 'creative'],
 true);

-- 5. E-commerce Product Page
INSERT INTO public.templates (id, name, description, category, tags, is_official) VALUES
('55555555-5555-5555-5555-555555555555',
 'E-commerce Product Page',
 'Product detail page with image gallery, size/color selection, add to cart, and reviews section.',
 'app',
 ARRAY['ecommerce', 'product', 'shopping', 'retail'],
 true);

-- 6. Blog Template
INSERT INTO public.templates (id, name, description, category, tags, is_official) VALUES
('66666666-6666-6666-6666-666666666666',
 'Modern Blog',
 'Clean blog layout with post grid, categories, search, and reading progress. Markdown ready.',
 'app',
 ARRAY['blog', 'content', 'writing', 'markdown'],
 true);

-- 7. Login/Signup Form
INSERT INTO public.templates (id, name, description, category, tags, is_official) VALUES
('77777777-7777-7777-7777-777777777777',
 'Auth Forms Component',
 'Beautiful login and signup forms with validation, password strength meter, and social auth buttons.',
 'component',
 ARRAY['auth', 'forms', 'validation', 'component'],
 true);

-- 8. Pricing Page
INSERT INTO public.templates (id, name, description, category, tags, is_official) VALUES
('88888888-8888-8888-8888-888888888888',
 'Pricing Plans Page',
 'Modern pricing page with 3-tier plan comparison, feature toggles, and FAQ section.',
 'landing',
 ARRAY['pricing', 'subscription', 'saas', 'monetization'],
 true);

-- 9. Contact Form
INSERT INTO public.templates (id, name, description, category, tags, is_official) VALUES
('99999999-9999-9999-9999-999999999999',
 'Contact Page',
 'Professional contact page with form validation, map integration placeholder, and business info.',
 'landing',
 ARRAY['contact', 'form', 'communication', 'business'],
 true);

-- 10. Admin Dashboard
INSERT INTO public.templates (id, name, description, category, tags, is_official) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
 'Admin Dashboard',
 'Full admin dashboard with sidebar navigation, user management table, and system stats.',
 'dashboard',
 ARRAY['admin', 'management', 'table', 'crud'],
 true);

-- 11. Weather App
INSERT INTO public.templates (id, name, description, category, tags, is_official) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 'Weather Dashboard',
 'Beautiful weather app with current conditions, 7-day forecast, and location search. Uses mock data.',
 'app',
 ARRAY['weather', 'api', 'forecast', 'data'],
 true);

-- 12. Calculator
INSERT INTO public.templates (id, name, description, category, tags, is_official) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc',
 'Calculator App',
 'Sleek calculator with basic operations, memory functions, and keyboard support.',
 'app',
 ARRAY['calculator', 'utility', 'math', 'tool'],
 true);

-- 13. Timer/Stopwatch
INSERT INTO public.templates (id, name, description, category, tags, is_official) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd',
 'Timer & Stopwatch',
 'Dual-mode timer and stopwatch with lap recording, pause/resume, and visual countdown.',
 'app',
 ARRAY['timer', 'stopwatch', 'productivity', 'utility'],
 true);

-- 14. FAQ Page
INSERT INTO public.templates (id, name, description, category, tags, is_official) VALUES
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
 'FAQ Page',
 'Expandable FAQ with categories, search functionality, and smooth animations.',
 'landing',
 ARRAY['faq', 'help', 'support', 'accordion'],
 true);

-- 15. Coming Soon Page
INSERT INTO public.templates (id, name, description, category, tags, is_official) VALUES
('ffffffff-ffff-ffff-ffff-ffffffffffff',
 'Coming Soon Page',
 'Eye-catching coming soon page with countdown timer and email signup form.',
 'landing',
 ARRAY['coming-soon', 'launch', 'marketing', 'countdown'],
 true);

-- Update timestamps
UPDATE public.templates SET created_at = NOW(), updated_at = NOW();

COMMENT ON TABLE public.templates IS 'Contains 15 official starter templates ready to use';
