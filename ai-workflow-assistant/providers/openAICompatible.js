window.openAICompatibleProvider = {
    async getAvailableModels(apiKey, baseUrl) {
        const response = await fetch(`${baseUrl}/models`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${errorData.error?.message || response.statusText || 'Unknown error'}`);
        }
        const data = await response.json();
        // Filter and map to a consistent format
        return data.data.map(model => ({ id: model.id, name: model.id }));
    },

    async sendPrompt(prompt, model, apiKey, baseUrl) {
        let messages;
        if (typeof prompt === 'string') {
            messages = [{ role: 'user', content: prompt }];
        } else {
            // Assumes prompt is already a valid messages array
            messages = prompt;
        }

        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                // Instructing the model to generate JSON is more reliable with this parameter
                response_format: { "type": "json_object" }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${errorData.error?.message || response.statusText || 'Unknown error'}`);
        }
        const data = await response.json();
        return data.choices[0].message.content;
    }
};