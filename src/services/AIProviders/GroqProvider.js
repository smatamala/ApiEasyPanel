import axios from 'axios';
import { BaseProvider } from './BaseProvider.js';

export class GroqProvider extends BaseProvider {
    constructor(config, apiKey) {
        super('Groq', config, apiKey);
        this.client = axios.create({
            baseURL: config.baseURL,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async chat(messages, modelKey = 'default') {
        const model = this.config.models[modelKey] || this.config.models.default;

        const response = await this.client.post('/chat/completions', {
            model,
            messages,
            stream: false,
            max_tokens: 1024,
            temperature: 0.7
        });

        return {
            model: response.data.model,
            content: response.data.choices[0].message.content
        };
    }
}
