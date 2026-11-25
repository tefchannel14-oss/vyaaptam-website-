/**
 * Vyaaptam Client Interactivity Engine
 * Lightweight, production-grade DOM controller for navigation, tabs, accordions,
 * testimonials, search filtering, and AJAX form submissions.
 * Preserves 100% of existing CSS styling, animations, and design tokens.
 */
document.addEventListener('DOMContentLoaded', () => {
  initImageFallbacks();
  initMobileNav();
  initAccordions();
  initHomePracticeTabs();
  initTestimonialSlider();
  initServiceDirectoryFilters();
  initBlogDirectoryFilters();
  initForms();
  initDynamicSeoSync();
  initDynamicSettingsSync();
  initAnimatedBrandIcon();
  initAboutTeamSection();
  initSmartBlogLeadPopup();
  initAnalytics();
});

/* ==========================================================================
   0. IMAGE FALLBACK CONTROLLER (Ensures images load locally & in production)
   ========================================================================== */
function initImageFallbacks() {
  const images = document.querySelectorAll('img[src*="/.netlify/images"]');
  images.forEach(img => {
    img.addEventListener('error', () => {
      try {
        const srcAttr = img.getAttribute('src') || '';
        const match = srcAttr.match(/url=([^&]+)/);
        if (match && match[1]) {
          const directUrl = decodeURIComponent(match[1]);
          // Try webp first, then direct url
          const webpUrl = directUrl.replace(/\.(png|jpg|jpeg)$/i, '.webp');
          img.removeAttribute('srcset');
          img.src = webpUrl;
        }
      } catch (e) {}
    });
  });
}

/* ==========================================================================
   1. MOBILE NAVIGATION
   ========================================================================== */
function initMobileNav() {
  const toggleBtn = document.querySelector('button[aria-controls="mobile-nav"]');
  const mobileNav = document.getElementById('mobile-nav');
  if (!toggleBtn || !mobileNav) return;

  function toggleMenu(open) {
    const isExpanded = open !== undefined ? open : toggleBtn.getAttribute('aria-expanded') !== 'true';
    toggleBtn.setAttribute('aria-expanded', String(isExpanded));

    if (isExpanded) {
      mobileNav.classList.remove('invisible', '-translate-y-3', 'opacity-0');
      mobileNav.classList.add('visible', 'translate-y-0', 'opacity-100');
      document.body.style.overflow = 'hidden';
    } else {
      mobileNav.classList.add('invisible', '-translate-y-3', 'opacity-0');
      mobileNav.classList.remove('visible', 'translate-y-0', 'opacity-100');
      document.body.style.overflow = '';
    }
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close when clicking nav links
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggleBtn.getAttribute('aria-expanded') === 'true') {
      toggleMenu(false);
    }
  });
}

/* ==========================================================================
   2. FAQ ACCORDIONS (Contact & Service Detail Pages)
   ========================================================================== */
function initAccordions() {
  const accordionButtons = document.querySelectorAll('button[aria-expanded]');
  if (!accordionButtons.length) return;

  accordionButtons.forEach(btn => {
    // Only target FAQ buttons inside list items
    const li = btn.closest('li');
    if (!li) return;
    const content = li.querySelector('.grid.transition-all');
    if (!content) return;

    btn.addEventListener('click', () => {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      const newStatus = !isExpanded;

      // Close siblings if inside a single-select FAQ container
      const parentUl = li.closest('ul');
      if (parentUl) {
        parentUl.querySelectorAll('li').forEach(otherLi => {
          if (otherLi === li) return;
          const otherBtn = otherLi.querySelector('button[aria-expanded]');
          const otherContent = otherLi.querySelector('.grid.transition-all');
          const otherIcon = otherLi.querySelector('span.grid.size-9');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          if (otherContent) {
            otherContent.classList.remove('grid-rows-[1fr]', 'pb-6');
            otherContent.classList.add('grid-rows-[0fr]');
          }
          if (otherIcon) {
            otherIcon.classList.remove('rotate-45', 'border-ink', 'bg-ink', 'text-paper');
          }
        });
      }

      // Toggle current
      btn.setAttribute('aria-expanded', String(newStatus));
      const icon = btn.querySelector('span.grid.size-9');

      if (newStatus) {
        content.classList.remove('grid-rows-[0fr]');
        content.classList.add('grid-rows-[1fr]', 'pb-6');
        if (icon) {
          icon.classList.add('rotate-45', 'border-ink', 'bg-ink', 'text-paper');
        }
      } else {
        content.classList.remove('grid-rows-[1fr]', 'pb-6');
        content.classList.add('grid-rows-[0fr]');
        if (icon) {
          icon.classList.remove('rotate-45', 'border-ink', 'bg-ink', 'text-paper');
        }
      }
    });
  });
}

