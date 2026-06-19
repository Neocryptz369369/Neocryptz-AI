const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

let saveKeysReplacement = `        async function saveApiKeys() {
            let trackedKeys = JSON.parse(localStorage.getItem('trackedApiKeys') || '["OPENAI_API_KEY", "GOOGLE_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY", "TOGETHER_API_KEY", "ANYSCALE_API_KEY", "SUPABASE_URL", "SUPABASE_KEY"]');
            let keysObj = {};
            trackedKeys.forEach(k => {
                const input = document.getElementById(\`setting-\${k}\`);
                if (input) {
                    const val = input.value.trim();
                    localStorage.setItem(\`sys_api_\${k}\`, val);
                    keysObj[k] = val;
                }
            });
            // Save to supabase
            if (currentUser) {
                const { error } = await supabaseClient.from('profiles').update({ api_keys: keysObj }).eq('id', currentUser.id);
                if (error) console.log("Failed to save keys to supabase", error);
            }
            alert('System API Keys Saved Successfully!');
        }`;

html = html.replace(/        function saveApiKeys\(\) \{[\s\S]*?alert\('System API Keys Saved Successfully!'\);\n        \}/, saveKeysReplacement);

// load keys from supabase
// Where does it load them? In loadAdminData:
let adminDataKeys = `            const defaultKeys = ['OPENAI_API_KEY', 'GOOGLE_API_KEY', 'GROQ_API_KEY', 'OPENROUTER_API_KEY', 'TOGETHER_API_KEY', 'ANYSCALE_API_KEY', 'SUPABASE_URL', 'SUPABASE_KEY'];
            let trackedKeys = JSON.parse(localStorage.getItem('trackedApiKeys') || JSON.stringify(defaultKeys));

            // Try to load from supabase first
            if (currentUser) {
                const { data } = await supabaseClient.from('profiles').select('api_keys').eq('id', currentUser.id).single();
                if (data && data.api_keys) {
                    for (const [k, v] of Object.entries(data.api_keys)) {
                        localStorage.setItem(\`sys_api_\${k}\`, v);
                        if (!trackedKeys.includes(k)) trackedKeys.push(k);
                    }
                    localStorage.setItem('trackedApiKeys', JSON.stringify(trackedKeys));
                }
            }

            const keysContainer = document.getElementById('keys-container');
            keysContainer.innerHTML = trackedKeys.map(k => {
                const val = localStorage.getItem(\`sys_api_\${k}\`) || '';
                return \`
                <label style="display: flex; flex-direction: column;">
                    <span style="color: var(--secondary); font-size: 0.8em; margin-bottom: 2px;">\${escapeHtml(k)}</span>
                    <input type="text" id="setting-\${k}" value="\${escapeHtml(val)}" placeholder="Enter \${escapeHtml(k)}" style="width: 100%; padding: 5px; background: #222; border: 1px solid var(--primary); color: #fff;">
                </label>
                \`;
            }).join('');`;

html = html.replace(/            const defaultKeys = \['OPENAI_API_KEY', 'GOOGLE_API_KEY', 'GROQ_API_KEY', 'OPENROUTER_API_KEY', 'TOGETHER_API_KEY', 'ANYSCALE_API_KEY', 'SUPABASE_URL', 'SUPABASE_KEY'\];[\s\S]*?\}\)\.join\(''\);/, adminDataKeys);

fs.writeFileSync('index.html', html);
console.log("Keys to supabase added");
