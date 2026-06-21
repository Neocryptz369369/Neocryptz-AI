from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Load the page
    page.goto("http://localhost:8080/index.html")
    page.wait_for_timeout(2000)

    # Mock login as admin 'Neocryptz' and force admin icon visibility
    page.evaluate("""() => {
        const user = {
            username: 'Neocryptz',
            is_admin: true,
            id: '0f0d371d-b860-457e-bb61-754106590f57'
        };
        localStorage.setItem('currentUser', JSON.stringify(user));
        // Manually trigger the visibility as init() might be delayed or blocked by geo-checks
        document.getElementById('admin-icon').style.display = 'inline-block';
        window.currentUser = user;
    }""")
    page.wait_for_timeout(2000)

    # Open Admin Modal
    page.click("#admin-icon")
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/admin_modal_v3.png")

    # Click SUPPORT tab
    page.get_by_role("button", name="SUPPORT").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/admin_support_v3.png")

    # Check for "Neocryptz" instead of "NEOCRYPTZ"
    content = page.content()
    has_neocryptz_caps = "NEOCRYPTZ" in content
    print(f"Has all-caps NEOCRYPTZ: {has_neocryptz_caps}")

    title = page.title()
    print(f"Title: {title}")

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