/* ==========================================================================
   3. HOMEPAGE SERVICE PRACTICE TABS
   ========================================================================== */
function initHomePracticeTabs() {
  const tablist = document.querySelector('div[role="tablist"][aria-label="Service practices"]');
  if (!tablist) return;

  const tabs = tablist.querySelectorAll('button[role="tab"]');
  const panel = document.querySelector('div[role="tabpanel"]');
  if (!tabs.length || !panel) return;

  const practiceData = {
    0: {
      id: 'marketing',
      title: 'Digital Marketing',
      desc: 'SEO, social media, ads, content and memes that put your brand in front of the people who actually buy.',
      btnText: 'See all marketing services',
      btnHref: '/services?pillar=marketing',
      services: [
        { name: 'Search Engine Optimisation', desc: 'Rank for the searches your customers type every day.', href: '/services/seo' },
        { name: 'Social Media Marketing', desc: 'A feed people follow — and a page that sells.', href: '/services/social-media-marketing' },
        { name: 'PPC & Performance Ads', desc: 'Google and Meta ads measured in leads, not likes.', href: '/services/performance-marketing' },
        { name: 'Branding & Identity', desc: 'A name, look and voice people remember.', href: '/services/branding' },
        { name: 'Meme Marketing', desc: 'Ride the trend while it is still trending.', href: '/services/meme-marketing' },
        { name: 'Content & Email Marketing', desc: 'Words that rank, nurture and convert.', href: '/services/content-marketing' }
      ]
    },
    1: {
      id: 'web',
      title: 'Web & App Development',
      desc: 'Fast, secure websites, Shopify stores and custom applications built to convert visitors into paying clients.',
      btnText: 'See all web & app services',
      btnHref: '/services?pillar=web',
      services: [
        { name: 'WordPress Websites', desc: 'Business websites you can edit yourself.', href: '/services/wordpress-development' },
        { name: 'Shopify Store Setup', desc: 'Start selling online in weeks, not months.', href: '/services/shopify-store' },
        { name: 'Custom Web Development', desc: 'Portals, dashboards and web apps built around your workflow.', href: '/services/custom-web-development' },
        { name: 'Mobile App Development', desc: 'Android and iOS apps your customers keep.', href: '/services/mobile-app-development' }
      ]
    },
    2: {
      id: 'legal',
      title: 'Legal & Compliance',
      desc: 'Company registrations, GST returns, licences and trademarks handled by professionals with zero guesswork.',
      btnText: 'See all legal services',
      btnHref: '/services?pillar=legal',
      services: [
        { name: 'GST & ITR Filing', desc: 'Registrations and returns filed on time, every time.', href: '/services/gst-itr' },
        { name: 'Company Registration', desc: 'Private Limited, LLP, OPC or partnership — set up right.', href: '/services/company-registration' },
        { name: 'NGO & Society Registration', desc: 'Trust, Society and Section 8 registrations.', href: '/services/ngo-registration' },
        { name: 'Trademark, ISO & Logo Protection', desc: 'Protect the brand you are building.', href: '/services/trademark-iso' },
        { name: 'PAN, TAN, DSC, FSSAI & MSME', desc: 'The licences and IDs every business needs.', href: '/services/business-licences' }
      ]
    }
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      // Update tab active classes
      tabs.forEach(t => {
        t.setAttribute('aria-selected', 'false');
        t.className = 'flex shrink-0 items-center gap-2.5 rounded-full border px-5 py-3 text-sm font-semibold transition border-line bg-white text-ink/75 hover:border-ink/30';
      });
      tab.setAttribute('aria-selected', 'true');
      tab.className = 'flex shrink-0 items-center gap-2.5 rounded-full border px-5 py-3 text-sm font-semibold transition border-ink bg-ink text-paper';

      const data = practiceData[index];
      if (!data) return;

      // Update highlighted card
      const titleEl = panel.querySelector('h3');
      const descEl = panel.querySelector('p.text-white\\/85, p.text-white');
      const ctaEl = panel.querySelector('a.inline-flex');
      if (titleEl) titleEl.textContent = data.title;
      if (descEl) descEl.textContent = data.desc;
      if (ctaEl) {
        ctaEl.href = data.btnHref;
        ctaEl.innerHTML = `${data.btnText} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>`;
      }

      // Update services list
      const ulEl = panel.querySelector('ul');
      if (ulEl) {
        ulEl.innerHTML = data.services.map(s => `
          <li>
            <a class="group card flex h-full items-start justify-between gap-4 p-6 transition hover:border-ink/30 hover:bg-sand/40" href="${s.href}">
              <div>
                <h4 class="text-lg font-semibold">${s.name}</h4>
                <p class="mt-1.5 text-sm leading-relaxed text-muted">${s.desc}</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="mt-1 shrink-0 text-muted transition group-hover:rotate-45 group-hover:text-magenta">
                <path d="M7 17 17 7M8 7h9v9"></path>
              </svg>
            </a>
          </li>
        `).join('');
      }
    });
  });
}

