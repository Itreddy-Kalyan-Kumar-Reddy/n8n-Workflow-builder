# AI Workflow Assistant - Chrome Extension

A modular Chrome extension to interact with any AI model from a browser sidebar, designed to assist with workflows on platforms like n8n, Notion, etc.

## 🚀 How to Install Locally

1.  **Download the Code**: Clone this repository or download it as a ZIP file and unzip it.
2.  **Open Chrome Extensions**: Open Google Chrome and navigate to `chrome://extensions`.
3.  **Enable Developer Mode**: Turn on the "Developer mode" toggle in the top-right corner.
4.  **Load the Extension**: Click the "Load unpacked" button and select the `/ai-workflow-assistant` folder you downloaded.
5.  **Pin the Extension**: The extension icon should appear in your toolbar. Click the puzzle piece icon and pin the "AI Workflow Assistant" for easy access.

## 🔧 How to Add a New Provider

The extension is designed to be easily extendable with new AI providers.

1.  **Create a New Provider File**: In the `/providers` directory, create a new file (e.g., `providers/groq.js`).
2.  **Implement the Provider Interface**: Your new file must expose a global object with two asynchronous functions:
    * `getAvailableModels(apiKey, baseUrl)`: Should return a promise that resolves to an array of objects, where each object has an `id` and a `name`.
    * `sendPrompt(prompt, model, apiKey, baseUrl)`: Should return a promise that resolves to the AI's text response as a string.
3.  **Add the Script to `popup.html`**: Open `popup.html` and add a new script tag for your provider:
    ```html
    <script src="providers/groq.js"></script>
    ```
4.  **Register the Provider in `popup.js`**: Open `popup.js` and add your new provider to the `providers` map:
    ```javascript
    const providers = {
        openai: window.openAICompatibleProvider,
        anthropic: window.anthropicProvider,
        groq: window.groqProvider, // Add your new line here
    };
    ```
5.  **Add an Option in `popup.html`**: Add a new `<option>` to the provider dropdown in `popup.html`:
    ```html
    <select id="provider-select">
        <option value="openai">OpenAI Compatible</option>
        <option value="anthropic">Anthropic (Claude)</option>
        <option value="groq">Groq</option> </select>
    ```

## 🌐 How to Deploy to Chrome Web Store

1.  **Finalize Your Code**: Ensure your code is clean, commented, and includes all necessary icons and metadata in `manifest.json`.
2.  **Create a ZIP File**: Compress the entire extension directory (`/ai-workflow-assistant`) into a single `.zip` file.
3.  **Go to the Developer Dashboard**: Log in to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
4.  **Upload Your Item**: Click "Add new item", upload your `.zip` file, and fill out the required store listing information (description, screenshots, etc.).
5.  **Pay the Fee**: There is a one-time $5 registration fee.
6.  **Submit for Review**: Submit your extension for review by Google. This process can take a few days to a few weeks.

**Note on Icons**: You'll need to create your own 16x16, 48x48, and 128x128 pixel icons and place them in the `icons/` folder for the extension to display properly.