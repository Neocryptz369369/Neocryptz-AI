const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The issue occurs if history renders older messages that DO NOT have an ID but have literal text attached to the `onclick` handler,
// OR because the fallback in playAudio receives text containing special characters and it fails early.
// The new playAudio takes `id` which may just be the text itself if the element isn't found.

html = html.replace(/function loadHistory\(\) \{[\s\S]*?globalChat\.forEach\(msg => \{\s*appendMessage\(msg\.role, msg\.text\);\s*\}\);/m, function(match) {
    return match; // loadHistory just calls appendMessage, so they DO get an ID and go through the new flow.
});

fs.writeFileSync('index.html', html);
