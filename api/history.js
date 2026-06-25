import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const supabaseUrl = process.env.SUPABASE_URL || 'https://bxzvxgjnlvbexeuocbey.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    if (!supabaseKey) return res.status(500).json({ error: 'Supabase not configured.' });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { username, action, user_msg, ai_response } = req.body || {};

    if (!username) return res.status(400).json({ error: 'username required' });

    // ── fetch: load last N messages for a user ────────────────────────────
    if (action === 'fetch' || !action) {
        const limit = username.toLowerCase() === 'neocryptz' ? 30 : 15;
        const { data, error } = await supabase
            .from('chat_history')
            .select('user_msg, ai_response, created_at')
            .eq('username', username)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ history: (data || []).reverse() });
    }

    // ── save: persist a new exchange ──────────────────────────────────────
    if (action === 'save') {
        if (!user_msg) return res.status(400).json({ error: 'user_msg required' });
        const { error } = await supabase
            .from('chat_history')
            .insert([{ username, user_msg, ai_response: ai_response || '' }]);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ saved: true });
    }

    // ── clear: delete all history for a user (admin only) ─────────────────
    if (action === 'clear') {
        const { error } = await supabase
            .from('chat_history')
            .delete()
            .eq('username', username);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ cleared: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
}