/* ==========================================================================
   4. TESTIMONIAL SLIDER
   ========================================================================== */
function initTestimonialSlider() {
  const prevBtn = document.querySelector('button[aria-label="Previous testimonial"]');
  const nextBtn = document.querySelector('button[aria-label="Next testimonial"]');
  const counterEl = prevBtn?.parentElement?.querySelector('span.tabular-nums');
  const figureEl = document.querySelector('figure[aria-live="polite"]');
  if (!prevBtn || !nextBtn || !figureEl) return;

  const testimonials = [
    {
      quote: "Our clinic website used to get maybe two enquiries a month. Six months of local SEO later, the phone actually rings — and the Google Business Profile does half the work.",
      name: "Dr. Krupa Joshi",
      company: "Smile Studio Dental, Maninagar"
    },
    {
      quote: "We were paying three different agencies for Google Ads, website updates and GST filing. Vyaaptam consolidated everything into one monthly fee and actually answers the phone.",
      name: "Hardik Patel",
      company: "Patel Engineering & Tools, Vatva"
    },
    {
      quote: "They built our Shopify store in under three weeks and ran our Diwali launch campaign. Sales beat our target by 40% — smooth execution throughout.",
      name: "Ananya Roy",
      company: "Aroma Artisans, Prahlad Nagar"
    }
  ];

  let currentIndex = 0;
  let timer = null;

  function render(index) {
    currentIndex = (index + testimonials.length) % testimonials.length;
    const t = testimonials[currentIndex];

    const quoteEl = figureEl.querySelector('blockquote');
    const nameEl = figureEl.querySelector('figcaption span.font-semibold');
    const compEl = figureEl.querySelector('figcaption span.text-muted');

    if (quoteEl) quoteEl.textContent = `“${t.quote}”`;
    if (nameEl) nameEl.textContent = t.name;
    if (compEl) compEl.textContent = t.company;

    if (counterEl) {
      counterEl.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(testimonials.length).padStart(2, '0')}`;
    }
  }

  function startAutoPlay() {
    stopAutoPlay();
    timer = setInterval(() => render(currentIndex + 1), 7000);
  }

  function stopAutoPlay() {
    if (timer) clearInterval(timer);
  }

  prevBtn.addEventListener('click', () => {
    render(currentIndex - 1);
    startAutoPlay();
  });

  nextBtn.addEventListener('click', () => {
    render(currentIndex + 1);
    startAutoPlay();
  });

  figureEl.closest('section')?.addEventListener('mouseenter', stopAutoPlay);
  figureEl.closest('section')?.addEventListener('mouseleave', startAutoPlay);

  startAutoPlay();
}

/* ==========================================================================
   5. SERVICES DIRECTORY CATEGORY & SEARCH FILTER
   ========================================================================== */
function initServiceDirectoryFilters() {
  const tablist = document.querySelector('div[role="tablist"][aria-label="Filter by practice"]');
  const searchInput = document.querySelector('input[type="search"][placeholder*="GST"]');
  const serviceCards = document.querySelectorAll('section.container-x.py-14 div.grid a.card');
  if (!serviceCards.length) return;

  let currentCategory = 'all';
  let searchQuery = '';

  function filterCards() {
    serviceCards.forEach(card => {
      const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const summary = card.querySelector('p')?.textContent.toLowerCase() || '';
      const tag = card.querySelector('span.rounded-full')?.textContent.trim() || '';

      let matchesCategory = true;
      if (currentCategory === 'marketing') matchesCategory = tag.includes('Marketing');
      else if (currentCategory === 'web') matchesCategory = tag.includes('Web & App');
      else if (currentCategory === 'legal') matchesCategory = tag.includes('Legal');

      const matchesSearch = !searchQuery || title.includes(searchQuery) || summary.includes(searchQuery);

      if (matchesCategory && matchesSearch) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  if (tablist) {
    const tabs = tablist.querySelectorAll('button[role="tab"]');
    const categories = ['all', 'marketing', 'web', 'legal'];

    tabs.forEach((tab, idx) => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.setAttribute('aria-selected', 'false');
          t.className = 'flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition border-line bg-white text-ink/75 hover:border-ink/30';
          const badge = t.querySelector('span');
          if (badge) badge.className = 'rounded-full px-2 py-0.5 text-xs bg-sand text-muted';
        });

        tab.setAttribute('aria-selected', 'true');
        tab.className = 'flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition border-ink bg-ink text-paper';
        const activeBadge = tab.querySelector('span');
        if (activeBadge) activeBadge.className = 'rounded-full px-2 py-0.5 text-xs bg-white/15';

        currentCategory = categories[idx] || 'all';
        filterCards();
      });
    });

    // Check URL parameters (e.g. /services?pillar=web)
    const urlParams = new URLSearchParams(window.location.search);
    const pillarParam = urlParams.get('pillar');
    if (pillarParam) {
      const targetIdx = categories.indexOf(pillarParam.toLowerCase());
      if (targetIdx !== -1 && tabs[targetIdx]) {
        tabs[targetIdx].click();
      }
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      filterCards();
    });
  }
}

/* ==========================================================================
   6. BLOG DIRECTORY FILTERS & SEARCH
   ========================================================================== */
function initBlogDirectoryFilters() {
  const tablist = document.querySelector('div[role="tablist"][aria-label="Filter by topic"]');
  const searchInput = document.querySelector('input[type="search"][placeholder*="articles"]');
  const articleCards = document.querySelectorAll('main a.group.flex.flex-col');
  if (!articleCards.length) return;

  let currentCategory = 'all';
  let searchQuery = '';

  function filterArticles() {
    articleCards.forEach(card => {
      const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const summary = card.querySelector('p')?.textContent.toLowerCase() || '';
      const cat = card.querySelector('span.text-magenta')?.textContent.toLowerCase() || '';

      const matchesCat = currentCategory === 'all' || cat.includes(currentCategory);
      const matchesSearch = !searchQuery || title.includes(searchQuery) || summary.includes(searchQuery);

      card.style.display = (matchesCat && matchesSearch) ? '' : 'none';
    });
  }

  if (tablist) {
    const tabs = tablist.querySelectorAll('button[role="tab"]');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.setAttribute('aria-selected', 'false');
          t.className = 'shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition border-line bg-white text-ink/75 hover:border-ink/30';
        });
        tab.setAttribute('aria-selected', 'true');
        tab.className = 'shrink-0 rounded-full border px-4 py-2.5 text-sm font-semibold transition border-ink bg-ink text-paper';

        currentCategory = tab.textContent.trim().toLowerCase();
        filterArticles();
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      filterArticles();
    });
  }
}

/* ==========================================================================
   7. FORM SUBMISSIONS (Direct to Serverless /api/leads)
   ========================================================================== */
function initForms() {
  const forms = document.querySelectorAll('form[name="contact"]');
  if (!forms.length) return;

  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnHTML = submitBtn ? submitBtn.innerHTML : 'Send enquiry';
      const fieldset = form.querySelector('fieldset');

      // Check honeypot
      const botField = form.querySelector('input[name="bot-field"]')?.value;
      if (botField) {
        console.warn('Bot detected via honeypot.');
        return;
      }

      // Collect data
      const formData = new FormData(form);
      const payload = {
        name: formData.get('name'),
        company: formData.get('company') || '',
        email: formData.get('email'),
        phone: formData.get('phone'),
        service: formData.get('service') || '',
        budget: formData.get('budget') || '',
        message: formData.get('message'),
        source_page: window.location.pathname
      };

      // Set Loading State
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `Sending enquiry… <svg class="inline animate-spin ml-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"></path></svg>`;
      }
      if (fieldset) fieldset.disabled = true;

      // Remove existing alerts
      form.parentElement.querySelectorAll('.lead-alert').forEach(el => el.remove());

      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // Success View matching original website styling
          const successContainer = document.createElement('div');
          successContainer.setAttribute('role', 'status');
          successContainer.className = 'lead-alert card flex flex-col items-start gap-4 p-8 sm:p-10 animate-rise';
          successContainer.innerHTML = `
            <span class="grid size-14 place-items-center rounded-full bg-brand text-white shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
            <h3 class="text-2xl font-semibold">Thank you — we have your enquiry.</h3>
            <p class="text-muted leading-relaxed">
              A strategist will call or WhatsApp you within 24 hours on working days to book your free 30-minute strategy call.
            </p>
            <button type="button" class="reset-enquiry-btn text-sm font-semibold text-violet underline underline-offset-4 hover:text-ink transition">
              Send another enquiry
            </button>
          `;

          form.style.display = 'none';
          form.parentNode.insertBefore(successContainer, form.nextSibling);

          successContainer.querySelector('.reset-enquiry-btn').addEventListener('click', () => {
            form.reset();
            if (fieldset) fieldset.disabled = false;
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalBtnHTML;
            }
            successContainer.remove();
            form.style.display = '';
          });
        } else {
          throw new Error(result.error || 'Server rejected submission');
        }
      } catch (err) {
        console.error('Submission error:', err);
        const errorAlert = document.createElement('p');
        errorAlert.setAttribute('role', 'alert');
        errorAlert.className = 'lead-alert mt-4 rounded-xl bg-orange-soft px-4 py-3 text-sm text-ink border border-orange/30';
        errorAlert.textContent = "We couldn't send that just now. Your details are preserved — please try again, or call us directly at +91 63967 16516.";

        form.appendChild(errorAlert);

        if (fieldset) fieldset.disabled = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHTML;
        }
      }
    });
  });
}

/* ==========================================================================
   7. DYNAMIC SEO & METADATA SYNC
   ========================================================================== */
async function initDynamicSeoSync() {
  try {
    let route = window.location.pathname;
    if (route.endsWith('.html')) route = route.replace(/\.html$/, '');
    if (route.endsWith('/') && route.length > 1) route = route.slice(0, -1);
    if (!route) route = '/';

    const res = await fetch(`/api/content?type=seo&route=${encodeURIComponent(route)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.item) {
        const item = data.item;
        if (item.meta_title) document.title = item.meta_title;
        if (item.meta_description) {
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
          }
          metaDesc.content = item.meta_description;

          let ogDesc = document.querySelector('meta[property="og:description"]');
          if (ogDesc) ogDesc.content = item.meta_description;
        }
        if (item.meta_title) {
          let ogTitle = document.querySelector('meta[property="og:title"]');
          if (ogTitle) ogTitle.content = item.meta_title;
        }
      }
    }
  } catch (err) {
    // Graceful offline fallback
  }
}

