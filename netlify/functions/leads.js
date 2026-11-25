const { getSupabaseClient, getMockStore } = require('./_supabase');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    let data;
    const contentType = event.headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      data = JSON.parse(event.body || '{}');
    } else {
      // URL-encoded form data
      const params = new URLSearchParams(event.body || '');
      data = {};
      params.forEach((value, key) => { data[key] = value; });
    }

    // 1. Honeypot Anti-Spam Check
    if (data['bot-field'] || data.bot_field) {
      console.warn('Bot submission dropped via honeypot.');
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, message: 'Received' })
      };
    }

    // 2. Field Validations
    const name = (data.name || '').trim();
    const email = (data.email || '').trim().toLowerCase();
    const phone = (data.phone || '').trim();
    const message = (data.message || '').trim();
    const company = (data.company || '').trim();
    const service = (data.service || '').trim();
    const budget = (data.budget || '').trim();
    const source_page = (data.source_page || '').trim() || '/';

    if (!name || name.length < 2) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Please enter your full name.' })
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Please enter a valid email address.' })
      };
    }

    if (!phone || phone.length < 8) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Please enter a valid phone number.' })
      };
    }

    if (!message || message.length < 5) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Please enter a brief message describing your goals.' })
      };
    }

    const leadRecord = {
      name,
      company,
      email,
      phone,
      service,
      budget,
      message,
      status: 'new',
      source_page,
      notes: null,
      ip_address: event.headers['client-ip'] || event.headers['x-forwarded-for'] || null,
      user_agent: event.headers['user-agent'] || null
    };

    const supabase = getSupabaseClient();
    let leadId;

    if (supabase) {
      const { data: inserted, error } = await supabase
        .from('leads')
        .insert([leadRecord])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      leadId = inserted.id;

      // Log activity
      await supabase.from('lead_activity_log').insert([{
        lead_id: leadId,
        action: 'CREATED',
        details: `New enquiry received from ${name} (${company || 'Individual'}) via ${source_page}`
      }]);
    } else {
      // Local fallback mock store
      const mockStore = getMockStore();
      leadId = 'lead-' + Date.now();
      mockStore.unshift({
        id: leadId,
        created_at: new Date().toISOString(),
        ...leadRecord
      });
      console.log('Saved lead to local memory store (configure SUPABASE_URL to persist to PostgreSQL):', leadRecord);
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        id: leadId,
        message: 'Enquiry received successfully. A strategist will contact you within 24 hours.'
      })
    };
  } catch (err) {
    console.error('Leads handler error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Failed to process enquiry. Please try again or call us at +91 63967 16516.'
      })
    };
  }
};

