const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const { id } = req.query;

    const FALLBACK_DIRECTORY = {
        'default_desk_mat': 'https://www.tiktok.com/@tiktok/video/1',
        'recommended_mic':  'https://www.tiktok.com/@tiktok/video/2'
    };

    const supabaseUrl = process.env.SUPABASE_URL || 'https://bxzvxgjnlvbexeuocbey.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    let destination = null;
    try {
        if (supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data } = await supabase
                .from('tiktok_recommendations')
                .select('destination_url')
                .eq('id', id)
                .single();
            if (data && data.destination_url) destination = data.destination_url;
        }
    } catch(e) {
        console.log('Supabase error:', e.message);
    }

    if (!destination && id && FALLBACK_DIRECTORY[id]) destination = FALLBACK_DIRECTORY[id];
    if (!destination) return res.redirect(302, '/');

    // Serve a no-referrer HTML bounce page so TikTok never sees our site
    // as the referrer — a plain 302 triggers TikTok's bot/security check.
    const safe = destination.replace(/"/g, '&quot;');
    const jsUrl = JSON.stringify(destination);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.status(200).send(
        '<!DOCTYPE html><html><head>' +
        '<meta name="referrer" content="no-referrer">' +
        '<meta http-equiv="refresh" content="0;url=' + safe + '">' +
        '<title>Redirecting...</title>' +
        '</head><body>' +
        '<script>window.location.replace(' + jsUrl + ');<\/script>' +
        '</body></html>'
    );
};