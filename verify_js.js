const fs = require('fs');
const acorn = require('acorn');

const html = fs.readFileSync('index.html', 'utf8');
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let match;
let i = 0;

while ((match = scriptRegex.exec(html)) !== null) {
    const code = match[1];
    try {
        acorn.parse(code, { ecmaVersion: 2020 });
        console.log(`Script ${i} is valid.`);
    } catch (e) {
        console.error(`Script ${i} is INVALID:`, e.message);
        // Find line number in original file
        const linesBefore = html.substring(0, match.index).split('\n').length;
        const errorLineInScript = code.substring(0, e.pos).split('\n').length;
        console.error(`Error at line ${linesBefore + errorLineInScript - 1}`);
        // Print snippet
        const codeLines = code.split('\n');
        const start = Math.max(0, errorLineInScript - 5);
        const end = Math.min(codeLines.length, errorLineInScript + 5);
        for (let l = start; l < end; l++) {
            console.error(`${l === errorLineInScript - 1 ? '>' : ' '} ${codeLines[l]}`);
        }
    }
    i++;
}
