import express from 'express';

const router = express.Router();

/**
 * POST /api/chat
 * Send a chat message and get AI response
 * 
 * Body:
 * {
 *   "message": "Your message here",
 *   "model": "default|fast|smart" (optional)
 * }
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, model = 'default' } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Message is required and must be a string'
            });
        }

        const messages = [
            {
                role: 'user',
                content: message
            }
        ];

        const providerManager = req.app.get('providerManager');
        const result = await providerManager.chat(messages, model);

        if (!result.success) {
            return res.status(500).json({
                error: result.error,
                provider: result.provider
            });
        }

        res.json({
            success: true,
            provider: result.provider,
            model: result.model,
            response: result.content,
            tokensUsed: result.tokensUsed
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({
            error: error.message || 'An error occurred while processing your request'
        });
    }
});

/**
 * POST /api/chat/conversation
 * Send a conversation with multiple messages
 * 
 * Body:
 * {
 *   "messages": [
 *     { "role": "user", "content": "Hello" },
 *     { "role": "assistant", "content": "Hi there!" },
 *     { "role": "user", "content": "How are you?" }
 *   ],
 *   "model": "default|fast|smart" (optional)
 * }
 */
router.post('/chat/conversation', async (req, res) => {
    try {
        const { messages, model = 'default' } = req.body;

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: 'Messages array is required and must not be empty'
            });
        }

        // Validate message format
        const validRoles = ['user', 'assistant', 'system'];
        for (const msg of messages) {
            if (!msg.role || !validRoles.includes(msg.role)) {
                return res.status(400).json({
                    error: `Invalid message role. Must be one of: ${validRoles.join(', ')}`
                });
            }
            if (!msg.content || typeof msg.content !== 'string') {
                return res.status(400).json({
                    error: 'Each message must have a content string'
                });
            }
        }

        const providerManager = req.app.get('providerManager');
        const result = await providerManager.chat(messages, model);

        if (!result.success) {
            return res.status(500).json({
                error: result.error,
                provider: result.provider
            });
        }

        res.json({
            success: true,
            provider: result.provider,
            model: result.model,
            response: result.content,
            tokensUsed: result.tokensUsed
        });

    } catch (error) {
        console.error('Conversation error:', error);
        res.status(500).json({
            error: error.message || 'An error occurred while processing your request'
        });
    }
});

/**
 * GET /api/providers/status
 * Get status of all AI providers
 */
router.get('/providers/status', (req, res) => {
    try {
        const providerManager = req.app.get('providerManager');
        const status = providerManager.getAllProvidersStatus();

        res.json({
            success: true,
            providers: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Status error:', error);
        res.status(500).json({
            error: error.message || 'An error occurred while fetching provider status'
        });
    }
});

// POST /api/chat/stream
router.post('/chat/stream', async (req, res) => {
    try {
        const { message, model = 'default' } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Message is required and must be a string'
            });
        }

        const messages = [{
            role: 'user',
            content: message
        }];

        const providerManager = req.app.get('providerManager');
        const result = await providerManager.stream(messages, model);

        if (!result.success) {
            return res.status(500).json({
                error: result.error,
                provider: result.provider
            });
        }

        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const stream = result.stream;
        let fullContent = '';

        stream.on('data', (chunk) => {
            const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                if (line.includes('[DONE]')) {
                    res.write('data: [DONE]\n\n');

                    // Update usage after stream is done (estimate based on fullContent)
                    const provider = providerManager.getProviderByName(result.provider.toLowerCase());
                    if (provider) {
                        const tokensUsed = Math.ceil((JSON.stringify(messages).length + fullContent.length) / 4);
                        provider.updateUsage(tokensUsed);
                    }

                    return res.end();
                }

                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const content = data.choices[0]?.delta?.content || '';
                        if (content) {
                            fullContent += content;
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                        }
                    } catch (e) {
                        // Skip parse errors for non-json lines
                    }
                }
            }
        });

        stream.on('error', (err) => {
            console.error('Stream error:', err);
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
            res.end();
        });

        req.on('close', () => {
            stream.destroy();
        });

    } catch (error) {
        console.error('Chat stream error:', error);
        res.status(500).json({
            error: error.message
        });
    }
});

export default router;
