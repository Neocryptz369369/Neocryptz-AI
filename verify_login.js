const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  try {
    await page.goto('file://' + process.cwd() + '/index.html');

    // Give it a moment to initialize
    await page.waitForTimeout(1000);

    const toggleButton = page.locator('button:has-text("New? Create Account")');
    await toggleButton.click();

    await page.waitForTimeout(1000);

    const isRegVisible = await page.locator('#register-form').isVisible();
    console.log('Reg visible:', isRegVisible);

    if (isRegVisible) {
        console.log('Toggle logic works.');
    } else {
        console.error('Toggle logic failed.');
        process.exit(1);
    }

  } catch (err) {
    console.error('Verification failed:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
  console.log('Verification successful.');
})();
