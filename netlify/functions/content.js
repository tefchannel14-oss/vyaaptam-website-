// netlify/functions/content.js - Dynamic CMS & SEO API for Vyaaptam Website
const { getSupabaseClient, getServicesStore, getBlogStore, getSeoStore, getSettingsStore } = require('./_supabase');

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
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ item: settingsStore }) };
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
        if (supabase) {
          const { data: updated, error } = await supabase.from('site_settings').update(data).neq('id', '00000000-0000-0000-0000-000000000000').select().single();
          if (error) throw error;
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, item: updated }) };
        }
        Object.assign(settingsStore, data);
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, item: settingsStore }) };
      }
    }

    // -------------------------------------------------------------
    // 4. DELETE: Remove Service or Blog
    // -------------------------------------------------------------
    if (event.httpMethod === 'DELETE') {
      const { id } = query;
      if (!id) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Item ID is required.' }) };
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
