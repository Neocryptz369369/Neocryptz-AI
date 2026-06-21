from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    # Load the page
    page.goto("http://localhost:8080/index.html")
    page.wait_for_timeout(2000)

    # Mock login as admin 'Neocryptz'
    page.evaluate("""() => {
        localStorage.setItem('currentUser', JSON.stringify({
            username: 'Neocryptz',
            is_admin: true,
            id: 'admin-uuid'
        }));
        window.location.reload();
    }""")
    page.wait_for_timeout(2000)

    # Open Admin Modal
    page.click("#admin-icon")
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/admin_modal_open.png")

    # Click SUPPORT tab
    page.get_by_role("button", name="SUPPORT").click()
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/admin_support_tab.png")

    # Verify Audio Element exists
    audio_exists = page.evaluate("() => !!document.getElementById('support-alert-sound')")
    print(f"Audio element exists: {audio_exists}")

    # Verify UI elements (Mocking a user for display)
    page.evaluate("""() => {
        const userDetails = document.getElementById('support-user-details');
        userDetails.innerHTML = `
            <div style="background: rgba(138, 43, 226, 0.1); padding: 10px; border: 1px solid #8a2be2; border-radius: 5px;">
                <h4 style="margin: 0 0 10px 0; color: #fff; text-transform: uppercase; letter-spacing: 1px;">User Registration Details</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div><strong>Username:</strong> TestUser</div>
                    <div><strong>Full Name:</strong> Test Name</div>
                    <div><strong>Email:</strong> test@example.com</div>
                    <div><strong>Phone:</strong> 123-456-7890</div>
                    <div><strong>Address:</strong> 123 Neon St</div>
                    <div><strong>Age:</strong> 25</div>
                </div>
            </div>
        `;
    }""")
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/admin_support_details_mock.png")

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
