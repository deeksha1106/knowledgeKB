# AI Knowledge Base & Customer Service Copilot

A production-ready knowledge base assistant that indexes internal documents and provides AI-powered responses with clearly cited sources. Built with the MERN stack and Google's Gemini API.

![KB Copilot](https://via.placeholder.com/800x400?text=KB+Copilot+Demo)

## ✨ Features

- **📚 Document Ingestion**: Upload and index internal documents with automatic text chunking
- **🔍 Semantic Search**: Find relevant information using natural language queries
- **🤖 AI-Powered Responses**: Get accurate answers grounded in your knowledge base
- **📎 Source Citations**: Every response includes clearly cited sources
- **🎨 Modern UI**: Dark theme with glassmorphism effects and smooth animations
- **⚡ Real-time**: Instant responses with loading indicators

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Chat UI      │  │ Documents    │  │ Citations    │       │
│  │ Component    │  │ Manager      │  │ Display      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js Backend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Document     │  │ RAG Pipeline │  │ Gemini API   │       │
│  │ Ingestion    │  │ & Search     │  │ Integration  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        MongoDB                               │
│  ┌──────────────────┐  ┌───────────────────────────┐        │
│  │   Documents      │  │  Chunks + Embeddings      │        │
│  └──────────────────┘  └───────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- Gemini API Key

### 1. Clone and Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kb-copilot
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start MongoDB

```bash
# If using local MongoDB
mongod
```

### 4. Seed the Database

```bash
cd server
npm run seed
```

This loads 5 mock documents and generates embeddings for them.

### 5. Start the Application

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev
```

### 6. Open the App

Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 API Documentation

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/documents` | List all documents |
| `GET` | `/api/documents/:id` | Get document details |
| `POST` | `/api/documents` | Create new document |
| `POST` | `/api/documents/:id/index` | Index a document |
| `DELETE` | `/api/documents/:id` | Delete document |
| `POST` | `/api/chat` | Query the knowledge base |
| `GET` | `/api/chat/stats` | Get KB statistics |

### Example: Query the Knowledge Base

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the remote work policy?"}'
```

Response:
```json
{
  "query": "What is the remote work policy?",
  "response": "Based on our company policies [Source 1], all full-time employees who have completed their probation period (90 days) are eligible for remote work...",
  "citations": [
    {
      "sourceNumber": 1,
      "documentTitle": "Company Policies & Guidelines",
      "excerpt": "All full-time employees who have completed..."
    }
  ],
  "sources": [...]
}
```

## 📁 Project Structure

```
├── server/                 # Express.js backend
│   ├── src/
│   │   ├── index.js       # Entry point
│   │   ├── config/        # Database configuration
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   │   ├── gemini.js  # Gemini API integration
│   │   │   ├── chunker.js # Text chunking
│   │   │   ├── ingestion.js # Document processing
│   │   │   └── search.js  # Semantic search & RAG
│   │   └── middleware/    # Express middleware
│   └── data/mock-docs/    # Sample documents
│
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main component
│   │   ├── App.css        # Component styles
│   │   ├── index.css      # Global styles
│   │   ├── hooks/         # Custom React hooks
│   │   └── services/      # API client
│   └── public/            # Static assets
│
└── DECISIONS.md           # Architecture decisions
```

## 🧪 Testing

### Try These Queries

1. "What is the remote work policy?"
2. "How do I create my first project in TechFlow?"
3. "What are the password requirements?"
4. "Tell me about the onboarding process for new employees"
5. "What happens if I discover a security incident?"

## 📝 Mock Documents

The seed script loads these documents:

| Document | Content |
|----------|---------|
| `company-policies.md` | HR policies, PTO, remote work |
| `product-faq.md` | TechFlow product questions |
| `technical-guide.md` | API documentation |
| `onboarding.md` | New employee guide |
| `security-guidelines.md` | Security best practices |

## 🔧 Tech Stack

- **Frontend**: React, Vite, CSS3 (custom design system)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini API (embeddings + generation)
- **RAG**: Custom implementation with cosine similarity

## 📄 License

MIT
