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

export default router;
