import { getProviderConfig, getEnabledProviders } from '../config/providers.js';
import { CerebrasProvider } from './AIProviders/CerebrasProvider.js';
import { GroqProvider } from './AIProviders/GroqProvider.js';
import { OpenRouterProvider } from './AIProviders/OpenRouterProvider.js';
import logger from '../utils/logger.js';

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
                logger.warn(`No API key found for ${providerName}, skipping...`);
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
                    logger.warn(`Unknown provider: ${providerName}`);
                    return;
            }

            this.providers.set(providerName, provider);
            logger.info(`Initialized ${config.name} provider`);
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
        const providerArray = Array.from(this.providers.values());
        const totalProviders = providerArray.length;
        let lastError = null;

        // Try to get a response, falling back to other providers if one fails
        for (let i = 0; i < totalProviders; i++) {
            const provider = this.getNextAvailableProvider();

            if (!provider) {
                break;
            }

            try {
                logger.info(`Using ${provider.name} (Attempt ${i + 1}/${totalProviders})`);
                const result = await provider.makeRequest(messages, modelPreference);

                if (result.success) {
                    return result;
                }

                lastError = result.error;
                logger.warn(`${provider.name} failed: ${lastError}. Trying next...`);
            } catch (error) {
                lastError = error.message;
                logger.error(`Error with ${provider.name}: ${lastError}`);
            }
        }

        throw new Error(`All providers failed. Last error: ${lastError || 'No providers available'}`);
    }

    async stream(messages, modelPreference = 'default') {
        const providerArray = Array.from(this.providers.values());
        const totalProviders = providerArray.length;
        let lastError = null;

        // Try to get a stream, falling back to other providers if one fails
        for (let i = 0; i < totalProviders; i++) {
            const provider = this.getNextAvailableProvider();

            if (!provider) {
                break;
            }

            try {
                logger.info(`Streaming with ${provider.name} (Attempt ${i + 1}/${totalProviders})`);
                const result = await provider.makeStreamRequest(messages, modelPreference);

                if (result.success) {
                    return result;
                }

                lastError = result.error;
                logger.warn(`${provider.name} stream failed: ${lastError}. Trying next...`);
            } catch (error) {
                lastError = error.message;
                logger.error(`Stream error with ${provider.name}: ${lastError}`);
            }
        }

        throw new Error(`All providers failed to stream. Last error: ${lastError || 'No providers available'}`);
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
