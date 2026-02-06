import db from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Document Model - JSON Database implementation
 */
const Document = {
    /**
     * Create a new document
     */
    create: (data) => {
        const doc = {
            id: uuidv4(),
            _id: null, // Set after creation
            title: data.title,
            content: data.content,
            source: data.source || data.title,
            category: data.category || 'general',
            metadata: data.metadata || {},
            isIndexed: data.isIndexed || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        doc._id = doc.id;

        return db.addDocument(doc);
    },

    /**
     * Find document by ID
     */
    findById: (id) => {
        return db.getDocument(id);
    },

    /**
     * Find all documents
     */
    findAll: (options = {}) => {
        let docs = db.getDocuments();

        if (options.where) {
            if (options.where.isIndexed !== undefined) {
                docs = docs.filter(d => d.isIndexed === options.where.isIndexed);
            }
        }

        // Sort by createdAt descending
        docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return docs;
    },

    /**
     * Update document
     */
    update: (id, data) => {
        const updates = { ...data, updatedAt: new Date().toISOString() };
        return db.updateDocument(id, updates);
    },

    /**
     * Delete document
     */
    delete: (id) => {
        db.deleteDocument(id);
    },

    /**
     * Count documents
     */
    count: (where = {}) => {
        let docs = db.getDocuments();

        if (where.isIndexed !== undefined) {
            docs = docs.filter(d => d.isIndexed === where.isIndexed);
        }

        return docs.length;
    }
};

export default Document;
