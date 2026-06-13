const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  await page.goto('http://127.0.0.1:8000');
  await page.waitForTimeout(1000);

  console.log('Got to page');

  // Fill login
  await page.fill('#login-user', 'admin');
  await page.fill('#login-pass', 'pass123');
  await page.click('text="ENTER OS"');
  await page.waitForTimeout(2000);

  const authVisible = await page.isVisible('#auth-screen');
  console.log("Is auth screen visible after login?", authVisible);

  await page.screenshot({ path: 'login_test.png', fullPage: true });

  await browser.close();
})();