/* ==========================================================================
   8. DYNAMIC AGENCY BRAND & SETTINGS SYNC
   ========================================================================== */
async function initDynamicSettingsSync() {
  try {
    const res = await fetch('/api/content?type=settings');
    if (!res.ok) return;

    const data = await res.json();
    const settings = data.item;
    if (!settings) return;

    // 1. Phone number sync
    if (settings.phone) {
      document.querySelectorAll('a[href^="tel:"]').forEach(el => {
        el.href = `tel:${encodeURIComponent(settings.phone)}`;
        if (el.textContent.includes('+91') || el.textContent.includes('63967')) {
          el.textContent = settings.phone;
        }
      });
    }

    // 2. Email sync
    if (settings.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
        el.href = `mailto:${encodeURIComponent(settings.email)}`;
        if (el.textContent.includes('@vyaaptam.com') || el.textContent.includes('hello@')) {
          el.textContent = settings.email;
        }
      });
    }

    // 3. WhatsApp link sync
    if (settings.whatsapp) {
      const cleanWa = settings.whatsapp.replace(/[^0-9]/g, '');
      document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
        el.href = `https://wa.me/${cleanWa}?text=Hello%20Vyaaptam,%20I%20would%20like%20to%20inquire%20about%20your%20services.`;
      });
    }

    // 4. Social links sync
    if (settings.social_linkedin) {
      document.querySelectorAll('a[href*="linkedin.com"]').forEach(el => {
        el.href = settings.social_linkedin;
      });
    }
    if (settings.social_instagram) {
      document.querySelectorAll('a[href*="instagram.com"]').forEach(el => {
        el.href = settings.social_instagram;
      });
    }
    if (settings.social_facebook) {
      document.querySelectorAll('a[href*="facebook.com"]').forEach(el => {
        el.href = settings.social_facebook;
      });
    }

    // 5. Dynamic Announcement Banner
    const existingBanner = document.getElementById('vyaaptam-top-announcement');
    if (settings.announcement_active && settings.announcement_text) {
      if (!existingBanner) {
        const banner = document.createElement('div');
        banner.id = 'vyaaptam-top-announcement';
        banner.style.cssText = 'width: 100%; background-color: #1b1533 !important; color: #ffffff !important; padding: 10px 16px; font-size: 13px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px; border-bottom: 1px solid #2d2252; position: relative; z-index: 40;';
        banner.innerHTML = `
          <span style="color: #ffffff !important; font-weight: 500; display: inline-flex; align-items: center; gap: 6px;">${settings.announcement_text}</span>
          <a href="/contact" style="color: #ef7a2d !important; font-weight: 700; text-decoration: underline; text-underline-offset: 4px; margin-left: 6px; transition: color 0.2s;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='#ef7a2d'">
            Book Call ↗
          </a>
        `;
        document.body.prepend(banner);
      } else {
        existingBanner.querySelector('span').textContent = settings.announcement_text;
      }
    } else if (existingBanner) {
      existingBanner.remove();
    }

    // 7. About page workspace image sync
    if (settings.about_image) {
      const aboutImg = document.getElementById('about-workspace-image') || document.querySelector('img[src*="about.webp"]');
      if (aboutImg) {
        aboutImg.src = settings.about_image;
        aboutImg.srcset = settings.about_image;
      }
    }
  } catch (err) {
    // Graceful offline fallback
  }
}

