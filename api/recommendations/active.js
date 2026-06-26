const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const supabaseUrl = process.env.SUPABASE_URL || 'https://bxzvxgjnlvbexeuocbey.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    try {
        if (supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data, error } = await supabase
                .from('tiktok_recommendations')
                .select('*')
                .order('id');
            if (data && !error && data.length > 0) {
                return res.status(200).json(data); // array — frontend rotates
            }
        }
    } catch(e) {
        console.log('recommendations fetch error:', e.message);
    }

    // Fallback single-item array
    return res.status(200).json([{
        id: 'default',
        visual_badge_text: 'HOT TRENDING',
        product_name: 'AI Developer Desk Mat',
        display_headline: 'Upgrade your workspace.',
        destination_url: 'https://www.tiktok.com/shop',
        image_url: ''
    }]);
};