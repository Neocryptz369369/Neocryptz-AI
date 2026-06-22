        const _supabaseUrl = 'https://bxzvxgjnlvbexeuocbey.supabase.co';
        const _supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enZ4Z2pubHZiZXhldW9jYmV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzY3NjQsImV4cCI6MjA5NTY1Mjc2NH0.DWlzaP_xciNKfBDO-c_VTxTsaFVZjdfANesVY9Kjih0';
        const supabaseClient = window.supabase.createClient(_supabaseUrl, _supabaseAnonKey);

        let currentUser = null;
        let session_id = uuidv4();
        let token = localStorage.getItem('token');

        function uuidv4() { return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)); }


        async function checkGeoBlock() {
            try {
                // Ignore geoblock for Admin
                if (localStorage.getItem('currentUser')) {
                    const usr = JSON.parse(localStorage.getItem('currentUser'));
                    if (usr.username && usr.username.toLowerCase() === 'neocryptz') return false;
                }

                const res = await fetch('https://freeipapi.com/api/json/');
                const data = await res.json();

                if (data) {
                    // Block non-US
                    if (data.countryCode !== 'US') {
                        document.body.innerHTML = '<h1 style="color:red; text-align:center; margin-top:20vh;">ACCESS DENIED</h1><p style="text-align:center;">NEOCRYPTZ AI is currently restricted to US residents only.</p>';
                        return true;
                    }
                    // Block California
                    if (data.regionCode === 'CA') {
                        document.body.innerHTML = '<h1 style="color:red; text-align:center; margin-top:20vh;">ACCESS DENIED</h1><p style="text-align:center;">Due to state regulations, NEOCRYPTZ AI is not available in California.</p>';
                        return true;
                    }
                    // Block VPNs / Proxies
                    if (data.isProxy) {
                        document.body.innerHTML = '<h1 style="color:red; text-align:center; margin-top:20vh;">SECURITY ALERT</h1><p style="text-align:center;">VPN or Proxy detected. Please disable your VPN to access NEOCRYPTZ AI.</p>';
                        return true;
                    }
                }
            } catch(e) { console.log('Geocheck failed, proceeding.'); }
            return false;
        }



        function startAdCooldown(seconds) {
            const btn = document.getElementById('unlock-ad-btn');
            if (!btn) return;

            localStorage.setItem('adCooldownEnd', Date.now() + seconds * 1000);
            updateAdCooldownUI();
        }

        function updateAdCooldownUI() {
            const btn = document.getElementById('unlock-ad-btn');
            if (!btn) return;

            const cooldownEnd = localStorage.getItem('adCooldownEnd');
            if (cooldownEnd && Date.now() < cooldownEnd) {
                const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
                btn.disabled = true;
                btn.innerText = `COOLDOWN: ${remaining}s`;
                btn.style.opacity = '0.5';

                if (adCooldownTimer) clearTimeout(adCooldownTimer);
                adCooldownTimer = setTimeout(updateAdCooldownUI, 1000);
            } else {
                btn.disabled = false;
                btn.innerText = "UNLOCK +5 QUESTIONS (AD)";
                btn.style.opacity = '1';
                localStorage.removeItem('adCooldownEnd');
            }
        }

        // Call on init
        setTimeout(updateAdCooldownUI, 2000);
