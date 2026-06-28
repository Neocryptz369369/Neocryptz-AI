// api/upload-image.js
// Accepts: POST { fileName, contentType, data } where data is base64-encoded image
// Uploads to Supabase Storage (tiktok-meta bucket) and returns the public URL

const SUPABASE_URL = 'https://bxzvxgjnlvbexeuocbey.supabase.co';
const BUCKET       = 'tiktok-meta';

module.exports = async function uploadImage(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!svcKey) return res.status(500).json({ error: 'Server not configured' });

  const { fileName, contentType, data } = req.body || {};
  if (!data || !contentType) return res.status(400).json({ error: 'fileName, contentType and data required' });

  // Sanitise the filename and give it a unique prefix so overwrites are safe
  const ext  = (contentType.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '');
  const safe = 'product_' + Date.now() + '.' + ext;
  const buf  = Buffer.from(data, 'base64');

  const https = require('https');
  const uploadPath = '/storage/v1/object/' + BUCKET + '/images/' + safe;

  const uploaded = await new Promise((resolve, reject) => {
    const opts = {
      hostname: 'bxzvxgjnlvbexeuocbey.supabase.co',
      path: uploadPath,
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + svcKey,
        'apikey': svcKey,
        'Content-Type': contentType,
        'Content-Length': buf.length,
        'x-upsert': 'true'
      }
    };
    const req2 = https.request(opts, r2 => {
      let d = ''; r2.on('data', c => d += c);
      r2.on('end', () => { try { resolve({ s: r2.statusCode, b: JSON.parse(d) }); } catch(e) { resolve({ s: r2.statusCode, b: d }); } });
    });
    req2.on('error', reject);
    req2.write(buf);
    req2.end();
  });

  if (uploaded.s !== 200 && uploaded.s !== 201) {
    return res.status(500).json({ error: 'Storage upload failed', detail: uploaded.b });
  }

  const publicUrl = SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/images/' + safe;
  return res.json({ ok: true, url: publicUrl });
};
