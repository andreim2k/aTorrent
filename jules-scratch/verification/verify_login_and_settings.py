from playwright.sync_api import sync_playwright, Page, expect

def verify_login_and_settings(page: Page):
    """
    This test verifies that a user can log in and navigate to the settings page.
    """
    # 1. Arrange: Go to the login page.
    page.goto("http://localhost:3000/login.html")

    # 2. Act: Fill in the password and click the login button.
    page.get_by_placeholder("Enter password").fill("password")
    page.get_by_role("button", name="Login").click()

    # 3. Assert: Wait for the dashboard to load and then navigate to settings.
    expect(page).to_have_url("http://localhost:3000/dashboard.html")

    # 4. Act: Navigate to the settings page.
    page.get_by_role("link", name="Settings").click()

    # 5. Assert: Check that the settings page is loaded.
    expect(page).to_have_url("http://localhost:3000/settings.html")
    expect(page.get_by_role("heading", name="Settings")).to_be_visible()

    # 6. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/settings_page.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_login_and_settings(page)
        browser.close()

if __name__ == "__main__":
    main()