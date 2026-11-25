// Polyfill WebSocket for Node.js 18 environments (Hostinger / cPanel)
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class DummyWebSocket {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  };
}

const { createClient } = require('@supabase/supabase-js');

// Load environment variables for local testing
try {
  require('dotenv').config();
} catch (e) {}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_ANON_KEY || 
  process.env.SUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance = null;

function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;

  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && !SUPABASE_URL.includes('your-project')) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    return supabaseInstance;
  }
  return null;
}

// In-memory / file fallback store for development or testing prior to Supabase connection
let mockLeadsStore = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    name: 'Riddhi Shah',
    company: 'Shah Interiors',
    email: 'riddhi@shahinteriors.in',
    phone: '+91 98250 12345',
    service: 'Social Media Marketing',
    budget: '₹10k – ₹25k',
    message: 'We want regular reels and interior design portfolio management for Ahmedabad clients.',
    status: 'new',
    notes: 'Follow up requested via WhatsApp',
    source_page: '/'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    name: 'Imran Qureshi',
    company: 'Qureshi Rice Traders',
    email: 'imran@qureshirice.com',
    phone: '+91 94260 54321',
    service: 'GST & ITR Filing',
    budget: '₹10k – ₹25k',
    message: 'Looking for quarterly GST return filing and annual business ITR audit assistance.',
    status: 'new',
    notes: 'Scheduled call for tomorrow 11 AM',
    source_page: '/services/gst-itr'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    name: 'Tanvi Mehta',
    company: 'Bloom Yoga Studio',
    email: 'tanvi@bloomyoga.in',
    phone: '+91 98980 98765',
    service: 'WordPress Websites',
    budget: '₹10k – ₹25k',
    message: 'Need modern responsive website with class booking schedule and WhatsApp chat.',
    status: 'contacted',
    notes: 'Spoke with Tanvi. Sent website portfolio demo.',
    source_page: '/services/wordpress-development'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    name: 'Kunal Parikh',
    company: 'Parikh Agro Exports',
    email: 'kunal@parikhagro.com',
    phone: '+91 97120 67890',
    service: 'PPC & Performance Ads',
    budget: '₹50k+',
    message: 'B2B export leads needed for agricultural machinery via Google Ads & LinkedIn.',
    status: 'proposal_sent',
    notes: 'Sent proposal for ₹65,000 / month retainer on Monday.',
    source_page: '/contact'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    name: 'Dr. Krupa Joshi',
    company: 'Smile Studio Dental',
    email: 'krupa@smilestudio.in',
    phone: '+91 98240 11223',
    service: 'Search Engine Optimisation',
    budget: '₹25k – ₹50k',
    message: 'Local SEO and Google Maps ranking for dental clinic in Maninagar.',
    status: 'won',
    notes: 'Signed 6-month local SEO agreement.',
    source_page: '/services/seo'
  }
];

function getMockStore() {
  return mockLeadsStore;
}

