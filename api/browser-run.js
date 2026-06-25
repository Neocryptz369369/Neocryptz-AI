// Connects to an existing Browserbase session via CDP and runs actions
// Uses playwright-core (remote CDP — NO local Chromium binary needed)
// The user watches live via the iframe; this just drives the browser

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { sessionId, url, actions = [] } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
    if (!url) return res.status(400).json({ error: 'url required' });

    const apiKey = process.env.BROWSERBASE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'BROWSERBASE_API_KEY not configured' });

    let browser;
    const log = [];

    try {
        const { chromium } = await import('playwright-core');

        // Connect to the live Browserbase session via CDP — no local binary needed
        const wsEndpoint = `wss://connect.browserbase.com?apiKey=${apiKey}&sessionId=${sessionId}`;
        browser = await chromium.connectOverCDP(wsEndpoint);

        const context = browser.contexts()[0] || await browser.newContext();
        const page = context.pages()[0] || await context.newPage();

        // ── Navigate to the starting URL ─────────────────────────────────
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForTimeout(1500);
        log.push({ step: 'navigate', label: `Opened ${url}`, url: page.url() });

        // ── Run each action ───────────────────────────────────────────────
        for (const action of actions) {
            try {
                if (action.type === 'navigate') {
                    await page.goto(action.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
                    await page.waitForTimeout(1200);
                    log.push({ step: 'navigate', label: action.label || `Went to ${action.url}`, url: page.url() });

                } else if (action.type === 'click') {
                    // Try selector, then fallback to text-based matching
                    try {
                        await page.click(action.selector, { timeout: 5000 });
                    } catch (_) {
                        // Try finding by visible text
                        if (action.label) {
                            try {
                                await page.click(`text=${action.label}`, { timeout: 3000 });
                            } catch (__) {
                                log.push({ step: 'skip', label: `⚠️ Could not find: "${action.label || action.selector}"` });
                                continue;
                            }
                        } else {
                            log.push({ step: 'skip', label: `⚠️ Element not found: ${action.selector}` });
                            continue;
                        }
                    }
                    await page.waitForTimeout(1000);
                    log.push({ step: 'click', label: action.label || `Clicked ${action.selector}`, url: page.url() });

                } else if (action.type === 'scroll') {
                    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), action.y || 500);
                    await page.waitForTimeout(600);
                    log.push({ step: 'scroll', label: action.label || 'Scrolled' });

                } else if (action.type === 'type') {
                    await page.fill(action.selector, action.value || '');
                    log.push({ step: 'type', label: action.label || `Typed "${action.value}"` });

                } else if (action.type === 'wait') {
                    await page.waitForTimeout(Math.min(action.ms || 1000, 5000));
                    log.push({ step: 'wait', label: action.label || 'Waited' });

                } else if (action.type === 'screenshot') {
                    log.push({ step: 'screenshot', label: action.label || 'Snapshot', url: page.url() });
                }
            } catch (e) {
                log.push({ step: 'error', label: `⚠️ ${action.label || action.type}: ${e.message.slice(0, 100)}` });
            }
        }

        // ── Find all links on the final page ─────────────────────────────
        const linkData = await page.evaluate(() => {
            const links = [];
            document.querySelectorAll('a[href], button').forEach(el => {
                const label = el.textContent?.trim().slice(0, 60);
                const href = el.getAttribute('href');
                const tag = el.tagName.toLowerCase();
                if (label) links.push({ label, href, tag });
            });
            return links.slice(0, 20);
        });

        await browser.close();

        return res.status(200).json({
            ok: true,
            log,
            links: linkData,
            summary: `Completed ${log.length} steps. Found ${linkData.length} clickable elements on page.`
        });

    } catch (err) {
        if (browser) try { await browser.close(); } catch (_) {}
        return res.status(200).json({ ok: false, error: err.message, log });
    }
}
