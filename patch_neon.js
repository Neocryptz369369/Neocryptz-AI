const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace('<div class="ad-box" id="ad-1">Sponsored Content</div>', '<div class="ad-box neon-border" id="ad-1">Sponsored Content</div>');
html = html.replace('<div class="ad-box" id="ad-2">Sponsored Content</div>', '<div class="ad-box neon-border" id="ad-2">Sponsored Content</div>');
html = html.replace('<div class="ad-box" id="ad-3">Sponsored Content</div>', '<div class="ad-box neon-border" id="ad-3">Sponsored Content</div>');
html = html.replace('<div class="ad-box" id="ad-4">Sponsored Content</div>', '<div class="ad-box neon-border" id="ad-4">Sponsored Content</div>');

fs.writeFileSync('index.html', html);
console.log("ad neon added.");
