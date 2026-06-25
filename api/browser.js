// Browser automation endpoint — takes live screenshots as the AI navigates
// No limits, no budget caps — runs as many sessions as needed

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { url, actions = [], viewport = { width: 1280, height: 720 } } = req.body || {};
    if (!url) return res.status(400).json({ error: 'url required' });

    let browser;
    const frames = [];

    try {
        let chromiumLib, executablePath, launchArgs;

        // Try @sparticuz/chromium (works in Vercel/Lambda)
        try {
            chromiumLib = (await import('@sparticuz/chromium')).default;
            executablePath = await chromiumLib.executablePath();
            launchArgs = chromiumLib.args;
        } catch (_) {
            // Fall back to system Playwright chromium
            executablePath = undefined;
            launchArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'];
        }

        const { chromium } = await import('playwright-core');
        browser = await chromium.launch({
            headless: true,
            args: launchArgs || ['--no-sandbox', '--disable-setuid-sandbox'],
            ...(executablePath ? { executablePath } : {})
        });

        const context = await browser.newContext({
            viewport,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        const page = await context.newPage();

        async function snap(label) {
            const buf = await page.screenshot({ type: 'jpeg', quality: 80, fullPage: false });
            frames.push({ label, image: buf.toString('base64'), url: page.url() });
        }

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForTimeout(1800);
        await snap(`Opened ${new URL(url).hostname}`);

        for (const action of actions) {
            try {
                if (action.type === 'navigate') {
                    await page.goto(action.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
                    await page.waitForTimeout(1200);
                    await snap(action.label || `Navigated to ${action.url}`);
                } else if (action.type === 'click') {
                    await page.click(action.selector, { timeout: 8000 });
                    await page.waitForTimeout(900);
                    await snap(action.label || `Clicked: ${action.selector}`);
                } else if (action.type === 'type') {
                    await page.fill(action.selector, action.value, { timeout: 8000 });
                    await snap(action.label || `Typed value`);
                } else if (action.type === 'scroll') {
                    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), action.y || 500);
                    await page.waitForTimeout(600);
                    await snap(action.label || 'Scrolled');
                } else if (action.type === 'wait') {
                    await page.waitForTimeout(action.ms || 1000);
                    await snap(action.label || 'Waiting...');
                } else if (action.type === 'screenshot') {
                    await snap(action.label || 'Capturing view');
                }
            } catch (e) {
                frames.push({ label: `⚠️ ${action.label || action.type}: ${e.message}`, image: null, error: true });
            }
        }

        await browser.close();
        return res.status(200).json({ ok: true, frames: frames.filter(f => f.image) });

    } catch (err) {
        if (browser) try { await browser.close(); } catch (_) {}
        return res.status(500).json({ ok: false, error: err.message, frames: frames.filter(f => f.image) });
    }
}