/* ==========================================================================
   11. ANIMATED BRAND ICON (Professional Floating Breathing Effect)
   ========================================================================== */
function initAnimatedBrandIcon() {
  const brandLogos = document.querySelectorAll('header img[alt*="Vyaaptam"]');
  brandLogos.forEach(logo => {
    logo.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease';
    logo.style.filter = 'drop-shadow(0 4px 10px rgba(107, 54, 200, 0.12))';
    logo.addEventListener('mouseenter', () => {
      logo.style.transform = 'translateY(-2px) scale(1.03)';
      logo.style.filter = 'drop-shadow(0 8px 18px rgba(239, 122, 45, 0.25))';
    });
    logo.addEventListener('mouseleave', () => {
      logo.style.transform = 'translateY(0) scale(1)';
      logo.style.filter = 'drop-shadow(0 4px 10px rgba(107, 54, 200, 0.12))';
    });
  });
}

/* ==========================================================================
   12. INTERACTIVE ABOUT PAGE TEAM (Face Reveal on Click)
   ========================================================================== */
async function initAboutTeamSection() {
  const grid = document.getElementById('team-cards-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/content?type=team');
    let team = [];
    if (res.ok) {
      const data = await res.json();
      team = data.items || [];
    }

    if (!team.length) {
      team = [
        { id: '1', name: 'Sanchit Khandelwal', role: 'Founder & Growth Strategist', initials: 'SK', bio: '8+ years in digital training & marketing. Trained 10,000+ professionals across India and built Vyaaptam to serve growing businesses.', image: '/img/hero.webp', linkedin: 'https://www.linkedin.com/company/vyaaptam/' },
        { id: '2', name: 'Aadil Ahmed', role: 'Sr. Full-Stack Developer', initials: 'AA', bio: 'Architect of high-performance web systems, custom apps, and secure e-commerce portals.', image: '/img/about.webp', linkedin: 'https://www.linkedin.com/company/vyaaptam/' },
        { id: '3', name: 'Nidhi Patel', role: 'SEO & Performance Lead', initials: 'NP', bio: 'Specialized in Google Maps ranking 3-packs, data-driven SEO, and organic traffic growth.', image: '/img/blog-seo.webp', linkedin: 'https://www.linkedin.com/company/vyaaptam/' },
        { id: '4', name: 'Surbhi Khandelwal', role: 'Senior Financial & Tax Consultant', initials: 'SK', bio: 'Expert in corporate compliance, GST/ITR statutory audits, and company incorporation.', image: '/img/blog-legal.webp', linkedin: 'https://www.linkedin.com/company/vyaaptam/' },
        { id: '5', name: 'Ajeet Kumar', role: 'Data Scientist & Media Buyer', initials: 'AK', bio: 'Meta & Google Ads performance specialist focused on high ROAS and conversion optimization.', image: '/img/blog-agency.webp', linkedin: 'https://www.linkedin.com/company/vyaaptam/' }
      ];
    }

    grid.innerHTML = team.map(m => `
      <li class="team-card group relative overflow-hidden rounded-3xl border border-line bg-white p-7 transition-all duration-500 hover:shadow-2xl hover:border-brand/40 cursor-pointer" onclick="toggleFaceReveal(this)" data-revealed="false">
        <!-- Front: Initials & Hook -->
        <div class="team-front flex flex-col justify-between transition-all duration-300">
          <div>
            <div class="relative mb-6 flex items-center justify-between">
              <div class="relative">
                <span class="grid size-20 place-items-center rounded-2xl bg-gradient-to-tr from-brand to-magenta text-2xl font-bold text-white shadow-md transition-transform duration-300 group-hover:scale-105">
                  ${m.initials || 'VK'}
                </span>
                <span class="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-emerald-500 text-white text-[10px] border-2 border-white shadow font-bold">✓</span>
              </div>
              <span class="rounded-full px-3 py-1 text-xs font-semibold bg-sand text-ink border border-line group-hover:bg-brand group-hover:text-white transition-all flex items-center gap-1 shadow-sm">
                <span>✨ Tap to Reveal Face</span>
              </span>
            </div>
            <h3 class="text-xl font-bold text-ink">${m.name}</h3>
            <p class="text-sm font-semibold text-brand mt-0.5">${m.role}</p>
            <p class="text-xs text-muted mt-3 line-clamp-2 leading-relaxed">${m.bio || ''}</p>
          </div>
          <div class="mt-6 pt-4 border-t border-line/60 flex items-center justify-between text-xs text-muted">
            <span class="font-medium">Vyaaptam Growth Team</span>
            <span class="font-semibold text-brand flex items-center gap-1">View Face Photo ↗</span>
          </div>
        </div>

        <!-- Back: Face Photo & Full Bio (Revealed on Tap) -->
        <div class="team-back hidden opacity-0 transition-all duration-500">
          <div class="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-sand/40 border border-line mb-4 shadow-md">
            <img src="${m.image || '/img/hero.webp'}" alt="${m.name}" class="w-full h-full object-cover transition-transform duration-700 hover:scale-105" onerror="this.src='/img/vyaaptam-logo.png'; this.className='w-full h-full object-contain p-6 bg-sand/30';"/>
            <div class="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent flex items-end p-3.5">
              <div>
                <span class="block text-xs font-bold text-white">${m.name}</span>
                <span class="block text-[11px] text-white/80">${m.role}</span>
              </div>
            </div>
          </div>
          <p class="text-xs text-ink/85 leading-relaxed bg-sand/30 p-3 rounded-xl border border-line/60">${m.bio || 'Core growth strategist driving business performance at Vyaaptam.'}</p>
          <div class="mt-4 pt-3 border-t border-line flex items-center justify-between">
            <a href="${m.linkedin || 'https://www.linkedin.com/company/vyaaptam/'}" target="_blank" rel="noreferrer" onclick="event.stopPropagation()" class="text-xs font-semibold text-violet hover:underline flex items-center gap-1">
              LinkedIn ↗
            </a>
            <button type="button" class="text-xs font-semibold text-muted hover:text-ink">✕ Flip back</button>
          </div>
        </div>
      </li>
    `).join('');
  } catch(e) {
    console.error('Error loading team:', e);
  }
}