// -------------------------------------------------------------
// CMS MOCK STORES: SERVICES, BLOGS & SEO
// -------------------------------------------------------------
let mockServicesStore = [
  { id: 'srv-1', slug: 'seo', title: 'Search Engine Optimisation', category: 'Digital Marketing', tagline: 'Rank for the searches your customers type every day.', price_from: 'From ₹7,499 / month', description: 'Dominate Google rankings with data-driven keyword research, technical on-page fixes, schema markup, and authoritative white-hat local citations in Ahmedabad.', meta_title: 'Best SEO Services in Ahmedabad | Vyaaptam Digital', meta_description: 'Grow organic traffic and Google Map rankings with Ahmedabad leading SEO agency. Transparent reporting and proven ROI.', is_active: true },
  { id: 'srv-2', slug: 'social-media-marketing', title: 'Social Media Marketing', category: 'Digital Marketing', tagline: 'A feed people follow — and a page that sells.', price_from: 'From ₹9,999 / month', description: 'Build loyal brand followers with custom viral reels, carousel designs, community engagement, and influencer outreach across Instagram, LinkedIn & Facebook.', meta_title: 'Social Media Marketing & Management in Ahmedabad | Vyaaptam', meta_description: 'Engaging content, viral reels, and targeted social media growth for businesses.', is_active: true },
  { id: 'srv-3', slug: 'performance-marketing', title: 'PPC & Performance Ads', category: 'Digital Marketing', tagline: 'Google and Meta ads measured in leads, not likes.', price_from: 'Custom quote', description: 'High-converting Google Ads Search & Display campaigns combined with hyper-targeted Meta ad funnels optimized for maximum ROAS.', meta_title: 'Performance Marketing & Paid Ads Agency Ahmedabad | Vyaaptam', meta_description: 'Convert ad budget into qualified customer appointments and sales with high ROAS.', is_active: true },
  { id: 'srv-4', slug: 'branding', title: 'Branding & Identity', category: 'Digital Marketing', tagline: 'A name, look and voice people remember.', price_from: 'Custom quote', description: 'Complete brand identity suites: typography, color systems, logos, brand guidelines, packaging designs, and distinct brand tone.', meta_title: 'Corporate Branding & Identity Design Ahmedabad | Vyaaptam', meta_description: 'Memorable logos, modern packaging, and distinctive brand identities for growing enterprises.', is_active: true },
  { id: 'srv-5', slug: 'meme-marketing', title: 'Meme Marketing', category: 'Digital Marketing', tagline: 'Ride the trend while it is still trending.', price_from: 'Custom quote', description: 'Agile moment marketing that connects with Gen Z and millennial consumers through relatable, culturally sharp humor.', meta_title: 'Viral Meme Marketing for Brands | Vyaaptam', meta_description: 'Make your brand viral with timely moment marketing and high-engagement humor.', is_active: true },
  { id: 'srv-6', slug: 'content-marketing', title: 'Content & Email Marketing', category: 'Digital Marketing', tagline: 'Words that rank, nurture and convert.', price_from: 'Custom quote', description: 'Authoritative long-form articles, conversion-focused newsletter sequences, and B2B case studies.', meta_title: 'Content & Email Marketing Solutions | Vyaaptam', meta_description: 'Strategic content and automated email flows that convert readers into loyal clients.', is_active: true },
  { id: 'srv-7', slug: 'wordpress-development', title: 'WordPress Websites', category: 'Web & App Development', tagline: 'Business websites you can edit yourself.', price_from: 'From ₹9,999', description: 'Blazing fast, secure, and mobile-friendly WordPress websites equipped with Elementor/Gutenberg, custom forms, and WhatsApp CRM integration.', meta_title: 'Custom WordPress Website Development Ahmedabad | Vyaaptam', meta_description: 'Fast, responsive, and SEO-optimized business WordPress websites built for lead generation.', is_active: true },
  { id: 'srv-8', slug: 'shopify-store', title: 'Shopify Store Setup', category: 'Web & App Development', tagline: 'Start selling online in weeks, not months.', price_from: 'From ₹19,999', description: 'Complete D2C e-commerce stores: custom theme styling, Indian payment gateway setup (Razorpay/Cashfree), and courier integrations.', meta_title: 'Shopify E-Commerce Store Design Ahmedabad | Vyaaptam', meta_description: 'Launch your online store with custom Shopify designs and integrated payment gateways.', is_active: true },
  { id: 'srv-9', slug: 'custom-web-development', title: 'Custom Web Development', category: 'Web & App Development', tagline: 'Portals, dashboards and web apps built around your workflow.', price_from: 'From ₹39,999', description: 'Full-stack enterprise web applications built using modern frameworks like React, Node.js, and PostgreSQL.', meta_title: 'Full-Stack Custom Web Development Ahmedabad | Vyaaptam', meta_description: 'Scalable custom web portals and SaaS platforms tailored to your business operations.', is_active: true },
  { id: 'srv-10', slug: 'mobile-app-development', title: 'Mobile App Development', category: 'Web & App Development', tagline: 'Android and iOS apps your customers keep.', price_from: 'Custom quote', description: 'Native and cross-platform mobile apps built with Flutter and React Native, featuring smooth animations and offline support.', meta_title: 'Mobile App Development (Android & iOS) | Vyaaptam', meta_description: 'High-performance iOS and Android applications with intuitive user experience.', is_active: true },
  { id: 'srv-11', slug: 'gst-itr', title: 'GST & ITR Filing', category: 'Legal & Compliance', tagline: 'Registrations and returns filed on time, every time.', price_from: 'Custom quote', description: 'Monthly/Quarterly GST filings, Annual ITR audits, input tax credit reconciliation, and notice handling by chartered professionals.', meta_title: 'GST Return Filing & Income Tax Services Ahmedabad | Vyaaptam', meta_description: 'Timely GST filings and tax returns managed by experienced accounting professionals.', is_active: true },
  { id: 'srv-12', slug: 'company-registration', title: 'Company Registration', category: 'Legal & Compliance', tagline: 'Private Limited, LLP, OPC or partnership — set up right.', price_from: 'Custom quote', description: 'Incorporation documentation, DIN/DSC allotment, MCA approval, PAN/TAN issuance, and corporate bank account setup in 7 days.', meta_title: 'Company Registration (Pvt Ltd, LLP, OPC) | Vyaaptam', meta_description: 'Fast and compliant business registration across India with complete MCA documentation.', is_active: true },
  { id: 'srv-13', slug: 'ngo-registration', title: 'NGO & Society Registration', category: 'Legal & Compliance', tagline: 'Trust, Society and Section 8 registrations.', price_from: 'Custom quote', description: 'End-to-end guidance for public charitable trusts, societies, Section 8 non-profits, and 12A/80G tax exemptions.', meta_title: 'NGO & Section 8 Company Registration India | Vyaaptam', meta_description: 'Incorporate charitable trusts and societies with full regulatory compliance and 80G tax benefits.', is_active: true },
  { id: 'srv-14', slug: 'trademark-iso', title: 'Trademark, ISO & Logo Protection', category: 'Legal & Compliance', tagline: 'Protect the brand you are building.', price_from: 'Custom quote', description: 'Comprehensive brand trademark search, class classification, TM application filing, opposition defense, and ISO 9001 certifications.', meta_title: 'Trademark Registration & ISO Certification | Vyaaptam', meta_description: 'Safeguard your brand name, logo, and intellectual property with registered trademark protection.', is_active: true },
  { id: 'srv-15', slug: 'business-licences', title: 'PAN, TAN, DSC, FSSAI & MSME', category: 'Legal & Compliance', tagline: 'The licences and IDs every business needs.', price_from: 'Custom quote', description: 'Fast processing for Class 3 Digital Signature Certificates, MSME Udyam registration, FSSAI food licenses, and trade licenses.', meta_title: 'Business Licenses (FSSAI, MSME, DSC, TAN) | Vyaaptam', meta_description: 'Quick regulatory licensing and certifications for Indian businesses.', is_active: true }
];

