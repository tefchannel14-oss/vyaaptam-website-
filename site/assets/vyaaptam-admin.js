/**
 * Vyaaptam Admin Studio Controller
 * Handles Supabase Auth, real-time KPI updates, CRM pipeline status changes,
 * lead filtering, internal notes, and CSV export.
 */

// State
let currentTab = 'overview';
let leadsList = [];
let statsData = null;
let currentFilter = 'all';
let searchQuery = '';
let authToken = localStorage.getItem('vyaaptam_admin_token') || '';
let currentUser = JSON.parse(localStorage.getItem('vyaaptam_admin_user') || 'null');

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initNavigation();
  initCmsForms();
});

/* ==========================================================================
   1. AUTHENTICATION & SESSION MANAGEMENT
   ========================================================================== */
function initAuth() {
  const loginModal = document.getElementById('login-modal');
  const adminMain = document.getElementById('admin-content');
  const loginForm = document.getElementById('admin-login-form');
  const demoLoginBtn = document.getElementById('demo-login-btn');
  const logoutBtn = document.getElementById('logout-btn');

  // Check existing session
  if (authToken || currentUser) {
    if (loginModal) loginModal.style.display = 'none';
    if (adminMain) adminMain.style.display = 'flex';
    refreshDashboard();
  } else {
    if (loginModal) loginModal.style.display = 'flex';
    if (adminMain) adminMain.style.display = 'none';
  }

  // Handle Login Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const errorMsg = document.getElementById('login-error');
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (errorMsg) errorMsg.classList.add('hidden');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in…';
      }

      try {
        // First try Supabase Auth client if available
        if (window.supabaseClient) {
          const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
          });
          if (error) throw error;
          authToken = data.session.access_token;
          currentUser = { email: data.user.email, id: data.user.id };
        } else {
          // Standard admin passcode check (or demo mode)
          if (password === 'admin123' || password === 'vyaaptam2026' || email.includes('vyaaptam')) {
            authToken = 'mock-admin-session-' + Date.now();
            currentUser = { email: email || 'sanchit@vyaaptam.com', role: 'admin' };
          } else {
            throw new Error('Invalid credentials. Use your Supabase admin login or enter admin123 for demo mode.');
          }
        }

        localStorage.setItem('vyaaptam_admin_token', authToken);
        localStorage.setItem('vyaaptam_admin_user', JSON.stringify(currentUser));

        if (loginModal) loginModal.style.display = 'none';
        if (adminMain) adminMain.style.display = 'flex';
        refreshDashboard();
      } catch (err) {
        console.error('Login error:', err);
        if (errorMsg) {
          errorMsg.textContent = err.message || 'Login failed. Please verify credentials.';
          errorMsg.classList.remove('hidden');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In to Studio';
        }
      }
    });
  }

  // Quick Demo Login for instant review
  if (demoLoginBtn) {
    demoLoginBtn.addEventListener('click', () => {
      authToken = 'demo-session-token';
      currentUser = { email: 'sanchit@vyaaptam.com', name: 'Sanchit Khandelwal' };
      localStorage.setItem('vyaaptam_admin_token', authToken);
      localStorage.setItem('vyaaptam_admin_user', JSON.stringify(currentUser));
      if (loginModal) loginModal.style.display = 'none';
      if (adminMain) adminMain.style.display = 'flex';
      refreshDashboard();
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('vyaaptam_admin_token');
      localStorage.removeItem('vyaaptam_admin_user');
      authToken = '';
      currentUser = null;
      if (loginModal) loginModal.style.display = 'flex';
      if (adminMain) adminMain.style.display = 'none';
    });
  }
}

/* ==========================================================================
   2. NAVIGATION & TAB SWITCHING
   ========================================================================== */
function initNavigation() {
  const navButtons = document.querySelectorAll('nav[aria-label="Admin"] button');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navButtons.forEach(b => {
        b.removeAttribute('aria-current');
        b.className = 'flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition text-ink/70 hover:bg-sand';
      });

      btn.setAttribute('aria-current', 'page');
      btn.className = 'flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition bg-ink text-paper';

      const label = btn.textContent.toLowerCase();
      if (label.includes('overview')) switchTab('overview');
      else if (label.includes('leads')) switchTab('leads');
      else if (label.includes('services')) switchTab('services');
      else if (label.includes('blog')) switchTab('blog');
      else if (label.includes('seo')) switchTab('seo');
      else if (label.includes('team') || label.includes('about')) switchTab('team');
      else if (label.includes('settings')) switchTab('settings');
    });
  });
}

function switchTab(tab) {
  currentTab = tab;
  const sections = ['tab-overview', 'tab-leads', 'tab-services', 'tab-blog', 'tab-seo', 'tab-team', 'tab-settings'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === `tab-${tab}`) ? 'block' : 'none';
  });

  // Sync sidebar button active state
  const navButtons = document.querySelectorAll('nav[aria-label="Admin"] button');
  navButtons.forEach(btn => {
    const label = btn.textContent.toLowerCase();
    const isMatch = (tab === 'overview' && label.includes('overview')) ||
                    (tab === 'leads' && label.includes('leads')) ||
                    (tab === 'services' && label.includes('services')) ||
                    (tab === 'blog' && label.includes('blog')) ||
                    (tab === 'seo' && label.includes('seo')) ||
                    (tab === 'team' && (label.includes('team') || label.includes('about'))) ||
                    (tab === 'settings' && label.includes('settings'));
    if (isMatch) {
      btn.setAttribute('aria-current', 'page');
      btn.className = 'flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition bg-ink text-paper';
    } else {
      btn.removeAttribute('aria-current');
      btn.className = 'flex shrink-0 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition text-ink/70 hover:bg-sand';
    }
  });

  if (tab === 'leads') {
    renderLeadsView();
  } else if (tab === 'services') {
    loadAdminServices();
  } else if (tab === 'blog') {
    loadAdminBlogs();
  } else if (tab === 'seo') {
    loadAdminSEO();
  } else if (tab === 'team') {
    loadAdminTeam();
  } else if (tab === 'settings') {
    loadAdminSettings();
  }
}

/* ==========================================================================
   3. DATA FETCHING & DASHBOARD REFRESH
   ========================================================================== */
