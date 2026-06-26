const { createClient } = require('@supabase/supabase-js');

// Stores chat history in the existing query_cache table using a
// special key prefix: __NCAI_HIST__:<username>
// No new table needed — works with the existing schema.

const HIST_PREFIX = '__NCAI_HIST__:';
const MAX_ENTRIES = { neocryptz: 50, default: 20 };

function histKey(username) { return HIST_PREFIX + username.toLowerCase(); }

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const supabaseUrl = process.env.SUPABASE_URL || 'https://bxzvxgjnlvbexeuocbey.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
    if (!supabaseKey) return res.status(500).json({ error: 'Supabase not configured.' });

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { username, action, user_msg, ai_response } = req.body || {};
    if (!username) return res.status(400).json({ error: 'username required' });

    const key = histKey(username);
    const maxEntries = username.toLowerCase() === 'neocryptz' ? MAX_ENTRIES.neocryptz : MAX_ENTRIES.default;

    // ── fetch ────────────────────────────────────────────────────────────���─
    if (action === 'fetch' || !action) {
        const { data, error } = await supabase
            .from('query_cache')
            .select('response')
            .eq('prompt', key)
            .single();

        if (error || !data) return res.status(200).json({ history: [] });

        try {
            const history = JSON.parse(data.response || '[]');
            return res.status(200).json({ history });
        } catch {
            return res.status(200).json({ history: [] });
        }
    }

    // ── save ───────────────────────────────────────────────────────────────
    if (action === 'save') {
        if (!user_msg) return res.status(400).json({ error: 'user_msg required' });

        // Read current history
        const { data } = await supabase
            .from('query_cache')
            .select('response')
            .eq('prompt', key)
            .single();

        let history = [];
        try { history = JSON.parse(data?.response || '[]'); } catch { history = []; }

        history.push({ user_msg, ai_response: ai_response || '', created_at: new Date().toISOString() });

        // Keep only last N entries
        if (history.length > maxEntries) history = history.slice(-maxEntries);

        await supabase.from('query_cache').upsert(
            [{ prompt: key, response: JSON.stringify(history) }],
            { onConflict: 'prompt' }
        );

        return res.status(200).json({ saved: true, total: history.length });
    }

    // ── clear ──────────────────────────────────────────────────────────────
    if (action === 'clear') {
        await supabase.from('query_cache').delete().eq('prompt', key);
        return res.status(200).json({ cleared: true });
    }

    return res.status(400).json({ error: 'Unknown action' });
}
