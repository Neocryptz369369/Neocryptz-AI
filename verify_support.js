const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Load the page
  await page.goto('file://' + path.resolve('index.html'));

  // 1. Check for the audio element
  const audioSrc = await page.getAttribute('#support-alert-sound', 'src');
  console.log('Audio Source:', audioSrc);

  // 2. Verify User Support UI
  const userPlaceholder = await page.getAttribute('#user-support-input', 'placeholder');
  console.log('User Input Placeholder:', userPlaceholder);

  const sendBtnText = await page.innerText('button[onclick="sendSupportMessage(false)"]');
  console.log('User Send Button Text:', sendBtnText);

  // 3. Verify Admin Support UI (mocking admin status)
  await page.evaluate(() => {
    localStorage.setItem('supabase.auth.token', 'dummy'); // Mocking some auth state if needed
    // In index.html, admin status is set based on profile username 'Neocryptz'
    // We can manually trigger the admin UI for verification
    document.getElementById('admin-icon').style.display = 'inline-block';
    openModal('admin-modal');
    showAdminTab('admin-support');
  });

  await page.waitForSelector('#admin-support', { state: 'visible' });
  const adminHeader = await page.innerText('#admin-support h3');
  console.log('Admin Support Header:', adminHeader);

  // Mocking a support user selection to see the registration details grid
  await page.evaluate(() => {
    const mockProfile = {
      username: 'TestUser',
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      address: '123 Neon St',
      age: '25'
    };
    selectSupportUser('dummy-uid', mockProfile);
  });

  await page.waitForSelector('#support-user-details', { state: 'visible' });
  const detailsGrid = await page.innerText('#support-user-details');
  console.log('Registration Details Grid Content:\n', detailsGrid);

  await page.screenshot({ path: 'admin_support_panel.png', fullPage: true });

  await browser.close();
})();
