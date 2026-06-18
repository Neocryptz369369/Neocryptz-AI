
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const id = req.query.id;
    if (!id) return res.status(400).send('Missing ID');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // Mock fallback redirect
        return res.redirect(302, 'https://www.tiktok.com/t/mocklink/');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
        .from('tiktok_recommendations')
        .select('tiktok_affiliate_url')
        .eq('id', id)
        .single();

    if (error || !data || !data.tiktok_affiliate_url) {
        return res.status(404).send('Recommendation Not Found');
    }

    return res.redirect(302, data.tiktok_affiliate_url);
}
