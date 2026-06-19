const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Change the default provider order to start with groq
html = html.replace(/'openrouter,together,anyscale,openai,gemini,groq,pollinations'/g, "'groq,openrouter,together,anyscale,openai,gemini,pollinations'");
html = html.replace(/value="openrouter,together,anyscale,openai,gemini,groq,pollinations"/g, 'value="groq,openrouter,together,anyscale,openai,gemini,pollinations"');

fs.writeFileSync('index.html', html);
console.log("Provider order changed to prioritize groq.");
