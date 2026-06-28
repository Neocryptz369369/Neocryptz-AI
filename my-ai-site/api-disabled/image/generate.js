module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { prompt, keys } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
    // Server-side Geo and VPN blocking
    const country = req.headers['x-vercel-ip-country'];
    const region = req.headers['x-vercel-ip-country-region'];
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (country && country !== 'US') {
        return res.status(403).json({ error: "ACCESS DENIED: Neocryptz AI is currently restricted to US residents only." });
    }
    if (region && region === 'CA') {
        return res.status(403).json({ error: "ACCESS DENIED: Due to state regulations, Neocryptz AI is not available in California." });
    }

    // VPN/Proxy check
    try {
        const geoRes = await fetch(`https://freeipapi.com/api-disabled/json/${ip}`);
        const geoData = await geoRes.json();
        if (geoData && geoData.isProxy) {
            return res.status(403).json({ error: "SECURITY ALERT: VPN or Proxy detected. Please disable your VPN to access Neocryptz AI." });
        }
    } catch (e) {
        console.error("Server-side geo-check failed:", e);
    }


    // The user requested: "The Tool: Together AI (Flux Schnell or SDXL Turbo) or Groq... keeping your $240 collection as pure profit."
    // I can try Together AI using a fallback, but since the user didn't explicitly hand me a Together AI key right now,
    // I will set up the API to default to Pollinations (which is 100% free/pure profit) 
    // BUT if the user plugs a Together API key into their admin panel, it will use Together's Flux Schnell!
    
    let activeKey = keys && keys.TOGETHER_API_KEY ? keys.TOGETHER_API_KEY : process.env.TOGETHER_API_KEY;

    if (activeKey) {
        try {
            const togetherRes = await fetch("https://api.together.xyz/v1/images/generations", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${activeKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "black-forest-labs/FLUX.1-schnell-Free",
                    prompt: prompt,
                    steps: 4,
                    n: 1,
                    height: 1024,
                    width: 1024,
                    response_format: "url"
                })
            });

            if (togetherRes.ok) {
                const data = await togetherRes.json();
                if (data && data.data && data.data[0] && data.data[0].url) {
                    return res.status(200).json({ url: data.data[0].url, provider: "Together" });
                }
            }
        } catch(e) {
            console.log("Together AI Error", e);
        }
    }

    // Ultra-low cost / Free Fallback (Pollinations)
    const encodedPrompt = encodeURIComponent(prompt);
    const polliUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
    return res.status(200).json({ url: polliUrl, provider: "Pollinations" });
}
