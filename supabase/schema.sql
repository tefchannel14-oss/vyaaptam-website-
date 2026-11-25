-- ==============================================================================
-- VYAAPTAM FULL-STACK DATABASE SCHEMA (Supabase PostgreSQL)
-- ==============================================================================
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- This sets up the leads pipeline, audit logs, RLS policies, and initial sample data.

-- 1. Enable UUID generator
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create LEADS Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name VARCHAR(100) NOT NULL,
    company VARCHAR(120),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    service VARCHAR(100),
    budget VARCHAR(50),
    message TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'new' NOT NULL 
        CHECK (status IN ('new', 'contacted', 'proposal_sent', 'won', 'lost')),
    notes TEXT,
    source_page VARCHAR(255),
    ip_address TEXT,
    user_agent TEXT
);

-- 3. Create LEAD ACTIVITY LOG Table (History & Notes)
CREATE TABLE IF NOT EXISTS public.lead_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details TEXT
);

-- 4. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_service ON public.leads (service);

-- 5. Auto-update `updated_at` Timestamp Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_leads_updated_at ON public.leads;
CREATE TRIGGER set_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Configure Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activity_log ENABLE ROW LEVEL SECURITY;

-- Policy A: Service role (Netlify Functions) has full access
-- Supabase service_role key automatically bypasses RLS in backend functions.

-- Policy B: Authenticated Admin Users (Supabase Auth) have full CRUD access
DROP POLICY IF EXISTS "Admins have full access to leads" ON public.leads;
CREATE POLICY "Admins have full access to leads"
    ON public.leads FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access to lead activity" ON public.lead_activity_log;
CREATE POLICY "Admins have full access to lead activity"
    ON public.lead_activity_log FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 7. Seed Initial Sample Data (for instant verification)
INSERT INTO public.leads (name, company, email, phone, service, budget, message, status, notes, source_page)
VALUES 
    (
        'Riddhi Shah', 
        'Shah Interiors', 
        'riddhi@shahinteriors.in', 
        '+91 98250 12345', 
        'Social Media Marketing', 
        '₹10k – ₹25k', 
        'We want regular reels and interior design portfolio management for Ahmedabad clients.', 
        'new', 
        'Follow up requested via WhatsApp',
        '/'
    ),
    (
        'Imran Qureshi', 
        'Qureshi Rice Traders', 
        'imran@qureshirice.com', 
        '+91 94260 54321', 
        'GST & ITR Filing', 
        '₹10k – ₹25k', 
        'Looking for quarterly GST return filing and annual business ITR audit assistance.', 
        'new', 
        'Scheduled call for tomorrow 11 AM',
        '/services/gst-itr'
    ),
    (
        'Tanvi Mehta', 
        'Bloom Yoga Studio', 
        'tanvi@bloomyoga.in', 
        '+91 98980 98765', 
        'WordPress Websites', 
        '₹10k – ₹25k', 
        'Need modern responsive website with class booking schedule and WhatsApp chat.', 
        'contacted', 
        'Spoke with Tanvi. Sent website portfolio demo.',
        '/services/wordpress-development'
    ),
    (
        'Kunal Parikh', 
        'Parikh Agro Exports', 
        'kunal@parikhagro.com', 
        '+91 97120 67890', 
        'PPC & Performance Ads', 
        '₹50k+', 
        'B2B export leads needed for agricultural machinery via Google Ads & LinkedIn.', 
        'proposal_sent', 
        'Sent proposal for ₹65,000 / month retainer on Monday.',
        '/contact'
    ),
    (
        'Dr. Krupa Joshi',
        'Smile Studio Dental',
        'krupa@smilestudio.in',
        '+91 98240 11223',
        'Search Engine Optimisation',
        '₹25k – ₹50k',
        'Local SEO and Google Maps ranking for dental clinic in Maninagar.',
        'won',
        'Signed 6-month local SEO agreement.',
        '/services/seo'
    )
ON CONFLICT DO NOTHING;


