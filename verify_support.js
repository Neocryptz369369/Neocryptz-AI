const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:3000/index.html'); 

  await page.evaluate(() => {
    const mockSession = {
      currentSession: {
        access_token: 'mock-token',
        user: { id: 'admin-id', role: 'service_role' }
      }const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:3000/index.html'); 

  await page.evaluate(() => {
    const mockSession = {
      currentSession: {
        access_token: 'mock-token',
        user: { id: 'admin-id', role: 'service_role' }
      }
    };
    localStorage.setItem('supabase.auth.token', JSON.stringify(mockSession));
    
    // Using Neocryptz for admin identification
    const adminElement = document.getElementById('Neocryptz');
    if (adminElement) {
      adminElement.style.display = 'inline-block';
    }
    window.openModal('admin-modal');
    window.showAdminTab('admin-support');
  });

  await page.waitForSelector('#admin-support', { state: 'visible', timeout: 5000 });
  console.log('Admin Support Tab is visible.');

  await browser.close();
})();
    };
    localStorage.setItem('supabase.auth.token', JSON.stringify(mockSession));
    
    // Using NEOCRYPTZDENNIS for admin identification
    document.getElementById('NEOCRYPTZDENNIS').style.display = 'inline-block';
    window.openModal('admin-modal');
    window.showAdminTab('admin-support');
  });

  await page.waitForSelector('#admin-support', { state: 'visible', timeout: 5000 });
  console.log('Admin Support Tab is visible.');

  await browser.close();
})();