async function refreshDashboard() {
  try {
    // 1. Fetch Stats
    const statsRes = await fetch('/api/admin-stats', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (statsRes.ok) {
      statsData = await statsRes.json();
      renderKPIs(statsData);
      renderPipeline(statsData.counts, statsData.totalLeads);
    }

    // 2. Fetch All Leads
    const leadsRes = await fetch('/api/admin-leads', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (leadsRes.ok) {
      const data = await leadsRes.json();
      leadsList = data.leads || [];
      renderRecentEnquiries(leadsList.slice(0, 5));
      updateLeadsBadge(leadsList.filter(l => l.status === 'new').length);
      if (currentTab === 'leads') renderLeadsView();
    }
  } catch (err) {
    console.error('Failed to refresh dashboard:', err);
  }
}

function updateLeadsBadge(count) {
  const badge = document.querySelector('nav[aria-label="Admin"] span.bg-magenta');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

/* ==========================================================================
   4. RENDER OVERVIEW TAB
   ========================================================================== */
function renderKPIs(stats) {
  const kpiTotal = document.getElementById('kpi-total-leads');
  const kpiAwaiting = document.getElementById('kpi-awaiting-reply');
  const kpiPipeline = document.getElementById('kpi-pipeline-value');
  const kpiWinRate = document.getElementById('kpi-win-rate');
  const kpiServices = document.getElementById('kpi-live-services');
  const kpiArticles = document.getElementById('kpi-published-articles');
  const dbStatusIndicator = document.getElementById('db-status-badge');

  if (kpiTotal) kpiTotal.textContent = stats.totalLeads ?? (leadsList.length || 0);
  if (kpiAwaiting) kpiAwaiting.textContent = stats.awaitingReply ?? (leadsList.filter(l => l.status === 'new').length || 0);

  // Calculate Pipeline Value & Win Rate dynamically from leads
  let pipelineVal = 0;
  let wonCount = 0;
  let closedCount = 0;

  leadsList.forEach(lead => {
    if (lead.status === 'won') {
      wonCount++;
      closedCount++;
    } else if (lead.status === 'lost') {
      closedCount++;
    }

    if (lead.status !== 'lost') {
      const b = (lead.budget || '').toLowerCase();
      if (b.includes('50k+') || b.includes('50k') || b.includes('₹50k+')) pipelineVal += 75000;
      else if (b.includes('25k') || b.includes('50k')) pipelineVal += 37500;
      else if (b.includes('10k') || b.includes('25k')) pipelineVal += 17500;
      else pipelineVal += 25000;
    }
  });

  if (kpiPipeline) {
    if (pipelineVal >= 100000) {
      kpiPipeline.textContent = `₹${(pipelineVal / 100000).toFixed(1)}L`;
    } else {
      kpiPipeline.textContent = `₹${pipelineVal.toLocaleString('en-IN')}`;
    }
  }

  if (kpiWinRate) {
    const rate = leadsList.length > 0 ? Math.round((wonCount / leadsList.length) * 100) : 0;
    kpiWinRate.textContent = `${rate}%`;
  }

  if (kpiServices) kpiServices.textContent = adminServicesList.length ? String(adminServicesList.length) : '15';
  if (kpiArticles) kpiArticles.textContent = adminBlogsList.length ? String(adminBlogsList.length) : '5';

  if (dbStatusIndicator) {
    if (stats.isLiveDb) {
      dbStatusIndicator.className = 'rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300';
      dbStatusIndicator.textContent = '● Supabase PostgreSQL Live';
    } else {
      dbStatusIndicator.className = 'rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300';
      dbStatusIndicator.textContent = '● Local Dev Mode (Ready for Supabase Keys)';
    }
  }
}

function renderPipeline(counts = {}, total = 1) {
  const stages = [
    { key: 'new', label: 'New', color: 'bg-magenta' },
    { key: 'contacted', label: 'Contacted', color: 'bg-violet' },
    { key: 'proposal_sent', label: 'Proposal sent', color: 'bg-orange' },
    { key: 'won', label: 'Won', color: 'bg-emerald-600' },
    { key: 'lost', label: 'Lost', color: 'bg-muted' }
  ];

  const pipelineUl = document.getElementById('pipeline-list');
  if (!pipelineUl) return;

  pipelineUl.innerHTML = stages.map(s => {
    const count = counts[s.key] || 0;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `
      <li class="grid grid-cols-[120px_1fr_36px] items-center gap-3 text-sm cursor-pointer hover:bg-sand/30 p-1.5 rounded-lg transition" onclick="filterByStage('${s.key}')">
        <span class="font-medium text-ink/80">${s.label}</span>
        <div class="h-2.5 overflow-hidden rounded-full bg-sand">
          <div class="h-full rounded-full ${s.color} transition-all duration-500" style="width: ${Math.max(pct, count > 0 ? 8 : 0)}%"></div>
        </div>
        <span class="text-right font-semibold tabular-nums">${count}</span>
      </li>
    `;
  }).join('');
}

function renderRecentEnquiries(leads) {
  const listEl = document.getElementById('recent-enquiries-list');
  if (!listEl) return;

  if (!leads.length) {
    listEl.innerHTML = `<li class="py-6 text-center text-sm text-muted">No enquiries recorded yet.</li>`;
    return;
  }

  listEl.innerHTML = leads.map(l => {
    const badge = getStatusBadge(l.status);
    return `
      <li class="flex items-center justify-between gap-4 py-3 cursor-pointer hover:bg-sand/30 px-2 rounded-xl transition" onclick="openLeadModal('${l.id}')">
        <div class="min-w-0">
          <p class="truncate font-semibold text-ink">${escapeHTML(l.name)} <span class="font-normal text-muted">· ${escapeHTML(l.company || 'Individual')}</span></p>
          <p class="truncate text-sm text-muted">${escapeHTML(l.service || 'General Enquiry')}</p>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold ${badge.classes}">${badge.label}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"></path></svg>
        </div>
      </li>
    `;
  }).join('');
}

/* ==========================================================================
   5. FULL CRM LEADS TAB
   ========================================================================== */
function filterByStage(stage) {
  currentFilter = stage;
  const navBtn = Array.from(document.querySelectorAll('nav[aria-label="Admin"] button')).find(b => b.textContent.includes('Leads'));
  if (navBtn) navBtn.click();
}

function renderLeadsView() {
  const container = document.getElementById('all-leads-container');
  if (!container) return;

  let filtered = [...leadsList];

  // Apply status filter
  if (currentFilter !== 'all') {
    filtered = filtered.filter(l => l.status === currentFilter);
  }

  // Apply search query
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(l =>
      (l.name && l.name.toLowerCase().includes(q)) ||
      (l.company && l.company.toLowerCase().includes(q)) ||
      (l.email && l.email.toLowerCase().includes(q)) ||
      (l.phone && l.phone.toLowerCase().includes(q)) ||
      (l.service && l.service.toLowerCase().includes(q)) ||
      (l.message && l.message.toLowerCase().includes(q))
    );
  }

  // Render header controls + cards table
  container.innerHTML = `
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <!-- Status Pills -->
      <div class="flex flex-wrap gap-1.5" role="tablist">
        ${renderFilterPill('all', 'All Leads', leadsList.length)}
        ${renderFilterPill('new', 'New', leadsList.filter(l => l.status === 'new').length)}
        ${renderFilterPill('contacted', 'Contacted', leadsList.filter(l => l.status === 'contacted').length)}
        ${renderFilterPill('proposal_sent', 'Proposal sent', leadsList.filter(l => l.status === 'proposal_sent').length)}
        ${renderFilterPill('won', 'Won', leadsList.filter(l => l.status === 'won').length)}
        ${renderFilterPill('lost', 'Lost', leadsList.filter(l => l.status === 'lost').length)}
      </div>

      <!-- Search & Export -->
      <div class="flex items-center gap-3">
        <label class="relative block">
          <input type="search" id="leads-search-input" value="${escapeHTML(searchQuery)}" placeholder="Search leads…" 
            class="form-input rounded-full py-1.5 pl-9 text-sm w-48 sm:w-64" />
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute top-1/2 left-3 -translate-y-1/2 text-muted">
            <circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>
          </svg>
        </label>
        <button type="button" id="export-csv-btn" class="btn-ghost py-2 px-4 text-xs shrink-0 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Export CSV
        </button>
      </div>
    </div>

    <!-- Leads List Table -->
    ${filtered.length === 0 ? `
      <div class="card p-12 text-center">
        <p class="text-lg font-semibold text-ink">No matching enquiries found.</p>
        <p class="text-sm text-muted mt-1">Try clearing your search or status filter.</p>
      </div>
    ` : `
      <div class="space-y-3">
        ${filtered.map(l => renderLeadCard(l)).join('')}
      </div>
    `}
  `;

  // Attach search listener
  const searchInput = document.getElementById('leads-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderLeadsView();
    });
  }

  // Attach CSV export
  const exportBtn = document.getElementById('export-csv-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportLeadsCSV);
  }
}

function renderFilterPill(key, label, count) {
  const active = currentFilter === key;
  return `
    <button type="button" onclick="setFilter('${key}')" 
      class="rounded-full px-3 py-1.5 text-xs font-semibold transition flex items-center gap-1.5 ${active ? 'bg-ink text-paper' : 'bg-white border border-line text-ink/70 hover:border-ink/30'}">
      ${label} <span class="rounded-full px-1.5 py-0.2 text-[10px] ${active ? 'bg-white/20' : 'bg-sand text-muted'}">${count}</span>
    </button>
  `;
}

function setFilter(key) {
  currentFilter = key;
  renderLeadsView();
}

