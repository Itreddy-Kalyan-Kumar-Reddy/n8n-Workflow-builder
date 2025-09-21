// Add a context menu item on installation.
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "ai-assistant-send",
        title: "Send selected text to AI Assistant",
        contexts: ["selection"]
    });
});

 // Handle the context menu click.
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "ai-assistant-send") {
        // Open the popup or send a message to it.
        // For simplicity, we can store the text and let the popup retrieve it.
        chrome.storage.local.set({ 'contextMenuText': info.selectionText }, () => {
             // This doesn't open the popup, but makes the text available
             // when the user next opens it. A more advanced implementation
             // could use messaging to inject it directly.
        });
    }
});

// Handle messages from content script for floating chat
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "sendChatPrompt") {
        const { prompt } = request;
        if (!prompt) {
            sendResponse({ error: 'Missing prompt' });
            return;
        }

        // Fetch settings securely from storage
        chrome.storage.local.get(['settings'], (result) => {
            const settings = result.settings || {};
            const provider = settings.provider || 'openai';
            const apiKey = settings.providers?.[provider]?.apiKey;
            const baseUrl = settings.providers?.[provider]?.baseUrl || (provider === 'openai' ? 'https://api.openai.com/v1' : provider === 'anthropic' ? 'https://api.anthropic.com' : '');
            const model = settings.selectedModel || 'gpt-3.5-turbo';

            if (!apiKey || !baseUrl) {
                sendResponse({ error: 'API key or base URL not configured. Please set up in the extension popup.' });
                return;
            }

            let url, body, headers = { 'Content-Type': 'application/json' };

            switch (provider) {
                case 'openai':
                case 'openAICompatible':
                    url = `${baseUrl}/chat/completions`;
                    headers['Authorization'] = `Bearer ${apiKey}`;
                    body = {
                        model: model,
                        messages: [{ role: 'user', content: prompt }],
                        max_tokens: 500,
                        temperature: 0.7
                    };
                    break;
                case 'anthropic':
                    url = `${baseUrl}/v1/messages`;
                    headers['x-api-key'] = apiKey;
                    headers['anthropic-version'] = '2023-06-01';
                    body = {
                        model: model,
                        max_tokens: 500,
                        messages: [{ role: 'user', content: prompt }]
                    };
                    break;
                default:
                    sendResponse({ error: 'Unsupported provider for chat' });
                    return;
            }

            fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            })
            .then(response => response.json())
            .then(data => {
                let responseText = '';
                switch (provider) {
                    case 'openai':
                    case 'openAICompatible':
                        if (data.choices && data.choices[0] && data.choices[0].message) {
                            responseText = data.choices[0].message.content;
                        }
                        break;
                    case 'anthropic':
                        if (data.content && data.content[0] && data.content[0].text) {
                            responseText = data.content[0].text;
                        }
                        break;
                }
                if (responseText) {
                    sendResponse({ response: responseText });
                } else {
                    sendResponse({ error: data.error?.message || 'No response content' });
                }
            })
            .catch(error => {
                sendResponse({ error: error.message });
            });
        });

        return true; // Async response
    }
});