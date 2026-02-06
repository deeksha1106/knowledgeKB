import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import { chunkText } from './chunker.js';
import { generateEmbedding } from './gemini.js';

/**
 * Ingest and index a document
 * @param {string} documentId - Document ID
 * @returns {Promise<{chunksCreated: number}>}
 */
export async function indexDocument(documentId) {
    const document = Document.findById(documentId);
    if (!document) {
        throw new Error('Document not found');
    }

    // Delete existing chunks for this document (re-indexing)
    Chunk.deleteByDocumentId(document.id);

    // Chunk the document content
    const chunks = chunkText(document.content);
    console.log(`📄 Processing "${document.title}": ${chunks.length} chunks`);

    // Generate embeddings and save chunks
    let chunksCreated = 0;

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        try {
            // Generate embedding for this chunk
            const embedding = await generateEmbedding(chunk.content);

            // Save chunk with embedding
            Chunk.create({
                documentId: document.id,
                content: chunk.content,
                embedding,
                chunkIndex: i,
                startOffset: chunk.startOffset,
                endOffset: chunk.endOffset
            });

            chunksCreated++;

            // Rate limiting - small delay between API calls
            if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (error) {
            console.error(`Error processing chunk ${i}:`, error.message);
            throw error;
        }
    }

    // Mark document as indexed
    Document.update(document.id, { isIndexed: true });

    console.log(`✅ Indexed "${document.title}": ${chunksCreated} chunks created`);

    return { chunksCreated };
}

/**
 * Create a new document from text
 */
export async function createDocument({ title, content, source, category, metadata }) {
    const document = Document.create({
        title,
        content,
        source: source || title,
        category: category || 'general',
        metadata: metadata || {}
    });

    return document;
}

/**
 * Index all unindexed documents
 */
export async function indexAllDocuments() {
    const documents = Document.findAll({ where: { isIndexed: false } });
    console.log(`📚 Found ${documents.length} documents to index`);

    const results = [];
    for (const doc of documents) {
        try {
            const result = await indexDocument(doc.id);
            results.push({ documentId: doc.id, title: doc.title, ...result });
        } catch (error) {
            results.push({ documentId: doc.id, title: doc.title, error: error.message });
        }
    }

    return results;
}