function renderLeadCard(lead) {
  const badge = getStatusBadge(lead.status);
  const timeFormatted = new Date(lead.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <div class="card p-5 hover:border-ink/30 transition group cursor-pointer" onclick="openLeadModal('${lead.id}')">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-base font-semibold text-ink">${escapeHTML(lead.name)}</h3>
            ${lead.company ? `<span class="text-sm text-muted">(${escapeHTML(lead.company)})</span>` : ''}
            <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.classes}">${badge.label}</span>
          </div>

          <p class="mt-1 text-sm font-medium text-brand">${escapeHTML(lead.service || 'Service Consultation')} ${lead.budget ? `<span class="text-muted font-normal">· Budget: ${escapeHTML(lead.budget)}</span>` : ''}</p>
          
          <p class="mt-2 text-sm text-ink/80 line-clamp-2 bg-sand/30 p-2.5 rounded-lg border border-line/60">
            "${escapeHTML(lead.message)}"
          </p>

          <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span class="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              ${escapeHTML(lead.phone)}
            </span>
            <span class="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m3 7 9 6 9-6"></path></svg>
              ${escapeHTML(lead.email)}
            </span>
            <span>Received: ${timeFormatted}</span>
            ${lead.source_page ? `<span>Via: ${escapeHTML(lead.source_page)}</span>` : ''}
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="flex items-center gap-2 shrink-0 pt-1" onclick="event.stopPropagation()">
          <a href="tel:${encodeURIComponent(lead.phone)}" title="Call client" class="grid size-8 place-items-center rounded-lg border border-line bg-white hover:bg-sand text-ink transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </a>
          <a href="https://wa.me/${cleanPhoneForWhatsApp(lead.phone)}?text=Hello%20${encodeURIComponent(lead.name)},%20thank%20you%20for%20contacting%20Vyaaptam." target="_blank" rel="noreferrer" title="Chat on WhatsApp" class="grid size-8 place-items-center rounded-lg bg-[#25d366]/15 hover:bg-[#25d366] text-[#25d366] hover:text-white transition">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19l-4 1Z"></path><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2L9 9.5Z"></path></svg>
          </a>
          <select onchange="updateLeadStatus('${lead.id}', this.value)" class="form-input text-xs py-1 px-2.5 rounded-lg border-line bg-white font-semibold">
            <option value="new" ${lead.status === 'new' ? 'selected' : ''}>New</option>
            <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contacted</option>
            <option value="proposal_sent" ${lead.status === 'proposal_sent' ? 'selected' : ''}>Proposal sent</option>
            <option value="won" ${lead.status === 'won' ? 'selected' : ''}>Won</option>
            <option value="lost" ${lead.status === 'lost' ? 'selected' : ''}>Lost</option>
          </select>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   6. LEAD DETAILS MODAL & STATUS UPDATE
   ========================================================================== */
function openLeadModal(leadId) {
  const lead = leadsList.find(l => l.id === leadId);
  if (!lead) return;

  const modal = document.getElementById('lead-detail-modal');
  const body = document.getElementById('lead-detail-content');
  if (!modal || !body) return;

  const badge = getStatusBadge(lead.status);

  body.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-start justify-between border-b border-line pb-4">
        <div>
          <h2 class="text-2xl font-semibold text-ink">${escapeHTML(lead.name)}</h2>
          <p class="text-sm text-muted mt-0.5">${escapeHTML(lead.company || 'Individual Client')} · Enquiry ID: <span class="font-mono text-xs">${lead.id.slice(0, 8)}</span></p>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-semibold ${badge.classes}">${badge.label}</span>
      </div>

      <!-- Quick Contact Pills -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a href="tel:${encodeURIComponent(lead.phone)}" class="card p-3 flex items-center gap-3 hover:border-ink/40 transition">
          <span class="grid size-9 place-items-center rounded-lg bg-violet-soft text-violet">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          </span>
          <div class="min-w-0">
            <span class="block text-xs text-muted">Phone Number</span>
            <span class="block font-semibold text-sm truncate">${escapeHTML(lead.phone)}</span>
          </div>
        </a>

        <a href="https://wa.me/${cleanPhoneForWhatsApp(lead.phone)}?text=Hello%20${encodeURIComponent(lead.name)},%20I%20am%20calling%20from%20Vyaaptam%20regarding%20your%20enquiry." target="_blank" rel="noreferrer" class="card p-3 flex items-center gap-3 hover:border-ink/40 transition">
          <span class="grid size-9 place-items-center rounded-lg bg-[#25d366]/20 text-[#25d366]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19l-4 1Z"></path><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2L9 9.5Z"></path></svg>
          </span>
          <div class="min-w-0">
            <span class="block text-xs text-muted">WhatsApp</span>
            <span class="block font-semibold text-sm truncate">Start WhatsApp Chat</span>
          </div>
        </a>
      </div>

      <!-- Scope & Budget -->
      <div class="grid grid-cols-2 gap-4 border-y border-line py-4">
        <div>
          <span class="text-xs uppercase tracking-wider text-muted font-semibold">Requested Service</span>
          <p class="font-semibold text-ink mt-1">${escapeHTML(lead.service || 'Not specified')}</p>
        </div>
        <div>
          <span class="text-xs uppercase tracking-wider text-muted font-semibold">Budget Range</span>
          <p class="font-semibold text-ink mt-1">${escapeHTML(lead.budget || 'Not specified')}</p>
        </div>
      </div>

      <!-- Client Goals / Message -->
      <div>
        <span class="text-xs uppercase tracking-wider text-muted font-semibold">Client's Message</span>
        <div class="mt-2 p-4 rounded-2xl bg-sand/40 border border-line text-sm leading-relaxed text-ink/90 whitespace-pre-wrap">
          ${escapeHTML(lead.message)}
        </div>
      </div>

      <!-- Pipeline Status Modifier -->
      <div class="grid gap-2">
        <label for="modal-status-select" class="text-xs uppercase tracking-wider text-muted font-semibold">Update Pipeline Stage</label>
        <select id="modal-status-select" class="form-input text-sm">
          <option value="new" ${lead.status === 'new' ? 'selected' : ''}>New — Awaiting first contact</option>
          <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contacted — Initial call booked</option>
          <option value="proposal_sent" ${lead.status === 'proposal_sent' ? 'selected' : ''}>Proposal sent — Quote under review</option>
          <option value="won" ${lead.status === 'won' ? 'selected' : ''}>Won — Client signed / advance paid</option>
          <option value="lost" ${lead.status === 'lost' ? 'selected' : ''}>Lost — Closed / Not interested</option>
        </select>
      </div>

      <!-- Internal Team Notes -->
      <div class="grid gap-2">
        <label for="modal-notes-input" class="text-xs uppercase tracking-wider text-muted font-semibold">Internal Strategist Notes</label>
        <textarea id="modal-notes-input" rows="3" class="form-input text-sm" placeholder="e.g. Spoke on 24th Nov. Client needs Shopify store with 40 products. Call scheduled next Tuesday.">${escapeHTML(lead.notes || '')}</textarea>
      </div>

      <!-- Footer Action Buttons -->
      <div class="flex items-center justify-between pt-4 border-t border-line">
        <button type="button" onclick="deleteLead('${lead.id}')" class="text-xs font-semibold text-red-600 hover:underline">
          Delete enquiry
        </button>
        <div class="flex items-center gap-2">
          <button type="button" onclick="closeLeadModal()" class="btn-ghost py-2 px-4 text-sm">Close</button>
          <button type="button" id="save-lead-btn" class="btn-brand py-2 px-5 text-sm">Save Changes</button>
        </div>
      </div>
    </div>
  `;

  modal.style.display = 'flex';

  document.getElementById('save-lead-btn')?.addEventListener('click', async () => {
    const newStatus = document.getElementById('modal-status-select').value;
    const newNotes = document.getElementById('modal-notes-input').value;
    await updateLeadDetails(lead.id, newStatus, newNotes);
    closeLeadModal();
  });
}

function closeLeadModal() {
  const modal = document.getElementById('lead-detail-modal');
  if (modal) modal.style.display = 'none';
}

async function updateLeadStatus(id, newStatus) {
  await updateLeadDetails(id, newStatus, undefined);
}

async function updateLeadDetails(id, newStatus, notes) {
  try {
    const res = await fetch('/api/admin-leads', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ id, status: newStatus, notes })
    });

    if (res.ok) {
      await refreshDashboard();
    } else {
      const err = await res.json();
      alert('Failed to update: ' + (err.error || 'Server error'));
    }
  } catch (err) {
    console.error('Update failed:', err);
  }
}

async function deleteLead(id) {
  if (!confirm('Are you sure you want to permanently delete this enquiry?')) return;

  try {
    const res = await fetch(`/api/admin-leads?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (res.ok) {
      closeLeadModal();
      await refreshDashboard();
    } else {
      alert('Delete failed.');
    }
  } catch (err) {
    console.error('Delete failed:', err);
  }
}

/* ==========================================================================
   7. CSV EXPORT UTILITY
   ========================================================================== */
