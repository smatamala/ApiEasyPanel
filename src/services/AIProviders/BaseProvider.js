import axios from 'axios';

export class BaseProvider {
    constructor(name, config, apiKey) {
        this.name = name;
        this.config = config;
        this.apiKey = apiKey;
        this.usage = {
            tokensToday: 0,
            requestsToday: 0,
            requestsThisMinute: 0,
            lastReset: new Date(),
            lastMinuteReset: new Date()
        };
    }

    resetIfNeeded() {
        const now = new Date();

        // Reset daily counters
        if (now.getDate() !== this.usage.lastReset.getDate()) {
            this.usage.tokensToday = 0;
            this.usage.requestsToday = 0;
            this.usage.lastReset = now;
        }

        // Reset minute counters
        const minutesPassed = Math.floor((now - this.usage.lastMinuteReset) / 60000);
        if (minutesPassed >= 1) {
            this.usage.requestsThisMinute = 0;
            this.usage.lastMinuteReset = now;
        }
    }

    canMakeRequest() {
        this.resetIfNeeded();

        const withinDailyLimit = this.usage.requestsToday < this.config.limits.requestsPerDay;
        const withinMinuteLimit = this.usage.requestsThisMinute < this.config.limits.requestsPerMinute;
        const withinTokenLimit = this.usage.tokensToday < this.config.limits.tokensPerDay;

        return withinDailyLimit && withinMinuteLimit && withinTokenLimit;
    }

    updateUsage(tokensUsed) {
        this.usage.tokensToday += tokensUsed;
        this.usage.requestsToday += 1;
        this.usage.requestsThisMinute += 1;
    }

    getUsageStats() {
        this.resetIfNeeded();
        return {
            provider: this.name,
            tokensUsed: this.usage.tokensToday,
            tokensLimit: this.config.limits.tokensPerDay,
            requestsToday: this.usage.requestsToday,
            requestsLimit: this.config.limits.requestsPerDay,
            available: this.canMakeRequest()
        };
    }

    async chat(messages, model = 'default') {
        throw new Error('chat() must be implemented by subclass');
    }

    async makeRequest(messages, modelKey = 'default') {
        if (!this.canMakeRequest()) {
            throw new Error(`${this.name} rate limit exceeded`);
        }

        try {
            const response = await this.chat(messages, modelKey);

            // Estimate tokens (rough approximation)
            const tokensUsed = Math.ceil(
                (JSON.stringify(messages).length + response.content.length) / 4
            );

            this.updateUsage(tokensUsed);

            return {
                success: true,
                provider: this.name,
                model: response.model,
                content: response.content,
                tokensUsed
            };
        } catch (error) {
            return {
                success: false,
                provider: this.name,
                error: error.message
            };
        }
    }
}
