module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const { repo, commit_sha } = req.body || {};
    if (!repo || !commit_sha) return res.status(400).json({ state: 'pending', description: 'Waiting...' });

    const token = process.env.GITHUB_TOKEN;
    const ghHeaders = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' };

    try {
        // Method 1: Commit statuses (Vercel classic GitHub integration)
        const statusRes = await fetch(
            `https://api.github.com/repos/${repo}/commits/${commit_sha}/statuses`,
            { headers: ghHeaders }
        );
        const statuses = await statusRes.json();

        if (Array.isArray(statuses) && statuses.length > 0) {
            const vercel = statuses.find(s =>
                s.context && (s.context.toLowerCase().includes('vercel') || s.context.toLowerCase().includes('deployment'))
            );
            if (vercel) {
                return res.status(200).json({
                    state: vercel.state,           // 'pending' | 'success' | 'failure' | 'error'
                    description: vercel.description,
                    url: vercel.target_url
                });
            }
        }

        // Method 2: Check runs (Vercel GitHub App integration)
        const checkRes = await fetch(
            `https://api.github.com/repos/${repo}/commits/${commit_sha}/check-runs`,
            { headers: ghHeaders }
        );
        const checkData = await checkRes.json();

        if (checkData.check_runs && checkData.check_runs.length > 0) {
            const vercelRun = checkData.check_runs.find(c =>
                c.app?.name?.toLowerCase().includes('vercel') ||
                c.name?.toLowerCase().includes('vercel') ||
                c.name?.toLowerCase().includes('deploy')
            );
            if (vercelRun) {
                let state = 'pending';
                if (vercelRun.conclusion === 'success' || vercelRun.status === 'completed') state = 'success';
                if (vercelRun.conclusion === 'failure' || vercelRun.conclusion === 'cancelled') state = 'failure';
                return res.status(200).json({
                    state,
                    description: vercelRun.output?.title || vercelRun.name,
                    url: vercelRun.details_url
                });
            }

            // Any check run — use the first completed one as a signal
            const done = checkData.check_runs.find(c => c.status === 'completed' && c.conclusion === 'success');
            if (done) {
                return res.status(200).json({ state: 'success', description: done.name + ' completed', url: done.details_url });
            }
        }

        // Nothing yet — build is queued
        return res.status(200).json({ state: 'pending', description: 'Waiting for Vercel...' });
    } catch (e) {
        return res.status(500).json({ state: 'pending', description: 'Status check error: ' + e.message });
    }
}
