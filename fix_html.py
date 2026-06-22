import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix testDoomsdayFallback
doomsday_pattern = r'async function testDoomsdayFallback\(\) \{.*?\}'
new_doomsday = '''async function testDoomsdayFallback() {
            const resEl = document.getElementById('doomsday-test-result');
            resEl.style.display = 'block';
            resEl.innerText = "Simulating total AI failure... routing to Doomsday Fallback...";
            let scrapes = JSON.parse(localStorage.getItem('localScrapes') || '[]');
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
                    resEl.innerText = "FAILED.\n\n" + data.error;
                }
            } catch(e) {
                resEl.innerText = "Network Error:\n" + e.message;
            }
        }'''

content = re.sub(doomsday_pattern, new_doomsday, content, flags=re.DOTALL)

# Fix processCSV
csv_pattern = r'async function processCSV\(\) \{.*?\}'
new_csv = '''async function processCSV() {
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
                    await sendMessage(); // Triggers the existing logic
                    await new Promise(r => setTimeout(r, 2500)); // Rate limit pause
                }
            };
            reader.readAsText(file);
        }'''
content = re.sub(csv_pattern, new_csv, content, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
