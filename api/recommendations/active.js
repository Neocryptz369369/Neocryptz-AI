const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    // Since we don't want to expose our supabase service role key or hardcode it everywhere if we don't have to,
    // we'll try to fetch an active recommendation from Supabase, or fall back to a hardcoded default.
    // The front-end needs: visual_badge_text, product_name, display_headline, id
    
    // Check if Supabase keys exist in env
    const supabaseUrl = process.env.SUPABASE_URL || 'https://bxzvxgjnlvbexeuocbey.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    try {
        if (supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data, error } = await supabase
                .from('tiktok_recommendations')
                .select('*')
                .eq('is_active', true)
                .limit(1)
                .single();
                
            if (data && !error) {
                return res.status(200).json(data);
            }
        }
    } catch(e) {
        console.log("Supabase error fetching recommendations:", e.message);
    }

    // Default Fallback Affiliate (If DB is empty or fails)
    return res.status(200).json({
        id: "default_desk_mat",
        visual_badge_text: "HOT TRENDING 🔥",
        product_name: "AI Developer Desk Mat",
        display_headline: "Upgrade your workspace with this premium shortcut mat.",
        destination_url: "https://tiktok.com" // Used in the /go endpoint
    });
}
