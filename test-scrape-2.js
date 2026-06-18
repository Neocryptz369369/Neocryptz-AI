async function testScrape2() {
    try {
        const url = 'https://example.com';
        // allOrigins has changed its free tier routing. Let's try corsproxy.io or just fetching directly if the proxy is broken.
        const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
        const text = await response.text();
        console.log("SUCCESS CorsProxy:", text.substring(0, 100));
    } catch(e) {
        console.error(e);
    }
}
testScrape2();
