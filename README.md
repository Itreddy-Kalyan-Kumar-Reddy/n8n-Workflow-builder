# AI Workflow Assistant - Chrome Extension

A modular Chrome extension that brings AI assistance directly into your browser. It offers a sidebar interface to interact with AI models from OpenAI, Anthropic (Claude), and n8n for tasks like code generation, content summarization, and workflow automation on platforms such as n8n or Notion.

## Prerequisites

- Google Chrome browser (version 88 or later).
- API keys: OpenAI (from https://platform.openai.com/api-keys), Anthropic (from https://console.anthropic.com/settings/keys), or n8n instance URL (e.g., http://localhost:5678).

## Installation

1. Download or clone the repository and extract to a folder named `ai-workflow-assistant`.

2. Open Chrome and navigate to `chrome://extensions/`.

3. Toggle "Developer mode" ON in the top-right.

4. Click "Load unpacked" and select the `ai-workflow-assistant` folder (must contain `manifest.json`).

5. The extension appears in the list. Pin its icon to the toolbar via the puzzle piece menu.

6. Click the icon to open the popup, configure your provider and API key, then test with a prompt.

**Troubleshooting**: Reload the extension after code changes. Check console (right-click popup > Inspect) for errors. Ensure manifest permissions are granted.

## Quick Start Usage

1. In the popup, select a provider (e.g., OpenAI Compatible).

2. Enter API key or base URL (for n8n: http://your-n8n-url:5678).

3. Click "Load Models" to see available options (e.g., gpt-4o).

4. Enter a prompt (e.g., "Generate a Python function to sort a list") and click "Send Prompt".

5. Responses appear in the popup or sidebar (opens on webpages for context-aware queries).

For n8n: Set up a workflow with HTTP Trigger > AI Agent > Respond to Webhook.

## License

MIT License - see the [LICENSE](LICENSE) file for details.