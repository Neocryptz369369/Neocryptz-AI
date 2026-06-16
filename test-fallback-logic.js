async function testFallback() {
    console.log("Starting rigorous Pollinations API Fallback Test...");
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < 5; i++) {
        try {
            const response4 = await fetch('https://text.pollinations.ai/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'You are helpful. Keep it brief.' },
                        { role: 'user', content: `Test query number ${i + 1}` }
                    ],
                    model: 'openai',
                    jsonMode: false
                })
            });

            if (response4.ok) {
                const data4 = await response4.text();
                if (data4 && !data4.includes('error')) {
                    console.log(`Test ${i + 1} SUCCESS:`, data4.substring(0, 50).trim() + "...");
                    successCount++;
                } else {
                    console.log(`Test ${i + 1} FAILED (API Error Payload)`);
                    failCount++;
                }
            } else {
                console.log(`Test ${i + 1} FAILED (HTTP Status: ${response4.status})`);
                failCount++;
            }
        } catch (e) {
            console.log(`Test ${i + 1} EXCEPTION:`, e.message);
            failCount++;
        }
    }
    console.log(`\nResults: ${successCount} Successes, ${failCount} Failures.`);
}
testFallback();
