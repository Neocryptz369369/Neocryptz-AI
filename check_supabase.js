const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

if (html.includes("await supabaseClient.from('profiles').update({ api_keys: keysObj })")) {
  console.log("Supabase API save found");
}

if (html.includes("const { data } = await supabaseClient.from('profiles').select('api_keys')")) {
  console.log("Supabase API load found");
}
