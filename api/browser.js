// Browser automation — puppeteer-core + @sparticuz/chromium (correct Vercel pairing)
// No limits, no budget caps — runs as many sessions as needed

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { url, actions = [] } = req.body || {};
    if (!url) return res.status(400).json({ error: 'url required' });

    let browser;
    const frames = [];

    try {
        const chromium = (await import('@sparticuz/chromium')).default;
        const puppeteer = (await import('puppeteer-core')).default;

        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: { width: 1280, height: 720 },
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');

        async function snap(label) {
            const buf = await page.screenshot({ type: 'jpeg', quality: 78, fullPage: false });
            frames.push({ label, image: buf.toString('base64'), url: page.url() });
        }

        // Navigate to starting URL
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await new Promise(r => setTimeout(r, 1800));
        await snap(`Opened ${new URL(url).hostname}`);

        // Execute each action
        for (const action of actions) {
            try {
                if (action.type === 'navigate') {
                    await page.goto(action.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
                    await new Promise(r => setTimeout(r, 1200));
                    await snap(action.label || 'Navigated');

                } else if (action.type === 'click') {
                    // Try the selector, fall back gracefully
                    try {
                        await page.click(action.selector, { timeout: 4000 });
                        await new Promise(r => setTimeout(r, 900));
                    } catch(ce) {
                        // Selector not found — note it but still screenshot
                        frames.push({ label: `⚠️ ${action.label || action.selector} — element not found`, image: null, skipped: true });
                        continue;
                    }
                    await snap(action.label || 'Clicked');

                } else if (action.type === 'scroll') {
                    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), action.y || 500);
                    await new Promise(r => setTimeout(r, 600));
                    await snap(action.label || 'Scrolled');

                } else if (action.type === 'type') {
                    await page.type(action.selector, action.value || '', { delay: 40 });
                    await snap(action.label || 'Typed');

                } else if (action.type === 'wait') {
                    await new Promise(r => setTimeout(r, Math.min(action.ms || 1000, 5000)));
                    await snap(action.label || 'Waiting');

                } else if (action.type === 'screenshot') {
                    await snap(action.label || 'Snapshot');
                }
            } catch (e) {
                frames.push({ label: `⚠️ ${action.label || action.type}: ${e.message.slice(0, 120)}`, image: null, error: true });
            }
        }

        await browser.close();
        return res.status(200).json({ ok: true, frames: frames.filter(f => f.image) });

    } catch (err) {
        if (browser) try { await browser.close(); } catch (_) {}
        // Return partial frames + error so the frontend can show what it got
        return res.status(200).json({
            ok: false,
            error: err.message,
            frames: frames.filter(f => f.image),
            debug: err.stack ? err.stack.slice(0, 400) : undefined
        });
    }
}
