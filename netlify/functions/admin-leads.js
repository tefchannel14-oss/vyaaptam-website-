const { getSupabaseClient, getMockStore } = require('./_supabase');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  // Verify Admin Authorization
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  const supabase = getSupabaseClient();
  let user = null;

  if (supabase && token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data?.user) {
      user = data.user;
    }
  }

  // If Supabase is connected but token is invalid, reject
  if (supabase && !user && process.env.ENFORCE_AUTH === 'true') {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Unauthorized. Please sign in to Vyaaptam Studio.' })
    };
  }

  try {
    const mockStore = getMockStore();

    // -------------------------------------------------------------
    // GET: Fetch Leads
    // -------------------------------------------------------------
    if (event.httpMethod === 'GET') {
      const { status, search } = event.queryStringParameters || {};

      if (supabase) {
        let query = supabase.from('leads').select('*').order('created_at', { ascending: false });

        if (status && status !== 'all') {
          query = query.eq('status', status);
        }

        if (search) {
          query = query.or(`name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,service.ilike.%${search}%`);
        }

        const { data: leads, error } = await query;
        if (error) throw error;

        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ leads })
        };
      } else {
        // Fallback local memory store
        let results = [...mockStore];
        if (status && status !== 'all') {
          results = results.filter(l => l.status === status);
        }
        if (search) {
          const s = search.toLowerCase();
          results = results.filter(l =>
            (l.name && l.name.toLowerCase().includes(s)) ||
            (l.company && l.company.toLowerCase().includes(s)) ||
            (l.email && l.email.toLowerCase().includes(s)) ||
            (l.phone && l.phone.toLowerCase().includes(s)) ||
            (l.service && l.service.toLowerCase().includes(s))
          );
        }
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ leads: results })
        };
      }
    }

    // -------------------------------------------------------------
    // PATCH: Update Status / Notes
    // -------------------------------------------------------------
    if (event.httpMethod === 'PATCH') {
      const body = JSON.parse(event.body || '{}');
      const { id, status, notes } = body;

      if (!id) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Lead ID is required.' })
        };
      }

      const updates = {};
      if (status !== undefined) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      updates.updated_at = new Date().toISOString();

      if (supabase) {
        const { data: updated, error } = await supabase
          .from('leads')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        // Log status change
        if (status) {
          await supabase.from('lead_activity_log').insert([{
            lead_id: id,
            action: 'STATUS_UPDATED',
            details: `Status changed to '${status}'`
          }]);
        }

        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: true, lead: updated })
        };
      } else {
        const lead = mockStore.find(l => l.id === id);
        if (lead) {
          if (status !== undefined) lead.status = status;
          if (notes !== undefined) lead.notes = notes;
          lead.updated_at = updates.updated_at;
          return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ success: true, lead })
          };
        } else {
          return {
            statusCode: 404,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'Lead not found.' })
          };
        }
      }
    }

    // -------------------------------------------------------------
    // DELETE: Delete / Archive Lead
    // -------------------------------------------------------------
    if (event.httpMethod === 'DELETE') {
      const { id } = event.queryStringParameters || {};
      if (!id) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Lead ID is required.' })
        };
      }

      if (supabase) {
        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (error) throw error;
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: true, message: 'Lead deleted.' })
        };
      } else {
        const index = mockStore.findIndex(l => l.id === id);
        if (index !== -1) {
          mockStore.splice(index, 1);
          return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ success: true, message: 'Lead deleted from local store.' })
          };
        } else {
          return {
            statusCode: 404,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'Lead not found.' })
          };
        }
      }
    }

    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  } catch (err) {
    console.error('Admin leads API error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message || 'Internal server error.' })
    };
  }
};

