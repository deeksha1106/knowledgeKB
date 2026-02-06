import express from 'express';
import { queryKnowledgeBase, getSearchStats } from '../services/search.js';

const router = express.Router();

// POST /api/chat - Query the knowledge base
router.post('/', async (req, res) => {
    try {
        const { query, topK = 5 } = req.body;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const result = await queryKnowledgeBase(query.trim(), topK);

        res.json({
            query: query.trim(),
            response: result.response,
            citations: result.citations,
            sources: result.sources,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/chat/stats - Get knowledge base statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await getSearchStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
