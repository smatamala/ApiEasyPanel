export const authMiddleware = (req, res, next) => {
    // Skip auth for health check and root endpoint
    if (req.path === '/health' || req.path === '/') {
        return next();
    }

    const authHeader = req.headers.authorization;
    const apiToken = process.env.API_TOKEN;

    // If no API_TOKEN is configured, allow all requests (backward compatibility)
    if (!apiToken) {
        console.warn('⚠️  API_TOKEN not configured. API is running without authentication!');
        return next();
    }

    // Check if Authorization header exists
    if (!authHeader) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing Authorization header. Use: Authorization: Bearer YOUR_TOKEN'
        });
    }

    // Check if it's a Bearer token
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer') {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid authentication scheme. Use: Authorization: Bearer YOUR_TOKEN'
        });
    }

    // Verify token
    if (token !== apiToken) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token'
        });
    }

    // Token is valid, proceed
    next();
};
