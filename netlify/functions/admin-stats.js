const { getSupabaseClient, getMockStore } = require('./_supabase');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    const supabase = getSupabaseClient();
    let leads = [];

    if (supabase) {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      leads = data || [];
    } else {
      leads = getMockStore();
    }

    // Compute metrics
    const totalLeads = leads.length;
    const counts = {
      new: 0,
      contacted: 0,
      proposal_sent: 0,
      won: 0,
      lost: 0
    };

    const serviceCounts = {};

    leads.forEach(l => {
      const st = l.status || 'new';
      if (counts[st] !== undefined) counts[st]++;
      else counts.new++;

      const srv = l.service || 'General Enquiry';
      serviceCounts[srv] = (serviceCounts[srv] || 0) + 1;
    });

    const awaitingReply = counts.new;
    const wonDeals = counts.won;
    const activePipeline = counts.new + counts.contacted + counts.proposal_sent;
    const winRate = totalLeads > 0 ? Math.round((wonDeals / totalLeads) * 100) : 0;

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        totalLeads,
        awaitingReply,
        activePipeline,
        wonDeals,
        winRate,
        counts,
        serviceCounts,
        recentLeads: leads.slice(0, 5),
        isLiveDb: !!supabase
      })
    };
  } catch (err) {
    console.error('Admin stats error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: err.message || 'Failed to aggregate statistics.' })
    };
  }
};
