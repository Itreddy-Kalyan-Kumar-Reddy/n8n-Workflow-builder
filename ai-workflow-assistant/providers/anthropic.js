window.anthropicProvider = {
    async getAvailableModels(apiKey, baseUrl) {
        // Anthropic doesn't have a public models endpoint.
        // We list the most common ones manually.
        return [
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
            { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
        ];
    },

    async sendPrompt(prompt, model, apiKey, baseUrl) {
        const response = await fetch(`${baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: model,
                max_tokens: 2048,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${errorData.error?.message || response.statusText || 'Unknown error'}`);
        }
        const data = await response.json();
        return data.content[0].text;
    }
};