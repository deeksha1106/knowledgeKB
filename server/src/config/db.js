import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const dbDir = path.join(__dirname, '../../data');
const dbPath = path.join(dbDir, 'database.json');

// Default empty database structure
const defaultDB = {
    documents: [],
    chunks: []
};

/**
 * Simple JSON file database with sync operations
 */
class JSONDatabase {
    constructor() {
        this.data = null;
        this.initialized = false;
    }

    /**
     * Initialize database
     */
    init() {
        if (this.initialized) return;

        // Ensure data directory exists
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Load or create database
        if (fs.existsSync(dbPath)) {
            try {
                const content = fs.readFileSync(dbPath, 'utf-8');
                this.data = JSON.parse(content);
            } catch (err) {
                console.log('Creating new database file...');
                this.data = { ...defaultDB };
            }
        } else {
            this.data = { ...defaultDB };
        }

        this.initialized = true;
        this.save();
        console.log('✅ JSON Database initialized');
    }

    /**
     * Save database to file - synchronously to avoid crashes
     */
    save() {
        try {
            const tempPath = dbPath + '.tmp';
            fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2));
            fs.renameSync(tempPath, dbPath);
        } catch (err) {
            console.error('Failed to save database:', err.message);
        }
    }

    /**
     * Get all documents
     */
    getDocuments() {
        return this.data.documents;
    }

    /**
     * Get document by ID
     */
    getDocument(id) {
        return this.data.documents.find(d => d.id === id);
    }

    /**
     * Add document
     */
    addDocument(doc) {
        this.data.documents.push(doc);
        this.save();
        return doc;
    }

    /**
     * Update document
     */
    updateDocument(id, updates) {
        const index = this.data.documents.findIndex(d => d.id === id);
        if (index !== -1) {
            this.data.documents[index] = { ...this.data.documents[index], ...updates };
            this.save();
            return this.data.documents[index];
        }
        return null;
    }

    /**
     * Delete document
     */
    deleteDocument(id) {
        this.data.documents = this.data.documents.filter(d => d.id !== id);
        this.data.chunks = this.data.chunks.filter(c => c.documentId !== id);
        this.save();
    }

    /**
     * Get all chunks
     */
    getChunks() {
        return this.data.chunks;
    }

    /**
     * Get chunks by document ID
     */
    getChunksByDocument(documentId) {
        return this.data.chunks.filter(c => c.documentId === documentId);
    }

    /**
     * Add chunk - batch version to reduce file writes
     */
    addChunk(chunk) {
        this.data.chunks.push(chunk);
        // Don't save on every chunk to reduce writes
        return chunk;
    }

    /**
     * Batch add chunks
     */
    addChunks(chunks) {
        this.data.chunks.push(...chunks);
        this.save();
        return chunks;
    }

    /**
     * Delete chunks by document ID
     */
    deleteChunksByDocument(documentId) {
        this.data.chunks = this.data.chunks.filter(c => c.documentId !== documentId);
        this.save();
    }

    /**
     * Clear all chunks
     */
    clearChunks() {
        this.data.chunks = [];
        this.save();
    }

    /**
     * Clear all documents
     */
    clearDocuments() {
        this.data.documents = [];
        this.data.chunks = [];
        this.save();
    }
}

// Singleton instance
const db = new JSONDatabase();

export default db;
