import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  // Fetch all un-notified purchases from the last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('purchase_notifications')
    .select('id, username, plan, period, amount_cents, created_at')
    .eq('notified', false)
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  if (data && data.length > 0) {
    // Mark them all as notified
    const ids = data.map(r => r.id);
    await supabase
      .from('purchase_notifications')
      .update({ notified: true })
      .in('id', ids);
  }

  return res.status(200).json({ purchases: data || [] });
}
