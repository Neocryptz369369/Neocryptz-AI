const { createClient } = require('@supabase/supabase-js');

// Server-side proxy for admin TikTok writes.
// Uses service role key → bypasses Row Level Security.
// Actions: upsert | delete | toggle
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const supabaseUrl = process.env.SUPABASE_URL || 'https://bxzvxgjnlvbexeuocbey.supabase.co';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) return res.status(500).json({ error: 'Missing service role key' });

    const supabase = createClient(supabaseUrl, key);
    const { action, ...body } = req.body || {};

    try {
        // ── upsert ──────────────────────────────────────────────────────────
        if (action === 'upsert') {
            const { id, visual_badge_text, product_name, display_headline, destination_url, image_url, is_active } = body;
            if (!id || !product_name) return res.status(400).json({ error: 'id and product_name required' });

            const payload = { id, visual_badge_text, product_name, display_headline, destination_url, image_url, is_active: is_active !== false };
            let { error } = await supabase.from('tiktok_recommendations').upsert(payload);

            if (error && error.message && error.message.includes('image_url')) {
                // Column not yet added — save without it
                const sans = { id, visual_badge_text, product_name, display_headline, destination_url, is_active: is_active !== false };
                const r2 = await supabase.from('tiktok_recommendations').upsert(sans);
                if (r2.error) return res.status(400).json({ error: r2.error.message });
                return res.json({ ok: true, note: 'no_image_col' });
            }
            if (error) return res.status(400).json({ error: error.message });
            return res.json({ ok: true });
        }

        // ── delete ──────────────────────────────────────────────────────────
        if (action === 'delete') {
            const { id } = body;
            if (!id) return res.status(400).json({ error: 'id required' });
            const { error } = await supabase.from('tiktok_recommendations').delete().eq('id', id);
            if (error) return res.status(400).json({ error: error.message });
            return res.json({ ok: true });
        }

        // ── toggle ──────────────────────────────────────────────────────────
        if (action === 'toggle') {
            const { id, makeActive } = body;
            if (!id) return res.status(400).json({ error: 'id required' });
            if (makeActive) {
                await supabase.from('tiktok_recommendations').update({ is_active: false }).neq('id', id);
            }
            const { error } = await supabase.from('tiktok_recommendations').update({ is_active: makeActive }).eq('id', id);
            if (error) return res.status(400).json({ error: error.message });
            return res.json({ ok: true });
        }

        return res.status(400).json({ error: 'Unknown action: ' + action });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