let mockBlogsStore = [
  { id: 'blg-1', slug: 'how-to-choose-a-digital-marketing-company-in-ahmedabad', title: 'How to Choose a Digital Marketing Company in Ahmedabad', category: 'Marketing', author: 'Sanchit Khandelwal', published_date: '8 Oct 2026', read_time: '6 min read', excerpt: 'Portfolio, pricing, reporting and red flags to watch before signing a contract with any agency.', content: 'Hiring a marketing agency is a big decision for small and growing businesses...', meta_title: 'How to Choose a Digital Marketing Company in Ahmedabad | Vyaaptam', meta_description: 'Essential checklist for business owners before hiring a digital agency in Ahmedabad.', is_published: true },
  { id: 'blg-2', slug: 'local-seo-checklist-for-small-businesses', title: 'A Local SEO Checklist for Small Businesses', category: 'SEO', author: 'Vyaaptam Strategy Team', published_date: '21 Sept 2026', read_time: '5 min read', excerpt: 'Twelve practical fixes to show up when people search “near me” on Google and Maps.', content: 'When local customers search for your services, Google Maps 3-pack is where 70% of calls originate...', meta_title: 'Local SEO Checklist for Small Businesses | Vyaaptam Insights', meta_description: 'Rank higher on Google Maps and local search queries with this 12-step practical guide.', is_published: true },
  { id: 'blg-3', slug: 'gst-registration-checklist-for-new-businesses', title: 'GST Registration: A Practical Checklist for New Businesses', category: 'Legal', author: 'CA Nitin Shah', published_date: '30 Aug 2026', read_time: '7 min read', excerpt: 'Who needs to register, documents required and common pitfalls to avoid when filing your application.', content: 'Navigating goods and services tax registration in India requires precise legal documentation...', meta_title: 'GST Registration Checklist for Indian Businesses | Vyaaptam Legal', meta_description: 'Complete documentation and eligibility checklist for new GST registrations in India.', is_published: true },
  { id: 'blg-4', slug: 'private-limited-vs-llp-india', title: 'Private Limited vs LLP: Which One Should You Pick in India?', category: 'Legal', author: 'Vyaaptam Corporate Team', published_date: '15 Aug 2026', read_time: '8 min read', excerpt: 'Costs, compliance burden, tax differences and fundraising readiness compared side by side.', content: 'Choosing between a Private Limited company and a Limited Liability Partnership (LLP)...', meta_title: 'Private Limited vs LLP in India: Comparison Guide | Vyaaptam', meta_description: 'Clear comparison between Pvt Ltd and LLP structures to choose the best entity for your startup.', is_published: true },
  { id: 'blg-5', slug: 'website-checklist-before-running-ads', title: 'Don’t Run Ads Yet: The 7-Point Landing Page Audit', category: 'Web & App', author: 'Vyaaptam Growth Team', published_date: '2 Aug 2026', read_time: '5 min read', excerpt: 'Seven critical changes that turn paid clicks into real leads instead of bounced traffic.', content: 'Before spending even one rupee on Google Ads or Meta Ads, your landing page must pass these 7 tests...', meta_title: 'Landing Page Audit Checklist Before Running Google Ads | Vyaaptam', meta_description: 'Boost your conversion rates and ad ROAS with these 7 essential landing page optimizations.', is_published: true }
];

