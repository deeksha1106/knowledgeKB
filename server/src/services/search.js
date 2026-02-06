import Chunk from '../models/Chunk.js';
import Document from '../models/Document.js';
import { generateRAGResponse } from './gemini.js';

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    const divisor = Math.sqrt(normA) * Math.sqrt(normB);
    return divisor > 0 ? dotProduct / divisor : 0;
}

/**
 * Generate keyword-based embedding for query (matches seed format)
 */
function generateQueryEmbedding(text) {
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const embedding = new Array(768).fill(0);

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        let hash = 0;
        for (let j = 0; j < word.length; j++) {
            hash = ((hash << 5) - hash) + word.charCodeAt(j);
            hash = hash & hash;
        }
        const idx = Math.abs(hash) % 768;
        embedding[idx] += 1 / Math.sqrt(words.length);
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
        for (let i = 0; i < 768; i++) {
            embedding[i] = embedding[i] / magnitude;
        }
    }

    return embedding;
}

/**
 * Keyword-based scoring as fallback
 */
function keywordScore(query, content) {
    const queryWords = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const contentLower = content.toLowerCase();

    let matches = 0;
    for (const word of queryWords) {
        if (contentLower.includes(word)) matches++;
    }

    return queryWords.length > 0 ? matches / queryWords.length : 0;
}

/**
 * Search for relevant chunks using hybrid similarity
 * @param {string} query - User query
 * @param {number} topK - Number of results to return
 * @returns {Promise<Array>} - Ranked chunks with similarity scores
 */
export async function semanticSearch(query, topK = 5) {
    const queryEmbedding = generateQueryEmbedding(query);
    const chunks = Chunk.findAll();

    // Calculate hybrid scores
    const scoredChunks = chunks.map(chunk => {
        const embeddingSim = cosineSimilarity(queryEmbedding, chunk.embedding);
        const keywordSim = keywordScore(query, chunk.content);

        // Hybrid: keyword matching is more reliable with mock embeddings
        const similarity = (embeddingSim * 0.4) + (keywordSim * 0.6);

        return {
            ...chunk,
            documentTitle: chunk.documentId?.title || 'Unknown',
            documentSource: chunk.documentId?.source || 'Unknown',
            documentCategory: chunk.documentId?.category || 'general',
            similarity
        };
    });

    scoredChunks.sort((a, b) => b.similarity - a.similarity);
    return scoredChunks.slice(0, topK);
}

/**
 * Full RAG pipeline: search + generate response
 */
export async function queryKnowledgeBase(query, topK = 5) {
    console.log(`🔍 Query: "${query}"`);

    const relevantChunks = await semanticSearch(query, topK);

    if (relevantChunks.length === 0) {
        return {
            response: "I don't have any documents in the knowledge base yet. Please run the seed script first.",
            citations: [],
            sources: []
        };
    }

    console.log(`📋 Found ${relevantChunks.length} relevant chunks`);

    // Generate response using Gemini
    const { response, citations } = await generateRAGResponse(query, relevantChunks);

    const sources = relevantChunks.map((chunk, index) => ({
        sourceNumber: index + 1,
        documentId: chunk.documentId?._id || chunk.documentId,
        documentTitle: chunk.documentTitle,
        documentSource: chunk.documentSource,
        category: chunk.documentCategory,
        excerpt: chunk.content.substring(0, 200) + '...',
        similarity: Math.round(chunk.similarity * 100) / 100
    }));

    return { response, citations, sources };
}

/**
 * Get search statistics
 */
export async function getSearchStats() {
    const totalDocuments = Document.count();
    const indexedDocuments = Document.count({ isIndexed: true });
    const totalChunks = Chunk.count();

    return {
        totalDocuments,
        indexedDocuments,
        totalChunks,
        averageChunksPerDocument: indexedDocuments > 0
            ? Math.round(totalChunks / indexedDocuments * 10) / 10
            : 0
    };
}
