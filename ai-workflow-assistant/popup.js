// n8n system prompt for workflow generation
const n8nSystemPrompt = `You are an expert n8n workflow developer. Your sole purpose is to convert a user's natural language request into a valid n8n workflow JSON structure.

RULES:
1.  **Strictly JSON Output**: Your entire response MUST be a single, valid JSON object. Do not include any explanatory text, markdown formatting like \`\`\`json, or any other characters before or after the JSON object.
2.  **Node Structure**: Every workflow has a \`nodes\` array and a \`connections\` array.
3.  **Trigger Node**: The first node should almost always be a trigger node (e.g., \`n8n-nodes-base.webhook\`, \`n8n-nodes-base.scheduleTrigger\`). Give it a unique position like \`x: 250, y: 300\`.
4.  **Node Connections**: For every connection between two nodes, you must create an entry in the \`connections\` object. The key should be the \`output\` name of the source node, and the value is an array of objects specifying the \`node\` and \`input\` of the destination.
5.  **Parameters**: Infer the necessary parameters for each node. For example, if a user says "send a Discord message", you must create an \`n8n-nodes-base.discord\` node and populate its \`parameters\` with a placeholder \`content\` field.
6.  **Credentials**: Do not include real credentials. For nodes that require them, the AI knows to create a \`credentials\` object, but the user will select the specific credential in the n8n UI.

Here is an example of a simple workflow.
User Request: "When a webhook is called with a 'name' field, respond with a message 'Hello, {name}'."

Your JSON Output:
{
"nodes": [
  {
    "parameters": {
      "httpMethod": "POST",
      "path": "my-webhook",
      "options": {}
    },
    "name": "Webhook",
    "type": "n8n-nodes-base.webhook",
    "typeVersion": 1,
    "position": [ 250, 300 ]
  },
  {
    "parameters": {
      "content": "Hello, {{$json.body.name}}!",
      "options": {}
    },
    "name": "Respond with Message",
    "type": "n8n-nodes-base.respondToWebhook",
    "typeVersion": 1,
    "position": [ 500, 300 ]
  }
],
"connections": {
  "Webhook": {
    "main": [
      [
        {
          "node": "Respond with Message",
          "type": "main"
        }
      ]
    ]
  }
}
}`;

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const providerSelect = document.getElementById('provider-select');
    const apiKeyInput = document.getElementById('api-key');
    const baseUrlInput = document.getElementById('base-url');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const settingsStatus = document.getElementById('settings-status');
    const modelSearchInput = document.getElementById('model-search');
    const modelList = document.getElementById('model-list');
    const selectedModelInput = document.getElementById('selected-model');
    const promptInput = document.getElementById('prompt-input');
    const sendPromptBtn = document.getElementById('send-prompt-btn');
    const responseOutput = document.getElementById('response-output');
    const copyJsonBtn = document.getElementById('copy-json-btn');
    const downloadJsonBtn = document.getElementById('download-json-btn');
    const pushWorkflowBtn = document.getElementById('push-workflow-btn');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    let currentSettings = {};
    let allModels = [];

    // Map provider keys to their respective implementation objects
    const providers = {
        openai: window.openAICompatibleProvider,
        anthropic: window.anthropicProvider,
    };

    // Default base URLs for providers
    function getDefaultBaseUrl(provider) {
        switch (provider) {
            case 'openai':
                return 'https://api.openai.com/v1';
            case 'anthropic':
                return 'https://api.anthropic.com';
            default:
                return '';
        }
    }

    // Helper to get current provider settings
    function getCurrentProviderSettings() {
        const provider = providerSelect.value;
        if (!currentSettings.providers) {
            currentSettings.providers = {};
        }
        if (!currentSettings.providers[provider]) {
            currentSettings.providers[provider] = {
                apiKey: '',
                baseUrl: getDefaultBaseUrl(provider)
            };
        }
        return currentSettings.providers[provider];
    }

    // --- Tab Navigation ---
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            link.classList.add('active');
            document.getElementById(link.dataset.tab).classList.add('active');

            // Refresh history when tab is opened
            if (link.dataset.tab === 'history') {
                loadHistory();
            }
        });
    });

    // --- Settings Logic ---
    async function saveSettings() {
        if (!currentSettings.providers) {
            currentSettings.providers = {};
        }
        const currentProvider = getCurrentProviderSettings();
        currentProvider.apiKey = apiKeyInput.value;
        currentProvider.baseUrl = baseUrlInput.value;
    
        currentSettings.n8nUrl = document.getElementById('n8n-url').value;
        currentSettings.n8nApiKey = document.getElementById('n8n-api-key').value;
    
        await chrome.storage.local.set({ settings: currentSettings });
        settingsStatus.textContent = 'Settings saved.';
        settingsStatus.style.color = 'var(--success-color)';
        setTimeout(() => settingsStatus.textContent = '', 3000);
        
        await fetchAndPopulateModels(selectedModelInput.value);
    }

    async function loadSettings() {
        const result = await chrome.storage.local.get(['settings', 'selectedModel']);
        if (result.settings) {
            currentSettings = result.settings;
        } else {
            currentSettings = { providers: {} };
        }
    
        // Load n8n settings
        document.getElementById('n8n-url').value = currentSettings.n8nUrl || '';
        document.getElementById('n8n-api-key').value = currentSettings.n8nApiKey || '';
    
        // Set initial provider if not set
        if (!currentSettings.provider) {
            currentSettings.provider = 'openai';
            providerSelect.value = 'openai';
        } else {
            providerSelect.value = currentSettings.provider;
        }
    
        // Load current provider settings
        const currentProviderSettings = getCurrentProviderSettings();
        apiKeyInput.value = currentProviderSettings.apiKey;
        baseUrlInput.value = currentProviderSettings.baseUrl;
    
        await fetchAndPopulateModels(result.selectedModel);
    }

    // Provider change listener
    providerSelect.addEventListener('change', async () => {
        currentSettings.provider = providerSelect.value;
        const currentProviderSettings = getCurrentProviderSettings();
        apiKeyInput.value = currentProviderSettings.apiKey;
        baseUrlInput.value = currentProviderSettings.baseUrl;
        await fetchAndPopulateModels(selectedModelInput.value);
    });

    async function fetchAndPopulateModels(selectedModel) {
        const currentProviderSettings = getCurrentProviderSettings();
        const providerKey = providerSelect.value;
        if (providerKey === 'openai' && !currentProviderSettings.apiKey) {
            modelSearchInput.placeholder = 'Please enter API key and save settings first';
            return;
        }

        const provider = providers[providerKey];
        if (!provider) {
            console.error('Invalid provider selected');
            return;
        }

        try {
            modelSearchInput.placeholder = 'Fetching models...';
            allModels = await provider.getAvailableModels(currentProviderSettings.apiKey, currentProviderSettings.baseUrl);
            modelList.innerHTML = ''; // Clear loading message
            allModels.forEach(model => {
                const li = document.createElement('li');
                li.textContent = model.name;
                li.dataset.modelId = model.id;
                li.addEventListener('click', async () => {
                    selectedModelInput.value = model.id;
                    modelSearchInput.value = model.name;
                    modelList.style.display = 'none';
                    await chrome.storage.local.set({ selectedModel: model.id });
                });
                modelList.appendChild(li);
            });

            if (selectedModel && allModels.some(m => m.id === selectedModel)) {
                const selected = allModels.find(m => m.id === selectedModel);
                modelSearchInput.value = selected.name;
                selectedModelInput.value = selected.id;
            }

            modelList.style.display = 'none';
        } catch (error) {
            console.error('Failed to fetch models:', error);
            modelSearchInput.placeholder = `Error: ${error.message}`;
            modelList.style.display = 'none';
        }
    }
    
    // --- Prompt & Response Logic ---
    async function handleSendPrompt() {
        const promptText = promptInput.value;
        const selectedModel = selectedModelInput.value;
        
        const currentProviderSettings = getCurrentProviderSettings();
        if (!promptText || !selectedModel || !currentProviderSettings.apiKey) {
            responseOutput.innerHTML = 'Error: Missing prompt, model, or API key.';
            return;
        }

        sendPromptBtn.disabled = true;
        sendPromptBtn.textContent = 'Thinking...';
        responseOutput.innerHTML = '';
        copyJsonBtn.classList.add('hidden');
        pushWorkflowBtn.classList.add('hidden');

        // Always use workflow mode with system prompt
        const finalPrompt = [
            { role: 'system', content: n8nSystemPrompt },
            { role: 'user', content: promptText }
        ];

        const providerKey = providerSelect.value;
        const provider = providers[providerKey];
        try {
            const response = await provider.sendPrompt(
                finalPrompt,
                selectedModel,
                currentProviderSettings.apiKey,
                currentProviderSettings.baseUrl
            );

            // Always expect JSON for workflow
            try {
                const jsonResponse = JSON.parse(response);
                responseOutput.innerHTML = renderJsonTree(jsonResponse);
                responseOutput.dataset.json = JSON.stringify(jsonResponse);
                copyJsonBtn.classList.remove('hidden');
                downloadJsonBtn.classList.remove('hidden');
                
                // Show push button if n8n settings are available
                if (currentSettings.n8nUrl && currentSettings.n8nApiKey) {
                    pushWorkflowBtn.classList.remove('hidden');
                }

            } catch (e) {
                responseOutput.innerHTML = "Error: AI did not return valid JSON.\n\n" + response;
            }
            await saveToHistory(promptText, response);
        } catch (error) {
            responseOutput.innerHTML = `Error: ${error.message}`;
        } finally {
            sendPromptBtn.disabled = false;
            sendPromptBtn.textContent = 'Send';
        }
    }

    // --- History Logic ---
    async function saveToHistory(prompt, response, type = 'workflow') {
        const { history = [] } = await chrome.storage.local.get('history');
        history.unshift({ prompt, response, type, timestamp: new Date().toISOString() });
        // Keep history to a reasonable size, e.g., 50 entries
        if (history.length > 50) {
            history.pop();
        }
        await chrome.storage.local.set({ history });
    }

    async function loadHistory() {
        const { history = [] } = await chrome.storage.local.get('history');
        historyList.innerHTML = '';
        if (history.length === 0) {
            historyList.innerHTML = '<p>No history yet.</p>';
            return;
        }
        history.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'history-card';
            card.dataset.index = index;

            const timestamp = new Date(item.timestamp).toLocaleString();
            const type = item.type || 'workflow';
            const truncatedPrompt = item.prompt.length > 100 ? item.prompt.substring(0, 100) + '...' : item.prompt;
            const headerText = type === 'chat' ? `Chat: ${truncatedPrompt}` : truncatedPrompt;

            let detailsHTML = '';
            if (type === 'chat') {
                detailsHTML = `
                    <div class="full-chat">
                        <h4>User:</h4>
                        <pre>${item.prompt}</pre>
                        <h4>AI:</h4>
                        <pre>${item.response}</pre>
                        <div class="copy-buttons">
                            <button class="copy-prompt-btn">Copy User Message</button>
                            <button class="copy-response-btn">Copy AI Response</button>
                        </div>
                    </div>
                `;
            } else {
                detailsHTML = `
                    <div class="full-prompt">
                        <h4>Question:</h4>
                        <pre>${item.prompt}</pre>
                    </div>
                    <div class="full-response">
                        <h4>Response:</h4>
                        <pre>${item.response}</pre>
                        <div class="copy-buttons">
                            <button class="copy-prompt-btn">Copy Question</button>
                            <button class="copy-response-btn">Copy Response</button>
                        </div>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="card-header">
                    <span class="timestamp">${timestamp}</span>
                    <span class="truncated-prompt">${headerText}</span>
                    <span class="type-badge">${type.toUpperCase()}</span>
                    <button class="expand-btn">▼</button>
                    <button class="delete-btn">×</button>
                </div>
                <div class="card-details hidden">
                    ${detailsHTML}
                </div>
            `;

            // Add expand/collapse functionality
            const header = card.querySelector('.card-header');
            const details = card.querySelector('.card-details');
            const expandBtn = card.querySelector('.expand-btn');

            header.addEventListener('click', (e) => {
                if (e.target !== expandBtn && !e.target.classList.contains('delete-btn')) {
                    details.classList.toggle('hidden');
                    expandBtn.textContent = details.classList.contains('hidden') ? '▼' : '▲';
                }
            });

            // Delete functionality
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const index = parseInt(card.dataset.index);
                const { history = [] } = await chrome.storage.local.get('history');
                if (index >= 0 && index < history.length) {
                    history.splice(index, 1);
                    await chrome.storage.local.set({ history });
                    loadHistory(); // Refresh UI
                }
            });

            // Copy prompt functionality
            const copyPromptBtn = card.querySelector('.copy-prompt-btn');
            copyPromptBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(item.prompt)
                    .then(() => {
                        const originalText = copyPromptBtn.textContent;
                        copyPromptBtn.textContent = 'Copied!';
                        setTimeout(() => copyPromptBtn.textContent = originalText, 2000);
                    })
                    .catch(err => {
                        console.error('Failed to copy prompt: ', err);
                    });
            });

            // Copy response functionality
            const copyResponseBtn = card.querySelector('.copy-response-btn');
            copyResponseBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(item.response)
                    .then(() => {
                        const originalText = copyResponseBtn.textContent;
                        copyResponseBtn.textContent = 'Copied!';
                        setTimeout(() => copyResponseBtn.textContent = originalText, 2000);
                    })
                    .catch(err => {
                        console.error('Failed to copy response: ', err);
                    });
            });

            historyList.appendChild(card);
        });
    }

    async function clearHistory() {
        await chrome.storage.local.remove('history');
        loadHistory();
    }
    

    // --- Copy JSON Logic ---
    function copyJsonToClipboard() {
        const responseText = responseOutput.dataset.json;
        if (!responseText) return;

        navigator.clipboard.writeText(responseText)
            .then(() => {
                const btn = copyJsonBtn;
                btn.textContent = 'Copied!';
                setTimeout(() => btn.textContent = 'Copy JSON', 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    }

    function downloadJson() {
        const jsonString = responseOutput.dataset.json;
        if (!jsonString) return;

        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'workflow.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function renderJsonTree(obj, key = '') {
        if (obj === null) {
            return `<span class="null">null</span>`;
        }
        if (typeof obj === 'string') {
            return `<span class="string">"${obj}"</span>`;
        }
        if (typeof obj === 'number') {
            return `<span class="number">${obj}</span>`;
        }
        if (typeof obj === 'boolean') {
            return `<span class="boolean">${obj}</span>`;
        }
        if (Array.isArray(obj)) {
            let html = '<details open><summary>Array [' + obj.length + ']</summary>';
            obj.forEach((item, index) => {
                html += `<div style="margin-left: 20px;">[${index}]: ${renderJsonTree(item)}</div>`;
            });
            html += '</details>';
            return html;
        }
        if (typeof obj === 'object') {
            let html = '<details open><summary>Object</summary>';
            Object.entries(obj).forEach(([k, v]) => {
                html += `<div style="margin-left: 20px;"><span class="key">"${k}"</span>: ${renderJsonTree(v, k)}</div>`;
            });
            html += '</details>';
            return html;
        }
        return String(obj);
    }

    // --- Push to n8n Logic ---
    async function pushWorkflowToN8n() {
        const btn = pushWorkflowBtn;
        try {
            const workflowJson = JSON.parse(responseOutput.dataset.json);
            if (!currentSettings.n8nUrl || !currentSettings.n8nApiKey) {
                alert('Please set your n8n URL and API Key in Settings.');
                return;
            }
            
            btn.textContent = 'Pushing...';
            btn.disabled = true;
    
            const response = await fetch(`${currentSettings.n8nUrl}/api/v1/workflows`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-N8N-API-KEY': currentSettings.n8nApiKey,
                },
                body: JSON.stringify(workflowJson),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`n8n API Error: ${errorData.message}`);
            }
            
            btn.textContent = 'Pushed Successfully!';
            setTimeout(() => btn.textContent = 'Push to n8n', 3000);
    
        } catch (error) {
            alert(error.message);
            btn.textContent = 'Push to n8n';
        } finally {
            btn.disabled = false;
        }
    }

    // --- Event Listeners ---
    saveSettingsBtn.addEventListener('click', saveSettings);
    sendPromptBtn.addEventListener('click', handleSendPrompt);
    copyJsonBtn.addEventListener('click', copyJsonToClipboard);
    downloadJsonBtn.addEventListener('click', downloadJson);
    pushWorkflowBtn.addEventListener('click', pushWorkflowToN8n);
    clearHistoryBtn.addEventListener('click', clearHistory);
    modelSearchInput.addEventListener('input', () => {
        const filter = modelSearchInput.value.toLowerCase();
        const liElements = modelList.getElementsByTagName('li');
        let hasVisible = false;
        for (let li of liElements) {
            if (li.textContent.toLowerCase().includes(filter)) {
                li.style.display = '';
                hasVisible = true;
            } else {
                li.style.display = 'none';
            }
        }
        modelList.style.display = hasVisible ? 'block' : 'none';
    });

    // Show model list on focus if models are loaded
    modelSearchInput.addEventListener('focus', () => {
        if (allModels.length > 0) {
            modelList.style.display = 'block';
        }
    });

    // --- Initialization ---
    loadSettings();
});