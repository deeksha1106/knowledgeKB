#!/usr/bin/env node
/**
 * Standalone seed script - CommonJS format
 * Run with: node src/scripts/seed-standalone.cjs
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Paths
const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'database.json');
const mockDocsDir = path.join(dataDir, 'mock-docs');

// Mock documents configuration
const mockDocs = [
    { filename: 'company-policies.md', title: 'Company Policies & Guidelines', category: 'policy' },
    { filename: 'product-faq.md', title: 'TechFlow Product FAQ', category: 'faq' },
    { filename: 'technical-guide.md', title: 'TechFlow API Documentation', category: 'technical' },
    { filename: 'onboarding.md', title: 'New Employee Onboarding Guide', category: 'onboarding' },
    { filename: 'security-guidelines.md', title: 'Security Guidelines & Best Practices', category: 'security' }
];

// Generate UUID
function uuid() {
    return crypto.randomUUID();
}

// Chunk text
function chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
        let end = Math.min(start + chunkSize, text.length);

        // Try to find a good break point
        if (end < text.length) {
            const breakPoints = ['\n\n', '\n', '. ', ', ', ' '];
            for (const bp of breakPoints) {
                const idx = text.lastIndexOf(bp, end);
                if (idx > start + chunkSize * 0.5) {
                    end = idx + bp.length;
                    break;
                }
            }
        }

        chunks.push({
            content: text.substring(start, end),
            startOffset: start,
            endOffset: end
        });

        start = end - overlap;
        if (start >= text.length) break;
        if (end === text.length) break;
    }

    return chunks;
}

// Generate keyword-based embedding
function generateEmbedding(text) {
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
    const mag = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
    if (mag > 0) {
        for (let i = 0; i < 768; i++) embedding[i] /= mag;
    }

    return embedding;
}

// Main seed function
function seed() {
    console.log('🌱 Starting database seed (CommonJS)...\n');

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize database
    const db = { documents: [], chunks: [] };

    let totalChunks = 0;

    for (const docConfig of mockDocs) {
        const filePath = path.join(mockDocsDir, docConfig.filename);

        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File not found: ${docConfig.filename}`);
            continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const docId = uuid();

        // Create document
        const document = {
            id: docId,
            _id: docId,
            title: docConfig.title,
            content: content,
            source: docConfig.filename,
            category: docConfig.category,
            metadata: {},
            isIndexed: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        db.documents.push(document);
        console.log(`📄 ${docConfig.title}`);

        // Chunk and embed
        const textChunks = chunkText(content);
        console.log(`   📦 ${textChunks.length} chunks`);

        for (let i = 0; i < textChunks.length; i++) {
            const chunk = textChunks[i];
            const chunkId = `${docId}-${i}`;

            db.chunks.push({
                id: chunkId,
                _id: chunkId,
                documentId: docId,
                content: chunk.content,
                embedding: generateEmbedding(chunk.content),
                chunkIndex: i,
                startOffset: chunk.startOffset,
                endOffset: chunk.endOffset,
                createdAt: new Date().toISOString()
            });

            totalChunks++;
        }
    }

    // Save database
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    console.log(`
╔══════════════════════════════════════════════════╗
║   ✅ Seed Complete!                              ║
║   📚 Documents: ${db.documents.length}                                ║
║   📦 Chunks: ${totalChunks}                                 ║
║   💾 Database: ${path.basename(dbPath)}                     ║
╚══════════════════════════════════════════════════╝
  `);
}

seed();
