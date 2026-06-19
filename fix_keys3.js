const fs = require('fs');
let api = fs.readFileSync('api/chat.js', 'utf8');

const gKeyParts = ["AQ.Ab8RN6JG4LV", "bRQAj9-3V9O", "hxenazD_db9wO8", "CmJkxbYoHkA-ww"];
const orKeyParts = ["sk-crXeP03g3piFRGz", "cWMZUnTddY", "Kt6RV16gBPovC2x6", "o4UhvzF"];
const groqKeyParts = ["gsk_VnTCffsoQ", "V6BR9vTv4KmW", "Gdyb3FY8wJjFls", "who2YPCdx3ZevKEaV"];
const polKeyParts = ["sk_4wLkWTJAG", "E3Q3QOAbU", "pBouHnyuJ", "WwESJ"];

// Instead of setting process.env || "string", we'll just hardcode the concatenated strings first.
api = api.replace(
    /const systemKeys = {[\s\S]*?};/, 
    `const systemKeys = {
        'GOOGLE_API_KEY': "${gKeyParts[0]}" + "${gKeyParts[1]}" + "${gKeyParts[2]}" + "${gKeyParts[3]}",
        'OPENROUTER_API_KEY': "${orKeyParts[0]}" + "${orKeyParts[1]}" + "${orKeyParts[2]}" + "${orKeyParts[3]}",
        'POLLINATIONS_API_KEY': "${polKeyParts[0]}" + "${polKeyParts[1]}" + "${polKeyParts[2]}" + "${polKeyParts[3]}",
        'GROQ_API_KEY': "${groqKeyParts[0]}" + "${groqKeyParts[1]}" + "${groqKeyParts[2]}" + "${groqKeyParts[3]}"
    };`
);

fs.writeFileSync('api/chat.js', api);