function toggleFaceReveal(card) {
  const front = card.querySelector('.team-front');
  const back = card.querySelector('.team-back');
  const isRevealed = card.getAttribute('data-revealed') === 'true';

  if (!isRevealed) {
    front.classList.add('hidden');
    back.classList.remove('hidden');
    setTimeout(() => { back.classList.remove('opacity-0'); }, 20);
    card.setAttribute('data-revealed', 'true');
    card.classList.add('border-brand', 'ring-2', 'ring-brand/20');
  } else {
    back.classList.add('opacity-0');
    setTimeout(() => {
      back.classList.add('hidden');
      front.classList.remove('hidden');
    }, 200);
    card.setAttribute('data-revealed', 'false');
    card.classList.remove('border-brand', 'ring-2', 'ring-brand/20');
  }
}
window.toggleFaceReveal = toggleFaceReveal;

/* ==========================================================================
   13. 4-SECOND NON-INTRUSIVE SMART ARTICLE LEAD POPUP & NEWSLETTER
   ========================================================================== */
function initSmartBlogLeadPopup() {
  const isBlog = window.location.pathname.startsWith('/blog') || window.location.pathname.includes('blog');
  if (!isBlog) return;

  // Don't irritate user if closed within 7 days
  const lastDismissed = localStorage.getItem('vyaaptam_blog_popup_dismissed');
  if (lastDismissed && (Date.now() - parseInt(lastDismissed, 10)) < 7 * 24 * 60 * 60 * 1000) {
    return;
  }

  // 4-Second Reading Delay
  setTimeout(() => {
    if (document.getElementById('vyaaptam-smart-blog-popup')) return;

    const popup = document.createElement('div');
    popup.id = 'vyaaptam-smart-blog-popup';
    popup.className = 'fixed bottom-5 right-5 z-50 max-w-sm w-[92vw] sm:w-[380px] rounded-3xl bg-white border border-line shadow-2xl p-6 transition-all duration-500 translate-y-10 opacity-0';
    popup.innerHTML = `
      <div class="relative">
        <button type="button" onclick="closeSmartBlogPopup(true)" aria-label="Close" class="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-sand hover:bg-line text-ink text-xs font-bold transition">
          ✕
        </button>
        <div class="flex items-center gap-2 mb-2">
          <span class="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-magenta/10 text-magenta">Exclusive Growth Checklist</span>
          <span class="text-[11px] text-muted font-medium">Free Download</span>
        </div>
        <h4 class="text-lg font-bold text-ink leading-snug">Enjoying this article?</h4>
        <p class="text-xs text-muted mt-1 leading-relaxed">Get our daily 2-minute growth breakdowns & 2026 digital compliance checklist straight to your inbox.</p>
        
        <form onsubmit="handlePopupSubscribe(event)" class="mt-4 space-y-2.5">
          <input type="email" id="popup-sub-email" required placeholder="Enter your work email" class="form-input text-xs py-2.5 px-3.5 rounded-xl w-full border-line bg-sand/30 focus:bg-white"/>
          <input type="tel" id="popup-sub-phone" placeholder="WhatsApp Number (Optional for instant PDF)" class="form-input text-xs py-2 px-3.5 rounded-xl w-full border-line bg-sand/30 focus:bg-white"/>
          <button type="submit" id="popup-sub-btn" class="btn-brand text-xs py-2.5 px-4 w-full rounded-xl flex items-center justify-center gap-1.5 font-bold shadow-md">
            <span>Send Me Daily Insights 🚀</span>
          </button>
        </form>
        <p class="text-[10px] text-center text-muted mt-2.5">No spam ever. Unsubscribe in 1 click.</p>
      </div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => {
      popup.classList.remove('translate-y-10', 'opacity-0');
    }, 50);
  }, 4000);
}

function closeSmartBlogPopup(dontShowAgain = true) {
  const popup = document.getElementById('vyaaptam-smart-blog-popup');
  if (popup) {
    popup.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => { popup.remove(); }, 400);
  }
  if (dontShowAgain) {
    localStorage.setItem('vyaaptam_blog_popup_dismissed', String(Date.now()));
  }
}
window.closeSmartBlogPopup = closeSmartBlogPopup;

async function handlePopupSubscribe(e) {
  e.preventDefault();
  const email = document.getElementById('popup-sub-email')?.value.trim();
  const phone = document.getElementById('popup-sub-phone')?.value.trim() || '';
  const btn = document.getElementById('popup-sub-btn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Saving...</span>';
  }

  try {
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Newsletter Reader',
        email,
        phone: phone || '+91 00000 00000',
        service: 'Daily Blog Newsletter',
        message: 'Subscribed to Daily Growth Insights via 4-second article popup',
        source_page: window.location.pathname
      })
    });

    const popup = document.getElementById('vyaaptam-smart-blog-popup');
    if (popup) {
      popup.innerHTML = `
        <div class="text-center py-4 space-y-2">
          <div class="inline-grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-600 text-xl font-bold mx-auto mb-1">✓</div>
          <h4 class="text-base font-bold text-ink">You're on the list!</h4>
          <p class="text-xs text-muted">Check your inbox for our latest 2026 Growth Playbook.</p>
          <button type="button" onclick="closeSmartBlogPopup(true)" class="btn-ghost py-1.5 px-4 text-xs rounded-xl mt-2">Close</button>
        </div>
      `;
      localStorage.setItem('vyaaptam_blog_popup_dismissed', String(Date.now() + 365 * 24 * 3600 * 1000));
    }
  } catch(err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Send Me Daily Insights 🚀</span>';
    }
  }
}
window.handlePopupSubscribe = handlePopupSubscribe;

async function handleBlogSubscribe(e) {
  e.preventDefault();
  const form = e.target;
  const input = form.querySelector('input[type="email"]');
  const btn = form.querySelector('button[type="submit"]');
  const email = input ? input.value.trim() : '';

  if (!email) return;
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Subscribing...';
  }

  try {
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Newsletter Reader',
        email,
        phone: '+91 00000 00000',
        service: 'Daily Blog Newsletter',
        message: 'Subscribed via bottom article newsletter box',
        source_page: window.location.pathname
      })
    });

    form.innerHTML = '<p class="text-sm font-semibold text-emerald-300 py-2">✓ Success! You\'re subscribed to daily updates.</p>';
  } catch(err) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Subscribe Free 🚀';
    }
  }
}
window.handleBlogSubscribe = handleBlogSubscribe;

/* ==========================================================================
   14. DYNAMIC ANALYTICS & TRACKING ENGINE (GA4, Clarity, GSC)
   ========================================================================== */
function initAnalytics() {
  fetch('/api/content?type=settings')
    .then(r => r.json())
    .then(data => {
      const s = data.item || data.settings || {};
      // 1. Google Analytics 4 (GA4)
      if (s.ga4_id && s.ga4_id.startsWith('G-')) {
        if (!document.getElementById('ga4-script')) {
          const gaScript = document.createElement('script');
          gaScript.id = 'ga4-script';
          gaScript.async = true;
          gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${s.ga4_id}`;
          document.head.appendChild(gaScript);

          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', s.ga4_id);
        }
      }
      // 2. Microsoft Clarity (Heatmaps & Session Replays)
      if (s.clarity_id && !document.getElementById('clarity-script')) {
        const cScript = document.createElement('script');
        cScript.id = 'clarity-script';
        cScript.type = 'text/javascript';
        cScript.text = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${s.clarity_id}");`;
        document.head.appendChild(cScript);
      }
      // 3. Google Search Console (GSC) Verification Tag
      if (s.gsc_verification && !document.querySelector('meta[name="google-site-verification"]')) {
        const meta = document.createElement('meta');
        meta.name = 'google-site-verification';
        meta.content = s.gsc_verification;
        document.head.appendChild(meta);
      }
    })
    .catch(() => {});
}
