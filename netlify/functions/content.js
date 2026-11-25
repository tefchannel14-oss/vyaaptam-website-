// netlify/functions/content.js - Dynamic CMS & SEO API for Vyaaptam Website
const fs = require('fs');
const path = require('path');
const { getSupabaseClient, getServicesStore, getBlogStore, getSeoStore, getSettingsStore } = require('./_supabase');

const TEAM_FILE = path.join(__dirname, '../../site/data/team.json');
const SETTINGS_FILE = path.join(__dirname, '../../site/data/settings.json');

function getTeamStore() {
  try {
    if (fs.existsSync(TEAM_FILE)) {
      return JSON.parse(fs.readFileSync(TEAM_FILE, 'utf8'));
    }
  } catch(e) {}
  return [];
}

function saveTeamStore(data) {
  try {
    const dir = path.dirname(TEAM_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TEAM_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch(e) {
    console.error('Failed to save team file:', e);
  }
}

function getDiskSettingsStore() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    }
  } catch(e) {}
  return null;
}

function saveDiskSettingsStore(data) {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch(e) {
    console.error('Failed to save settings file:', e);
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  const supabase = getSupabaseClient();
  const query = event.queryStringParameters || {};
  const type = (query.type || 'services').toLowerCase();

  const servicesStore = getServicesStore();
  const blogStore = getBlogStore();
  const seoStore = getSeoStore();
  const settingsStore = getSettingsStore();

  try {
    // -------------------------------------------------------------
    // 1. GET: Fetch Services, Blogs, or SEO Pages
    // -------------------------------------------------------------
    if (event.httpMethod === 'GET') {
      if (type === 'services') {
        if (query.slug) {
          if (supabase) {
            const { data, error } = await supabase.from('services').select('*').eq('slug', query.slug).single();
            if (error) throw error;
            return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ item: data }) };
          }
          const item = servicesStore.find(s => s.slug === query.slug);
          return { statusCode: item ? 200 : 404, headers: CORS_HEADERS, body: JSON.stringify({ item }) };
        }

        if (supabase) {
          const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: true });
          if (error) throw error;
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ items: data || [] }) };
        }
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ items: servicesStore }) };
      }

      if (type === 'blogs') {
        if (query.slug) {
          if (supabase) {
            const { data, error } = await supabase.from('blog_posts').select('*').eq('slug', query.slug).single();
            if (error) throw error;
            return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ item: data }) };
          }
          const item = blogStore.find(b => b.slug === query.slug);
          return { statusCode: item ? 200 : 404, headers: CORS_HEADERS, body: JSON.stringify({ item }) };
        }

        if (supabase) {
          const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ items: data || [] }) };
        }
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ items: blogStore }) };
      }

      if (type === 'seo') {
        if (query.route) {
          if (supabase) {
            const { data, error } = await supabase.from('seo_pages').select('*').eq('route', query.route).single();
            if (error) throw error;
            return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ item: data }) };
          }
          const item = seoStore.find(s => s.route === query.route);
          return { statusCode: item ? 200 : 404, headers: CORS_HEADERS, body: JSON.stringify({ item }) };
        }

        if (supabase) {
          const { data, error } = await supabase.from('seo_pages').select('*').order('route', { ascending: true });
          if (error) throw error;
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ items: data || [] }) };
        }
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ items: seoStore }) };
      }

      if (type === 'settings') {
        if (supabase) {
          const { data, error } = await supabase.from('site_settings').select('*').limit(1).single();
          if (!error && data) {
            return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ item: data }) };
          }
        }
        const diskSettings = getDiskSettingsStore();
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ item: diskSettings || settingsStore }) };
      }

      if (type === 'team') {
        const team = getTeamStore();
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ items: team }) };
      }

      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Invalid content type requested.' })
      };
    }

    // -------------------------------------------------------------
    // 2. POST: Create New Service or Blog Post
    // -------------------------------------------------------------
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body || '{}');

      if (type === 'services') {
        const newService = {
          id: 'srv-' + Date.now(),
          slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: data.title,
          category: data.category || 'Digital Marketing',
          tagline: data.tagline || '',
          price_from: data.price_from || 'Custom quote',
          description: data.description || '',
          meta_title: data.meta_title || `${data.title} | Vyaaptam`,
          meta_description: data.meta_description || data.tagline || '',
          is_active: data.is_active !== undefined ? data.is_active : true
        };

        if (supabase) {
          const { data: inserted, error } = await supabase.from('services').insert([newService]).select().single();
          if (error) throw error;
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, item: inserted }) };
        }

        servicesStore.push(newService);
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, item: newService }) };
      }

      if (type === 'blogs') {
        const newBlog = {
          id: 'blg-' + Date.now(),
          slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: data.title,
          category: data.category || 'Marketing',
          author: data.author || 'Sanchit Khandelwal',
          published_date: data.published_date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          read_time: data.read_time || '5 min read',
          excerpt: data.excerpt || '',
          content: data.content || '',
          meta_title: data.meta_title || `${data.title} | Vyaaptam`,
          meta_description: data.meta_description || data.excerpt || '',
          is_published: data.is_published !== undefined ? data.is_published : true
        };

        if (supabase) {
          const { data: inserted, error } = await supabase.from('blog_posts').insert([newBlog]).select().single();
          if (error) throw error;
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, item: inserted }) };
        }

        blogStore.unshift(newBlog);
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, item: newBlog }) };
      }

      if (type === 'team') {
        const team = getTeamStore();
        const newMember = {
          id: 'team-' + Date.now(),
          name: data.name || 'Team Member',
          role: data.role || 'Growth Strategist',
          bio: data.bio || '',
          initials: data.initials || (data.name ? data.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'VM'),
          image: data.image || '',
          linkedin: data.linkedin || 'https://www.linkedin.com/company/vyaaptam/',
          is_founder: Boolean(data.is_founder)
        };
        team.push(newMember);
        saveTeamStore(team);
        return { statusCode: 201, headers: CORS_HEADERS, body: JSON.stringify({ success: true, item: newMember }) };
      }
    }

    // -------------------------------------------------------------
    // 3. PATCH: Update Service, Blog, or SEO Page Metadata
    // -------------------------------------------------------------
    if (event.httpMethod === 'PATCH') {
      const data = JSON.parse(event.body || '{}');

      if (type === 'services') {
        if (supabase) {
          const { data: updated, error } = await supabase.from('services').update(data).eq('id', data.id).select().single();
          if (error) throw error;
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, item: updated }) };
        }

        const idx = servicesStore.findIndex(s => s.id === data.id || s.slug === data.slug);
        if (idx !== -1) {
          servicesStore[idx] = { ...servicesStore[idx], ...data };
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, item: servicesStore[idx] }) };
        }
        return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Service not found.' }) };
      }

      if (type === 'blogs') {
        if (supabase) {
          const { data: updated, error } = await supabase.from('blog_posts').update(data).eq('id', data.id).select().single();
          if (error) throw error;
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, item: updated }) };
        }

        const idx = blogStore.findIndex(b => b.id === data.id || b.slug === data.slug);
        if (idx !== -1) {
          blogStore[idx] = { ...blogStore[idx], ...data };
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, item: blogStore[idx] }) };
        }
        return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Blog not found.' }) };
      }

      if (type === 'seo') {
        if (supabase) {
          const { data: updated, error } = await supabase.from('seo_pages').update(data).eq('route', data.route).select().single();
          if (error) throw error;
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, item: updated }) };
        }

        const idx = seoStore.findIndex(s => s.route === data.route);
        if (idx !== -1) {
          seoStore[idx] = { ...seoStore[idx], ...data };
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, item: seoStore[idx] }) };
        }
        return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: 'SEO page not found.' }) };
      }

      if (type === 'settings') {
        let savedItem = null;
        if (supabase) {
          try {
            const { data: updated, error } = await supabase.from('site_settings').update(data).neq('id', '00000000-0000-0000-0000-000000000000').select().single();
            if (!error && updated) savedItem = updated;
          } catch(e) {}
        }
        const diskSettings = getDiskSettingsStore() || settingsStore;
        Object.assign(diskSettings, data);
        saveDiskSettingsStore(diskSettings);
        Object.assign(settingsStore, data);
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, item: savedItem || diskSettings }) };
      }

      if (type === 'team') {
        const team = getTeamStore();
        const idx = team.findIndex(t => t.id === data.id);
        if (idx !== -1) {
          team[idx] = { ...team[idx], ...data };
          saveTeamStore(team);
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, item: team[idx] }) };
        }
        return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Team member not found.' }) };
      }
    }

    // -------------------------------------------------------------
    // 4. DELETE: Remove Service, Blog, or Team
    // -------------------------------------------------------------
    if (event.httpMethod === 'DELETE') {
      const { id } = query;
      if (!id) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Item ID is required.' }) };
      }

      if (type === 'team') {
        const targetId = id || (event.body ? (typeof event.body === 'string' ? JSON.parse(event.body).id : event.body.id) : null);
        let team = getTeamStore();
        team = team.filter(t => String(t.id) !== String(targetId));
        saveTeamStore(team);
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, message: 'Team member removed.' }) };
      }

      if (type === 'services') {
        if (supabase) {
          const { error } = await supabase.from('services').delete().eq('id', id);
          if (error) throw error;
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, message: 'Service removed.' }) };
        }
        const idx = servicesStore.findIndex(s => s.id === id);
        if (idx !== -1) servicesStore.splice(idx, 1);
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, message: 'Service removed.' }) };
      }

      if (type === 'blogs') {
        if (supabase) {
          const { error } = await supabase.from('blog_posts').delete().eq('id', id);
          if (error) throw error;
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, message: 'Blog post removed.' }) };
        }
        const idx = blogStore.findIndex(b => b.id === id);
        if (idx !== -1) blogStore.splice(idx, 1);
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, message: 'Blog post removed.' }) };
      }
    }

    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  } catch (err) {
    console.error('Content API error:', err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: err.message }) };
  }
};
