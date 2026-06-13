const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('dialog', dialog => {
      console.log('DIALOG:', dialog.message());
      dialog.accept();
  });

  await page.goto('http://127.0.0.1:8000');
  await page.waitForTimeout(1000);

  // click toggle via the button
  await page.click('text="New? Create Account"', {force: true});
  await page.waitForTimeout(500);

  await page.fill('#reg-user', 'testuser123');
  await page.fill('#reg-email', 'test12345@test.com');
  await page.fill('#reg-pass', 'pass123');
  await page.fill('#reg-name', 'Test User');
  await page.fill('#reg-address', '123 Test St');
  await page.fill('#reg-city', 'TestCity');
  await page.fill('#reg-state', 'TS');
  await page.fill('#reg-zip', '12345');
  await page.check('#reg-tos');

  await page.click('text="CREATE ACCOUNT"', {force: true});
  await page.waitForTimeout(1000);

  await page.fill('#login-user', 'testuser123');
  await page.fill('#login-pass', 'pass123');
  await page.click('text="ENTER OS"', {force: true});
  await page.waitForTimeout(1000);

  const authVisible = await page.isVisible('#auth-screen');
  console.log("Is auth screen visible after login?", authVisible);

  await browser.close();
})();
