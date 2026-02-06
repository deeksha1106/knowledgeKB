/**
 * Global error handling middleware
 */
export function errorHandler(err, req, res, next) {
    console.error('❌ Error:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ error: messages.join(', ') });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Gemini API error
    if (err.message?.includes('API')) {
        return res.status(503).json({ error: 'AI service temporarily unavailable' });
    }

    // Default error
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
}

/**
 * 404 handler
 */
export function notFoundHandler(req, res) {
    res.status(404).json({ error: 'Endpoint not found' });
}