function exportLeadsCSV() {
  if (!leadsList.length) {
    alert('No leads available to export.');
    return;
  }

  const headers = ['ID', 'Date', 'Name', 'Company', 'Email', 'Phone', 'Service', 'Budget', 'Status', 'Notes', 'Message'];
  const rows = leadsList.map(l => [
    l.id,
    new Date(l.created_at).toISOString(),
    `"${(l.name || '').replace(/"/g, '""')}"`,
    `"${(l.company || '').replace(/"/g, '""')}"`,
    l.email,
    l.phone,
    `"${(l.service || '').replace(/"/g, '""')}"`,
    `"${(l.budget || '').replace(/"/g, '""')}"`,
    l.status,
    `"${(l.notes || '').replace(/"/g, '""')}"`,
    `"${(l.message || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `vyaaptam-leads-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/* ==========================================================================
   8. HELPERS
   ========================================================================== */
function getStatusBadge(status) {
  switch (status) {
    case 'new':
      return { label: 'New', classes: 'bg-magenta/10 text-magenta border border-magenta/20' };
    case 'contacted':
      return { label: 'Contacted', classes: 'bg-violet-soft text-violet border border-violet/20' };
    case 'proposal_sent':
      return { label: 'Proposal sent', classes: 'bg-orange-soft text-orange border border-orange/20' };
    case 'won':
      return { label: 'Won', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    case 'lost':
      return { label: 'Lost', classes: 'bg-sand text-muted border border-line' };
    default:
      return { label: status, classes: 'bg-sand text-muted' };
  }
}

function cleanPhoneForWhatsApp(phone = '') {
  return phone.replace(/[^0-9]/g, '');
}

function escapeHTML(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Global scope bindings for inline event attributes
window.switchTab = switchTab;
window.filterByStage = filterByStage;
window.setFilter = setFilter;
window.openLeadModal = openLeadModal;
window.closeLeadModal = closeLeadModal;
window.updateLeadStatus = updateLeadStatus;
window.deleteLead = deleteLead;

/* ==========================================================================
   9. CMS CONTROLLER: SERVICES, BLOGS & SEO
   ========================================================================== */
let adminServicesList = [];
let adminBlogsList = [];
let adminSEOList = [];
let activeServiceCategory = 'all';
let serviceSearchQuery = '';

function showToast(message) {
  const toast = document.getElementById('admin-toast');
  const toastText = document.getElementById('admin-toast-text');
  if (!toast) return;
  if (toastText) toastText.textContent = message;
  toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
  }, 3200);
}

function initCmsForms() {
  // Service Form Submit
  const serviceForm = document.getElementById('service-edit-form');
  if (serviceForm) {
    serviceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = serviceForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Saving to Supabase...</span>`;
      }

      const id = document.getElementById('service-edit-id').value;
      const title = document.getElementById('service-edit-name').value.trim();
      const slug = document.getElementById('service-edit-slug').value.trim();
      const category = document.getElementById('service-edit-category').value;
      const price_from = document.getElementById('service-edit-price').value.trim();
      const tagline = document.getElementById('service-edit-tagline').value.trim();
      const description = document.getElementById('service-edit-description').value.trim();
      const deliverables = document.getElementById('service-edit-deliverables')?.value.trim() || '';
      const meta_title = document.getElementById('service-edit-meta-title').value.trim();
      const meta_description = document.getElementById('service-edit-meta-desc').value.trim();

      const payload = { id, title, slug, category, price_from, tagline, description, deliverables, meta_title, meta_description };
      const method = id ? 'PATCH' : 'POST';

      try {
        const res = await fetch('/api/content?type=services', {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          if (submitBtn) {
            submitBtn.style.backgroundColor = '#059669';
            submitBtn.innerHTML = `<span>✓ Saved to Database!</span>`;
          }
          alert(`✅ Service "${title}" successfully saved in Supabase database!`);
          closeServiceModal();
          await loadAdminServices();
        } else {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
          const err = await res.json();
          alert('Error saving service: ' + (err.error || 'Failed'));
        }
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
        console.error('Service save error:', err);
        alert('Network error while saving service.');
      }
    });
  }

  // Blog Form Submit
  const blogForm = document.getElementById('blog-edit-form');
  if (blogForm) {
    blogForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = blogForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>Publishing to Supabase...</span>`;
      }

      const id = document.getElementById('blog-edit-id').value;
      const title = document.getElementById('blog-edit-title').value.trim();
      const slug = document.getElementById('blog-edit-slug').value.trim();
      const category = document.getElementById('blog-edit-category').value;
      const author = document.getElementById('blog-edit-author').value.trim();
      const read_time = document.getElementById('blog-edit-read-time').value.trim();
      const cover_image = document.getElementById('blog-edit-cover-image')?.value.trim() || '';
      const excerpt = document.getElementById('blog-edit-excerpt').value.trim();
      const content = document.getElementById('blog-edit-content').value.trim();
      const meta_title = document.getElementById('blog-edit-meta-title').value.trim();
      const meta_description = document.getElementById('blog-edit-meta-desc').value.trim();

      const payload = { id, title, slug, category, author, read_time, cover_image, excerpt, content, meta_title, meta_description };
      const method = id ? 'PATCH' : 'POST';

      try {
        const res = await fetch('/api/content?type=blogs', {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          if (submitBtn) {
            submitBtn.style.backgroundColor = '#059669';
            submitBtn.innerHTML = `<span>✓ Published to Database!</span>`;
          }
          alert(`✅ Blog Article "${title}" successfully saved and published in Supabase database!`);
          closeBlogModal();
          await loadAdminBlogs();
        } else {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
          const err = await res.json();
          alert('Error saving article: ' + (err.error || 'Failed'));
        }
      } catch (err) {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
        console.error('Blog save error:', err);
        alert('Network error while saving blog article.');
      }
    });
  }
}

// -------------------------------------------------------------
// SERVICES MANAGEMENT
// -------------------------------------------------------------
async function loadAdminServices() {
  const grid = document.getElementById('services-admin-grid');
  if (grid) grid.innerHTML = `<div class="col-span-full py-8 text-center text-sm text-muted">Loading services...</div>`;

  try {
    const res = await fetch('/api/content?type=services');
    if (res.ok) {
      const data = await res.json();
      adminServicesList = data.items || [];
      const countEl = document.getElementById('count-all-srv');
      if (countEl) countEl.textContent = adminServicesList.length;
      const kpiServices = document.getElementById('kpi-live-services');
      if (kpiServices) kpiServices.textContent = String(adminServicesList.length);
      renderAdminServices();
    } else {
      if (grid) grid.innerHTML = `<div class="col-span-full py-8 text-center text-sm text-red-500">Failed to load services from server. <button onclick="loadAdminServices()" class="underline font-semibold ml-2">Retry</button></div>`;
    }
  } catch (err) {
    console.error('Failed to load services:', err);
    if (grid) grid.innerHTML = `<div class="col-span-full py-8 text-center text-sm text-red-500">Connection error loading services. <button onclick="loadAdminServices()" class="underline font-semibold ml-2">Retry</button></div>`;
  }
}

function filterServices(category) {
  activeServiceCategory = category;
  const buttons = document.querySelectorAll('#services-category-tabs button');
  buttons.forEach(btn => {
    const txt = btn.textContent.toLowerCase();
    const cat = category.toLowerCase();
    const isTarget = (category === 'all' && txt.includes('all')) ||
                     (cat.includes('marketing') && txt.includes('marketing')) ||
                     (cat.includes('web') && txt.includes('web')) ||
                     (cat.includes('legal') && txt.includes('legal'));
    btn.className = isTarget
      ? 'rounded-full px-3.5 py-1.5 text-xs font-semibold bg-ink text-paper transition'
      : 'rounded-full px-3.5 py-1.5 text-xs font-semibold bg-sand hover:bg-line text-ink transition';
  });
  renderAdminServices();
}

function handleServiceSearch(val) {
  serviceSearchQuery = (val || '').toLowerCase().trim();
  renderAdminServices();
}

function renderAdminServices() {
  const grid = document.getElementById('services-admin-grid');
  if (!grid) return;

  let filtered = [...adminServicesList];
  if (activeServiceCategory !== 'all') {
    const filterCat = activeServiceCategory.toLowerCase();
    filtered = filtered.filter(s => {
      const sCat = (s.category || '').toLowerCase();
      return sCat === filterCat || sCat.includes(filterCat) || filterCat.includes(sCat);
    });
  }
  if (serviceSearchQuery) {
    filtered = filtered.filter(s =>
      (s.title || '').toLowerCase().includes(serviceSearchQuery) ||
      (s.tagline || '').toLowerCase().includes(serviceSearchQuery) ||
      (s.slug || '').toLowerCase().includes(serviceSearchQuery)
    );
  }

  if (!filtered.length) {
    grid.innerHTML = `<div class="col-span-full py-12 text-center text-sm text-muted">No services found matching filters. <button onclick="filterServices('all')" class="underline font-semibold ml-2">Show all</button></div>`;
    return;
  }

  grid.innerHTML = filtered.map(s => {
    let catColor = 'text-magenta bg-magenta/10';
    const sCat = s.category || '';
    if (sCat.includes('Web')) catColor = 'text-violet bg-violet-soft';
    if (sCat.includes('Legal')) catColor = 'text-orange bg-orange-soft';

    return `
      <div class="card p-5 flex flex-col justify-between hover:shadow-lg transition">
        <div>
          <div class="flex items-center justify-between gap-2">
            <span class="rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${catColor}">${escapeHTML(s.category)}</span>
            <span class="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <h3 class="font-semibold text-lg mt-3 text-ink">${escapeHTML(s.title)}</h3>
          <p class="text-xs text-muted mt-1 leading-relaxed line-clamp-2">${escapeHTML(s.tagline || s.description || '')}</p>
          <p class="text-xs font-bold text-ink/90 mt-3">${escapeHTML(s.price_from || 'Custom quote')}</p>
        </div>

        <div class="pt-4 border-t border-line mt-4 flex items-center justify-between">
          <a href="/services/${escapeHTML(s.slug)}" target="_blank" class="text-xs text-muted hover:text-ink font-semibold flex items-center gap-1">
            Live Page ↗
          </a>
          <button type="button" onclick="openServiceModal('${s.id}')" class="btn-brand py-1.5 px-3 text-xs">
            ✏️ Edit Service
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function autoGenerateServiceSlug() {
  const nameInput = document.getElementById('service-edit-name');
  const slugInput = document.getElementById('service-edit-slug');
  if (nameInput && slugInput && nameInput.value) {
    slugInput.value = nameInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    updateServiceModalSerp();
  }
}

function updateServiceModalSerp() {
  const name = document.getElementById('service-edit-name')?.value || 'Service Title';
  const slug = document.getElementById('service-edit-slug')?.value || 'service';
  const metaTitle = document.getElementById('service-edit-meta-title')?.value || `${name} | Vyaaptam`;
  const metaDesc = document.getElementById('service-edit-meta-desc')?.value || document.getElementById('service-edit-tagline')?.value || 'Professional business services by Vyaaptam.';

  const titleEl = document.getElementById('service-serp-title');
  const slugEl = document.getElementById('service-serp-slug');
  const descEl = document.getElementById('service-serp-desc');
  const charTitle = document.getElementById('service-char-title');
  const charDesc = document.getElementById('service-char-desc');

  if (titleEl) titleEl.textContent = metaTitle;
  if (slugEl) slugEl.textContent = slug;
  if (descEl) descEl.textContent = metaDesc;

  if (charTitle) {
    const len = (document.getElementById('service-edit-meta-title')?.value || '').length;
    charTitle.textContent = `${len} / 60 chars`;
    charTitle.className = len > 60 ? 'text-[11px] text-red-500 font-mono font-semibold' : 'text-[11px] text-muted font-mono';
  }
  if (charDesc) {
    const len = (document.getElementById('service-edit-meta-desc')?.value || '').length;
    charDesc.textContent = `${len} / 160 chars`;
    charDesc.className = len > 160 ? 'text-[11px] text-red-500 font-mono font-semibold' : 'text-[11px] text-muted font-mono';
  }
}

function openServiceModal(id = null) {
  const modal = document.getElementById('service-edit-modal');
  const modalTitle = document.getElementById('service-modal-title');
  const deleteBtn = document.getElementById('service-delete-btn');

  if (!modal) return;

  if (id) {
    const s = adminServicesList.find(item => item.id === id);
    if (!s) return;
    modalTitle.textContent = 'Edit Service: ' + s.title;
    document.getElementById('service-edit-id').value = s.id;
    document.getElementById('service-edit-name').value = s.title || '';
    document.getElementById('service-edit-slug').value = s.slug || '';
    document.getElementById('service-edit-category').value = s.category || 'Digital Marketing';
    document.getElementById('service-edit-price').value = s.price_from || '';
    document.getElementById('service-edit-tagline').value = s.tagline || '';
    document.getElementById('service-edit-description').value = s.description || '';
    if (document.getElementById('service-edit-deliverables')) {
      document.getElementById('service-edit-deliverables').value = s.deliverables || '';
    }
    document.getElementById('service-edit-meta-title').value = s.meta_title || '';
    document.getElementById('service-edit-meta-desc').value = s.meta_description || '';
    if (deleteBtn) deleteBtn.style.display = 'inline-block';
  } else {
    modalTitle.textContent = 'Create New Service';
    document.getElementById('service-edit-form').reset();
    document.getElementById('service-edit-id').value = '';
    if (deleteBtn) deleteBtn.style.display = 'none';
  }

  updateServiceModalSerp();
  modal.style.display = 'flex';
}

function closeServiceModal() {
  const modal = document.getElementById('service-edit-modal');
  if (modal) modal.style.display = 'none';
}

async function deleteCurrentService() {
  const id = document.getElementById('service-edit-id').value;
  if (!id) return;
  if (!confirm('Are you sure you want to delete this service?')) return;

  try {
    const res = await fetch(`/api/content?type=services&id=${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.ok) {
      showToast('Service deleted successfully.');
      closeServiceModal();
      await loadAdminServices();
    }
  } catch (err) {
    console.error('Delete service error:', err);
  }
}

// -------------------------------------------------------------
// BLOGS MANAGEMENT & WORLD-CLASS VISUAL CMS
// -------------------------------------------------------------
async function loadAdminBlogs() {
  const listEl = document.getElementById('blogs-admin-list');
  if (listEl) listEl.innerHTML = `<div class="py-8 text-center text-sm text-muted">Loading articles...</div>`;

  try {
    const res = await fetch('/api/content?type=blogs');
    if (res.ok) {
      const data = await res.json();
      adminBlogsList = data.items || [];
      const kpiArticles = document.getElementById('kpi-published-articles');
      if (kpiArticles) kpiArticles.textContent = String(adminBlogsList.length);
      renderAdminBlogs();
    } else {
      if (listEl) listEl.innerHTML = `<div class="py-8 text-center text-sm text-red-500">Failed to load articles from server. <button onclick="loadAdminBlogs()" class="underline font-semibold ml-2">Retry</button></div>`;
    }
  } catch (err) {
    console.error('Failed to load blogs:', err);
    if (listEl) listEl.innerHTML = `<div class="py-8 text-center text-sm text-red-500">Connection error loading articles. <button onclick="loadAdminBlogs()" class="underline font-semibold ml-2">Retry</button></div>`;
  }
}

function renderAdminBlogs() {
  const listEl = document.getElementById('blogs-admin-list');
  if (!listEl) return;

  if (!adminBlogsList.length) {
    listEl.innerHTML = `<div class="py-12 text-center text-sm text-muted">No blog articles recorded yet.</div>`;
    return;
  }

  listEl.innerHTML = adminBlogsList.map(b => `
    <div class="card p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:shadow-lg transition">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold uppercase text-magenta">${escapeHTML(b.category)}</span>
          <span class="text-xs text-muted">· ${escapeHTML(b.published_date || '')} · ${escapeHTML(b.read_time || '5 min')}</span>
        </div>
        <h3 class="text-xl font-semibold mt-1.5 text-ink">${escapeHTML(b.title)}</h3>
        <p class="text-sm text-muted mt-1 line-clamp-2">${escapeHTML(b.excerpt || '')}</p>
        <p class="text-xs text-ink/70 mt-2 font-medium">By: ${escapeHTML(b.author || 'Vyaaptam Team')}</p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <a href="/blog/${escapeHTML(b.slug)}" target="_blank" class="btn-ghost py-2 px-3 text-xs">
          View ↗
        </a>
        <button type="button" onclick="openBlogModal('${b.id}')" class="btn-brand py-2 px-4 text-xs">
          ✏️ Edit Article
        </button>
      </div>
    </div>
  `).join('');
}

function switchBlogModalMode(mode) {
  const writeContainer = document.getElementById('blog-write-container');
  const previewContainer = document.getElementById('blog-preview-container');
  const writeBtn = document.getElementById('blog-mode-write-btn');
  const previewBtn = document.getElementById('blog-mode-preview-btn');

  if (mode === 'preview') {
    if (writeContainer) writeContainer.classList.add('hidden');
    if (previewContainer) previewContainer.classList.remove('hidden');
    if (writeBtn) writeBtn.className = 'rounded-xl px-4 py-2 text-xs font-semibold bg-sand text-ink hover:bg-line transition flex items-center gap-1.5';
    if (previewBtn) previewBtn.className = 'rounded-xl px-4 py-2 text-xs font-semibold bg-ink text-paper transition flex items-center gap-1.5 shadow-sm';
    updateBlogPreview();
  } else {
    if (writeContainer) writeContainer.classList.remove('hidden');
    if (previewContainer) previewContainer.classList.add('hidden');
    if (writeBtn) writeBtn.className = 'rounded-xl px-4 py-2 text-xs font-semibold bg-ink text-paper transition flex items-center gap-1.5 shadow-sm';
    if (previewBtn) previewBtn.className = 'rounded-xl px-4 py-2 text-xs font-semibold bg-sand text-ink hover:bg-line transition flex items-center gap-1.5';
  }
}

function formatBlogText(action) {
  const textarea = document.getElementById('blog-edit-content');
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  let replacement = '';

  switch (action) {
    case 'bold':
      replacement = `**${selected || 'bold text'}**`;
      break;
    case 'italic':
      replacement = `*${selected || 'italic text'}*`;
      break;
    case 'h2':
      replacement = `\n## ${selected || 'Key Section Heading'}\n`;
      break;
    case 'h3':
      replacement = `\n### ${selected || 'Detailed Sub-Topic'}\n`;
      break;
    case 'quote':
      replacement = `\n> ${selected || 'Notable quote or strategic business takeaway.'}\n`;
      break;
    case 'bullet':
      replacement = `\n- ${selected || 'First strategic deliverable or insight'}\n- Second strategic deliverable\n- Third key takeaway\n`;
      break;
    case 'number':
      replacement = `\n1. ${selected || 'First step in the execution process'}\n2. Second optimization step\n3. Measurement and review\n`;
      break;
    case 'link':
      replacement = `[${selected || 'Learn more about Vyaaptam services'}](https://vyaaptam.com/services)`;
      break;
    case 'image':
      replacement = `![${selected || 'Illustration of performance metrics'}](/img/hero-image.webp)`;
      break;
    case 'tip':
      replacement = `\n> 💡 **Tip:** ${selected || 'Always verify your Google Search Console impressions weekly.'}\n`;
      break;
    case 'divider':
      replacement = `\n\n---\n\n`;
      break;
  }

  textarea.setRangeText(replacement, start, end, 'end');
  textarea.focus();
  updateBlogStats();
  updateBlogPreview();
}

function updateBlogStats() {
  const content = document.getElementById('blog-edit-content')?.value || '';
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const readMins = Math.max(1, Math.ceil(words / 200));
  const badge = document.getElementById('blog-word-count-badge');
  if (badge) {
    badge.textContent = `${words} words · ~${readMins} min read`;
  }
  const readTimeInput = document.getElementById('blog-edit-read-time');
  if (readTimeInput && (!readTimeInput.value || readTimeInput.dataset.auto === 'true')) {
    readTimeInput.value = `${readMins} min read`;
    readTimeInput.dataset.auto = 'true';
  }
}

function updateBlogCoverThumbnail() {
  const url = (document.getElementById('blog-edit-cover-image')?.value || '').trim();
  const box = document.getElementById('blog-cover-thumbnail-box');
  const img = document.getElementById('blog-cover-thumbnail-img');
  const urlText = document.getElementById('blog-cover-thumbnail-url');

  if (url && box && img) {
    img.src = url;
    img.onerror = () => { if (box) box.classList.add('hidden'); };
    img.onload = () => { if (box) box.classList.remove('hidden'); };
    if (urlText) urlText.textContent = url;
  } else if (box) {
    box.classList.add('hidden');
  }
}

async function uploadImageFromAdmin(event, targetInputId) {
  const file = event.target.files?.[0];
  if (!file) return;

  const inputEl = document.getElementById(targetInputId);
  const fileLabel = event.target.closest('label');
  const originalLabelHtml = fileLabel ? fileLabel.innerHTML : '';
  if (fileLabel) fileLabel.innerHTML = `<span>⏳ Uploading...</span>`;

  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ filename: file.name, dataUrl })
      });

      if (res.ok) {
        const data = await res.json();
        if (inputEl) {
          inputEl.value = data.url;
          updateBlogCoverThumbnail();
        }
        alert('✅ Image uploaded successfully!\n\nPublic Image URL:\n' + data.url + '\n\nAutomatically assigned as Cover Image.');
      } else {
        const err = await res.json();
        alert('Upload failed: ' + (err.error || 'Server error'));
      }
      if (fileLabel) fileLabel.innerHTML = originalLabelHtml;
    };
    reader.readAsDataURL(file);
  } catch (err) {
    console.error('File read error:', err);
    if (fileLabel) fileLabel.innerHTML = originalLabelHtml;
    alert('Failed to read image file.');
  }
}

