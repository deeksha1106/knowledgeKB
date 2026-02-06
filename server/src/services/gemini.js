import 'dotenv/config';

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing");
}

const API_KEY = process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Generate embeddings for text using Gemini REST API
 * @param {string} text - Text to generate embeddings for
 * @returns {Promise<number[]>} - Embedding vector
 */
export async function generateEmbedding(text) {
    const url = `${BASE_URL}/models/text-embedding-004:embedContent?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: {
                    parts: [{ text }]
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Embedding API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.embedding.values;
    } catch (error) {
        console.error('Embedding generation error:', error.message);
        throw error;
    }
}

/**
 * Generate a RAG response using Gemini REST API
 * @param {string} query - User's question
 * @param {Array} relevantChunks - Retrieved context chunks
 * @returns {Promise<{response: string, citations: Array}>}
 */
export async function generateRAGResponse(query, relevantChunks) {
    const url = `${BASE_URL}/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    // Build context from relevant chunks
    const context = relevantChunks
        .map((chunk, i) => `[Source ${i + 1}: ${chunk.documentTitle}]\n${chunk.content}`)
        .join('\n\n---\n\n');

    const prompt = `You are a helpful knowledge base assistant. Answer the user's question based ONLY on the provided context. If the answer is not in the context, say so politely.

Always cite your sources using [Source N] format when using information from the context.

CONTEXT:
${context}

USER QUESTION: ${query}

INSTRUCTIONS:
1. Answer based ONLY on the provided context
2. Cite sources using [Source N] format
3. If unsure or info not in context, say so
4. Be concise but complete
5. Format response in markdown

ANSWER:`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Generation API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Extract citations from response
        const citationMatches = text.match(/\[Source \d+\]/g) || [];
        const citations = [...new Set(citationMatches)].map(citation => {
            const num = parseInt(citation.match(/\d+/)[0]);
            const chunk = relevantChunks[num - 1];
            return chunk ? {
                sourceNumber: num,
                documentTitle: chunk.documentTitle,
                documentSource: chunk.documentSource
            } : null;
        }).filter(Boolean);

        return { response: text, citations };
    } catch (error) {
        console.error('RAG generation error:', error.message);
        throw error;
    }
}
