# AI Workflow Assistant - Chrome Extension

A modular Chrome extension designed to bring AI-powered assistance directly into your browser workflow. It provides a convenient sidebar interface to interact with various AI models (like OpenAI, Anthropic's Claude, and n8n-compatible endpoints) for tasks such as generating code, summarizing content, or automating workflows on platforms like n8n, Notion, and more. Whether you're debugging code, brainstorming ideas, or streamlining your development process, this extension keeps AI at your fingertips without leaving your current tab.

## Key Features

- **Multi-Provider Support**: Seamlessly switch between OpenAI-compatible APIs, Anthropic (Claude), and n8n workflows.
- **Sidebar Integration**: Access AI from a non-intrusive sidebar that overlays on any webpage.
- **Customizable Models**: Dynamically fetch and select available models based on your API provider.
- **Easy Prompting**: Simple interface to input prompts and receive responses in real-time.
- **Extensible Architecture**: Easily add new AI providers by implementing a simple interface.
- **Local Development Ready**: Quick setup for testing and customization on your machine.

![Extension Overview](Image.png)
This image shows the core popup interface where you configure providers and start interacting with AI.

![Popup Configuration](../images/Screenshot (2).png)
Configure your API keys and select providers directly from the extension popup.

![AI Response in Sidebar](../images/Screenshot (3).png)
View AI-generated responses in the sidebar while working on any webpage.

![Model Selection](../images/Screenshot (4).png)
Browse and select from available models fetched from your chosen provider.

![n8n Integration](../images/Screenshot (5).png)
Interact with n8n workflows by sending prompts to your local or remote n8n instance.

![Prompt Input](../images/Screenshot (6).png)
Enter detailed prompts and customize parameters for precise AI outputs.

![Error Handling](../images/Screenshot (7).png)
Built-in error messages and logging for troubleshooting API issues.

![Customization Options](../images/Screenshot (8).png)
Tailor the extension's behavior through simple JavaScript modifications.

## Prerequisites

Before installing, ensure you have:
- Google Chrome browser (version 88 or later recommended).
- API keys for your desired AI providers (e.g., OpenAI API key from https://platform.openai.com/api-keys, Anthropic API key from https://console.anthropic.com/settings/keys, or n8n instance URL like http://localhost:5678).
- Basic familiarity with Chrome extensions for advanced customization.
- Node.js (optional, for any future build scripts or testing).

## Installation on Local Machine

Follow these steps to load and run the extension locally for development or testing. This allows you to modify code, test changes, and debug without publishing.

1. **Clone or Download the Repository**:
   - If using Git, clone the repository:
     ```
     git clone https://github.com/yourusername/ai-workflow-assistant.git
     cd ai-workflow-assistant
     ```
   - Alternatively, download the ZIP file from the GitHub repository page, extract it, and navigate to the `ai-workflow-assistant` folder.

2. **Verify Folder Structure**:
   - Ensure the folder contains key files: `manifest.json`, `popup.html`, `popup.js`, `background.js`, `content.js`, `style.css`, and the `providers/` directory with JS files.
   - Images and LICENSE should also be present.

3. **Open Chrome and Access Extensions**:
   - Launch Google Chrome.
   - In the address bar, enter `chrome://extensions/` and press Enter.

4. **Enable Developer Mode**:
   - On the Extensions page, toggle "Developer mode" to ON in the top-right corner. This enables loading custom extensions.

5. **Load the Unpacked Extension**:
   - Click the "Load unpacked" button that appears.
   - Browse and select the `ai-workflow-assistant` folder (the one containing `manifest.json`—do not select a subfolder).
   - The extension will load, and you'll see "AI Workflow Assistant" (or similar) in the list. Note any warnings in the console.

6. **Handle Icons and Permissions**:
   - If icons don't appear, create an `icons/` folder inside `ai-workflow-assistant` and add PNG files: `icon16.png` (16x16), `icon48.png` (48x48), `icon128.png` (128x128). Update `manifest.json` icons section if needed.
   - Grant any requested permissions (e.g., "tabs", "storage", "activeTab") when prompted.

7. **Pin and Test the Extension**:
   - The icon appears in the toolbar (or under the puzzle piece icon). Pin it by clicking the puzzle piece > pin icon next to the extension.
   - Click the icon to open the popup. Enter a test API key and prompt to verify functionality.
   - For debugging: Right-click the popup > "Inspect popup" or inspect the background page via the extensions page.

**Troubleshooting Local Setup**:
- **Load Failed**: Check `manifest.json` for syntax errors (use JSON validator). Ensure file paths in manifest are correct.
- **Popup Blank**: Open DevTools on popup (right-click > Inspect) and check console for JS errors.
- **API Errors**: Verify API keys; test endpoints separately (e.g., curl to OpenAI API).
- **Sidebar Not Opening**: Ensure content script permissions in manifest; reload extension after changes.
- **Hot Reloading**: After code edits, click "Reload" on the extension card in chrome://extensions.
- **Clear Storage**: If issues persist, remove the extension, clear Chrome storage (chrome://settings/clearBrowserData), and reload.

## Usage

The extension is user-friendly for both quick queries and integrated workflows.

1. **Initial Setup in Popup**:
   - Click the extension icon to open the popup.
   - Choose a provider (e.g., "OpenAI Compatible").
   - Input your API key or base URL (for n8n: http://your-n8n-url:5678).
   - Click "Load Models" to populate the model dropdown (e.g., gpt-4o, claude-3-5-sonnet).

2. **Sending Prompts**:
   - Type your prompt in the textarea (e.g., "Generate a Python script to automate file backups").
   - Select a model.
   - Click "Send Prompt". The response streams or appears in the response area.
   - For longer sessions, the sidebar opens automatically on supported sites.

3. **Sidebar Mode**:
   - On any webpage (e.g., GitHub, Notion), click the extension icon or use a keyboard shortcut (if configured).
   - The sidebar slides in from the right, allowing you to reference page content.
   - Prompt with context: "Based on this code, suggest improvements."

4. **Provider-Specific Usage**:
   - **OpenAI/Anthropic**: Standard chat completions; supports system prompts for role-playing.
   - **n8n**: Sends prompts to n8n AI Agent nodes. Ensure your n8n workflow is set up to receive webhook/HTTP inputs.
     - Example: In n8n, create a workflow with HTTP Trigger > AI Agent > Respond to Webhook.
     - Base URL: Your n8n instance (local: http://localhost:5678/webhook/...).

5. **Advanced Tips**:
   - **Batch Prompts**: Copy-paste multiple queries; responses are appended.
   - **Error Recovery**: If API fails, retry or switch providers. Check console for details.
   - **Privacy**: API keys stored locally; never shared. Use incognito for testing.
   - **Integration Ideas**: Use with VS Code (via Live Server) or local n8n for dev workflows.

**Example Use Case**:
- On a n8n dashboard, open sidebar, prompt "Create a workflow to fetch RSS feeds and post to Slack"—get JSON config to import.

For production use, consider rate limits of your AI provider.

## Adding a New Provider

Extend the extension by supporting more AI services (e.g., Groq, Mistral).

1. **Create the Provider File**:
   - In `providers/`, add a new file like `groq.js`.

2. **Implement the Required Interface**:
   - The file must define a global object with two async functions:
     ```javascript
     window.groqProvider = {
       async getAvailableModels(apiKey, baseUrl = 'https://api.groq.com/openai/v1') {
         // Use fetch to get models from /models endpoint
         const response = await fetch(`${baseUrl}/models`, {
           headers: { Authorization: `Bearer ${apiKey}` }
         });
         const data = await response.json();
         return data.data.map(model => ({ id: model.id, name: model.id }));
       },
       async sendPrompt(prompt, model, apiKey, baseUrl = 'https://api.groq.com/openai/v1') {
         const response = await fetch(`${baseUrl}/chat/completions`, {
           method: 'POST',
           headers: {
             'Authorization': `Bearer ${apiKey}`,
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({
             model,
             messages: [{ role: 'user', content: prompt }],
             stream: false
           })
         });
         const data = await response.json();
         return data.choices[0].message.content;
       }
     };
     ```

3. **Include the Script in popup.html**:
   - Add before closing </body>:
     ```html
     <script src="providers/groq.js"></script>
     ```

4. **Register in popup.js**:
   - In the providers object (around line 10-20):
     ```javascript
     const providers = {
       openai: window.openAICompatibleProvider,
       anthropic: window.anthropicProvider,
       n8n: window.n8nProvider,
       groq: window.groqProvider  // Add this
     };
     ```

5. **Add to Provider Dropdown in popup.html**:
   - Inside <select id="provider-select">:
     ```html
     <option value="groq">Groq</option>
     ```

6. **Reload and Test**:
   - Save files, reload extension in chrome://extensions.
   - Select "Groq", enter API key, load models, and test a prompt.

**Tips**: Handle errors gracefully (e.g., return empty array on model fetch fail). Base URLs can be customizable in popup.

## Contributing

Contributions are welcome and help make this extension better for everyone! We appreciate bug reports, feature requests, documentation improvements, and code contributions.

### How to Contribute

1. **Fork the Repository**:
   - Go to the GitHub repo and click "Fork".

2. **Clone Your Fork Locally**:
   ```
   git clone https://github.com/YOUR_USERNAME/ai-workflow-assistant.git
   cd ai-workflow-assistant
   ```

3. **Create a Feature Branch**:
   ```
   git checkout -b feature/amazing-new-feature
   ```

4. **Make Your Changes**:
   - Edit files, add tests if applicable.
   - Load locally to test (follow Installation steps).
   - Ensure no breaking changes; update README if needed.

5. **Commit Your Changes**:
   ```
   git add .
   git commit -m "Add support for new AI provider: AmazingAI"
   ```

6. **Push to Your Branch**:
   ```
   git push origin feature/amazing-new-feature
   ```

7. **Open a Pull Request**:
   - On GitHub, go to your fork and click "Compare & pull request".
   - Describe your changes, reference any issues (e.g., "Fixes #42").
   - Include screenshots or examples if adding UI/features.

### Contribution Guidelines

- **Code Style**: Use ES6+ JavaScript, consistent indentation (2 spaces), and modular functions. Follow existing patterns in providers/.
- **Testing**: Test locally with multiple providers. Check console for errors.
- **Documentation**: Update README for new features. Add comments in code.
- **Issues**: Report bugs with steps to reproduce, browser version, and screenshots.
- **Scope**: Focus on AI integration; UI enhancements welcome but keep lightweight.
- **License**: Contributions under MIT License.
- **No Guarantees**: We review PRs but can't guarantee merge.

Join our community discussions in GitHub Issues. Thank you for contributing!

## 🌐 How to Deploy to Chrome Web Store

1. **Finalize Your Code**: Ensure everything works, add icons, and clean up (remove dev logs).
2. **ZIP the Extension**: Compress the `ai-workflow-assistant` folder (exclude .git).
3. **Developer Dashboard**: Visit https://chrome.google.com/webstore/developer/dashboard, sign in.
4. **New Item**: Click "Add new item", upload ZIP, fill listing (title, description, screenshots from images/, category: Developer Tools).
5. **Pay Fee**: One-time $5 USD.
6. **Submit Review**: Google reviews (1-7 days typically). Update as needed post-approval.

**Pro Tips**: Use high-quality screenshots (from provided images). Comply with policies (no malicious code).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.