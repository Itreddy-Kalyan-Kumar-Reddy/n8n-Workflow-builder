chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "injectText") {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable || activeElement.tagName === 'INPUT')) {
            // A more robust solution might be needed for complex editors,
            // but this covers most standard inputs.
            if (activeElement.value !== undefined) {
                activeElement.value = activeElement.value.slice(0, activeElement.selectionStart) + request.text + activeElement.value.slice(activeElement.selectionEnd);
            } else if (activeElement.isContentEditable) {
                // For contentEditable divs (like Notion, Google Docs)
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode(request.text));
                }
            }
            sendResponse({ status: "success" });
        } else {
            sendResponse({ status: "failed", message: "No active text input found." });
        }
    }
    return true; // Indicates an async response
});

// Floating Chat UI
function createFloatingChat() {
    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
        #ai-chat-toggle {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #61afef;
            color: white;
            border: none;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            transition: transform 0.2s;
        }
        #ai-chat-toggle:hover {
            transform: scale(1.1);
        }
        #ai-chat-sidebar {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 300px;
            height: 400px;
            background: #282c34;
            color: #abb2bf;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10001;
            display: none;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        #ai-chat-sidebar > div:first-child {
            padding: 10px;
            border-bottom: 1px solid #3b4048;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #ai-chat-sidebar h3 {
            margin: 0;
            color: #61afef;
        }
        #close-chat {
            background: none;
            border: none;
            color: #abb2bf;
            font-size: 20px;
            cursor: pointer;
        }
        #chat-messages {
            flex: 1;
            padding: 10px;
            overflow-y: auto;
            max-height: 300px;
        }
        #chat-input {
            width: 100%;
            padding: 8px;
            background: #21252b;
            color: #abb2bf;
            border: 1px solid #3b4048;
            border-radius: 4px;
            margin-bottom: 5px;
            box-sizing: border-box;
        }
        #send-chat {
            width: 100%;
            padding: 8px;
            background: #61afef;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        #send-chat:hover {
            background: #529bde;
        }
        .chat-message {
            margin-bottom: 10px;
            padding: 8px;
            border-radius: 4px;
        }
        .chat-message.user {
            background: #61afef;
            color: white;
            text-align: right;
        }
        .chat-message.ai {
            background: #3b4048;
            color: #abb2bf;
        }
        .chat-message.error {
            background: #e06c75;
            color: white;
        }
        #ai-chat-sidebar {
            cursor: move;
        }
    `;
    document.head.appendChild(style);

    // Floating button
    const floatingBtn = document.createElement('button');
    floatingBtn.id = 'ai-chat-toggle';
    floatingBtn.innerHTML = '💬';
    document.body.appendChild(floatingBtn);

    // Sidebar panel
    const sidebar = document.createElement('div');
    sidebar.id = 'ai-chat-sidebar';
    sidebar.innerHTML = `
        <div>
            <h3>AI Chat Helper</h3>
            <button id="close-chat">×</button>
        </div>
        <div id="chat-messages"></div>
        <div>
            <input type="text" id="chat-input" placeholder="Ask about errors or building...">
            <button id="send-chat">Send</button>
        </div>
    `;
    document.body.appendChild(sidebar);

    // Event listeners
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    floatingBtn.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
        if (e.target === floatingBtn) {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === floatingBtn) {
                isDragging = true;
            }
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            xOffset = currentX;
            yOffset = currentY;

            floatingBtn.style.transform = `translate(${currentX}px, ${currentY}px)`;
            sidebar.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    floatingBtn.addEventListener('click', (e) => {
        if (!isDragging) {
            sidebar.style.display = sidebar.style.display === 'none' ? 'flex' : 'none';
        }
    });

    const closeBtn = sidebar.querySelector('#close-chat');
    closeBtn.addEventListener('click', () => {
        sidebar.style.display = 'none';
    });

    const sendBtn = sidebar.querySelector('#send-chat');
    const input = sidebar.querySelector('#chat-input');
    const messages = sidebar.querySelector('#chat-messages');

    sendBtn.addEventListener('click', async () => {
        const prompt = input.value.trim();
        if (!prompt) return;

        // Add user message
        addMessage('user', prompt);
        input.value = '';

        // Get settings
        const { settings } = await chrome.storage.local.get('settings');
        if (!settings || !settings.apiKey || !settings.baseUrl) {
            addMessage('error', 'Settings not configured. Open popup to set up.');
            return;
        }

        // Send to background
        chrome.runtime.sendMessage({
            action: 'sendChatPrompt',
            prompt: prompt,
            model: settings.selectedModel || 'gpt-3.5-turbo'
        }, (response) => {
            if (response.error) {
                addMessage('error', `Error: ${response.error}`);
            } else {
                addMessage('ai', response.response);
                // Save to history
                chrome.storage.local.get(['history'], (result) => {
                    const history = result.history || [];
                    history.unshift({ prompt, response: response.response, type: 'chat', timestamp: new Date().toISOString() });
                    if (history.length > 50) {
                        history.pop();
                    }
                    chrome.storage.local.set({ history });
                });
            }
        });
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendBtn.click();
    });

    function addMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${sender}`;
        msgDiv.textContent = text;
        messages.appendChild(msgDiv);
        messages.scrollTop = messages.scrollHeight;
    }
}

// Initialize floating chat when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingChat);
} else {
    createFloatingChat();
}

// Error detection and auto-suggest
let originalConsoleError = console.error;
console.error = function(...args) {
    originalConsoleError.apply(console, args);
    handleError(args.join(' '));
};

window.addEventListener('error', (e) => {
    handleError(e.message || e.error?.message || 'Uncaught error');
});

function handleError(errorMsg) {
    const sidebar = document.getElementById('ai-chat-sidebar');
    if (sidebar && sidebar.style.display !== 'none') {
        const input = sidebar.querySelector('#chat-input');
        const sendBtn = sidebar.querySelector('#send-chat');
        const prompt = `Detected error on page: ${errorMsg}. Suggest a fix or explanation.`;
        input.value = prompt;
        sendBtn.click();
    } else {
        // Optionally, show a toast or open sidebar, but for now, just log
        console.log('AI Chat: Error detected, open chat to get help: ' + errorMsg);
    }
}