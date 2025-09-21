window.n8nProvider = {
    async getAvailableModels() {
        return [{ id: 'n8n-workflow', name: 'n8n Workflow API' }];
    },

    async sendPrompt(workflowJson, _, apiKey, baseUrl) {
        const response = await fetch(`${baseUrl}/workflows`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-API-KEY': apiKey
            },
            body: workflowJson
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`n8n Error: ${error.message}`);
        }
        return 'Workflow created successfully';
    }
};