# 🛠️ Generic Context Switcher Extension

A "White Label" Chrome Extension designed for developers who need to switch user contexts (e.g., impersonation, changing organizations) in Single Page Applications (SPAs) by injecting a toolbelt directly into the page.

## 🚀 Features

* **Auth Interceptor:** Automatically captures JWT Bearer tokens from network requests (XHR/Fetch) by monkey-patching the browser API.
* **Injected UI:** Adds a Floating Action Button (FAB) and a Navbar into your target application.
* **Autocomplete:** Search and select contexts (Client/Provider) instantly.
* **Isolated Storage:** Keeps session data secure in Chrome Storage.

## ⚙️ Configuration (How to Use)

1.  **Clone the Repo**
2.  **Edit `manifest.json`**:
    * Change `host_permissions` to your target domains.
    * Change `content_scripts.matches` to where the script should run.
3.  **Edit `content.js`**:
    * Locate the `CONFIG` object at the top of the file.
    * Update `apiBaseUrl` and endpoints to match your backend.
    * Define `routes` (where the interceptor runs vs where the UI appears).
4.  **Load in Chrome**:
    * Go to `chrome://extensions`.
    * Enable "Developer Mode".
    * "Load Unpacked" and select the folder.

## 📂 Project Structure

* `background.js`: Handles tab management.
* `content.js`: Main logic. Handles UI injection and API communication.
* `interceptor.js`: The script injected into the page context to listen for Headers.
* `popup.html/js`: The extension's small popup window for setup.

## ⚠️ Disclaimer

This tool is for development and productivity purposes. Ensure you comply with your organization's security policies regarding token handling.