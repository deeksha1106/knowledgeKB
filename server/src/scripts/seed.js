import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/db.js';
import Document from '../models/Document.js';
import { chunkText } from '../services/chunker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock documents configuration
const mockDocs = [
    {
        filename: 'company-policies.md',
        title: 'Company Policies & Guidelines',
        category: 'policy'
    },
    {
        filename: 'product-faq.md',
        title: 'TechFlow Product FAQ',
        category: 'faq'
    },
    {
        filename: 'technical-guide.md',
        title: 'TechFlow API Documentation',
        category: 'technical'
    },
    {
        filename: 'onboarding.md',
        title: 'New Employee Onboarding Guide',
        category: 'onboarding'
    },
    {
        filename: 'security-guidelines.md',
        title: 'Security Guidelines & Best Practices',
        category: 'security'
    }
];

/**
 * Generate keyword-based mock embedding
 * Creates a consistent embedding based on word frequencies
 */
function generateMockEmbedding(text) {
    // Use word frequencies to create a deterministic embedding
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
    const embedding = new Array(768).fill(0);

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        // Hash the word to get consistent positions
        let hash = 0;
        for (let j = 0; j < word.length; j++) {
            hash = ((hash << 5) - hash) + word.charCodeAt(j);
            hash = hash & hash; // Convert to 32-bit integer
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

function seed() {
    console.log('🌱 Starting database seed...\n');
    console.log('📝 Using keyword-based embeddings (no API calls)\n');

    try {
        // Initialize database
        db.init();

        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        db.clearDocuments();

        // Load and create documents
        const mockDocsDir = path.join(__dirname, '../../data/mock-docs');
        let totalChunks = 0;

        for (const docConfig of mockDocs) {
            const filePath = path.join(mockDocsDir, docConfig.filename);

            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  File not found: ${docConfig.filename}`);
                continue;
            }

            const content = fs.readFileSync(filePath, 'utf-8');

            // Create document
            const document = Document.create({
                title: docConfig.title,
                content,
                source: docConfig.filename,
                category: docConfig.category,
                isIndexed: false
            });

            console.log(`📄 Created: ${docConfig.title}`);

            // Chunk the document
            const textChunks = chunkText(content);
            console.log(`   📦 ${textChunks.length} chunks`);

            // Create all chunks for this document
            const chunksToAdd = textChunks.map((chunk, i) => ({
                id: `${document.id}-${i}`,
                _id: `${document.id}-${i}`,
                documentId: document.id,
                content: chunk.content,
                embedding: generateMockEmbedding(chunk.content),
                chunkIndex: i,
                startOffset: chunk.startOffset,
                endOffset: chunk.endOffset,
                createdAt: new Date().toISOString()
            }));

            // Batch add chunks
            db.addChunks(chunksToAdd);
            totalChunks += chunksToAdd.length;

            // Mark document as indexed
            Document.update(document.id, { isIndexed: true });
        }

        // Summary
        const docCount = Document.count();
        const indexedCount = Document.count({ isIndexed: true });

        console.log(`
╔══════════════════════════════════════════════════╗
║   ✅ Seed Complete!                              ║
║   📚 Documents: ${docCount}                                ║
║   🔖 Indexed: ${indexedCount}                                  ║
║   📦 Chunks: ${totalChunks}                                 ║
║   💾 Database: JSON File                         ║
║   🔍 Embeddings: Keyword-based                   ║
╚══════════════════════════════════════════════════╝
    `);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seed();
