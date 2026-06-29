const { exec } = require('child_process');
const fs = require('fs');

// System function to deploy code automatically to your platforms
function deployProject(projectName, codeFiles) {
    console.log(`Initializing Neocryptz Git pipeline for: ${projectName}`);
    
    // 1. Create a local temporary directory for git initialization
    const dir = `./${projectName}`;
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }

    // 2. Write the generated code to the directory
    Object.keys(codeFiles).forEach(filename => {
        fs.writeFileSync(`${dir}/${filename}`, codeFiles[filename]);
    });

    // 3. Automate terminal sequences (git init, add, commit)
    const commandSequence = `
        cd ${projectName} && 
        git init && 
        git add . && 
        git commit -m "Deploy via Neocryptz AI OS" && git push origin main --force
    `;

    exec(commandSequence, (error, stdout, stderr) => {
        if (error) {
            console.error(`Git pipeline error: ${error.message}`);
            return;
        }
        console.log(`Pipeline logs: ${stdout}`);
    });
}

module.exports = { deployProject };
