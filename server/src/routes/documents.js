import express from 'express';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import { indexDocument, createDocument, indexAllDocuments } from '../services/ingestion.js';

const router = express.Router();

// GET /api/documents - List all documents
router.get('/', async (req, res) => {
    try {
        const documents = Document.findAll();

        // Get chunk counts
        const docsWithStats = documents.map((doc) => {
            const chunkCount = Chunk.count({ documentId: doc.id });
            return {
                ...doc,
                chunkCount
            };
        });

        res.json(docsWithStats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/documents/:id - Get single document
router.get('/:id', async (req, res) => {
    try {
        const document = Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const chunkCount = Chunk.count({ documentId: document.id });

        res.json({
            ...document,
            chunkCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/documents - Create new document
router.post('/', async (req, res) => {
    try {
        const { title, content, source, category, metadata, autoIndex } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const document = await createDocument({ title, content, source, category, metadata });

        // Optionally index immediately
        if (autoIndex) {
            await indexDocument(document.id);
        }

        res.status(201).json(document);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/documents/:id/index - Index a specific document
router.post('/:id/index', async (req, res) => {
    try {
        const result = await indexDocument(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/documents/index-all - Index all unindexed documents
router.post('/index-all', async (req, res) => {
    try {
        const results = await indexAllDocuments();
        res.json({ results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/documents/:id - Delete document and its chunks
router.delete('/:id', async (req, res) => {
    try {
        const document = Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete associated chunks
        Chunk.deleteByDocumentId(document.id);

        // Delete document
        Document.delete(req.params.id);

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