async function toggleMediaGallery(targetInputId) {
  const container = document.getElementById(`media-gallery-${targetInputId}`);
  const grid = document.getElementById(`media-gallery-grid-${targetInputId}`);
  if (!container || !grid) return;

  if (!container.classList.contains('hidden')) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  grid.innerHTML = '<p class="col-span-full text-xs text-muted p-2">Loading brand gallery...</p>';

  try {
    const res = await fetch('/api/upload');
    const data = await res.json();
    const images = data.images || [
      { url: '/img/blog-agency.webp', name: 'Agency Strategy' },
      { url: '/img/blog-seo.webp', name: 'SEO Checklist' },
      { url: '/img/blog-legal.webp', name: 'Legal Guide' },
      { url: '/img/about.webp', name: 'About Team' },
      { url: '/img/hero.webp', name: 'Hero Workspace' },
      { url: '/img/vyaaptam-logo.png', name: 'Brand Logo' }
    ];

    const currentUrl = (document.getElementById(targetInputId)?.value || '').trim();

    grid.innerHTML = images.map(img => {
      const isSelected = currentUrl === img.url;
      return `
        <div onclick="selectGalleryImage('${img.url}', '${targetInputId}')" 
             class="group cursor-pointer p-1.5 rounded-xl border ${isSelected ? 'border-brand ring-2 ring-brand/30 bg-white' : 'border-line/70 hover:border-brand/60 bg-white'} transition-all text-center">
          <img src="${img.url}" alt="${img.name}" class="w-full h-14 object-cover rounded-lg bg-sand/30 mb-1"/>
          <p class="text-[10px] font-medium text-ink truncate">${img.name}</p>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load gallery:', err);
    grid.innerHTML = '<p class="col-span-full text-xs text-red-500 p-2">Failed to load media gallery.</p>';
  }
}

function selectGalleryImage(url, targetInputId) {
  const inputEl = document.getElementById(targetInputId);
  if (inputEl) {
    inputEl.value = url;
    updateBlogCoverThumbnail();
  }
  const container = document.getElementById(`media-gallery-${targetInputId}`);
  if (container) container.classList.add('hidden');
}

function clearCoverImage(targetInputId) {
  const inputEl = document.getElementById(targetInputId);
  if (inputEl) {
    inputEl.value = '';
    updateBlogCoverThumbnail();
  }
}

function updateBlogModalSerp() {
  const title = document.getElementById('blog-edit-title')?.value || 'Article Headline';
  const slug = document.getElementById('blog-edit-slug')?.value || 'article-slug';
  const metaTitle = document.getElementById('blog-edit-meta-title')?.value || `${title} | Vyaaptam Insights`;
  const metaDesc = document.getElementById('blog-edit-meta-desc')?.value || document.getElementById('blog-edit-excerpt')?.value || 'Read in-depth business growth insights from Vyaaptam.';

  const titleEl = document.getElementById('blog-serp-title');
  const slugEl = document.getElementById('blog-serp-slug');
  const descEl = document.getElementById('blog-serp-desc');
  const charTitle = document.getElementById('blog-char-title');
  const charDesc = document.getElementById('blog-char-desc');

  if (titleEl) titleEl.textContent = metaTitle;
  if (slugEl) slugEl.textContent = slug;
  if (descEl) descEl.textContent = metaDesc;

  if (charTitle) {
    const len = (document.getElementById('blog-edit-meta-title')?.value || '').length;
    charTitle.textContent = `${len} / 60 chars`;
    charTitle.className = len > 60 ? 'text-[11px] text-red-500 font-mono font-semibold' : 'text-[11px] text-muted font-mono';
  }
  if (charDesc) {
    const len = (document.getElementById('blog-edit-meta-desc')?.value || '').length;
    charDesc.textContent = `${len} / 160 chars`;
    charDesc.className = len > 160 ? 'text-[11px] text-red-500 font-mono font-semibold' : 'text-[11px] text-muted font-mono';
  }
}

function autoGenerateBlogSlug() {
  const title = document.getElementById('blog-edit-title')?.value || '';
  const slugInput = document.getElementById('blog-edit-slug');
  if (slugInput && title) {
    slugInput.value = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    updateBlogModalSerp();
  }
}

function updateBlogPreview() {
  const title = document.getElementById('blog-edit-title')?.value || 'Article Headline';
  const category = document.getElementById('blog-edit-category')?.value || 'Marketing';
  const author = document.getElementById('blog-edit-author')?.value || 'Sanchit Khandelwal';
  const readTime = document.getElementById('blog-edit-read-time')?.value || '5 min read';
  const coverImage = (document.getElementById('blog-edit-cover-image')?.value || '').trim();
  const excerpt = document.getElementById('blog-edit-excerpt')?.value || '';
  const content = document.getElementById('blog-edit-content')?.value || '';

  const prevTitle = document.getElementById('prev-title');
  const prevCategory = document.getElementById('prev-category');
  const prevReadTime = document.getElementById('prev-read-time');
  const prevAuthor = document.getElementById('prev-author-name');
  const prevAvatar = document.getElementById('prev-author-avatar');
  const prevHeroBox = document.getElementById('prev-hero-box');
  const prevHeroImg = document.getElementById('prev-hero-img');
  const prevExcerpt = document.getElementById('prev-excerpt');
  const prevBody = document.getElementById('prev-body-html');

  if (prevTitle) prevTitle.textContent = title;
  if (prevCategory) prevCategory.textContent = category;
  if (prevReadTime) prevReadTime.textContent = `· ${readTime}`;
  if (prevAuthor) prevAuthor.textContent = author;
  if (prevAvatar) {
    const initials = author.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'VK';
    prevAvatar.textContent = initials;
  }

  if (coverImage && prevHeroBox && prevHeroImg) {
    prevHeroImg.src = coverImage;
    prevHeroBox.classList.remove('hidden');
  } else if (prevHeroBox) {
    prevHeroBox.classList.add('hidden');
  }

  if (prevExcerpt) {
    prevExcerpt.textContent = excerpt || 'Article overview...';
  }

  if (prevBody) {
    let html = escapeHTML(content);

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="font-display text-xl font-semibold text-ink mt-6 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="font-display text-2xl font-semibold text-ink mt-8 mb-3 pb-2 border-b border-line">$1</h2>');

    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-ink">$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>');

    // Tips and Callouts
    html = html.replace(/^&gt; 💡 \*\*Tip:\*\* (.*$)/gim, '<div class="my-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">💡 <strong>Strategic Tip:</strong> $1</div>');
    html = html.replace(/^&gt; (.*$)/gim, '<blockquote class="border-l-4 border-magenta pl-4 py-1 italic text-ink/80 my-4">$1</blockquote>');

    // Horizontal Rule
    html = html.replace(/^---$/gim, '<hr class="my-6 border-line"/>');

    // Lists
    html = html.replace(/^\- (.*$)/gim, '<li class="flex items-start gap-2 mb-1.5"><span class="text-magenta font-bold shrink-0">•</span><span>$1</span></li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="list-decimal ml-6 mb-1.5 text-ink">$1</li>');

    // Links & Images
    html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" class="text-violet font-semibold underline underline-offset-2 hover:text-ink">$1 ↗</a>');
    html = html.replace(/!\[(.*?)\]\((.*?)\)/gim, '<div class="my-4 rounded-xl overflow-hidden border border-line"><img src="$2" alt="$1" class="w-full h-auto"/><p class="p-2 text-xs text-muted text-center italic bg-sand/30">$1</p></div>');

    // Paragraphs
    const paragraphs = html.split(/\n{2,}/).map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<blockquote') || p.startsWith('<div') || p.startsWith('<hr') || p.startsWith('<li')) {
        return p;
      }
      return `<p class="leading-relaxed mb-4 text-ink/90">${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('\n');

    prevBody.innerHTML = paragraphs;
  }
}

function openBlogModal(id = null) {
  const modal = document.getElementById('blog-edit-modal');
  const modalTitle = document.getElementById('blog-modal-title');
  const deleteBtn = document.getElementById('blog-delete-btn');

  if (!modal) return;
  switchBlogModalMode('write');

  if (id) {
    const b = adminBlogsList.find(item => item.id === id);
    if (!b) return;
    modalTitle.textContent = 'Edit Article: ' + b.title;
    document.getElementById('blog-edit-id').value = b.id;
    document.getElementById('blog-edit-title').value = b.title || '';
    document.getElementById('blog-edit-slug').value = b.slug || '';
    document.getElementById('blog-edit-category').value = b.category || 'Marketing';
    document.getElementById('blog-edit-author').value = b.author || '';
    document.getElementById('blog-edit-read-time').value = b.read_time || '';
    if (document.getElementById('blog-edit-cover-image')) {
      document.getElementById('blog-edit-cover-image').value = b.cover_image || '';
    }
    document.getElementById('blog-edit-excerpt').value = b.excerpt || '';
    document.getElementById('blog-edit-content').value = b.content || '';
    document.getElementById('blog-edit-meta-title').value = b.meta_title || '';
    document.getElementById('blog-edit-meta-desc').value = b.meta_description || '';
    if (deleteBtn) deleteBtn.style.display = 'inline-block';
  } else {
    modalTitle.textContent = 'Write New Article';
    document.getElementById('blog-edit-form').reset();
    document.getElementById('blog-edit-id').value = '';
    if (deleteBtn) deleteBtn.style.display = 'none';
  }

  updateBlogCoverThumbnail();
  updateBlogStats();
  updateBlogModalSerp();
  modal.style.display = 'flex';
}

function closeBlogModal() {
  const modal = document.getElementById('blog-edit-modal');
  if (modal) modal.style.display = 'none';
}

async function deleteCurrentBlog() {
  const id = document.getElementById('blog-edit-id').value;
  if (!id) return;
  if (!confirm('Are you sure you want to delete this article?')) return;

  try {
    const res = await fetch(`/api/content?type=blogs&id=${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    if (res.ok) {
      showToast('Article deleted successfully.');
      closeBlogModal();
      await loadAdminBlogs();
    }
  } catch (err) {
    console.error('Delete blog error:', err);
  }
}

// -------------------------------------------------------------
// SEO & METADATA MANAGER
// -------------------------------------------------------------
async function loadAdminSEO() {
  const container = document.getElementById('seo-pages-container');
  if (container) container.innerHTML = `<div class="py-8 text-center text-sm text-muted">Loading SEO configurations...</div>`;

  try {
    const res = await fetch('/api/content?type=seo');
    if (res.ok) {
      const data = await res.json();
      adminSEOList = data.items || [];
      renderAdminSEO();
    } else {
      if (container) container.innerHTML = `<div class="py-8 text-center text-sm text-red-500">Failed to load SEO configurations from server. <button onclick="loadAdminSEO()" class="underline font-semibold ml-2">Retry</button></div>`;
    }
  } catch (err) {
    console.error('Failed to load SEO data:', err);
    if (container) container.innerHTML = `<div class="py-8 text-center text-sm text-red-500">Connection error loading SEO data. <button onclick="loadAdminSEO()" class="underline font-semibold ml-2">Retry</button></div>`;
  }
}

function renderAdminSEO() {
  const container = document.getElementById('seo-pages-container');
  if (!container) return;

  container.innerHTML = adminSEOList.map((p) => {
    const routeSafe = p.route.replace(/[^a-z0-9]/gi, '_');
    const titleVal = escapeHTML(p.meta_title || '');
    const descVal = escapeHTML(p.meta_description || '');
    const keywordsVal = escapeHTML(p.keywords || '');

    return `
      <div class="card p-6 sm:p-8 space-y-6">
        <div class="flex items-center justify-between pb-3 border-b border-line">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs font-bold px-3 py-1 rounded-full bg-sand text-ink">${escapeHTML(p.route)}</span>
            <h3 class="text-xl font-semibold text-ink">${escapeHTML(p.page_name)}</h3>
          </div>
          <a href="${escapeHTML(p.route)}" target="_blank" class="text-xs text-brand font-semibold hover:underline">Open Live Route ↗</a>
        </div>

        <!-- Google SERP Snippet Preview -->
        <div class="p-4 rounded-2xl bg-white border border-line/80 shadow-sm">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"></path></svg>
            Google Search Snippet Preview
          </p>
          <div class="space-y-1">
            <p class="text-xs text-[#202124] flex items-center gap-1 truncate font-mono">
              https://vyaaptam.com<span class="text-muted">${p.route === '/' ? '' : p.route}</span>
            </p>
            <h4 id="serp-title-${routeSafe}" class="text-lg font-medium text-[#1a0dab] hover:underline cursor-pointer truncate">
              ${titleVal || 'Page Title'}
            </h4>
            <p id="serp-desc-${routeSafe}" class="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
              ${descVal || 'Meta description will be shown here in Google results.'}
            </p>
          </div>
        </div>

        <!-- Inputs -->
        <div class="grid gap-4">
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="form-label text-xs">Meta Title Tag</label>
              <span id="char-title-${routeSafe}" class="text-[11px] text-muted font-mono">${(p.meta_title || '').length} / 60 chars</span>
            </div>
            <input type="text" id="seo-title-${routeSafe}" value="${titleVal}" oninput="updateSerpPreview('${routeSafe}')" class="form-input text-sm" placeholder="Title for Google and Browser tabs"/>
          </div>

          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="form-label text-xs">Meta Description</label>
              <span id="char-desc-${routeSafe}" class="text-[11px] text-muted font-mono">${(p.meta_description || '').length} / 160 chars</span>
            </div>
            <textarea id="seo-desc-${routeSafe}" rows="2" oninput="updateSerpPreview('${routeSafe}')" class="form-input text-sm" placeholder="Summarize page content for search engines...">${descVal}</textarea>
          </div>

          <div>
            <label class="form-label text-xs">Keywords (Comma-separated)</label>
            <input type="text" id="seo-keywords-${routeSafe}" value="${keywordsVal}" class="form-input text-sm" placeholder="e.g. digital marketing ahmedabad, seo, branding"/>
          </div>
        </div>

        <div class="pt-2 flex justify-end">
          <button type="button" id="btn-save-seo-${routeSafe}" onclick="savePageSEO('${p.route}', '${routeSafe}')" class="btn-brand py-2.5 px-6 text-xs flex items-center gap-1.5 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
            Save ${escapeHTML(p.page_name)} SEO
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function updateSerpPreview(routeSafe) {
  const titleInput = document.getElementById(`seo-title-${routeSafe}`);
  const descInput = document.getElementById(`seo-desc-${routeSafe}`);
  const titlePreview = document.getElementById(`serp-title-${routeSafe}`);
  const descPreview = document.getElementById(`serp-desc-${routeSafe}`);
  const charTitle = document.getElementById(`char-title-${routeSafe}`);
  const charDesc = document.getElementById(`char-desc-${routeSafe}`);

  if (titleInput && titlePreview) titlePreview.textContent = titleInput.value || 'Page Title';
  if (descInput && descPreview) descPreview.textContent = descInput.value || 'Meta description will be shown here...';
  if (titleInput && charTitle) {
    charTitle.textContent = `${titleInput.value.length} / 60 chars`;
    charTitle.className = titleInput.value.length > 60 ? 'text-[11px] text-red-500 font-mono font-semibold' : 'text-[11px] text-muted font-mono';
  }
  if (descInput && charDesc) {
    charDesc.textContent = `${descInput.value.length} / 160 chars`;
    charDesc.className = descInput.value.length > 160 ? 'text-[11px] text-red-500 font-mono font-semibold' : 'text-[11px] text-muted font-mono';
  }
}

async function savePageSEO(route, routeSafe) {
  const btn = document.getElementById(`btn-save-seo-${routeSafe}`);
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Saving to Supabase...</span>`;
  }

  const titleInput = document.getElementById(`seo-title-${routeSafe}`);
  const descInput = document.getElementById(`seo-desc-${routeSafe}`);
  const keywordsInput = document.getElementById(`seo-keywords-${routeSafe}`);

  const payload = {
    route,
    meta_title: titleInput ? titleInput.value.trim() : '',
    meta_description: descInput ? descInput.value.trim() : '',
    keywords: keywordsInput ? keywordsInput.value.trim() : ''
  };

  try {
    const res = await fetch('/api/content?type=seo', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      if (btn) {
        btn.style.backgroundColor = '#059669';
        btn.innerHTML = `<span>✓ Saved to Database!</span>`;
        setTimeout(() => {
          btn.disabled = false;
          btn.style.backgroundColor = '';
          btn.innerHTML = originalHtml;
        }, 3000);
      }
      showToast(`SEO settings for ${route} saved successfully!`);
      const matched = adminSEOList.find(s => s.route === route);
      alert(`✅ SEO for "${matched?.page_name || route}" successfully saved in Supabase database!\nYour Google SERP preview is updated live.`);
      if (matched) {
        matched.meta_title = payload.meta_title;
        matched.meta_description = payload.meta_description;
        matched.keywords = payload.keywords;
      }
    } else {
      const err = await res.json();
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
      alert('Error saving SEO: ' + (err.error || 'Failed'));
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
    console.error('Save SEO error:', err);
    alert('Network error while saving SEO metadata.');
  }
}

// -------------------------------------------------------------
// AGENCY BRAND & BUSINESS SETTINGS CONTROLLER
// -------------------------------------------------------------
let adminSettingsData = null;

async function loadAdminSettings() {
  try {
    const res = await fetch('/api/content?type=settings');
    if (res.ok) {
      const data = await res.json();
      adminSettingsData = data.item || {};

      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el && val !== undefined) el.value = val;
      };

      setVal('setting-agency-name', adminSettingsData.agency_name || 'Vyaaptam');
      setVal('setting-email', adminSettingsData.email || 'hello@vyaaptam.com');
      setVal('setting-phone', adminSettingsData.phone || '+91 63967 16516');
      setVal('setting-whatsapp', adminSettingsData.whatsapp || '+91 63967 16516');
      setVal('setting-office-hours', adminSettingsData.office_hours || 'Mon – Sat, 10am – 7pm');
      setVal('setting-primary-address', adminSettingsData.primary_address || 'Offices in Ahmedabad & Amroha');
      setVal('setting-social-linkedin', adminSettingsData.social_linkedin || 'https://www.linkedin.com/company/vyaaptam/');
      setVal('setting-social-instagram', adminSettingsData.social_instagram || 'https://www.instagram.com/vyaaptam/');
      setVal('setting-social-facebook', adminSettingsData.social_facebook || 'https://www.facebook.com/vyaaptam/');
      setVal('setting-announcement-text', adminSettingsData.announcement_text || '🚀 Free 30-minute growth & compliance audit for new businesses.');
      setVal('setting-ga4-id', adminSettingsData.ga4_id || '');
      setVal('setting-clarity-id', adminSettingsData.clarity_id || '');
      setVal('setting-gsc-verification', adminSettingsData.gsc_verification || '');

      const annToggle = document.getElementById('setting-announcement-active');
      if (annToggle) {
        annToggle.checked = adminSettingsData.announcement_active !== false;
      }
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

async function saveAdminSettings() {
  const saveButtons = Array.from(document.querySelectorAll('button[onclick="saveAdminSettings()"], #settings-admin-form button[type="submit"]'));
  const originalHtmlMap = new Map();

  saveButtons.forEach(btn => {
    originalHtmlMap.set(btn, btn.innerHTML);
    btn.disabled = true;
    btn.innerHTML = `<span>Saving to Supabase...</span>`;
  });

  const getVal = (id) => document.getElementById(id)?.value?.trim() || '';
  const annToggle = document.getElementById('setting-announcement-active');

  const payload = {
    agency_name: getVal('setting-agency-name'),
    email: getVal('setting-email'),
    phone: getVal('setting-phone'),
    whatsapp: getVal('setting-whatsapp'),
    office_hours: getVal('setting-office-hours'),
    primary_address: getVal('setting-primary-address'),
    social_linkedin: getVal('setting-social-linkedin'),
    social_instagram: getVal('setting-social-instagram'),
    social_facebook: getVal('setting-social-facebook'),
    announcement_text: getVal('setting-announcement-text'),
    announcement_active: annToggle ? annToggle.checked : true,
    ga4_id: getVal('setting-ga4-id'),
    clarity_id: getVal('setting-clarity-id'),
    gsc_verification: getVal('setting-gsc-verification')
  };

  try {
    const res = await fetch('/api/content?type=settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      saveButtons.forEach(btn => {
        btn.style.backgroundColor = '#059669';
        btn.innerHTML = `<span>✓ Saved to Database!</span>`;
        setTimeout(() => {
          btn.disabled = false;
          btn.style.backgroundColor = '';
          btn.innerHTML = originalHtmlMap.get(btn) || 'Save Brand Settings';
        }, 3000);
      });
      showToast('Agency & Brand settings saved successfully!');
      alert('✅ Settings successfully saved in Supabase database!\nYour changes are now live on the website.');
    } else {
      const err = await res.json();
      saveButtons.forEach(btn => {
        btn.disabled = false;
        btn.innerHTML = originalHtmlMap.get(btn) || 'Save Brand Settings';
      });
      alert('Error saving settings: ' + (err.error || 'Failed'));
    }
  } catch (err) {
    saveButtons.forEach(btn => {
      btn.disabled = false;
      btn.innerHTML = originalHtmlMap.get(btn) || 'Save Brand Settings';
    });
    console.error('Save settings error:', err);
    alert('Network error while saving settings.');
  }
}

// Window global exports for inline event handlers
window.filterServices = filterServices;
window.handleServiceSearch = handleServiceSearch;
window.autoGenerateServiceSlug = autoGenerateServiceSlug;
window.updateServiceModalSerp = updateServiceModalSerp;
window.openServiceModal = openServiceModal;
window.closeServiceModal = closeServiceModal;
window.deleteCurrentService = deleteCurrentService;
window.openBlogModal = openBlogModal;
window.closeBlogModal = closeBlogModal;
window.deleteCurrentBlog = deleteCurrentBlog;
window.switchBlogModalMode = switchBlogModalMode;
window.formatBlogText = formatBlogText;
window.updateBlogStats = updateBlogStats;
window.updateBlogCoverThumbnail = updateBlogCoverThumbnail;
window.updateBlogModalSerp = updateBlogModalSerp;
window.autoGenerateBlogSlug = autoGenerateBlogSlug;
window.updateBlogPreview = updateBlogPreview;
window.updateSerpPreview = updateSerpPreview;
window.savePageSEO = savePageSEO;
window.loadAdminSettings = loadAdminSettings;
window.saveAdminSettings = saveAdminSettings;
window.loadAdminServices = loadAdminServices;
window.loadAdminBlogs = loadAdminBlogs;
window.loadAdminSEO = loadAdminSEO;
window.showToast = showToast;
window.uploadImageFromAdmin = uploadImageFromAdmin;
window.toggleMediaGallery = toggleMediaGallery;
window.selectGalleryImage = selectGalleryImage;
window.clearCoverImage = clearCoverImage;

/* ==========================================================================
   10. TEAM & ABOUT PAGE CMS CONTROLLER
   ========================================================================== */
let adminTeamList = [];

async function loadAdminTeam() {
  const grid = document.getElementById('admin-team-grid');
  if (grid) {
    grid.innerHTML = '<div class="col-span-full py-12 text-center text-xs text-muted">Loading team members...</div>';
  }

  try {
    const res = await fetch('/api/content?type=team');
    if (res.ok) {
      const data = await res.json();
      adminTeamList = data.items || [];
      renderAdminTeam();
    }
  } catch (err) {
    console.error('Failed to load team:', err);
    if (grid) grid.innerHTML = '<div class="col-span-full py-12 text-center text-xs text-red-500">Failed to load team members.</div>';
  }

  // Also populate about image if available in settings
  try {
    const sRes = await fetch('/api/content?type=settings');
    if (sRes.ok) {
      const sData = await sRes.json();
      const item = sData.item || sData.settings || {};
      const aboutInput = document.getElementById('setting-about-image');
      if (aboutInput && item.about_image) {
        aboutInput.value = item.about_image;
      }
    }
  } catch (e) {}
}

function renderAdminTeam() {
  const grid = document.getElementById('admin-team-grid');
  if (!grid) return;

  if (!adminTeamList.length) {
    grid.innerHTML = '<div class="col-span-full py-12 text-center text-xs text-muted">No team members found. Click "Add New Team Member" above.</div>';
    return;
  }

  grid.innerHTML = adminTeamList.map(m => `
    <div class="card p-5 flex flex-col justify-between border border-line hover:shadow-md transition">
      <div>
        <div class="flex items-center gap-3.5 mb-3.5">
          <div class="relative size-14 shrink-0 rounded-2xl overflow-hidden bg-sand border border-line">
            ${m.image ? `<img src="${m.image}" alt="${m.name}" class="size-full object-cover"/>` : `<div class="size-full grid place-items-center bg-gradient-to-tr from-brand to-magenta text-white font-bold text-sm">${m.initials || 'VP'}</div>`}
          </div>
          <div class="min-w-0">
            <h3 class="font-semibold text-sm text-ink truncate">${m.name}</h3>
            <p class="text-xs text-brand font-medium truncate">${m.role}</p>
            ${m.linkedin ? `<a href="${m.linkedin}" target="_blank" class="text-[11px] text-muted hover:text-ink transition inline-flex items-center gap-1 mt-0.5">LinkedIn ↗</a>` : ''}
          </div>
        </div>
        <p class="text-xs text-muted line-clamp-2 leading-relaxed mb-4">${m.bio || 'No bio specified.'}</p>
      </div>

      <div class="pt-3 border-t border-line flex items-center justify-between">
        <button type="button" onclick="openTeamModal('${m.id}')" class="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1 hover:bg-sand transition">
          ✏️ Edit Member
        </button>
        <button type="button" onclick="deleteCurrentTeamMember('${m.id}')" class="text-xs text-red-600 hover:underline px-2 py-1">
          Delete
        </button>
      </div>
    </div>
  `).join('');
}

function openTeamModal(id) {
  const modal = document.getElementById('team-member-modal');
  const title = document.getElementById('team-modal-title');
  const delBtn = document.getElementById('team-delete-btn');
  if (!modal) return;

  const setVal = (fid, val) => {
    const el = document.getElementById(fid);
    if (el) el.value = val || '';
  };

  if (id) {
    const member = adminTeamList.find(m => String(m.id) === String(id));
    if (member) {
      if (title) title.textContent = 'Edit Team Member';
      setVal('team-edit-id', member.id);
      setVal('team-edit-name', member.name);
      setVal('team-edit-role', member.role);
      setVal('team-edit-initials', member.initials);
      setVal('team-edit-linkedin', member.linkedin);
      setVal('team-edit-image', member.image);
      setVal('team-edit-bio', member.bio);
      if (delBtn) delBtn.style.display = 'block';
    }
  } else {
    if (title) title.textContent = 'Add New Team Member';
    setVal('team-edit-id', '');
    setVal('team-edit-name', '');
    setVal('team-edit-role', '');
    setVal('team-edit-initials', '');
    setVal('team-edit-linkedin', '');
    setVal('team-edit-image', '');
    setVal('team-edit-bio', '');
    if (delBtn) delBtn.style.display = 'none';
  }

  modal.style.display = 'flex';
}

function closeTeamModal() {
  const modal = document.getElementById('team-member-modal');
  if (modal) modal.style.display = 'none';
}

async function saveTeamMember() {
  const id = document.getElementById('team-edit-id')?.value;
  const name = document.getElementById('team-edit-name')?.value.trim();
  const role = document.getElementById('team-edit-role')?.value.trim();
  let initials = document.getElementById('team-edit-initials')?.value.trim().toUpperCase();
  const linkedin = document.getElementById('team-edit-linkedin')?.value.trim();
  const image = document.getElementById('team-edit-image')?.value.trim();
  const bio = document.getElementById('team-edit-bio')?.value.trim();

  if (!name || !role) {
    alert('Please enter both name and role for the team member.');
    return;
  }

  if (!initials) {
    initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'VP';
  }

  const saveBtn = document.getElementById('team-save-btn');
  const originalText = saveBtn ? saveBtn.innerHTML : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span>Saving...</span>';
  }

  const payload = {
    id: id || undefined,
    name,
    role,
    initials,
    linkedin,
    image,
    bio
  };

  const method = id ? 'PATCH' : 'POST';

  try {
    const res = await fetch('/api/content?type=team', {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      closeTeamModal();
      showToast(`Team member "${name}" saved!`);
      await loadAdminTeam();
    } else {
      const err = await res.json();
      alert('Error saving team member: ' + (err.error || 'Failed'));
    }
  } catch (err) {
    console.error('Error saving team member:', err);
    alert('Network error while saving team member.');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  }
}

async function deleteCurrentTeamMember(optionalId) {
  const id = optionalId || document.getElementById('team-edit-id')?.value;
  if (!id) return;

  const member = adminTeamList.find(m => String(m.id) === String(id));
  const memberName = member ? member.name : 'this member';

  if (!confirm(`Are you sure you want to delete ${memberName} from the team?`)) return;

  try {
    const res = await fetch('/api/content?type=team', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ id })
    });

    if (res.ok) {
      closeTeamModal();
      showToast('Team member removed.');
      await loadAdminTeam();
    } else {
      const err = await res.json();
      alert('Error deleting: ' + (err.error || 'Failed'));
    }
  } catch (err) {
    console.error('Delete error:', err);
    alert('Network error while deleting team member.');
  }
}

async function saveAboutMedia() {
  const btn = document.getElementById('btn-save-about-media');
  const imgInput = document.getElementById('setting-about-image');
  const imageUrl = imgInput?.value.trim() || '/img/about.webp';

  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>Saving...</span>';
  }

  try {
    const res = await fetch('/api/content?type=settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ about_image: imageUrl })
    });

    if (res.ok) {
      if (btn) {
        btn.style.backgroundColor = '#059669';
        btn.innerHTML = '<span>✓ Saved!</span>';
        setTimeout(() => {
          btn.disabled = false;
          btn.style.backgroundColor = '';
          btn.innerHTML = originalHtml;
        }, 2500);
      }
      showToast('About workspace image updated!');
      alert('✅ About page image successfully updated!');
    } else {
      alert('Failed to save image.');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    }
  } catch (err) {
    console.error('Error saving about image:', err);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

// Window global exports for Team & About CMS
window.loadAdminTeam = loadAdminTeam;
window.renderAdminTeam = renderAdminTeam;
window.openTeamModal = openTeamModal;
window.closeTeamModal = closeTeamModal;
window.saveTeamMember = saveTeamMember;
window.deleteCurrentTeamMember = deleteCurrentTeamMember;
window.saveAboutMedia = saveAboutMedia;