let mockSeoStore = [
  { id: 'seo-1', route: '/', page_name: 'Home Page', meta_title: 'Vyaaptam — Digital Marketing, Web Development & Legal Services in Ahmedabad', meta_description: 'Vyaaptam is an Ahmedabad-based agency for digital marketing, web & app development and legal compliance — one team for growing Indian businesses.', keywords: 'digital marketing ahmedabad, web development ahmedabad, gst filing, seo agency' },
  { id: 'seo-2', route: '/services', page_name: 'Services Catalog', meta_title: 'Services — SEO, Social Media, Websites, GST & More | Vyaaptam', meta_description: 'Explore 15+ services from Vyaaptam: SEO, social media, ads, branding, WordPress & Shopify websites, mobile apps, GST, company registration and trademarks.', keywords: 'marketing services, web design packages, legal business registration, ahmedabad agency' },
  { id: 'seo-3', route: '/about', page_name: 'About Us', meta_title: 'About Us — The One-Stop Growth & Compliance Team | Vyaaptam', meta_description: 'Learn how Vyaaptam helps Indian businesses scale with integrated marketing, development, and government compliance from Ahmedabad and Amroha.', keywords: 'about vyaaptam, digital agency team ahmedabad, marketing strategists' },
  { id: 'seo-4', route: '/blog', page_name: 'Insights Blog', meta_title: 'Insights — Marketing, Web & Legal Guides | Vyaaptam', meta_description: 'Actionable guides, business checklists, and industry insights on SEO, digital advertising, web development, and statutory legal compliance.', keywords: 'business guides india, digital marketing tips, gst blog, startup checklist' },
  { id: 'seo-5', route: '/contact', page_name: 'Contact Us', meta_title: 'Contact Us — Book a Free Strategy Call | Vyaaptam', meta_description: 'Speak with our growth strategists. Offices in Ahmedabad & Amroha. Call +91 63967 16516 or send an enquiry online.', keywords: 'contact vyaaptam, marketing consultation ahmedabad, book strategy call' }
];

let mockSettingsStore = {
  agency_name: 'Vyaaptam',
  phone: '+91 63967 16516',
  email: 'hello@vyaaptam.com',
  whatsapp: '+91 63967 16516',
  office_hours: 'Mon – Sat, 10am – 7pm',
  primary_address: 'Offices in Ahmedabad & Amroha',
  social_facebook: 'https://www.facebook.com/vyaaptam/',
  social_instagram: 'https://www.instagram.com/vyaaptam/',
  social_linkedin: 'https://www.linkedin.com/company/vyaaptam/',
  announcement_text: '🚀 Free 30-minute growth & compliance audit for new businesses.',
  announcement_active: true
};

function getServicesStore() { return mockServicesStore; }
function getBlogStore() { return mockBlogsStore; }
function getSeoStore() { return mockSeoStore; }
function getSettingsStore() { return mockSettingsStore; }

module.exports = {
  getSupabaseClient,
  getMockStore,
  getServicesStore,
  getBlogStore,
  getSeoStore,
  getSettingsStore
};

