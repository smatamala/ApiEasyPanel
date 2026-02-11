import { getProviderConfig, getEnabledProviders } from '../config/providers.js';
import { CerebrasProvider } from './AIProviders/CerebrasProvider.js';
import { GroqProvider } from './AIProviders/GroqProvider.js';
import { OpenRouterProvider } from './AIProviders/OpenRouterProvider.js';

export class ProviderManager {
    constructor() {
        this.providers = new Map();
        this.currentProviderIndex = 0;
        this.initializeProviders();
    }

    initializeProviders() {
        const enabledProviders = getEnabledProviders();

        enabledProviders.forEach(providerName => {
            const config = getProviderConfig(providerName);
            const apiKey = process.env[`${providerName.toUpperCase()}_API_KEY`];

            if (!apiKey) {
                console.warn(`⚠️  No API key found for ${providerName}, skipping...`);
                return;
            }

            let provider;
            switch (providerName) {
                case 'cerebras':
                    provider = new CerebrasProvider(config, apiKey);
                    break;
                case 'groq':
                    provider = new GroqProvider(config, apiKey);
                    break;
                case 'openrouter':
                    provider = new OpenRouterProvider(config, apiKey);
                    break;
                default:
                    console.warn(`⚠️  Unknown provider: ${providerName}`);
                    return;
            }

            this.providers.set(providerName, provider);
            console.log(`✅ Initialized ${config.name} provider`);
        });

        if (this.providers.size === 0) {
            throw new Error('No providers initialized. Please check your API keys.');
        }
    }

    getNextAvailableProvider() {
        const providerArray = Array.from(this.providers.values());
        const totalProviders = providerArray.length;

        // Try each provider starting from current index
        for (let i = 0; i < totalProviders; i++) {
            const index = (this.currentProviderIndex + i) % totalProviders;
            const provider = providerArray[index];

            if (provider.canMakeRequest()) {
                this.currentProviderIndex = (index + 1) % totalProviders;
                return provider;
            }
        }

        return null;
    }

    async chat(messages, modelPreference = 'default') {
        const provider = this.getNextAvailableProvider();

        if (!provider) {
            throw new Error('All providers have reached their rate limits. Please try again later.');
        }

        console.log(`🤖 Using ${provider.name} for this request`);
        return await provider.makeRequest(messages, modelPreference);
    }

    getAllProvidersStatus() {
        const status = [];

        this.providers.forEach((provider, name) => {
            status.push(provider.getUsageStats());
        });

        return status;
    }

    getProviderByName(name) {
        return this.providers.get(name);
    }
}
