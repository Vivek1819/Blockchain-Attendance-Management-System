const { verifyToken } = require('@clerk/clerk-sdk-node');

/**
 * Middleware to verify Clerk authentication token
 * Extracts user info and attaches it to req.auth
 */
async function requireAuth(req, res, next) {
    try {
        // Get the session token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Please sign in.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify the token with Clerk
        const verifiedToken = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY
        });

        // Attach user info to request
        req.auth = {
            userId: verifiedToken.sub,
            sessionId: verifiedToken.sid
        };

        next();
    } catch (error) {
        console.error('Auth verification failed:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired session. Please sign in again.'
        });
    }
}

/**
 * Optional auth middleware - doesn't block if not authenticated
 * Used for public routes that can optionally show user-specific data
 */
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const verifiedToken = await verifyToken(token, {
                secretKey: process.env.CLERK_SECRET_KEY
            });
            
            req.auth = {
                userId: verifiedToken.sub,
                sessionId: verifiedToken.sid
            };
        }
    } catch (error) {
        // Silently continue without auth for optional routes
        req.auth = null;
    }
    
    next();
}

module.exports = { requireAuth, optionalAuth };