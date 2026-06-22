        function setProviderOrder(order) {
            document.getElementById('provider-order').value = order;
            localStorage.setItem('providerOrder', order);
            alert('Provider priority updated. The system will automatically cycle through remaining defaults if these fail.');
        }

        async function testDoomsdayFallback() {
            const resEl = document.getElementById('doomsday-test-result');
            if (!resEl) return;
            resEl.style.display = 'block';
            resEl.innerText = "Simulating total AI failure... routing to Doomsday Fallback...";
            let scrapes = JSON.parse(localStorage.getItem('localScrapes') || '[]');
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + (localStorage.getItem('token') || '') },
                    body: JSON.stringify({
                        prompt: "System test.",
                        keys: { PROVIDER_ORDER: 'force_fail', LOCAL_SCRAPES: scrapes },
                        history: []
                    })
                });
                const data = await response.json();
                if (response.ok) {
                    resEl.innerText = "SUCCESS! Fallback activated.\n\nResponse:\n" + data.result;
                } else {
                    resEl.innerText = "FAILED.\n\n" + (data.error || "Unknown error");
                }
            } catch(e) {
                resEl.innerText = "Network Error:\n" + e.message;
            }
        }


        let adminPollInterval = null;
        async function startAdminMonitor() {
            if (currentUser?.role !== 'admin') return;

            // Poll for recent active users (who have sent logs or logged in)
            adminPollInterval = setInterval(async () => {
                const { data, error } = await supabaseClient
                    .from('users')
                    .select('username, plan, status, updated_at')
                    .order('updated_at', { ascending: false })
                    .limit(5);

                if (data && data.length > 0) {
                    const recentUser = data[0];
                    const lastSeen = new Date(recentUser.updated_at).getTime();
                    const now = new Date().getTime();
                    // If updated in the last 15 seconds, assume login or active
                    if (now - lastSeen < 15000) {
                        const notif = document.getElementById('admin-notif');
                        notif.innerText = `🚨 LIVE ACTIVITY: User [${recentUser.username}] is active / logged in.`;
                        notif.style.display = 'block';
                        setTimeout(() => notif.style.display = 'none', 5000);
                    }
                }
            }, 10000); // Check every 10 seconds
        }

        async function fetchLiveUserStats() {
            const { data: users, error } = await supabaseClient.from('users').select('*');
            if (users) {
                let html = '<h4>LIVE USER STATISTICS</h4><table style="width:100%; border-collapse: collapse;">';
                html += '<tr style="border-bottom:1px solid #ff00ff; color: #00ffff;"><th>Username</th><th>Status</th><th>Plan</th><th>Credits / Questions</th><th>Last Active</th></tr>';
                users.forEach(u => {
                    const isOnline = (new Date().getTime() - new Date(u.updated_at).getTime()) < 60000 ? '<span style="color:#0f0;">ONLINE</span>' : 'OFFLINE';
                    const questions = u.plan === 'Starter' ? '40/Day' : (u.plan === 'Unlimited Text' ? 'Unlimited' : 'Power Mode');
                    html += `<tr>
                        <td>${escapeHtml(u.username)}</td>
                        <td>${isOnline}</td>
                        <td>${u.plan}</td>
                        <td>${questions}</td>
                        <td>${new Date(u.updated_at).toLocaleTimeString()}</td>
                    </tr>`;
                });
                html += '</table>';
                document.getElementById('live-monitor-content').innerHTML = html;
            }
        }



        function changeFont(font) {
            document.body.style.fontFamily = font;
            localStorage.setItem('customFont', font);
        }


        async function processCSV() {
            const fileInput = document.getElementById('csv-upload');
            const promptPrefix = document.getElementById('csv-batch-prompt').value.trim();
            if (!fileInput.files.length || !promptPrefix) return alert("Select a CSV file and enter a prompt prefix.");

            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = async (e) => {
                const lines = e.target.result.split('\n').filter(l => l.trim().length > 0);
                if (lines.length > 20) return alert("Batch limit is 20 rows max.");

                alert("Processing " + lines.length + " rows. This will take a moment...");
                for(let i=0; i<lines.length; i++) {
                    const item = lines[i].replace(/,/g, '');
                    document.getElementById('message-input').value = promptPrefix + " " + item;
                    await sendMessage();
                    await new Promise(r => setTimeout(r, 2500));
                }
            };
            reader.readAsText(file);
        }
        function saveWebhook() {
            const url = document.getElementById('user-webhook-url').value.trim();
            localStorage.setItem('userWebhook', url);
            alert("Webhook Saved! Responses will now be forwarded.");
        }
        async function triggerWebhook(text) {
            const url = localStorage.getItem('userWebhook');
            if (url) {
                try {
                    await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ ai_response: text }) });
                } catch(e) { console.log('Webhook failed'); }
            }
        }
        function applyCustomCSS() {
            const css = document.getElementById('custom-css-box').value;
            let style = document.getElementById('user-custom-css');
            if (!style) {
                style = document.createElement('style');
                style.id = 'user-custom-css';
                document.head.appendChild(style);
            }
            style.innerHTML = css;
            localStorage.setItem('customCSS', css);
            alert("Custom CSS Applied!");
        }
        function loadCustomStyles() {
            const font = localStorage.getItem('customFont');
            if (font) {
                document.body.style.fontFamily = font;
                if(document.getElementById('font-selector')) document.getElementById('font-selector').value = font;
            }
            const css = localStorage.getItem('customCSS');
            if (css) {
                let style = document.createElement('style');
                style.id = 'user-custom-css';
                style.innerHTML = css;
                document.head.appendChild(style);
                if(document.getElementById('custom-css-box')) document.getElementById('custom-css-box').value = css;
            }
        }

        function generateEmbedCode() {
            if (!currentUser) return;
            const code = `<iframe src="https://${window.location.host}/?embed=${currentUser.username}" width="350" height="500" style="border:1px solid #ff00ff; border-radius:10px; box-shadow:0 0 10px #00ffff;"></iframe>`;
            document.getElementById('embed-code').value = code;
        }

        function copyEmbedCode() {
            const copyText = document.getElementById('embed-code');
            copyText.select();
            document.execCommand('copy');
            alert('Embed Snippet Copied!');
        }

        // Logic to handle being inside an iframe widget
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('embed')) {
            // Embed Widget Logic

        document.addEventListener('DOMContentLoaded', () => {
            if (!localStorage.getItem('activeBetaCode')) localStorage.setItem('activeBetaCode', 'NEO-BETA-2027');
            const savedLang = localStorage.getItem('globalLanguage');
            if (savedLang && document.getElementById('global-lang-select')) {
                document.getElementById('global-lang-select').value = savedLang;
                // Wait for Google Translate script to load
                setTimeout(() => setGlobalLanguage(savedLang), 1500);
            }
        });

        }



        function flipCard(el) {
            el.classList.toggle('flipped');
        }

        async function processImageGeneration(userMessage) {
            const prompt = userMessage.replace('/imagine', '').trim();
            if (!prompt) return "Error: Please provide a prompt. Example: /imagine a futuristic city";

            // Check limits (5 per day)
            const today = new Date().toDateString();
            const stored = JSON.parse(localStorage.getItem('imageGenStats') || '{}');
            if (stored.date !== today) { stored.date = today; stored.count = 0; }
            if (stored.count >= 5) {
                return "Daily Limit Reached: You have generated 5/5 pictures today.";
            }

            stored.count += 1;
            localStorage.setItem('imageGenStats', JSON.stringify(stored));

            // Generate image URL via Vercel Secure Endpoint
            let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
            try {
                let keysPayload = {};

            const globalLang = localStorage.getItem('globalLanguage');
            if (globalLang && globalLang !== 'English (US)') {
                keysPayload.TARGET_LANGUAGE = globalLang;
            }

            const activePersona = localStorage.getItem('activePersona') || 'default';
            const baseGuidelines = localStorage.getItem('adminBaseGuidelines') || '';
            keysPayload.ACTIVE_PERSONA = activePersona;
            if (baseGuidelines) keysPayload.BASE_GUIDELINES = baseGuidelines;

                const tKey = localStorage.getItem('sys_api_TOGETHER_API_KEY');
                if (tKey) keysPayload.TOGETHER_API_KEY = tKey;

                const res = await fetch('/api/image/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: prompt, keys: keysPayload })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.url) url = data.url;
                }
            } catch(e) { console.log(e); }

            // Limit to 500 pictures globally (simulated locally or via basic memory array)
            let globalImages = JSON.parse(localStorage.getItem('globalImageCache') || '[]');
            globalImages.push(url);
            if (globalImages.length > 500) globalImages.shift(); // Remove oldest
            localStorage.setItem('globalImageCache', JSON.stringify(globalImages));

            return `<img src="${url}" alt="Generated Image" style="max-width:100%; border:1px solid var(--secondary); box-shadow:0 0 10px var(--secondary); margin-top:10px;">`;
        }


        function generateReferral() {
            if(!currentUser) return;
            const refLink = window.location.origin + "?ref=" + currentUser.username;
            document.getElementById('referral-link').value = refLink;
        }

        function buyGiftSubscription() {
            const confirmed = confirm("You are about to purchase a gift voucher for $240. Proceed to PayPal?");
            if (confirmed) {
                // Simulate checkout return -> generating a code
                const code = "NEO-" + Math.random().toString(36).substring(2, 10).toUpperCase();
                const out = document.getElementById('gift-code-output');
                out.innerText = "Simulated Payment Success! Gift Code: " + code;
                out.style.display = 'block';
                // Note: In reality this opens PayPal and Webhook returns the code
            }
        }



        let adCooldownTimer = null;
        async function unlockQuestions() {
            const cooldownEnd = localStorage.getItem('adCooldownEnd');
            if (cooldownEnd && Date.now() < cooldownEnd) {
                return alert('Please wait for the cooldown to end.');
            }

            openModal('video-ad-modal');
            const container = document.getElementById('video-container');
            const status = document.getElementById('video-ad-status');
            const rewardBtn = document.getElementById('video-ad-reward-btn-container');

            rewardBtn.style.display = 'none';
            status.innerText = 'Loading Adsterra Sponsored Content...';

            container.innerHTML = `
                <div style="padding: 20px; color: #ff0050;">
                    <h3 class="neon-text">ADSTERRA REWARDED CONTENT</h3>
                    <p>Ad will appear. Please stay on this screen to earn credits.</p>
                    <div id="adsterra-placeholder"></div>
                </div>
            `;

            let timeLeft = 60; // 1 minute watch as requested
            const timer = setInterval(() => {
                timeLeft--;
                status.innerText = `Watch ad for ${timeLeft}s to claim reward...`;
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    status.innerText = "Ad complete! Click below to claim.";
                    rewardBtn.style.display = 'block';
                }
            }, 1000);
        }

        async function claimVideoReward() {
            try {
                const token = localStorage.getItem('token');
                const resp = await fetch('/api/reward', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ userId: currentUser.id })
                });

                const result = await resp.json();
                if (result.success) {
                    alert(result.message);
                    startAdCooldown(result.cooldown || 60);
                    closeModal('video-ad-modal');

                    if (result.newCredits !== undefined) {
                        currentUser.credits = result.newCredits;
                        const creditsDisp = (currentUser.credits >= 999999 || currentUser.credits === null) ? 'Unlimited' : currentUser.credits;
                        const userInfoEl = document.getElementById('user-info');
                        if (userInfoEl) userInfoEl.innerHTML = `USER: ${currentUser.username}<br>PLAN: ${currentUser.plan}<br>CREDITS: ${creditsDisp}`;
                    }
                } else {
                    alert('Reward failed: ' + (result.error || 'Unknown error'));
                }
            } catch (e) {
                console.error(e);
                alert('Connection error. Please try again.');
            }
        }
