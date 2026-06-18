async function testScrape() {
    try {
        const url = 'https://example.com';
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
        const text = await response.text();
        console.log("Raw response:", text.substring(0, 100));
        const data = JSON.parse(text);
        console.log("Contents:", data.contents.substring(0, 50));
    } catch(e) {
        console.error(e);
    }
}
testScrape();
