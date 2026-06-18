async function testScrape3() {
    try {
        const url = 'https://example.com';
        // Trying api.allorigins.win/raw?url=
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
        const text = await response.text();
        console.log("SUCCESS AllOrigins RAW:", text.substring(0, 100));
    } catch(e) {
        console.error(e);
    }
}
testScrape3();