-- ==============================================================================
-- 8. CMS: SERVICES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(80) NOT NULL,
    tagline VARCHAR(255),
    price_from VARCHAR(100),
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Allow admin full access on services" ON public.services FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 9. CMS: BLOG POSTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(80) NOT NULL,
    author VARCHAR(100) DEFAULT 'Vyaaptam Team',
    published_date VARCHAR(60),
    read_time VARCHAR(40) DEFAULT '5 min read',
    excerpt TEXT,
    content TEXT,
    image_url VARCHAR(255),
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    is_published BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TRIGGER update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on blogs" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "Allow admin full access on blogs" ON public.blog_posts FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 10. CMS: SEO PAGES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.seo_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    route VARCHAR(100) UNIQUE NOT NULL,
    page_name VARCHAR(100) NOT NULL,
    meta_title VARCHAR(255) NOT NULL,
    meta_description TEXT NOT NULL,
    og_title VARCHAR(255),
    og_description TEXT,
    og_image VARCHAR(255),
    keywords TEXT,
    canonical_url VARCHAR(255)
);

CREATE TRIGGER update_seo_pages_updated_at
    BEFORE UPDATE ON public.seo_pages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.seo_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on seo_pages" ON public.seo_pages FOR SELECT USING (true);
CREATE POLICY "Allow admin full access on seo_pages" ON public.seo_pages FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 11. INITIAL SEED DATA FOR SERVICES, BLOGS & SEO PAGES
-- ==============================================================================
INSERT INTO public.services (slug, title, category, tagline, price_from, description, meta_title, meta_description)
VALUES
    ('seo', 'Search Engine Optimisation', 'Digital Marketing', 'Rank for the searches your customers type every day.', 'From ₹7,499 / month', 'Dominate Google rankings with data-driven keyword research, technical on-page fixes, schema markup, and authoritative white-hat local citations in Ahmedabad.', 'Best SEO Services in Ahmedabad | Vyaaptam Digital', 'Grow organic traffic and Google Map rankings with Ahmedabad leading SEO agency. Transparent reporting and proven ROI.'),
    ('social-media-marketing', 'Social Media Marketing', 'Digital Marketing', 'A feed people follow — and a page that sells.', 'From ₹9,999 / month', 'Build loyal brand followers with custom viral reels, carousel designs, community engagement, and influencer outreach across Instagram, LinkedIn & Facebook.', 'Social Media Marketing & Management in Ahmedabad | Vyaaptam', 'Engaging content, viral reels, and targeted social media growth for businesses.'),
    ('performance-marketing', 'PPC & Performance Ads', 'Digital Marketing', 'Google and Meta ads measured in leads, not likes.', 'Custom quote', 'High-converting Google Ads Search & Display campaigns combined with hyper-targeted Meta ad funnels optimized for maximum ROAS.', 'Performance Marketing & Paid Ads Agency Ahmedabad | Vyaaptam', 'Convert ad budget into qualified customer appointments and sales with high ROAS.'),
    ('branding', 'Branding & Identity', 'Digital Marketing', 'A name, look and voice people remember.', 'Custom quote', 'Complete brand identity suites: typography, color systems, logos, brand guidelines, packaging designs, and distinct brand tone.', 'Corporate Branding & Identity Design Ahmedabad | Vyaaptam', 'Memorable logos, modern packaging, and distinctive brand identities for growing enterprises.'),
    ('meme-marketing', 'Meme Marketing', 'Digital Marketing', 'Ride the trend while it is still trending.', 'Custom quote', 'Agile moment marketing that connects with Gen Z and millennial consumers through relatable, culturally sharp humor.', 'Viral Meme Marketing for Brands | Vyaaptam', 'Make your brand viral with timely moment marketing and high-engagement humor.'),
    ('content-marketing', 'Content & Email Marketing', 'Digital Marketing', 'Words that rank, nurture and convert.', 'Custom quote', 'Authoritative long-form articles, conversion-focused newsletter sequences, and B2B case studies.', 'Content & Email Marketing Solutions | Vyaaptam', 'Strategic content and automated email flows that convert readers into loyal clients.'),
    ('wordpress-development', 'WordPress Websites', 'Web & App Development', 'Business websites you can edit yourself.', 'From ₹9,999', 'Blazing fast, secure, and mobile-friendly WordPress websites equipped with Elementor/Gutenberg, custom forms, and WhatsApp CRM integration.', 'Custom WordPress Website Development Ahmedabad | Vyaaptam', 'Fast, responsive, and SEO-optimized business WordPress websites built for lead generation.'),
    ('shopify-store', 'Shopify Store Setup', 'Web & App Development', 'Start selling online in weeks, not months.', 'From ₹19,999', 'Complete D2C e-commerce stores: custom theme styling, Indian payment gateway setup (Razorpay/Cashfree), and courier integrations.', 'Shopify E-Commerce Store Design Ahmedabad | Vyaaptam', 'Launch your online store with custom Shopify designs and integrated payment gateways.'),
    ('custom-web-development', 'Custom Web Development', 'Web & App Development', 'Portals, dashboards and web apps built around your workflow.', 'From ₹39,999', 'Full-stack enterprise web applications built using modern frameworks like React, Node.js, and PostgreSQL.', 'Full-Stack Custom Web Development Ahmedabad | Vyaaptam', 'Scalable custom web portals and SaaS platforms tailored to your business operations.'),
    ('mobile-app-development', 'Mobile App Development', 'Web & App Development', 'Android and iOS apps your customers keep.', 'Custom quote', 'Native and cross-platform mobile apps built with Flutter and React Native, featuring smooth animations and offline support.', 'Mobile App Development (Android & iOS) | Vyaaptam', 'High-performance iOS and Android applications with intuitive user experience.'),
    ('gst-itr', 'GST & ITR Filing', 'Legal & Compliance', 'Registrations and returns filed on time, every time.', 'Custom quote', 'Monthly/Quarterly GST filings, Annual ITR audits, input tax credit reconciliation, and notice handling by chartered professionals.', 'GST Return Filing & Income Tax Services Ahmedabad | Vyaaptam', 'Timely GST filings and tax returns managed by experienced accounting professionals.'),
    ('company-registration', 'Company Registration', 'Legal & Compliance', 'Private Limited, LLP, OPC or partnership — set up right.', 'Custom quote', 'Incorporation documentation, DIN/DSC allotment, MCA approval, PAN/TAN issuance, and corporate bank account setup in 7 days.', 'Company Registration (Pvt Ltd, LLP, OPC) | Vyaaptam', 'Fast and compliant business registration across India with complete MCA documentation.'),
    ('ngo-registration', 'NGO & Society Registration', 'Legal & Compliance', 'Trust, Society and Section 8 registrations.', 'Custom quote', 'End-to-end guidance for public charitable trusts, societies, Section 8 non-profits, and 12A/80G tax exemptions.', 'NGO & Section 8 Company Registration India | Vyaaptam', 'Incorporate charitable trusts and societies with full regulatory compliance and 80G tax benefits.'),
    ('trademark-iso', 'Trademark, ISO & Logo Protection', 'Legal & Compliance', 'Protect the brand you are building.', 'Custom quote', 'Comprehensive brand trademark search, class classification, TM application filing, opposition defense, and ISO 9001 certifications.', 'Trademark Registration & ISO Certification | Vyaaptam', 'Safeguard your brand name, logo, and intellectual property with registered trademark protection.'),
    ('business-licences', 'PAN, TAN, DSC, FSSAI & MSME', 'Legal & Compliance', 'The licences and IDs every business needs.', 'Custom quote', 'Fast processing for Class 3 Digital Signature Certificates, MSME Udyam registration, FSSAI food licenses, and trade licenses.', 'Business Licenses (FSSAI, MSME, DSC, TAN) | Vyaaptam', 'Quick regulatory licensing and certifications for Indian businesses.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.blog_posts (slug, title, category, author, published_date, read_time, excerpt, meta_title, meta_description)
VALUES
    ('how-to-choose-a-digital-marketing-company-in-ahmedabad', 'How to Choose a Digital Marketing Company in Ahmedabad', 'Marketing', 'Sanchit Khandelwal', '8 Oct 2026', '6 min read', 'Portfolio, pricing, reporting and red flags to watch before signing a contract with any agency.', 'How to Choose a Digital Marketing Company in Ahmedabad | Vyaaptam', 'Essential checklist for business owners before hiring a digital agency in Ahmedabad.'),
    ('local-seo-checklist-for-small-businesses', 'A Local SEO Checklist for Small Businesses', 'SEO', 'Vyaaptam Strategy Team', '21 Sept 2026', '5 min read', 'Twelve practical fixes to show up when people search “near me” on Google and Maps.', 'Local SEO Checklist for Small Businesses | Vyaaptam Insights', 'Rank higher on Google Maps and local search queries with this 12-step practical guide.'),
    ('gst-registration-checklist-for-new-businesses', 'GST Registration: A Practical Checklist for New Businesses', 'Legal', 'CA Nitin Shah', '30 Aug 2026', '7 min read', 'Who needs to register, documents required and common pitfalls to avoid when filing your application.', 'GST Registration Checklist for Indian Businesses | Vyaaptam Legal', 'Complete documentation and eligibility checklist for new GST registrations in India.'),
    ('private-limited-vs-llp-india', 'Private Limited vs LLP: Which One Should You Pick in India?', 'Legal', 'Vyaaptam Corporate Team', '15 Aug 2026', '8 min read', 'Costs, compliance burden, tax differences and fundraising readiness compared side by side.', 'Private Limited vs LLP in India: Comparison Guide | Vyaaptam', 'Clear comparison between Pvt Ltd and LLP structures to choose the best entity for your startup.'),
    ('website-checklist-before-running-ads', 'Don’t Run Ads Yet: The 7-Point Landing Page Audit', 'Web & App', 'Vyaaptam Growth Team', '2 Aug 2026', '5 min read', 'Seven critical changes that turn paid clicks into real leads instead of bounced traffic.', 'Landing Page Audit Checklist Before Running Google Ads | Vyaaptam', 'Boost your conversion rates and ad ROAS with these 7 essential landing page optimizations.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.seo_pages (route, page_name, meta_title, meta_description, keywords)
VALUES
    ('/', 'Home Page', 'Vyaaptam — Digital Marketing, Web Development & Legal Services in Ahmedabad', 'Vyaaptam is an Ahmedabad-based agency for digital marketing, web & app development and legal compliance — one team for growing Indian businesses.', 'digital marketing ahmedabad, web development ahmedabad, gst filing, seo agency'),
    ('/services', 'Services Catalog', 'Services — SEO, Social Media, Websites, GST & More | Vyaaptam', 'Explore 15+ services from Vyaaptam: SEO, social media, ads, branding, WordPress & Shopify websites, mobile apps, GST, company registration and trademarks.', 'marketing services, web design packages, legal business registration, ahmedabad agency'),
    ('/about', 'About Us', 'About Us — The One-Stop Growth & Compliance Team | Vyaaptam', 'Learn how Vyaaptam helps Indian businesses scale with integrated marketing, development, and government compliance from Ahmedabad and Amroha.', 'about vyaaptam, digital agency team ahmedabad, marketing strategists'),
    ('/blog', 'Insights Blog', 'Insights — Marketing, Web & Legal Guides | Vyaaptam', 'Actionable guides, business checklists, and industry insights on SEO, digital advertising, web development, and statutory legal compliance.', 'business guides india, digital marketing tips, gst blog, startup checklist'),
    ('/contact', 'Contact Us', 'Contact Us — Book a Free Strategy Call | Vyaaptam', 'Speak with our growth strategists. Offices in Ahmedabad & Amroha. Call +91 63967 16516 or send an enquiry online.', 'contact vyaaptam, marketing consultation ahmedabad, book strategy call')
ON CONFLICT (route) DO NOTHING;


-- ==============================================================================
-- 12. CMS: SITE SETTINGS TABLE (Agency Business & Brand Settings)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    agency_name VARCHAR(100) DEFAULT 'Vyaaptam' NOT NULL,
    phone VARCHAR(50) DEFAULT '+91 63967 16516' NOT NULL,
    email VARCHAR(100) DEFAULT 'hello@vyaaptam.com' NOT NULL,
    whatsapp VARCHAR(50) DEFAULT '+91 63967 16516' NOT NULL,
    office_hours VARCHAR(100) DEFAULT 'Mon – Sat, 10am – 7pm',
    primary_address TEXT DEFAULT 'Offices in Ahmedabad & Amroha',
    social_facebook VARCHAR(255) DEFAULT 'https://www.facebook.com/vyaaptam/',
    social_instagram VARCHAR(255) DEFAULT 'https://www.instagram.com/vyaaptam/',
    social_linkedin VARCHAR(255) DEFAULT 'https://www.linkedin.com/company/vyaaptam/',
    announcement_text VARCHAR(255) DEFAULT '🚀 Free 30-minute growth & compliance audit for new businesses.',
    announcement_active BOOLEAN DEFAULT TRUE NOT NULL
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin full access on site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.site_settings (agency_name, phone, email, whatsapp, office_hours, primary_address, announcement_text)
VALUES ('Vyaaptam', '+91 63967 16516', 'hello@vyaaptam.com', '+91 63967 16516', 'Mon – Sat, 10am – 7pm', 'Offices in Ahmedabad & Amroha', '🚀 Free 30-minute growth & compliance audit for new businesses.')
ON CONFLICT DO NOTHING;