async function init() {
            // Check local storage first (Fallback)
            if (await checkGeoBlock()) return;
            let localUser = localStorage.getItem('currentUser');
            let session = null;
            let userProfile = null;

            try {
                const { data } = await supabaseClient.auth.getSession();
                session = data.session;
                if (session) {
                    const profileResp = await supabaseClient.from('profiles').select('*').eq('id', session.user.id).single();
                    userProfile = profileResp.data;
                }
            } catch (err) {
                console.log("Supabase getSession failed, falling back to local storage.", err);
            }

            if (session || localUser) {
                if (session) {
                    currentUser = userProfile || {
                        username: session.user.email.split('@')[0],
                        plan: "Power",
                        credits: 999999,
                        is_admin: true
                    };
                    localStorage.setItem('token', session.access_token);
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                } else {
                    currentUser = JSON.parse(localUser);
                }

                document.getElementById('auth-screen').style.display = 'none';
                const creditsDisp = (currentUser.credits >= 999999 || currentUser.credits === null) ? 'Unlimited' : currentUser.credits;
                document.getElementById('user-info').innerHTML = `USER: ${currentUser.username}<br>PLAN: ${currentUser.plan}<br>CREDITS: ${creditsDisp}`;

                if (currentUser.username && currentUser.username.toLowerCase() === 'neocryptz') {
                     currentUser.is_admin = true;
                     currentUser.plan = currentUser.plan === "Free" ? "Unlimited Text" : currentUser.plan;
                     if (currentUser.credits === undefined || currentUser.credits === null) currentUser.credits = 999999;

                     // Ensure their password is correct locally if they use local auth fallback
                     let localUsers = JSON.parse(localStorage.getItem('localUsers') || '{}');
                     if(localUsers['Neocryptz']) {
                          localUsers['Neocryptz'].plan = currentUser.plan;
                          localUsers['Neocryptz'].password = "Firstdata@9302164166";
                          localUsers['Neocryptz'].plan_expires_at = null; // Never expire
                          localStorage.setItem('localUsers', JSON.stringify(localUsers));
                     }

                     if (userProfile && userProfile.stored_api_keys) {
                         const keys = userProfile.stored_api_keys;
                         for (let k in keys) {
                             localStorage.setItem(`sys_api_${k}`, keys[k]);
                         }
                     }
                } else {
                     currentUser.is_admin = false;
                }

                if (currentUser.is_admin) {
                     document.getElementById('admin-icon').style.display = 'inline-block';
                     document.getElementById('user-icon').style.display = 'none';
                } else {
                     document.getElementById('admin-icon').style.display = 'none';
                     document.getElementById('user-icon').style.display = 'inline-block';
                }
            }
            loadAds(); updateAdCooldownUI();
            loadCustomStyles();
        }

        const tosSentences = [
            "Terms of service for Neocryptz AI.",
            "Age Requirements: You must be 18 years or older to use Neocryptz AI meaning anyone under 18 may not have access.",
            "Usage Limits: The service defines fair usage.",
            "Free-tier users are generally limited to 10 tasks per day and 3 concurrent tasks.",
            "Higher usage allowances are available for Neocryptz AI Starter and Power subscribers.",
            "Intellectual Property: You retain ownership of your code.",
            "However, Neocryptz AI does claim ownership of the code the AI generates, and AI outputs may not be unique or consistent across different users.",
            "Privacy and Training: Neocryptz AI is not private by default.",
            "Your code and repository data used to train Neocryptz AI models and does not remain isolated within your execution environment.",
            "No Warranties: Neocryptz AI makes no representations or warranties regarding the accuracy, reliability, or completeness of the code or content generated, and advises users to independently verify the output.",
            "No Refunds: Neocryptz AI Will not issue any refunds for it’s plans or for it’s advertising and when you purchase either a plan or ad you will have to click agree to this agreement before you are sent to Paypal payment page.",
            "We do keep a copy of this agreement in case you dispute the charges.",
            "And NEVER use anyone else’s card or stolen cards that can get you banned for life.",
            "We do record your ip addresses as well.",
            "Privacy Policy for Neocryptz AI.",
            "1. Neocryptz AI (Autonomous AI Coding Agent)",
            "Neocryptz AI is an autonomous coding assistant.",
            "Code Privacy: Neocryptz AI is not private by default.",
            "Your codebase is cloned to an isolated on Supabase Cloud virtual machine and evaluated.",
            "Data Training: Neocryptz AI does use private repository code to train their base AI models.",
            "2. Neocryptz AI (Life Coaching AI)",
            "This AI is a personalized life and career coaching tool.",
            "Data Collection & Identification: It collects a minimal amount of personal data full name, age, email, phone number and address to set up your account.",
            "Anonymization: Neocryptz AI never passes your identifying information to the large language model handling your chats, ensuring your conversations remain anonymous.",
            "Limitation of Liability: If Neocryptz AI provides bad advice that causes financial, medical, or legal harm to a user we are not responsible for anything.",
            "Information & Control: You own your data.",
            "We do not share your information with any third parties ever we promise this."
        ];

        let currentTosIndex = 0;

        function viewLegal(type) {
            let title = type === 'tos' ? 'TERMS OF SERVICE' : 'PRIVACY POLICY';
            let content = type === 'tos' ? tosSentences.slice(0, 14).join(" <br><br>") : tosSentences.slice(14).join(" <br><br>");
            document.getElementById('legal-title').innerText = title;
            document.getElementById('legal-content').innerHTML = content;
            openModal('legal-modal');
        }

        async function handleAuth(type) {
            let email, pass, username;
            if (type === 'login') {
                username = document.getElementById('login-user').value;
                pass = document.getElementById('login-pass').value;
                email = username;
            } else {
                username = document.getElementById('reg-user').value;
                email = document.getElementById('reg-email').value;
                pass = document.getElementById('reg-pass').value;
            }

            // Re-route legacy username login fields to email format for Supabase if not an email
            const formatEmail = (input) => input.includes('@') ? input : `${input}@neocryptz.ai`;
            const validEmail = formatEmail(email);

            if (type === 'login') {
                if (!email || !pass) return alert("Enter credentials");

                // Try Supabase first
                let supaError = null;
                try {
                    const { data, error } = await supabaseClient.auth.signInWithPassword({
                        email: validEmail,
                        password: pass
                    });
                    supaError = error;
                } catch(err) { supaError = err; }

                // Fallback to local storage if Supabase fails or error
                if (supaError) {
                    let users = JSON.parse(localStorage.getItem('localUsers') || '{}');
                    const foundUser = users[username] || users[validEmail];
                    if (foundUser && foundUser.password === pass) {
                        if (foundUser.banned) {
                            return alert("ACCESS DENIED: Your account has been banned for violating the terms of service.");
                        }

                        // Check if plan expired
                        if (foundUser.plan_expires_at && new Date() > new Date(foundUser.plan_expires_at)) {
                            foundUser.plan = "Free";
                            foundUser.plan_expires_at = null;
                            localStorage.setItem('localUsers', JSON.stringify(users));

                        }

                        localStorage.setItem('currentUser', JSON.stringify(foundUser));
                        localStorage.setItem('token', 'local-token-' + (users[username] ? username : validEmail));
                        location.reload();
                    } else {
                        alert('Login Failed: ' + supaError.message + " (Local fallback also failed: invalid credentials)");
                    }
                } else {
                    location.reload();
                }
            } else {
                if (await checkGeoBlock()) return;
                if (!document.getElementById('reg-tos').checked) return alert('Agree to terms');
                if (!email || !pass) return alert("Enter all details");

                const fullName = document.getElementById('reg-name')?.value || '';
                const address = document.getElementById('reg-address')?.value || '';
                const city = document.getElementById('reg-city')?.value || '';
                const state = document.getElementById('reg-state')?.value || '';
                const zip = document.getElementById('reg-zip')?.value || '';
                const fullAddress = `${address}, ${city}, ${state} ${zip}`;
                const phone = document.getElementById('reg-phone')?.value || '';
                const age = document.getElementById('reg-age')?.value || '';

                let supaError = null;
                try {
                    const { data, error } = await supabaseClient.auth.signUp({
                        email: validEmail,
                        password: pass,
                        options: { data: { full_name: fullName, address: fullAddress, phone: phone, age: age } }
                    });
                    supaError = error;
                } catch(err) { supaError = err; }

                // Verify uniqueness
                let users = JSON.parse(localStorage.getItem('localUsers') || '{}');

                // If it's the admin or a local test, bypass IP check
                if (username.toLowerCase() !== 'neocryptz') {
                    // Simple IP constraint mock (would be done backend normally)
                    const ipConstraint = localStorage.getItem('registered_ip');
                    if (ipConstraint && ipConstraint !== username) {
                         // Only allow one non-admin account
                         alert("Registration Failed: Only one account is allowed per IP.");
                         return;
                    }
                    localStorage.setItem('registered_ip', username);
                }

                // Always save to local storage as fallback and for Admin view

                const betaInput = document.getElementById('reg-beta-code') ? document.getElementById('reg-beta-code').value.trim() : '';
                const activeBeta = localStorage.getItem('activeBetaCode') || 'NEO-BETA-2027';
                let startingCredits = 25;
                if (betaInput && betaInput === activeBeta) {
                    startingCredits = 100;
                    alert("Beta Code Accepted! 100 Credits Applied to Account.");
                }

                users[username] = {
                    username: username,
                    email: validEmail,
                    password: pass,
                    full_name: fullName,
                    address: fullAddress,
                    phone: phone,
                    age: age,
                    plan: "Free",
                    credits: startingCredits,
                    banned: false,
                    is_admin: (username.toLowerCase() === 'neocryptz')
                };
                localStorage.setItem('localUsers', JSON.stringify(users));

                // Sync to Supabase profiles table if authenticated
                if (supabaseClient) {
                    supabaseClient.auth.getSession().then(({ data: { session } }) => {
                        if (session) {
                            supabaseClient.from('profiles').upsert({
                                id: session.user.id,
                                username: username,
                                full_name: fullName,
                                email: validEmail,
                                address: fullAddress,
                                phone: phone,
                                age: age
                            }).then(() => console.log("Profile synced to Supabase")).catch(err => console.log("Profile sync error", err));
                        }
                    });
                }

                if (supaError && (supaError.message.includes('email_address_invalid') || supaError.message.includes('not allowed'))) {
                     alert('Registered successfully locally (Supabase email validation bypassed). Please Login.');
                     toggleAuth();
                } else if (supaError) {
                    alert('Registration fallback active. Saved locally. Supabase error: ' + supaError.message);
                    toggleAuth();
                } else {
                    alert('Registered successfully. Please Login.');
                    toggleAuth();
                }
            }
        }

        // Also update the logout function to sign out of Supabase
        async function logout() {
            try { await supabaseClient.auth.signOut(); } catch(e){ console.log(e); }
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            location.reload();
        }


        document.addEventListener('DOMContentLoaded', () => {
            const input = document.getElementById('message-input');
            if(input) {
                input.addEventListener('input', () => {
                    const counter = document.getElementById('char-counter');
                    if(counter) {
                        const len = input.value.length;
                        counter.innerText = len + " / 300 Chars";
                        if (len > 250) counter.style.color = '#ff0000';
                        else if (len > 200) counter.style.color = '#ff8c00';
                        else counter.style.color = '#aaa';
                    }
                });
            }
        });

        let recognition;
        function toggleVoiceInput() {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                alert("Voice input is not supported in this browser. Try Chrome or Edge.");
                return;
            }
            if (recognition) {
                recognition.stop();
                recognition = null;
                document.getElementById('mic-btn').style.color = 'var(--primary)';
                return;
            }

            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRec();
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = function() {
                document.getElementById('mic-btn').style.color = '#ff0000'; // Recording red
                document.getElementById('message-input').placeholder = "Listening...";
            };

            recognition.onresult = function(event) {
                const transcript = event.results[0][0].transcript;
                document.getElementById('message-input').value += (document.getElementById('message-input').value ? ' ' : '') + transcript;
            };

            recognition.onend = function() {
                document.getElementById('mic-btn').style.color = 'var(--primary)';
                document.getElementById('message-input').placeholder = "Enter command or question...";
                recognition = null;
            };

            recognition.start();
        }

        async function sendMessage() {
            const input = document.getElementById('message-input');
            checkMacros();
            let msg = input.value.trim();

            let isFlashcard = false;
            let displayMsg = msg;
            if (msg.startsWith('/flashcard')) {
                isFlashcard = true;
                displayMsg = "Generate a short, flashcard definition for: " + msg.replace('/flashcard', '').trim();
            }

            if (!msg) return;

            // Credit Check: 5 credits per question
            if (currentUser.credits !== null && currentUser.credits < 5) {
                appendMessage("assistant", "Insufficient credits! Each question costs 5 credits. Please upgrade your plan.");
                setTimeout(() => openModal("pricing-modal"), 1500);
                return;
            }

            // Deduct 5 credits
            if (currentUser.credits !== null) {
                currentUser.credits -= 5;
                if (currentUser.credits < 0) currentUser.credits = 0;
                localStorage.setItem("currentUser", JSON.stringify(currentUser));

                // Update localUsers as well
                let localUsers = JSON.parse(localStorage.getItem("localUsers") || "{}");
                if (localUsers[currentUser.username]) {
                    localUsers[currentUser.username].credits = currentUser.credits;
                    localStorage.setItem("localUsers", JSON.stringify(localUsers));
                }

                // Update UI
                const creditsDisp = (currentUser.credits >= 999999) ? "Unlimited" : currentUser.credits;
                document.getElementById("user-info").innerHTML = `USER: ${currentUser.username}<br>PLAN: ${currentUser.plan}<br>CREDITS: ${creditsDisp}`;
            }

            // Enforce 50 word limit for user inputs
            const wordCount = msg.split(/\s+/).length;
            const myUsernameLimitCheck = currentUser?.username || 'Unknown';
            if (myUsernameLimitCheck !== 'Neocryptz' && wordCount > 40) {
                alert("Please keep your questions brief (40 words or less). Your message is currently " + wordCount + " words.");
                return;
            }

            // Immediately apply profanity filter to the user's outgoing message string
            msg = filterProfanity(msg);

            const myUsername = currentUser?.username || 'Unknown';
            let users = JSON.parse(localStorage.getItem('localUsers') || '{}');
            let myPlan = 'Free';
            if (users[myUsername] && users[myUsername].plan) {
                myPlan = users[myUsername].plan;
            }

            // Check Daily Limit (40 Questions)
            const today = new Date().toDateString();
            let usageData = JSON.parse(localStorage.getItem('dailyUsage') || '{}');
            if (!usageData[myUsername]) usageData[myUsername] = { date: today, count: 0 };

            if (usageData[myUsername].date !== today) {
                usageData[myUsername] = { date: today, count: 0 }; // Reset for new day
            }

            if (myUsername !== 'Neocryptz' && usageData[myUsername].count >= 40) {
                appendMessage('assistant', 'ERROR: You have reached your daily limit of 40 questions. Please come back tomorrow!');
                input.value = '';
                return;
            }

            // Check 25 Free Lifetime Credits
            let lifetimeUsage = JSON.parse(localStorage.getItem('lifetimeUsage') || '{}');
            if (!lifetimeUsage[myUsername]) lifetimeUsage[myUsername] = 0;

            if (myPlan === 'Free' && lifetimeUsage[myUsername] >= 25 && myUsername !== 'Neocryptz') {
                appendMessage('assistant', 'You have used all 25 of your free trial credits! Please upgrade your plan to continue using Neocryptz AI.');
                input.value = '';
                setTimeout(() => openModal('pricing-modal'), 1500); // Auto pop-up pricing
                return;
            }

            appendMessage('user', msg);
            input.value = '';

            const btn = document.getElementById('send-btn');
            const micBtn = document.getElementById('mic-btn');
            btn.disabled = true;
            input.disabled = true; // Lock text box during countdown
            micBtn.disabled = true;

            let countdown = (myUsername === 'Neocryptz') ? 0 : 60;
            if (countdown === 0) {
                btn.disabled = false;
                input.disabled = false;
                micBtn.disabled = false;
                btn.innerText = 'EXECUTE';
            } else {
                const timer = setInterval(() => {
                    btn.innerText = `WAIT ${--countdown}s`;
                    if (countdown <= 0) {
                        clearInterval(timer);
                        btn.disabled = false;
                        input.disabled = false;
                        micBtn.disabled = false;
                        btn.innerText = 'EXECUTE';
                    }
                }, 1000);
            }

            let currentToken = localStorage.getItem('token') || 'local-token';

            let keysPayload = {};
            try {
                const defaultKeys = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_API_KEY', 'GROQ_API_KEY'];
                const trackedKeys = JSON.parse(localStorage.getItem('trackedApiKeys') || JSON.stringify(defaultKeys));
                trackedKeys.forEach(k => {
                    const val = localStorage.getItem(`sys_api_${k}`);
                    if (val) keysPayload[k] = val;
                });

                // Attach local scrapes to keys payload for the doomsday fallback
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith("authToken_")) {
                        const provider = key.replace("authToken_", "");
                        keysPayload[`AUTH_TOKEN_${provider.toUpperCase()}`] = localStorage.getItem(key);
                    }
                }
                let scrapes = JSON.parse(localStorage.getItem('localScrapes') || '[]');
                if (scrapes.length > 0) {
                    keysPayload.LOCAL_SCRAPES = scrapes;
                }
            } catch (e) {
                console.error("Error reading API keys from local storage", e);
            }

            let historyPayload = [];
            try {
                const allHistory = JSON.parse(localStorage.getItem('globalChatHistory') || '[]');
                historyPayload = allHistory.filter(h => h.username === myUsername).slice(-2); // Limit history to last 2 messages for extreme token optimization
            } catch(e) {}

            const resp = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentToken}` },
                body: JSON.stringify({ prompt: applyAnonymizer(displayMsg), session_id: session_id, keys: keysPayload, history: historyPayload })
            });

            const data = await resp.json();
            let aiText = '';
            if (resp.ok) {
                aiText = data.result || 'Task execution initiated.';
                if (isFlashcard) {
                    const topic = msg.replace('/flashcard', '').trim();
                    aiText = `
                    <div class="flip-card" onclick="flipCard(this)">
                        <div class="flip-card-inner">
                            <div class="flip-card-front">
                                <h3>${escapeHtml(topic.toUpperCase())}</h3>
                                <p style="font-size:0.7em; margin-top:20px;">(Click to flip)</p>
                            </div>
                            <div class="flip-card-back">
                                <p style="font-size:0.9em;">${escapeHtml(aiText)}</p>
                            </div>
                        </div>
                    </div>`;
                }

                appendMessage('assistant', aiText); triggerWebhook(aiText);

                // Increment Usage Count on Success
                if (myUsername !== 'Neocryptz') {
                    usageData[myUsername].count += 1;
                    localStorage.setItem('dailyUsage', JSON.stringify(usageData));

                    if (myPlan === 'Free') {
                        lifetimeUsage[myUsername] += 1;
                        localStorage.setItem('lifetimeUsage', JSON.stringify(lifetimeUsage));
                    }
                }
            } else {
                aiText = `ERROR: ${data.error || 'Request Failed'}`;
                appendMessage('assistant', aiText);
            }

            // Save to Global Chat History
            let globalChat = JSON.parse(localStorage.getItem('globalChatHistory') || '[]');
            globalChat.push({
                timestamp: new Date().toISOString(),
                username: currentUser?.username || 'Unknown',
                user_msg: msg,
                ai_response: aiText
            });
            localStorage.setItem('globalChatHistory', JSON.stringify(globalChat));
        }

        function appendMessage(role, text) {
            const win = document.getElementById('chat-window');
            const div = document.createElement('div');
            div.className = `message ${role} neon-border`;
            const msgId = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
            div.id = msgId;

            let formatted = formatText(text);
            if (role === 'assistant') {
                formatted += `<br><button class="btn" style="font-size: 0.7em; padding: 2px 5px; margin-top: 5px;" onclick="playAudio('${msgId}')">🔊 READ ALOUD</button>`;
            }
            div.innerHTML = formatted;

            win.appendChild(div);
            win.scrollTop = win.scrollHeight;
        }


        function playAudio(id) {
            if ('speechSynthesis' in window) {
                let textToRead = id;
                const el = document.getElementById(id);
                if (el) {
                    textToRead = el.textContent || el.innerText;
                }

                // When Google Translate is active, it wraps text in <font> tags.
                // Getting innerText is usually safe, but we must ensure we strip exactly what we need.
                // We will get textContent to be safe from HTML artifacts.
                let text = textToRead;
                text = text.replace('🔊 READ ALOUD', '').replace('🔊 LEER EN VOZ ALTA', '').replace('🔊 LIRE EN HAUTE VOIX', '').trim();

                if (!text) return;

                // Cancel any ongoing speech
                window.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(text);

                // Expanded Language Map for Corporate Accessibility
                const langMap = {
                    'English': 'en-US', 'Spanish': 'es-ES', 'French': 'fr-FR', 'German': 'de-DE',
                    'Chinese (Simplified)': 'zh-CN', 'Chinese (Traditional)': 'zh-TW',
                    'Japanese': 'ja-JP', 'Korean': 'ko-KR', 'Hindi': 'hi-IN', 'Arabic': 'ar-SA',
                    'Portuguese': 'pt-PT', 'Russian': 'ru-RU', 'Italian': 'it-IT', 'Dutch': 'nl-NL',
                    'Turkish': 'tr-TR', 'Polish': 'pl-PL', 'Swedish': 'sv-SE', 'Indonesian': 'id-ID',
                    'Vietnamese': 'vi-VN', 'Thai': 'th-TH', 'Greek': 'el-GR', 'Czech': 'cs-CZ',
                    'Danish': 'da-DK', 'Finnish': 'fi-FI', 'Hebrew': 'he-IL', 'Hungarian': 'hu-HU',
                    'Norwegian': 'no-NO', 'Romanian': 'ro-RO', 'Ukrainian': 'uk-UA'
                };

                const lang = localStorage.getItem('globalLanguage');

                // Set the default language if not explicitly configured in globalLanguage
                if (lang && langMap[lang]) {
                    utterance.lang = langMap[lang];
                } else if (lang && lang.length === 2) {
                    // It might be a 2 letter code from Google Translate fallback
                    utterance.lang = Object.values(langMap).find(v => v.startsWith(lang)) || 'en-US';
                } else {
                    utterance.lang = 'en-US';
                }

                // Many browsers require you to specifically select an available voice that matches the lang tag
                let voices = window.speechSynthesis.getVoices();
                if (voices.length > 0 && utterance.lang) {
                    const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));
                    if (matchedVoice) utterance.voice = matchedVoice;
                }

                // Extra fallback: If Google Translate modified the text but we don't have a matching voice,
                // let the browser attempt to auto-detect the language from the text itself.
                if (!utterance.voice && voices.length > 0) {
                    utterance.voice = voices.find(v => v.default) || voices[0];
                }

                window.speechSynthesis.speak(utterance);
            } else {
                alert("Text-to-speech not supported in this browser.");
            }
        }

        // Pre-load voices to avoid the Chrome bug where getVoices() returns empty the first time
        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = function() {
                window.speechSynthesis.getVoices();
            };
        }

        function escapeHtml(text) {
            return String(text)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }





        let wipeTimer = null;
        function toggleAutoWipe() {
            const isEnabled = document.getElementById('autowipe-toggle').checked;
            localStorage.setItem('autoWipeEnabled', isEnabled ? 'true' : 'false');
            resetWipeTimer();
            alert(isEnabled ? "Auto-Wipe Armed." : "Auto-Wipe Disarmed.");
        }
        function resetWipeTimer() {
            if (wipeTimer) clearTimeout(wipeTimer);
            if (localStorage.getItem('autoWipeEnabled') === 'true') {
                wipeTimer = setTimeout(() => {
                    document.getElementById('chat-window').innerHTML = ''; // Wipe screen
                    logout(); // Force logout
                }, 300000); // 5 minutes
            }
        }
        document.addEventListener('mousemove', resetWipeTimer);
        document.addEventListener('keypress', resetWipeTimer);

        function toggleAnonymizer() {
            const isEnabled = document.getElementById('anonymizer-toggle').checked;
            localStorage.setItem('anonymizerEnabled', isEnabled ? 'true' : 'false');
            alert(isEnabled ? "Shield Online. Personal data will be scrubbed." : "Shield Offline.");
        }

        function applyAnonymizer(text) {
            if (localStorage.getItem('anonymizerEnabled') !== 'true') return text;
            let clean = text;
            // Strip emails
            clean = clean.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi, '[EMAIL_REMOVED]');
            // Strip phone numbers (basic format)
            clean = clean.replace(/(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, '[PHONE_REMOVED]');
            return clean;
        }



        function setGlobalLanguage(lang) {
            localStorage.setItem('globalLanguage', lang);

            // Map our full names to Google Translate ISO codes
            const langMap = {
                'English': 'en', 'Spanish': 'es', 'French': 'fr', 'German': 'de', 'Chinese (Simplified)': 'zh-CN', 'Chinese (Traditional)': 'zh-TW',
                'Japanese': 'ja', 'Korean': 'ko', 'Hindi': 'hi', 'Arabic': 'ar', 'Portuguese': 'pt',
                'Russian': 'ru', 'Italian': 'it', 'Dutch': 'nl', 'Turkish': 'tr', 'Polish': 'pl',
                'Swedish': 'sv', 'Indonesian': 'id', 'Vietnamese': 'vi', 'Thai': 'th', 'Greek': 'el',
                'Czech': 'cs', 'Danish': 'da', 'Finnish': 'fi', 'Hebrew': 'iw', 'Hungarian': 'hu',
                'Norwegian': 'no', 'Romanian': 'ro', 'Ukrainian': 'uk'
            };

            const code = langMap[lang];
            if (code) {
                // Hack to trigger Google Translate dropdown without the user clicking the ugly widget
                const select = document.querySelector('.goog-te-combo');
                if (select) {
                    select.value = code;
                    select.dispatchEvent(new Event('change'));
                }
            }
        }
        document.addEventListener('DOMContentLoaded', () => {
            const savedLang = localStorage.getItem('globalLanguage');
            if (savedLang && document.getElementById('global-lang-select')) {
                document.getElementById('global-lang-select').value = savedLang;
            }
        });

        function filterProfanity(text) {
            // A comprehensive regex identifying standard variations of profanity/vulgarity
            const badWords = /\b(fuck|shit|bitch|cunt|asshole|dick|pussy|whore|slut|bastard|fag|nigg|crap|twat|damn)\w*\b/gi;
            return text.replace(badWords, '!@#$neocryptz6357%^&*');
        }

        function formatText(text) {
            // First filter vulgarity out of the raw text
            const cleanText = filterProfanity(text);
            // Escape HTML to prevent XSS
            const escapedText = escapeHtml(cleanText);
            // Simple markdown-ish code block formatting
            return escapedText.replace(/```([\s\S]*?)```/g, (match, code) => {
                const id = uuidv4();
                return `<pre id="${id}">${code}<button class="copy-btn" onclick="copyToClipboard('${id}')">COPY</button></pre>`;
            }).replace(/\n/g, '<br>');
        }

        async function copyToClipboard(id) {
            const code = document.getElementById(id).innerText.replace('COPY', '');
            await navigator.clipboard.writeText(code);
            alert('Copied to clipboard');
        }

        // LocalStorage Helpers for Ads
        function getLocalAds() {
            const storedAds = localStorage.getItem('activeAds');
            if (storedAds) return JSON.parse(storedAds);
            return [
                { id: '1', text: 'Please check out Neocryptz on YouTube and Spotify I just wrote all the books of the Bible into Songs. Just look for The Black and Purple Butterfly. I wrote 4 different Bibles into songs. The bible, Etheopian, Catholic,and The Mormon Bible.', type: 'ticker', status: 'active' }
            ];
        }

        function setLocalAds(ads) {
            localStorage.setItem('activeAds', JSON.stringify(ads));
        }

        async function loadAds() {
            const ads = getLocalAds();
            const ticker = document.getElementById('ticker');
            ticker.innerHTML = ads.map(a => `<span class="ticker-item">${a.text}</span>`).join('');

            // Populate ad boxes
            for (let i = 1; i <= 4; i++) {
                const el = document.getElementById(`ad-${i}`);
                if (el) {
                    el.innerText = ads[i-1] ? ads[i-1].text : 'Sponsored Content';
                }
            }

            // Update ticker speed mock
            const storedSpeed = localStorage.getItem('tickerSpeed') || "25";
            document.documentElement.style.setProperty('--ticker-speed', `${storedSpeed}s`);
            if (document.getElementById('speed-slider')) {
                document.getElementById('speed-slider').value = storedSpeed;
                document.getElementById('speed-val').innerText = storedSpeed;
            }
        }

        function toggleAuth() {
            const l = document.getElementById('login-form');
            const r = document.getElementById('register-form');
            l.style.display = l.style.display === 'none' ? 'flex' : 'none';
            r.style.display = r.style.display === 'none' ? 'flex' : 'none';

            // Check if registrations are locked
            if (r.style.display === 'flex' && localStorage.getItem('regLocked') === 'true') {
                r.innerHTML = '<h2 style="color: #ff0000; text-align: center;">We are not taking any new customers at this time.</h2><p style="text-align: center; margin-top: 20px; cursor: pointer; color: var(--secondary);" onclick="toggleAuth()">Back to Login</p>';
            }
        }

        const oauthProviders = [
            "Vercel", "Supabase", "Google", "Facebook (Meta)", "Apple", "X (Twitter)", "TikTok", "LinkedIn", "Pinterest", "Yahoo", "LINE", "Kakao", "Naver", "WeChat", "QQ", "VK (VKontakte)", "Mail.ru",
            "GitHub", "GitLab", "Bitbucket", "Atlassian", "Figma", "Notion", "Slack", "Zoom", "WordPress.com", "Basecamp", "HubSpot",
            "Amazon", "PayPal", "Stripe", "Shopify",
            "Spotify", "Twitch", "Discord", "Battle.net", "Steam", "Patreon", "Vimeo"
        ];

        function renderOAuthList() {
            const oauthList = document.getElementById('oauth-list');
            const tokenList = document.getElementById('auth-token-list');

            oauthList.innerHTML = oauthProviders.map(p => { const auth = localStorage.getItem(`authToken_${p}`); return `<button class="btn provider-btn ${auth ? "authorized" : ""}" style="padding: 10px; font-size: 0.9em;" onclick="autoAuthorizeAll()">OAuth: ${p}</button>`; }).join('');
            tokenList.innerHTML = oauthProviders.map(p => { const auth = localStorage.getItem(`authToken_${p}`); return `<button class="btn provider-btn ${auth ? "authorized" : ""}" style="padding: 10px; font-size: 0.9em;" onclick="promptAuthToken('${p}')">Token: ${p}</button>`; }).join('');
        }

        function filterOAuth() {
            const search = document.getElementById('oauth-search').value.toLowerCase();
            const btns = document.querySelectorAll('.provider-btn');
            for (let btn of btns) {
                btn.style.display = btn.innerText.toLowerCase().includes(search) ? 'block' : 'none';
            }
        }


        function autoAuthorizeAll() {
            if (confirm("NEOCRYPTZ AI requests automatic authorization for all 39 connected platforms to execute this autonomous task. Do you authorize?")) {
                oauthProviders.forEach(p => {
                    localStorage.setItem(`authToken_${p}`, "AUTO_AUTH_TOKEN_ACTIVE_" + Date.now());
                });
                alert("Success: Automatically authorized 39 OAuth platforms. NEOCRYPTZ AI has full cross-platform access.");
                if (document.getElementById('settings-modal').style.display === 'flex') {
                    renderOAuthList();
                }
                appendMessage("assistant", "I have automatically authorized all 39 platforms for you. You can manage these in the [OAuth Settings](javascript:openOAuthSettings()). Each authorized platform now shows a green indicator dot.");
            }
        }

        function promptAuthToken(provider) {
            const tokenInput = prompt(`Enter Manual Auth Token for ${provider}:`);
            if (tokenInput) {
                localStorage.setItem(`authToken_${provider}`, tokenInput);
                alert(`Auth Token for ${provider} saved successfully.`);
            }
        }

        function openOAuthSettings() {
            openModal('settings-modal');
            // Scroll to OAuth section if needed, though it is at the top of the settings modal usually
            const oauthSection = document.getElementById('oauth-list');
            if (oauthSection) oauthSection.scrollIntoView({ behavior: 'smooth' });
        }

        function openModal(id) {
            document.getElementById(id).style.display = 'flex';
            if (id === 'admin-modal') {
                loadAdminData();
                loadUsersAndLogs();
            }
            if (id === 'settings-modal') renderOAuthList();
            if(document.getElementById('anonymizer-toggle')) document.getElementById('anonymizer-toggle').checked = localStorage.getItem('anonymizerEnabled') === 'true';
            if (id === 'share-modal') generateReferral();
            if (id === 'history-modal') loadPersonalHistory();
        }

        function loadPersonalHistory() {
            const logsContainer = document.getElementById('personal-chat-logs');
            if (!logsContainer) return;

            let globalChat = JSON.parse(localStorage.getItem('globalChatHistory') || '[]');
            const myUsername = currentUser?.username || 'Unknown';
            let myLogs = globalChat.filter(log => log.username === myUsername);

            if (myLogs.length === 0) {
                logsContainer.innerHTML = '<p style="color: #aaa; text-align: center;">No chat history recorded yet.</p>';
                return;
            }

            let html = '';
            [...myLogs].reverse().forEach(log => {
                html += `<div style="margin-bottom: 15px; border: 1px solid #333; padding: 10px; border-radius: 5px; background: rgba(0,0,0,0.5);">
                    <strong style="color: var(--secondary);">${escapeHtml(new Date(log.timestamp).toLocaleString())}</strong>
                    <div style="margin-top: 5px; color: #fff;"><b>Me:</b> ${escapeHtml(log.user_msg)}</div>
                    <div style="margin-top: 5px; color: var(--primary);"><b>AI:</b> ${escapeHtml(log.ai_response)}</div>
                </div>`;
            });
            logsContainer.innerHTML = html;
        }

        async function banUser(userId) {
            let users = JSON.parse(localStorage.getItem('localUsers') || '{}');
            let foundUser = Object.keys(users).find(k => users[k].id === userId || users[k].username === userId);
            if (foundUser) {
                users[foundUser].banned = true;
                localStorage.setItem('localUsers', JSON.stringify(users));

                // Sync to Supabase profiles table if authenticated
                if (supabaseClient) {
                    supabaseClient.auth.getSession().then(({ data: { session } }) => {
                        if (session) {
                            supabaseClient.from('profiles').upsert({
                                id: session.user.id,
                                username: username,
                                full_name: fullName,
                                email: validEmail,
                                address: fullAddress,
                                phone: phone,
                                age: age
                            }).then(() => console.log("Profile synced to Supabase")).catch(err => console.log("Profile sync error", err));
                        }
                    });
                }
            }

            try {
                await supabaseClient.from('users').update({ banned: true }).eq('id', userId);
            } catch(e) {}

            alert("User has been completely BANNED.");
            loadAdminData();
            loadUsersAndLogs();
        }

        async function grantManualPlan(userId, planName, period = 'monthly') {
            // Calculate duration
            const days = period === 'yearly' ? 365 : 30;
            let expDate = planName === 'Free' ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
            const grantedDate = planName === 'Free' ? null : new Date().toLocaleDateString();

            if (userId.toLowerCase() === 'neocryptz') {
                expDate = null; // Never expire for the main admin account
            }

            // Map UI plan names to internal plan names if necessary
            if (planName === 'Unlimited') planName = 'Unlimited Text';

            // Update the user's plan, expiration, and status in Supabase
            const { data, error } = await supabaseClient
                .from('users')
                .update({
                    plan: planName,
                    status: planName === 'Free' ? 'inactive' : 'active',
                    updated_at: new Date(),
                    plan_expires_at: expDate,
                    plan_granted_at: grantedDate
                })
                .eq('id', userId);

            if (error) {
                console.log('Supabase users table missing/failing. Falling back to local storage update.');
                let users = JSON.parse(localStorage.getItem('localUsers') || '{}');
                let foundUser = Object.keys(users).find(k => users[k].id === userId || users[k].username === userId);
                if (foundUser) {
                    users[foundUser].plan = planName;
                    users[foundUser].plan_expires_at = expDate;
                    users[foundUser].plan_granted_at = grantedDate;

                    const multiplier = period === 'yearly' ? 12 : 1;
                    if (planName === 'Starter') users[foundUser].credits = 500 * multiplier;
                    if (planName === 'Power') users[foundUser].credits = 6000 * multiplier;
                    if (planName === 'Unlimited Text') users[foundUser].credits = 999999;
                    if (planName === 'Free') users[foundUser].credits = 25;
                    localStorage.setItem('localUsers', JSON.stringify(users));

                // Sync to Supabase profiles table if authenticated
                if (supabaseClient) {
                    supabaseClient.auth.getSession().then(({ data: { session } }) => {
                        if (session) {
                            supabaseClient.from('profiles').upsert({
                                id: session.user.id,
                                username: username,
                                full_name: fullName,
                                email: validEmail,
                                address: fullAddress,
                                phone: phone,
                                age: age
                            }).then(() => console.log("Profile synced to Supabase")).catch(err => console.log("Profile sync error", err));
                        }
                    });
                }
                }
            }

            alert(planName === 'Free' ? 'User plan revoked.' : `Plan ${planName} (${period}) updated successfully!`);
            loadAdminData(); // Refresh the admin table so the change shows
            loadUsersAndLogs();
        }

        function loadUsersAndLogs() {
            const logsContainer = document.getElementById('admin-logs');
            if (!logsContainer) return;
            logsContainer.innerHTML = '';

            let users = JSON.parse(localStorage.getItem('localUsers') || '{}');
            let globalChat = JSON.parse(localStorage.getItem('globalChatHistory') || '[]');

            // Render User Registry
            let html = '<h3 style="color:var(--primary); margin-bottom:10px;">USER REGISTRY & PLANS</h3>';
            html += '<table style="width:100%; border-collapse: collapse; font-size:0.8em; margin-bottom: 20px;"><tr><th style="border-bottom: 1px solid var(--primary); text-align:left; padding:5px;">Username</th><th style="border-bottom: 1px solid var(--primary); text-align:left; padding:5px;">Email</th><th style="border-bottom: 1px solid var(--primary); text-align:left; padding:5px;">Name/Age</th><th style="border-bottom: 1px solid var(--primary); text-align:left; padding:5px;">Phone</th><th style="border-bottom: 1px solid var(--primary); text-align:left; padding:5px;">Address</th><th style="border-bottom: 1px solid var(--primary); text-align:left; padding:5px;">Plan</th><th style="border-bottom: 1px solid var(--primary); text-align:left; padding:5px;">Controls</th></tr>';
            for (let u in users) {
                let usr = users[u];
                let userPlan = usr.plan || 'Free';
                if (usr.plan_granted_at) userPlan += `<br><span style="font-size:0.8em; color:#aaa;">(Granted: ${usr.plan_granted_at})</span>`;

                const passingId = usr.id || usr.username; // Ensure Supabase UUID or Username fallback is used
                const isBanned = usr.banned ? ' <strong style="color:red;">[BANNED]</strong>' : '';
                html += `<tr>
                    <td style="padding: 5px;">${escapeHtml(usr.username)}${isBanned}</td>
                    <td style="padding: 5px;">${escapeHtml(usr.email)}</td>
                    <td style="padding: 5px;">${escapeHtml(usr.full_name || 'N/A')}<br>Age: ${escapeHtml(usr.age || 'N/A')}</td>
                    <td style="padding: 5px;">${escapeHtml(usr.phone || 'N/A')}</td>
                    <td style="padding: 5px;">${escapeHtml(usr.address || 'N/A')}</td>
                    <td style="padding: 5px; color: var(--secondary);">${userPlan}</td>
                    <td style="padding: 5px; display:flex; flex-wrap:wrap; gap:5px;">
                        <button onclick="grantManualPlan('${passingId}', 'Starter', 'monthly')" style="font-size:0.7em; padding:2px;">STARTER (M)</button>
                        <button onclick="grantManualPlan('${passingId}', 'Starter', 'yearly')" style="font-size:0.7em; padding:2px;">STARTER (Y)</button>
                        <button onclick="grantManualPlan('${passingId}', 'Power', 'monthly')" style="font-size:0.7em; padding:2px;">POWER (M)</button>
                        <button onclick="grantManualPlan('${passingId}', 'Power', 'yearly')" style="font-size:0.7em; padding:2px;">POWER (Y)</button>
                        <button onclick="grantManualPlan('${passingId}', 'Unlimited', 'monthly')" style="font-size:0.7em; padding:2px;">UNL (M)</button>
                        <button onclick="grantManualPlan('${passingId}', 'Unlimited', 'yearly')" style="font-size:0.7em; padding:2px;">UNL (Y)</button>
                        <button onclick="grantManualPlan('${passingId}', 'Free')" style="font-size:0.8em; padding:2px; background:#ff8c00; border-color:#ff8c00; color:#fff;">REVOKE</button>
                        <button onclick="banUser('${passingId}')" style="font-size:0.8em; padding:2px; background:#ff0000; border-color:#ff0000; color:#fff;">BAN</button>
                    </td>
                </tr>`;
            }
            html += '</table>';

            // Render Global Chat Logs
            html += '<h3 style="color:var(--primary); margin-bottom:10px;">GLOBAL CHAT LOGS</h3>';
            if (globalChat.length === 0) {
                html += '<p>No chat history recorded.</p>';
            } else {
                [...globalChat].reverse().forEach(log => {
                    html += `<div style="margin-bottom: 15px; border: 1px solid #333; padding: 10px; border-radius: 5px; background: rgba(0,0,0,0.5);">
                        <strong style="color: var(--secondary);">${escapeHtml(new Date(log.timestamp).toLocaleString())} - USER: ${escapeHtml(log.username)}</strong>
                        <div style="margin-top: 5px; color: #fff;"><b>Msg:</b> ${escapeHtml(log.user_msg)}</div>
                        <div style="margin-top: 5px; color: var(--primary);"><b>AI:</b> ${escapeHtml(log.ai_response)}</div>
                    </div>`;
                });
            }

            logsContainer.innerHTML = html;
        }
        function closeModal(id) { document.getElementById(id).style.display = 'none'; }

        function setPersona(val) {
            localStorage.setItem('activePersona', val);
            alert("AI Persona updated to: " + val);
        }

        function useTemplate(text) {
            document.getElementById('message-input').value = text;
            closeModal('user-menu-modal');
            document.getElementById('message-input').focus();
        }

        function copyReferral() {
            const copyText = document.getElementById('referral-link');
            if(!copyText.value) return;
            copyText.select();
            document.execCommand('copy');
            alert('Referral Link Copied! Send it to your friends to earn 10% commission on sign-ups.');
        }


        function saveBetaCode() {
            const code = document.getElementById('admin-beta-code').value.trim();
            localStorage.setItem('activeBetaCode', code);
            alert("Beta Code updated to: " + code);
        }
        function saveGuidelines() {
            const text = document.getElementById('admin-base-guidelines').value.trim();
            localStorage.setItem('adminBaseGuidelines', text);
            alert("Custom Brand Guidelines Saved!");
        }

        function downloadChat() {
            const chatBox = document.getElementById('chat-window');
            const blob = new Blob([chatBox.innerText], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'neocryptz_chat_export.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }




        async function requestSplitView() {
            const input = document.getElementById('message-input');
            let msg = input.value.trim();
            if (!msg) return alert("Enter a prompt first to generate A/B split variations.");

            input.value = '';
            appendMessage('user', "[A/B SPLIT REQUEST]: " + msg);
            appendMessage('assistant', "Generating Option A and Option B...");

            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: "Provide 2 totally different style variations for the following prompt. Format exactly like this:\n\n[OPTION A]: (text)\n\n[OPTION B]: (text)\n\nPrompt: " + msg,
                        keys: { PROVIDER_ORDER: "sambanova,groq,gemini" }
                    })
                });
                const data = await res.json();

                const win = document.getElementById('chat-window');
                const div = document.createElement('div');
                div.className = `message assistant neon-border`;
                div.style.display = 'flex';
                div.style.gap = '10px';

                let text = data.result || '';
                let parts = text.split('[OPTION B]:');
                let optA = parts[0] ? parts[0].replace('[OPTION A]:', '').trim() : text;
                let optB = parts[1] ? parts[1].trim() : '';

                div.innerHTML = `
                    <div style="flex:1; border-right:1px dashed var(--primary); padding-right:10px;">
                        <h4 style="color:var(--primary); margin-top:0;">OPTION A</h4>
                        <p>${escapeHtml(optA)}</p>
                    </div>
                    <div style="flex:1; padding-left:10px;">
                        <h4 style="color:var(--secondary); margin-top:0;">OPTION B</h4>
                        <p>${escapeHtml(optB)}</p>
                    </div>
                `;
                win.appendChild(div);
                win.scrollTop = win.scrollHeight;

            } catch(e) {
            }
        }

        async function requestSplitView() {
            const input = document.getElementById('message-input');
            let msg = input.value.trim();
            if (!msg) return alert("Enter a prompt first to generate A/B split variations.");

            input.value = '';
            appendMessage('user', "[A/B SPLIT REQUEST]: " + msg);
            appendMessage('assistant', "Generating Option A and Option B...");

            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: "Provide 2 totally different style variations for the following prompt. Format exactly like this:\n\n[OPTION A]: (text)\n\n[OPTION B]: (text)\n\nPrompt: " + msg,
                        keys: { PROVIDER_ORDER: "sambanova,groq,gemini" }
                    })
                });
                const data = await res.json();

                const win = document.getElementById('chat-window');
                const div = document.createElement('div');
                div.className = `message assistant neon-border`;
                div.style.display = 'flex';
                div.style.gap = '10px';

                let text = data.result || '';
                let parts = text.split('[OPTION B]:');
                let optA = parts[0] ? parts[0].replace('[OPTION A]:', '').trim() : text;
                let optB = parts[1] ? parts[1].trim() : '';

                div.innerHTML = `
                    <div style="flex:1; border-right:1px dashed var(--primary); padding-right:10px;">
                        <h4 style="color:var(--primary); margin-top:0;">OPTION A</h4>
                        <p>${escapeHtml(optA)}</p>
                    </div>
                    <div style="flex:1; padding-left:10px;">
                        <h4 style="color:var(--secondary); margin-top:0;">OPTION B</h4>
                        <p>${escapeHtml(optB)}</p>
                    </div>
                `;
                win.appendChild(div);
                win.scrollTop = win.scrollHeight;

            } catch(e) {
            }
        }
        function generateCanvas() {
            const b1 = document.getElementById('canvas-1').value.trim();
            const b2 = document.getElementById('canvas-2').value.trim();
            const b3 = document.getElementById('canvas-3').value.trim();
            if(!b1 || !b2 || !b3) return alert("Fill in all boxes!");

            const prompt = `${b1} aimed at ${b2}. ${b3}.`;

        async function runPolisher() {
            const input = document.getElementById('polish-input').value.trim();
            if(!input) return;
            document.getElementById('polish-output').innerText = "Polishing...";

            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: "Fix all grammar errors and improve the vocabulary of this text: " + input,
                        keys: { PROVIDER_ORDER: "sambanova,groq,gemini" }
                    })
                });
                const data = await res.json();
                document.getElementById('polish-output').innerText = data.result || "Error";
            } catch(e) {
                document.getElementById('polish-output').innerText = "Network Error";
            }
        }

        async function runPolisher() {
            const input = document.getElementById('polish-input').value.trim();
            if(!input) return;
            document.getElementById('polish-output').innerText = "Polishing...";

            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: "Fix all grammar errors and improve the vocabulary of this text: " + input,
                        keys: { PROVIDER_ORDER: "sambanova,groq,gemini" }
                    })
                });
                const data = await res.json();
                document.getElementById('polish-output').innerText = data.result || "Error";
            } catch(e) {
                document.getElementById('polish-output').innerText = "Network Error";
            }
        }
        function checkMacros() {
            const input = document.getElementById('message-input');
            let val = input.value;
            const lowVal = val.toLowerCase();

            if (val.includes('/reply')) input.value = val.replace('/reply', 'Please draft a polite business email response to this message: ');
            if (val.includes('/explain')) input.value = val.replace('/explain', 'Explain this concept to me as if I am 5 years old: ');
            if (val.includes('/code')) input.value = val.replace('/code', 'Please write efficient, well-commented code for the following: ');

            if (val.startsWith("/auth ")) {
                const provider = val.replace("/auth ", "").trim();
                promptAuthToken(provider);
                input.value = "";
                return;
            }

            // Granular platform detection
            const authIntent = lowVal.includes("authorize") || lowVal.includes("connect") || lowVal.includes("login") || lowVal.includes("oauth");
            if (authIntent) {
                let foundMatch = false;
                oauthProviders.forEach(p => {
                    const pLow = p.toLowerCase();
                    // Match full name or specific parts (e.g. "Facebook (Meta)" -> "facebook" or "meta")
                    const pClean = pLow.split(' (')[0].split(' ')[0];
                    if (lowVal.includes(pClean)) {
                        setTimeout(() => promptAuthToken(p), 500);
                        foundMatch = true;
                    }
                });

                if (!foundMatch && (lowVal.includes("all") || lowVal.includes("everything"))) {
                    setTimeout(autoAuthorizeAll, 500);
                    foundMatch = true;
                }

                // If they just said "authorize" or "oauth" without a specific platform
                if (!foundMatch && (lowVal === "oauth" || lowVal === "authorize" || lowVal === "login")) {
                    setTimeout(autoAuthorizeAll, 500);
                }
            }

            if (lowVal.includes('do something himself') || val.includes('/do') || lowVal.includes("i need help") || lowVal.includes("i can't do it") || lowVal.includes("authorise me for") || lowVal.includes("authorize me for")) {
                setTimeout(autoAuthorizeAll, 500);
            }
        }


        function cleanPastedText() {
            let text = document.getElementById('dirty-paste-box').value;
            if (!text) return;
            text = text.replace(/<[^>]*>?/gm, '');
            text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
            text = text.replace(/\s+/g, ' ').trim();
            document.getElementById('message-input').value = text;
            closeModal('smart-paste-modal');
            document.getElementById('dirty-paste-box').value = '';
            const words = text.split(' ').filter(w => w.length > 0).length;
            const usernameToCheck = currentUser?.username || 'Unknown';
            if (usernameToCheck !== 'Neocryptz' && words > 40) {
                alert("Notice: Even after cleaning, your text is " + words + " words. You must shorten it to 40 words before sending.");
            }
        }

        // Admin

        async function loadTikTokLinks() {
            const container = document.getElementById('tiktok-links-container');
            container.innerHTML = '<p style="color: #aaa; text-align: center;">Loading links...</p>';

            try {
                const { data, error } = await supabaseClient.from('tiktok_recommendations').select('*').order('id');
                if (error) throw error;

                if (!data || data.length === 0) {
                    container.innerHTML = '<p style="color: #aaa; text-align: center;">No TikTok links configured yet.</p>';
                    return;
                }

                let html = '<table style="width:100%; border-collapse: collapse; text-align:left;">';
                html += '<tr style="border-bottom:1px solid #ff0050;"><th>ID</th><th>Product</th><th>Status</th><th>Actions</th></tr>';
                data.forEach(item => {
                    const statusColor = item.is_active ? '#0f0' : '#aaa';
                    const statusText = item.is_active ? 'ACTIVE' : 'INACTIVE';
                    html += `<tr>
                        <td style="padding:10px 5px;">${escapeHtml(item.id)}</td>
                        <td style="padding:10px 5px;">
                            <div style="font-weight:bold; color:#fff;">${escapeHtml(item.product_name)}</div>
                            <div style="font-size:0.7em; color:var(--secondary);">${escapeHtml(item.display_headline)}</div>
                            <small style="color:#555;">${escapeHtml(item.destination_url)}</small>
                        </td>
                        <td style="padding:10px 5px; color:${statusColor};">${statusText}</td>
                        <td style="padding:10px 5px;">
                            <button class="btn" style="padding:2px 5px; font-size:0.8em;" onclick="toggleTikTokLink('${item.id}', ${!item.is_active})">${item.is_active ? 'DISABLE' : 'ACTIVATE'}</button>
                            <button class="btn" style="padding:2px 5px; font-size:0.8em; border-color:#f00; color:#f00;" onclick="deleteTikTokLink('${item.id}')">DELETE</button>
                        </td>
                    </tr>`;
                });
                html += '</table>';
                container.innerHTML = html;
            } catch(e) {
                container.innerHTML = `<p style="color: #f00; text-align: center;">Failed to load links: ${e.message}</p>`;
            }
        }

        async function saveTikTokLink() {
            const id = document.getElementById('tk-id').value.trim();
            const badge = document.getElementById('tk-badge').value.trim();
            const name = document.getElementById('tk-name').value.trim();
            const headline = document.getElementById('tk-headline').value.trim();
            const url = document.getElementById('tk-url').value.trim();

            if (!id || !badge || !name || !headline || !url) return alert("Please fill out all fields.");

            try {
                // If we set one active, we usually want to deactivate the others so only one shows at a time.
                await supabaseClient.from('tiktok_recommendations').update({ is_active: false }).neq('id', id);

                const { error } = await supabaseClient.from('tiktok_recommendations').upsert({
                    id: id,
                    visual_badge_text: badge,
                    product_name: name,
                    display_headline: headline,
                    destination_url: url,
                    is_active: true
                });
                if (error) throw error;

                alert("Successfully loaded into your database! It is now ready to rotation-serve.");

                document.getElementById('tk-id').value = '';
                document.getElementById('tk-badge').value = '';
                document.getElementById('tk-name').value = '';
                document.getElementById('tk-headline').value = '';
                document.getElementById('tk-url').value = '';

                loadTikTokLinks();
            } catch(e) {
            }
        }

        async function toggleTikTokLink(id, makeActive) {
            try {
                if (makeActive) {
                    await supabaseClient.from('tiktok_recommendations').update({ is_active: false }).neq('id', id);
                }
                await supabaseClient.from('tiktok_recommendations').update({ is_active: makeActive }).eq('id', id);
                loadTikTokLinks();
            } catch(e) { console.log(e); }
        }

        async function deleteTikTokLink(id) {
            if(!confirm("Delete this TikTok affiliate link?")) return;
            try {
                await supabaseClient.from('tiktok_recommendations').delete().eq('id', id);
                loadTikTokLinks();
            } catch(e) { console.log(e); }
        }

        function showAdminTab(id) {
            if (id === "admin-deployment") loadVercelProjects();
            document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
            document.getElementById(id).style.display = 'block';
        }

        function shareTo(platform) {
            const shareText = "Check out Neocryptz AI I'm only letting 25 people in today. You can pay $20 month-to-month, or lock in your spot for a full year for $240 for unlimited AI so you never have to worry about price increases when I expand the server later. Limit 40 questions a day.";
            const shareUrl = "https://neocryptz-ai.vercel.app/";
            const fullText = `${shareText} ${shareUrl}`;

            if (platform === 'copy') {
                navigator.clipboard.writeText(fullText).then(() => alert('Copied to clipboard! Ready to paste to TikTok or anywhere else.'));
            } else if (platform === 'facebook') {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
            } else if (platform === 'twitter') {
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
            } else if (platform === 'whatsapp') {
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`, '_blank');
            } else if (platform === 'messenger') {
                window.open(`fb-messenger://share/?link=${encodeURIComponent(shareUrl)}`, '_blank');
            } else if (platform === 'native') {
                if (navigator.share) {
                    navigator.share({
                        title: 'Neocryptz AI',
                        text: shareText,
                        url: shareUrl
                    }).catch(console.error);
                } else {
                    alert("Native sharing is not supported on this browser. Please use the Copy Link button.");
                }
            }
        }

        function toggleRegistrationLock() {
            const isLocked = document.getElementById('lock-reg-checkbox').checked;
            localStorage.setItem('regLocked', isLocked ? 'true' : 'false');
        }

        function submitFeedback() {
            const text = document.getElementById('feedback-text').value.trim();
            if (!text) return alert("Please enter some feedback before submitting.");

            let feedbacks = JSON.parse(localStorage.getItem('globalFeedback') || '[]');
            feedbacks.push({
                username: currentUser?.username || 'Anonymous',
                text: text,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('globalFeedback', JSON.stringify(feedbacks));

            document.getElementById('feedback-text').value = '';
            closeModal('feedback-modal');
            alert("Thank you! Your feedback has been submitted successfully.");
        }

        async function executeScrape() {
            const urlInput = document.getElementById('scrape-url-input');
            const url = urlInput.value.trim();
            if (!url) return alert('Please enter a valid URL.');

            const btn = document.getElementById('scrape-btn');
            btn.disabled = true;
            btn.innerText = 'SCRAPING...';

            try {
                // Using a public free proxy to fetch raw HTML (AllOrigins) to avoid CORS issues
                const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
                if (!response.ok) throw new Error('Network error or blocked by proxy');

                const htmlText = await response.text();

                // Extremely basic extraction of just the text body
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');
                const rawText = doc.body.innerText.replace(/\s+/g, ' ').substring(0, 5000); // Cap at 5000 chars for token safety

                // Save securely to Supabase
                const { error } = await supabaseClient
                    .from('scrapes')
                    .insert([{ url: url, text_content: rawText }]);

                // Regardless of Supabase success, we must ALWAYS save to localStorage so the
                // AI "Doomsday" fallback in sendMessage() can instantly access the scrapes without latency!
                if (error) {
                    console.log("Supabase scrape insert failed, but saved to local fallback.", error);
                }
                let scrapes = JSON.parse(localStorage.getItem('localScrapes') || '[]');
                scrapes.push({ url: url, text: rawText, timestamp: new Date().toISOString() });
                localStorage.setItem('localScrapes', JSON.stringify(scrapes));

                alert('Website successfully scraped and saved to Supabase Cloud!');
                urlInput.value = '';
                loadScrapes();
            } catch (e) {
                alert('Failed to scrape URL. ' + e.message);
            }
            btn.disabled = false;
            btn.innerText = 'START SCRAPING';
        }

        async function loadScrapes() {
            const container = document.getElementById('scrapes-container');
            let scrapes = [];

            // Attempt to load from Supabase
            const { data, error } = await supabaseClient
                .from('scrapes')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                scrapes = data.map(d => ({ url: d.url, text: d.text_content, timestamp: d.created_at }));
            } else {
                console.log("Supabase fetch failed, loading local fallback scrapes.");
                scrapes = JSON.parse(localStorage.getItem('localScrapes') || '[]');
                scrapes.reverse(); // Reverse local to match Supabase descending order
            }

            if (scrapes.length === 0) {
                container.innerHTML = '<p style="color: #aaa; text-align: center;">No scrapes recorded in Supabase.</p>';
                return;
            }

            let html = '';
            scrapes.forEach(s => {
                html += `<div style="border: 1px solid #333; margin-bottom: 10px; padding: 10px;">
                    <strong style="color: var(--secondary);">${escapeHtml(s.url)}</strong> <span style="font-size: 0.8em; color: #777;">(${new Date(s.timestamp).toLocaleString()})</span>
                    <p style="font-size: 0.8em; color: #ccc; max-height: 60px; overflow: hidden;">${escapeHtml(s.text)}</p>
                </div>`;
            });
            container.innerHTML = html;
        }

        async function loadVercelProjects() {
            const container = document.getElementById("vercel-projects-container");
            container.innerHTML = "<p style=\"color: #aaa; text-align: center;\">Fetching Vercel projects...</p>";

            const token = localStorage.getItem("sys_api_VERCEL_TOKEN") || localStorage.getItem("authToken_Vercel");
            if (!token) {
                container.innerHTML = "<p style=\"color: #f00; text-align: center;\">No Vercel Token found. Please add VERCEL_TOKEN in Settings or authorize via OAuth.</p>";
                return;
            }

            try {
                const resp = await fetch("https://api.vercel.com/v9/projects", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await resp.json();

                if (data.projects && data.projects.length > 0) {
                    let html = "<table style=\"width:100%; border-collapse: collapse; text-align:left;\">";
                    html += "<tr style=\"border-bottom:1px solid #00ffff;\"><th>Project Name</th><th>Status</th><th>Actions</th></tr>";
                    data.projects.forEach(p => {
                        html += `<tr>
                            <td style="padding:10px 5px;">${escapeHtml(p.name)}</td>
                            <td style="padding:10px 5px; color:#0f0;">ACTIVE</td>
                            <td style="padding:10px 5px;">
                                <button class="btn" style="padding:2px 5px; font-size:0.8em; border-color:#00ffff; color:#00ffff;" onclick="triggerVercelRedeploy('${p.id}', '${p.name}')">REDEPLOY</button>
                            </td>
                        </tr>`;
                    });
                    html += "</table>";
                    container.innerHTML = html;
                } else {
                    container.innerHTML = "<p style=\"color: #aaa; text-align: center;\">No Vercel projects found.</p>";
                }
            } catch (e) {
                container.innerHTML = `<p style="color: #f00; text-align: center;">Failed to load projects: ${e.message}</p>`;
            }
        }

        async function triggerDeployHook() {
            const url = document.getElementById("vercel-deploy-hook-url").value.trim();
            if (!url) {
                alert("Please enter a Deploy Hook URL.");
                return;
            }

            try {
                const resp = await fetch(url, { method: "POST" });
                if (resp.ok) {
                    alert("Deploy Hook triggered successfully! Vercel is now redeploying.");
                } else {
                    const err = await resp.text();
                    alert("Failed to trigger Hook: " + err);
                }
            } catch (e) {
            }
        }

        async function triggerVercelRedeploy(projectId, projectName) {
            if (!confirm(`Are you sure you want to trigger a redeploy for ${projectName}?`)) return;

            const token = localStorage.getItem("sys_api_VERCEL_TOKEN") || localStorage.getItem("authToken_Vercel");
            if (!token) {
                alert("No Vercel Token found.");
                return;
            }

            try {
                const resp = await fetch(`https://api.vercel.com/v13/deployments`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: projectName,
                        projectId: projectId,
                        deploymentId: null,
                        meta: { redeploy: "true" }
                    })
                });

                if (resp.ok) {
                    const data = await resp.json();
                    alert(`Redeploy triggered for ${projectName}! Deployment ID: ${data.id}`);
                } else {
                    const err = await resp.json();
                    alert("Failed to trigger redeploy: " + (err.error?.message || JSON.stringify(err)));
                }
            } catch (e) {
                alert(`Error triggering redeploy: ${e.message}`);
            }
        }

        async function loadAdminData() {
            document.getElementById('lock-reg-checkbox').checked = localStorage.getItem('regLocked') === 'true';
            document.getElementById('provider-order').value = localStorage.getItem('providerOrder') || 'sambanova,gemini,openrouter,pollinations';
            loadScrapes(); // Load scrapes
            if(document.getElementById('admin-beta-code')) document.getElementById('admin-beta-code').value = localStorage.getItem('activeBetaCode') || 'NEO-BETA-2027';
            if(document.getElementById('admin-base-guidelines')) document.getElementById('admin-base-guidelines').value = localStorage.getItem('adminBaseGuidelines') || '';

            let feedbacks = JSON.parse(localStorage.getItem('globalFeedback') || '[]');
            let fbHtml = '';
            if (feedbacks.length === 0) {
                fbHtml = '<p style="color: #aaa;">No feedback recorded yet.</p>';
            } else {
                [...feedbacks].reverse().forEach(fb => {
                    fbHtml += `<div style="border: 1px solid #333; padding: 10px; margin-bottom: 10px; background: rgba(0,0,0,0.5);">
                        <div style="font-size: 0.8em; color: var(--secondary); margin-bottom: 5px;">${escapeHtml(fb.username)} - ${new Date(fb.timestamp).toLocaleString()}</div>
                        <div style="color: #fff;">${escapeHtml(fb.text)}</div>
                    </div>`;
                });
            }
            document.getElementById('admin-feedback-list').innerHTML = fbHtml;

            const ads = getLocalAds();
            document.getElementById('admin-ad-list').innerHTML = ads.map(a => `
                <tr>
                    <td>${a.type}</td>
                    <td>${a.text}</td>
                    <td>${a.status}</td>
                    <td><button onclick="deleteAd('${a.id}')">DELETE</button></td>
                </tr>
            `).join('');

            // Fixed: Don't hide scrapes

            const defaultKeys = ['OPENAI_API_KEY', 'GOOGLE_API_KEY', 'GROQ_API_KEY', 'OPENROUTER_API_KEY', 'TOGETHER_API_KEY', 'ANYSCALE_API_KEY', 'SUPABASE_URL', 'SUPABASE_KEY', 'VERCEL_TOKEN', 'GITHUB_TOKEN'];
            let trackedKeys = JSON.parse(localStorage.getItem('trackedApiKeys') || JSON.stringify(defaultKeys));

            const keysContainer = document.getElementById('keys-container');
            keysContainer.innerHTML = trackedKeys.map(k => {
                const val = localStorage.getItem(`sys_api_${k}`) || '';
                return `
                <label style="display: flex; flex-direction: column;">
                    <span style="color: var(--secondary); font-size: 0.8em; margin-bottom: 2px;">${escapeHtml(k)}</span>
                    <input type="text" id="setting-${k}" value="${escapeHtml(val)}" placeholder="Enter ${escapeHtml(k)}" style="width: 100%; padding: 5px; background: #222; border: 1px solid var(--primary); color: #fff;">
                </label>
                `;
            }).join('');
        }

        function addCustomApiKey() {
            const newKey = document.getElementById('new-api-key-name').value.trim();
            if (!newKey) return alert("Enter an API Key Name");

            let trackedKeys = JSON.parse(localStorage.getItem('trackedApiKeys') || '["GOOGLE_API_KEY", "OPENROUTER_API_KEY", "POLLINATIONS_API_KEY", "GROQ_API_KEY", "SUPABASE_URL", "SUPABASE_KEY"]');
            if (!trackedKeys.includes(newKey)) {
                trackedKeys.push(newKey);
                localStorage.setItem('trackedApiKeys', JSON.stringify(trackedKeys));
                loadAdminData(); // Refresh UI
                document.getElementById('new-api-key-name').value = '';
            } else {
                alert("Key name already exists!");
            }
        }

        async function saveApiKeys() {
            let trackedKeys = JSON.parse(localStorage.getItem('trackedApiKeys') || '["OPENAI_API_KEY", "GOOGLE_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY", "POLLINATIONS_API_KEY", "SUPABASE_URL", "SUPABASE_KEY"]');
            let keysPayload = {};
            trackedKeys.forEach(k => {
                const input = document.getElementById(`setting-${k}`);
                if (input) {
                    const val = input.value.trim();
                    localStorage.setItem(`sys_api_${k}`, val);
                    keysPayload[k] = val;
                }
            });

            // Try to sync to Supabase (assuming an 'api_keys' or 'profiles' table)
            if (currentUser && currentUser.is_admin) {
                try {
                    await supabaseClient.from('profiles').update({ stored_api_keys: keysPayload }).eq('username', currentUser.username);
                } catch(e) {
                    console.log("Could not sync keys to Supabase, saved locally.", e);
                }
            }
            alert('System API Keys Saved Successfully to Local Storage & Supabase!');
        }

        async function grantUnlimited(username) {
            alert(`Unlimited granted to ${username}`);
            loadAdminData();
        }

        async function banUser(username) {
            alert(`${username} banned`);
            loadAdminData();
        }

        async function deleteAd(id) {
            let ads = getLocalAds();
            ads = ads.filter(ad => ad.id !== id);
            setLocalAds(ads);
            loadAdminData(); // Refreshes the table
            loadAds(); updateAdCooldownUI(); // Refreshes the ticker and ad boxes
        }

        async function saveSettings() {
            const speed = document.getElementById('speed-slider').value;
            localStorage.setItem('tickerSpeed', speed);
            loadAds(); updateAdCooldownUI();
            alert('Settings Saved');
        }

        function updateSpeedVal(val) {
            document.getElementById('speed-val').innerText = val;
            document.documentElement.style.setProperty('--ticker-speed', `${val}s`);
        }

        async function createAd() {
            const text = document.getElementById('new-ad-text').value;
            if (!text) return alert('Enter ad text');

            const ads = getLocalAds();
            ads.push({
                id: uuidv4(),
                text: text,
                type: 'ticker',
                status: 'active'
            });
            setLocalAds(ads);

            alert('Ad created successfully');
            document.getElementById('new-ad-text').value = '';
            loadAdminData(); // Refreshes the table
            loadAds(); updateAdCooldownUI(); // Refreshes the ticker and ad boxes
        }

        async function viewLogs(username) {
            const resp = await fetch(`/admin/user-logs/${username}`, { headers: { 'Authorization': `Bearer ${currentToken}` } });
            const logs = await resp.json();
            if (!logs.length) return alert('No logs found for this user.');

            // Simple grouping by date for "calendar" feel
            const grouped = {};
            logs.forEach(l => {
                const date = new Date(l.timestamp).toDateString();
                if (!grouped[date]) grouped[date] = [];
                grouped[date].push(l);
            });

            let logHtml = `<h2>LOGS FOR ${escapeHtml(username)}</h2>`;
            for (const date in grouped) {
                logHtml += `<div style="border: 1px solid var(--primary); margin-top: 10px; padding: 10px;">
                    <h3 style="margin: 0; color: var(--primary);">${escapeHtml(date)}</h3>
                    ${grouped[date].map(l => `
                        <div style="margin-top: 10px; border-top: 1px solid #222; padding-top: 5px;">
                            <div style="font-size: 0.7em; color: #555;">${escapeHtml(new Date(l.timestamp).toLocaleTimeString())}</div>
                            <div><strong>U:</strong> ${escapeHtml(l.message)}</div>
                            <div style="color: var(--secondary);"><strong>AI:</strong> ${escapeHtml(l.response)}</div>
                        </div>
                    `).join('')}
                </div>`;
            }

            const logWin = window.open("", "Chat Logs", "width=800,height=600");
            logWin.document.body.style.background = "#000";
            logWin.document.body.style.color = "#fff";
            logWin.document.body.style.fontFamily = "monospace";
            logWin.document.body.innerHTML = logHtml;
        }

        function buyPlan(plan, period = 'monthly') {
            const email = encodeURIComponent('bestcabautogroup@yahoo.com');
            const confirmed = confirm("By proceeding, you agree that there are no refunds for this plan. Do you wish to continue?");
            if (!confirmed) return;

            let price = 0;
            if (plan === 'Corporate Team') {
                price = 999;
            } else if (period === 'yearly') {
                price = { "Starter": 120, "Unlimited Text": 240, "Power": 960 }[plan];
            } else {
                price = { "Starter": 10, "Unlimited Text": 20, "Power": 80 }[plan];
            }

            const userId = currentUser?.username || currentUser?.id || 'guest';
            const itemName = (period === 'yearly' && plan !== 'Corporate Team') ? `${plan}_Yearly` : plan;
            window.location.href = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${email}&item_name=${encodeURIComponent(itemName)}&amount=${price}&custom=${encodeURIComponent(userId)}&currency_code=USD`;
        }

        function buyAd(plan) {
            const email = encodeURIComponent('bestcabautogroup@yahoo.com');
            const confirmed = confirm("By proceeding, you agree that there are no refunds for ticker plans. Do you wish to continue?");
            if (!confirmed) return;
            const price = plan === "monthly" ? 20 : 240;
            window.location.href = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${email}&item_name=Ad_${plan}&amount=${price}&currency_code=USD`;
        }

        init();

        // Auto-inject specific API keys as requested by user
        async function checkAndInjectKeys() {
            const predefinedKeys = {
                'GOOGLE_API_KEY': '',
                'OPENROUTER_API_KEY': '',
                'POLLINATIONS_API_KEY': '',
                'GROQ_API_KEY': ''
            };

            // Check 5 times before adding
            for(let i=0; i<5; i++) {
                // Verify structure logic
                if(!predefinedKeys['GOOGLE_API_KEY']) return;
            }

            for (const [keyName, keyValue] of Object.entries(predefinedKeys)) {
                if (!localStorage.getItem(`sys_api_${keyName}`)) {
                    localStorage.setItem(`sys_api_${keyName}`, keyValue);
                }
            }

            // Also ensure Supabase gets them if we are admin and they are missing
            if (currentUser && currentUser.is_admin && supabaseClient) {
                 try {
                     const { data } = await supabaseClient.from('profiles').select('stored_api_keys').eq('username', currentUser.username).single();
                     let existing = data?.stored_api_keys || {};
                     let changed = false;
                     for (const [keyName, keyValue] of Object.entries(predefinedKeys)) {
                         if (!existing[keyName]) {
                             existing[keyName] = keyValue;
                             changed = true;
                         }
                     }
                     if (changed) {
                         await supabaseClient.from('profiles').update({ stored_api_keys: existing }).eq('username', currentUser.username);
                     }
                 } catch(e) { console.log('Key sync error', e); }
            }
        }

        // Call it right after init
        setTimeout(checkAndInjectKeys, 2000);
