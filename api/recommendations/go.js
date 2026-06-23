import { createClient  } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const { id } = req.query;
    
    // Default fallback dictionary if DB is unavailable
    const FALLBACK_DIRECTORY = {
        "default_desk_mat": "https://www.tiktok.com/@tiktok/video/1",
        "recommended_mic": "https://www.tiktok.com/@tiktok/video/2"
    };

    const supabaseUrl = process.env.SUPABASE_URL || 'https://bxzvxgjnlvbexeuocbey.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    try {
        if (supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data, error } = await supabase
                .from('tiktok_recommendations')
                .select('destination_url')
                .eq('id', id)
                .single();
                
            if (data && data.destination_url) {
                return res.redirect(302, data.destination_url);
            }
        }
    } catch(e) {
        console.log("Supabase error fetching recommendation URL:", e.message);
    }

    // Fallback logic
    if (id && FALLBACK_DIRECTORY[id]) {
        return res.redirect(302, FALLBACK_DIRECTORY[id]);
    }

    // If ID not found, redirect to the main site to avoid dead links
    return res.redirect(302, "/");
}
