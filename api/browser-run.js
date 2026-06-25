// Unified browser run — creates session, navigates, clicks every button,
// screenshots after each action, returns real frames from the actual page

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const { url, task } = req.body || {};
    if (!url) return res.status(400).json({ error: 'url required' });

    const apiKey = process.env.BROWSERBASE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'BROWSERBASE_API_KEY not configured' });

    const bbHeaders = {
        'x-bb-api-key': apiKey,
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
    };

    let browser;
    const frames = [];
    const report = [];

    try {
        // ── Step 1: Create Browserbase session ────────────────────────────
        let projectId = null;
        try {
            const pr = await fetch('https://www.browserbase.com/v1/projects', { headers: bbHeaders });
            if (pr.ok) { const pd = await pr.json(); projectId = (pd.data || pd)[0]?.id; }
        } catch(_) {}

        const sr = await fetch('https://www.browserbase.com/v1/sessions', {
            method: 'POST', headers: bbHeaders,
            body: JSON.stringify(projectId ? { projectId } : {})
        });
        if (!sr.ok) return res.status(500).json({ error: 'Session create failed: ' + await sr.text() });
        const session = await sr.json();
        const sessionId = session.id;

        // ── Step 2: Connect via Playwright CDP (no local browser needed) ──
        const { chromium } = await import('playwright-core');
        browser = await chromium.connectOverCDP(
            `wss://connect.browserbase.com?apiKey=${apiKey}&sessionId=${sessionId}`
        );
        const context = browser.contexts()[0];
        const page = context.pages()[0] || await context.newPage();
        await page.setViewportSize({ width: 1280, height: 720 });

        async function snap(label) {
            try {
                const buf = await page.screenshot({ type: 'jpeg', quality: 78 });
                frames.push({ label, image: buf.toString('base64'), url: page.url() });
            } catch(_) {}
        }

        // ── Step 3: Navigate to target URL ────────────────────────────────
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        await page.waitForTimeout(2500);
        await snap('🌐 Opened ' + url);

        // ── Step 4: Discover all clickable elements on the page ───────────
        const elements = await page.evaluate(() => {
            const seen = new Set();
            const results = [];
            document.querySelectorAll('button, a[href], input[type="submit"], input[type="button"], [role="button"]').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.width < 5 || rect.height < 5 || rect.top < 0 || rect.top > window.innerHeight + 200) return;
                const text = (el.textContent?.trim() || el.getAttribute('aria-label') || el.getAttribute('value') || el.getAttribute('href') || '?').slice(0, 60);
                const key = text + '|' + el.tagName;
                if (seen.has(key)) return;
                seen.add(key);
                results.push({
                    text,
                    tag: el.tagName.toLowerCase(),
                    href: el.getAttribute('href') || null,
                    cx: Math.round(rect.left + rect.width / 2),
                    cy: Math.round(rect.top + rect.height / 2)
                });
            });
            return results.slice(0, 12);
        });

        // ── Step 5: Click each element and screenshot ─────────────────────
        for (const el of elements) {
            const startUrl = page.url();
            try {
                await page.mouse.move(el.cx, el.cy);
                await page.waitForTimeout(300);
                await page.mouse.click(el.cx, el.cy);
                await page.waitForTimeout(1800);

                const endUrl = page.url();
                const navigated = endUrl !== startUrl;
                const label = navigated
                    ? `✅ "${el.text}" → navigated to ${endUrl}`
                    : `⚠️ "${el.text}" → no navigation (JS-only or dead)`;

                await snap(label);
                report.push({ element: el.text, tag: el.tag, navigated, destination: navigated ? endUrl : null });

                if (navigated) {
                    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 12000 }).catch(() => page.goto(url, { waitUntil: 'domcontentloaded' }));
                    await page.waitForTimeout(1500);
                }
            } catch(e) {
                report.push({ element: el.text, tag: el.tag, error: e.message.slice(0, 100) });
                frames.push({ label: `❌ "${el.text}": ${e.message.slice(0, 80)}`, image: null, error: true });
            }
        }

        await browser.close();

        const working = report.filter(r => r.navigated).length;
        const dead = report.filter(r => !r.navigated && !r.error).length;

        return res.status(200).json({
            ok: true,
            frames: frames.filter(f => f.image),
            report,
            summary: `Found ${elements.length} elements — ${working} navigate somewhere, ${dead} do nothing`
        });

    } catch (err) {
        if (browser) try { await browser.close(); } catch(_) {}
        return res.status(200).json({ ok: false, error: err.message, frames: frames.filter(f => f.image), report });
    }
}
