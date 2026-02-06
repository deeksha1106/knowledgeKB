# Architecture Decision Document

This document explains the key architectural decisions, trade-offs, and rationale for the KB Copilot implementation.

## 1. Technology Stack

### Decision: MERN Stack (MongoDB, Express, React, Node.js)

**Context**: The assignment required building a knowledge base assistant with document ingestion and AI-powered responses.

**Decision**: Use the MERN stack as specified by the user.

**Rationale**:
- **MongoDB**: Ideal for document-based data; flexible schema allows storing varied document types
- **Express.js**: Lightweight and flexible; easy to build RESTful APIs
- **React**: Modern component-based architecture; excellent for interactive UIs
- **Node.js**: JavaScript throughout the stack; async I/O ideal for API calls

**Trade-offs**:
- MongoDB's lack of vector search capabilities means we use in-memory cosine similarity (fine for small datasets)
- For production, would consider using a dedicated vector database (Pinecone, Weaviate) or MongoDB Atlas Vector Search

---

## 2. RAG (Retrieval Augmented Generation) Pipeline

### Decision: Custom RAG Implementation

**Context**: Need to provide grounded, source-backed responses from the knowledge base.

**Design**:
```
Query → Embed → Semantic Search → Top-K Chunks → LLM with Context → Response + Citations
```

**Key Parameters**:
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Chunk Size | 1000 chars | ~500 tokens; balance between context and granularity |
| Chunk Overlap | 200 chars | Preserves context across boundaries |
| Top-K Results | 5 | Provides sufficient context without overwhelming the LLM |

**Rationale**:
- Chunking with overlap prevents information loss at boundaries
- Semantic search finds relevant content regardless of keyword matching
- Including source numbers in LLM prompt enables proper citation

**Trade-offs**:
- In-memory search doesn't scale beyond ~100k chunks
- Fixed chunk size may split mid-sentence in edge cases
- Could add re-ranking step for improved relevance

---

## 3. Embedding Strategy

### Decision: Gemini text-embedding-004

**Context**: Need to generate embeddings for semantic search.

**Rationale**:
- Native integration with provided Gemini API key
- 768-dimensional vectors provide good semantic representation
- Fast and cost-effective for batch embedding

**Trade-offs**:
- Embedding API calls add latency during ingestion
- Added rate limiting (100ms delay) to avoid quota issues
- Could batch embeddings for efficiency in production

---

## 4. Citation System

### Decision: Source Numbers in LLM Prompt

**Context**: Responses must include clearly cited sources.

**Implementation**:
1. Format context chunks with `[Source N]` prefixes
2. Prompt instructs LLM to cite using `[Source N]` format
3. Parse response to extract cited source indices
4. Return citation metadata with response

**Rationale**:
- Simple, reliable approach that works with any LLM
- Easy for users to understand source references
- Enables expandable source cards in UI

**Trade-offs**:
- LLM may occasionally miss citations or cite incorrectly
- No automatic fact-checking of citations
- Could add verification step comparing response to sources

---

## 5. Frontend Architecture

### Decision: Single Page Application with Custom CSS

**Context**: Need an interactive UI for chat and document management.

**Design Choices**:
- **No CSS Framework**: Custom design system for unique look and feel
- **Dark Theme**: Modern, professional appearance; reduces eye strain
- **Glassmorphism**: Trendy visual style with depth and layering
- **Component-based**: Modular React components for maintainability

**Rationale**:
- Custom CSS allows precise control over aesthetics
- Dark theme is preferred for developer tools
- Animations provide feedback and polish

**Trade-offs**:
- More initial CSS work than using Tailwind/Bootstrap
- Must maintain custom design system
- Could extract to component library for reuse

---

## 6. Database Schema Design

### Decision: Separate Documents and Chunks Collections

**Document Schema**:
```javascript
{
  title: String,
  content: String,
  source: String,
  category: String,
  isIndexed: Boolean
}
```

**Chunk Schema**:
```javascript
{
  documentId: ObjectId,
  content: String,
  embedding: [Number],
  chunkIndex: Number,
  startOffset: Number,
  endOffset: Number
}
```

**Rationale**:
- Separation of concerns: documents vs search index
- Easy to re-index without modifying source documents
- Chunk offsets enable highlighting in original document

**Trade-offs**:
- Requires JOIN-like operations (populated queries)
- More storage for embedding arrays
- Could use separate vector store in production

---

## 7. Error Handling

### Decision: Graceful Degradation with User Feedback

**Implementation**:
- Global Express error handler
- Specific error types (validation, not found, API errors)
- User-friendly error messages in UI
- Fallback responses when AI fails

**Rationale**:
- Users should always receive feedback
- Errors shouldn't crash the application
- Logging enables debugging

---

## 8. Security Considerations

### Decision: API Key in Environment Variables

**Current**:
- Gemini API key stored in `.env` file
- `.env` excluded from git via `.gitignore`
- CORS enabled for development

**Production Recommendations**:
- Use secrets manager (AWS Secrets Manager, HashiCorp Vault)
- Implement rate limiting on API endpoints
- Add authentication/authorization
- Enable HTTPS
- Sanitize user inputs
- Add request validation middleware

---

## 9. Scalability Considerations

### Current Limitations

| Component | Limitation | Production Solution |
|-----------|------------|---------------------|
| Vector Search | In-memory | Use Pinecone, Weaviate, or MongoDB Atlas Vector Search |
| File Storage | Not implemented | Use S3 or cloud storage |
| Caching | None | Add Redis for query caching |
| Load Balancing | Single server | Use Kubernetes or PM2 cluster |

### Recommended Improvements

1. **Vector Database**: Move embeddings to dedicated vector store
2. **Caching Layer**: Cache frequent queries and embeddings
3. **Queue System**: Use Bull/BeeQueue for document processing
4. **CDN**: Serve static assets from CDN
5. **Monitoring**: Add observability (Datadog, New Relic)

---

## 10. Testing Strategy

### Current: Manual Testing

**Recommended Additions**:
- Unit tests for chunking and search logic
- Integration tests for API endpoints
- E2E tests with Playwright/Cypress
- Load testing with k6 or Artillery

---

## Summary

This implementation prioritizes:
1. **Simplicity**: Minimal dependencies, clear code structure
2. **User Experience**: Modern UI, source citations, loading states
3. **Correctness**: RAG grounding, proper error handling
4. **Extensibility**: Modular design, separation of concerns

The architecture is suitable for a demo/prototype. For production, focus on vector database integration, caching, and observability.
