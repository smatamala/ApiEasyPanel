export const PROVIDERS_CONFIG = {
  cerebras: {
    name: 'Cerebras',
    baseURL: 'https://api.cerebras.ai/v1',
    models: {
      default: 'llama3.1-8b',
      fast: 'llama3.1-8b',
      smart: 'llama3.1-70b'
    },
    limits: {
      tokensPerDay: 1000000,
      requestsPerMinute: 30,
      requestsPerDay: 14400
    },
    enabled: true
  },
  groq: {
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    models: {
      default: 'llama-3.3-70b-versatile',
      fast: 'llama-3.1-8b-instant',
      smart: 'llama-3.3-70b-versatile'
    },
    limits: {
      tokensPerDay: 14400,
      requestsPerMinute: 30,
      requestsPerDay: 14400
    },
    enabled: true
  },
  openrouter: {
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    models: {
      default: 'meta-llama/llama-3.2-3b-instruct:free',
      fast: 'meta-llama/llama-3.2-3b-instruct:free',
      smart: 'google/gemini-2.0-flash-exp:free'
    },
    limits: {
      tokensPerDay: 200000,
      requestsPerMinute: 20,
      requestsPerDay: 10000
    },
    enabled: true
  }
};

export function getEnabledProviders() {
  const enabledList = process.env.ENABLED_PROVIDERS?.split(',').map(p => p.trim()) || [];
  
  if (enabledList.length === 0) {
    return Object.keys(PROVIDERS_CONFIG);
  }
  
  return enabledList.filter(provider => PROVIDERS_CONFIG[provider]);
}

export function getProviderConfig(providerName) {
  return PROVIDERS_CONFIG[providerName];
}
