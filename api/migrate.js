const { createClient } = require('@supabase/supabase-js');

// Bootstrap endpoint — creates the chat_history table via Supabase pg REST.
// Called once automatically; safe to call repeatedly (IF NOT EXISTS).
module.exports = async function handler(req, res) {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://bxzvxgjnlvbexeuocbey.supabase.co';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) return res.status(500).json({ error: 'Missing service role key' });

    // Supabase exposes the postgres admin via the db REST endpoint when auth'd with service role.
    // We call the pg REST "query" path that Supabase opens for service-role tokens.
    const pgUrl = supabaseUrl.replace('supabase.co', 'supabase.co') + '/rest/v1/';

    const sql = `
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL,
  user_msg text NOT NULL,
  ai_response text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "anon_all_chat_history" ON chat_history FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS chat_history_user_time ON chat_history (username, created_at DESC);
    `.trim();

    // Try Supabase Management API endpoint (needs PAT, may fail)
    try {
        const ref = 'bxzvxgjnlvbexeuocbey';
        const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: sql })
        });
        const d = await r.json();
        if (r.ok) return res.status(200).json({ success: true, method: 'management_api', result: d });
        // Fall through to next method
    } catch (_) {}

    // Try Supabase SQL via pg REST directly
    try {
        const supabase = createClient(supabaseUrl, key);
        // Probe table existence
        const { error: probeError } = await supabase.from('chat_history').select('id').limit(1);
        if (!probeError) {
            return res.status(200).json({ success: true, method: 'table_exists', note: 'chat_history already exists.' });
        }
        return res.status(202).json({
            needs_manual_setup: true,
            sql,
            instructions: 'Run the SQL above in your Supabase dashboard → SQL Editor → New Query. Then this endpoint will confirm success.'
        });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
