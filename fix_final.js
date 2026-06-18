const fs = require('fs');
let htmlContent = fs.readFileSync('index.html', 'utf8');

// The user states: "my logo picture isn't even centered where i told you to put it right above the terms of service area centered in the black area underneath my plan for unlimited."
// The previous code had it placed at the VERY TOP of the sidebar. I need to move it to the bottom, right above the Terms of Service buttons.

// Remove the logo from the top of the sidebar
htmlContent = htmlContent.replace(
`            <div style="text-align: center; margin-bottom: 20px;">
                <img src="crypt.png" alt="Logo" style="max-width: 80%; height: auto; border-radius: 50%; box-shadow: 0 0 15px var(--primary);">
            </div>`,
""
);

// Insert it right above the Legal/Footer section
const newLogoPlacement = `
        <div style="flex:1;"></div>

        <div style="text-align: center; margin-bottom: 20px;">
            <img src="crypt.png" alt="Logo" style="max-width: 80%; height: auto; border-radius: 50%; box-shadow: 0 0 15px var(--primary); display: block; margin: 0 auto;">
        </div>

        <div style="border-top: 1px solid #333; padding-top: 10px; font-size: 0.8em; color: #555;">
`;
htmlContent = htmlContent.replace(
    '<div style="flex:1;"></div>\n        \n        <div style="border-top: 1px solid #333; padding-top: 10px; font-size: 0.8em; color: #555;">',
    newLogoPlacement
);

fs.writeFileSync('index.html', htmlContent);
console.log("Moved logo to bottom of sidebar.");
