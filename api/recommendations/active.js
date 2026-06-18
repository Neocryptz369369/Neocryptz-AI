
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // Mock fallback data if DB isn't configured
        return res.status(200).json({
            id: 'mock-123',
            product_name: 'Viral LED Cloud Light',
            display_headline: 'Transform your room instantly!',
            visual_badge_text: 'Trending'
        });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
        .from('tiktok_recommendations')
        .select('id, product_name, display_headline, visual_badge_text')
        .eq('is_active', true)
        .limit(1);

    if (error || !data || data.length === 0) {
        return res.status(404).json({ error: 'No active recommendations' });
    }

    return res.status(200).json(data[0]);
}
