const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_REF = 'bxzvxgjnlvbexeuocbey';
const STORAGE_BUCKET = 'tiktok-meta';
const STORAGE_FILE   = 'images.json';

// Fetch the image-url map from Supabase Storage
function fetchImageMap(key) {
    return new Promise((resolve) => {
        const opts = {
            hostname: SUPABASE_REF + '.supabase.co',
            path: '/storage/v1/object/public/' + STORAGE_BUCKET + '/' + STORAGE_FILE,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + key, 'apikey': key }
        };
        const req = https.request(opts, res => {
            let d = ''; res.on('data', c => d += c);
            res.on('end', () => { try { resolve(JSON.parse(d)); } catch (_) { resolve({}); } });
        });
        req.on('error', () => resolve({})); req.end();
    });
}

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const supabaseUrl = process.env.SUPABASE_URL || 'https://' + SUPABASE_REF + '.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

    try {
        if (supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);

            // Fetch DB rows and image map in parallel
            const [dbResult, imgMap] = await Promise.all([
                supabase.from('tiktok_recommendations').select('*').order('id'),
                fetchImageMap(supabaseKey)
            ]);

            const { data, error } = dbResult;
            if (data && !error && data.length > 0) {
                // Merge: storage image_url overrides DB value (handles missing column case)
                const merged = data.map(row => ({
                    ...row,
                    image_url: imgMap[row.id] || row.image_url || ''
                }));
                return res.status(200).json(merged);
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
