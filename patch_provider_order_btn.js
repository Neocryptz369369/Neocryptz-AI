const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The original value for "Supercomputer First" was openrouter... and now it says groq, openrouter... Let's fix that.
// First, find the buttons block.
let regex = /<button class="btn" onclick="setProviderOrder\('groq,openrouter,together,anyscale,openai,gemini,pollinations'\)">Supercomputer \(OpenRouter\) First<\/button>/;
html = html.replace(regex, `<button class="btn" onclick="setProviderOrder('groq,openrouter,together,anyscale,openai,gemini,pollinations')">Groq First</button>
                        <button class="btn" onclick="setProviderOrder('openrouter,together,anyscale,openai,gemini,groq,pollinations')">Supercomputer (OpenRouter) First</button>`);

fs.writeFileSync('index.html', html);
console.log("Button fixed.");
