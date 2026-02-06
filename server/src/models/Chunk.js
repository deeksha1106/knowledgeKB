import db from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Chunk Model - JSON Database implementation
 */
const Chunk = {
    /**
     * Create a new chunk
     */
    create: (data) => {
        const chunk = {
            id: uuidv4(),
            _id: null,
            documentId: data.documentId,
            content: data.content,
            embedding: data.embedding,
            chunkIndex: data.chunkIndex,
            startOffset: data.startOffset,
            endOffset: data.endOffset,
            createdAt: new Date().toISOString()
        };
        chunk._id = chunk.id;

        return db.addChunk(chunk);
    },

    /**
     * Find all chunks with document data
     */
    findAll: () => {
        const chunks = db.getChunks();
        const documents = db.getDocuments();

        return chunks.map(chunk => {
            const doc = documents.find(d => d.id === chunk.documentId);
            return {
                ...chunk,
                documentId: doc ? {
                    _id: doc.id,
                    title: doc.title,
                    source: doc.source,
                    category: doc.category
                } : null
            };
        });
    },

    /**
     * Find chunks by document ID
     */
    findByDocumentId: (documentId) => {
        return db.getChunksByDocument(documentId)
            .sort((a, b) => a.chunkIndex - b.chunkIndex);
    },

    /**
     * Delete chunks by document ID
     */
    deleteByDocumentId: (documentId) => {
        db.deleteChunksByDocument(documentId);
    },

    /**
     * Delete all chunks
     */
    deleteAll: () => {
        db.clearChunks();
    },

    /**
     * Count chunks
     */
    count: (where = {}) => {
        if (where.documentId) {
            return db.getChunksByDocument(where.documentId).length;
        }
        return db.getChunks().length;
    }
};

export default Chunk;
