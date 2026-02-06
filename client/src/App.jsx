import { useState, useEffect } from 'react';
import './App.css';
import { chatAPI, documentsAPI } from './services/api';
import { useChat } from './hooks/useChat';
import ReactMarkdown from 'react-markdown';

// Icons as simple SVG components
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const DocumentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

const SourceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// Category icon mapping
const getCategoryIcon = (category) => {
    const icons = {
        policy: '📋',
        faq: '❓',
        technical: '⚙️',
        onboarding: '🚀',
        security: '🔒',
        general: '📄'
    };
    return icons[category] || '📄';
};

// Document Viewer Modal Component
function DocumentViewer({ document, onClose }) {
    if (!document) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-section">
                        <span className="modal-icon">{getCategoryIcon(document.category)}</span>
                        <div>
                            <h2 className="modal-title">{document.title}</h2>
                            <div className="modal-meta">
                                <span className="modal-category">{document.category}</span>
                                <span className="modal-source">Source: {document.source}</span>
                                {document.chunkCount > 0 && (
                                    <span className="modal-chunks">{document.chunkCount} chunks indexed</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <CloseIcon />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="document-content">
                        <ReactMarkdown>{document.content}</ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main App Component
function App() {
    const [activeView, setActiveView] = useState('chat');
    const [stats, setStats] = useState({ totalDocuments: 0, indexedDocuments: 0, totalChunks: 0 });
    const [documents, setDocuments] = useState([]);
    const [input, setInput] = useState('');
    const [selectedDocument, setSelectedDocument] = useState(null);
    const { messages, isLoading, sendMessage, clearMessages } = useChat();

    // Load initial data
    useEffect(() => {
        loadStats();
        loadDocuments();
    }, []);

    const loadStats = async () => {
        try {
            const data = await chatAPI.getStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    const loadDocuments = async () => {
        try {
            const data = await documentsAPI.getAll();
            setDocuments(data);
        } catch (err) {
            console.error('Failed to load documents:', err);
        }
    };

    const handleSend = () => {
        if (input.trim() && !isLoading) {
            sendMessage(input);
            setInput('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setInput(suggestion);
        sendMessage(suggestion);
    };

    const handleDocumentClick = (doc) => {
        setSelectedDocument(doc);
    };

    const suggestions = [
        "What is the remote work policy?",
        "How do I set up my development environment?",
        "What are the security best practices?",
        "Tell me about the onboarding process"
    ];

    return (
        <div className="app">
            {/* Document Viewer Modal */}
            {selectedDocument && (
                <DocumentViewer
                    document={selectedDocument}
                    onClose={() => setSelectedDocument(null)}
                />
            )}

            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">KB</div>
                    <div>
                        <div className="sidebar-title">KB Copilot</div>
                        <div className="sidebar-subtitle">Knowledge Assistant</div>
                    </div>
                </div>

                <nav className="nav-section">
                    <div className="nav-section-title">Navigation</div>
                    <div
                        className={`nav-item ${activeView === 'chat' ? 'active' : ''}`}
                        onClick={() => setActiveView('chat')}
                    >
                        <ChatIcon />
                        <span>Chat</span>
                    </div>
                    <div
                        className={`nav-item ${activeView === 'documents' ? 'active' : ''}`}
                        onClick={() => setActiveView('documents')}
                    >
                        <DocumentIcon />
                        <span>Documents</span>
                    </div>
                </nav>

                <div className="stats-card">
                    <div className="stats-card-title">Knowledge Base</div>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-value">{stats.indexedDocuments}</div>
                            <div className="stat-label">Documents</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{stats.totalChunks}</div>
                            <div className="stat-label">Chunks</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Header */}
                <header className="header">
                    <h1 className="header-title">
                        {activeView === 'chat' ? 'Ask anything about our knowledge base' : 'Document Library'}
                    </h1>
                    <div className="header-actions">
                        {activeView === 'chat' && messages.length > 0 && (
                            <button className="btn btn-secondary" onClick={clearMessages}>
                                Clear Chat
                            </button>
                        )}
                    </div>
                </header>

                {/* Chat View */}
                {activeView === 'chat' && (
                    <>
                        <div className="chat-container">
                            {messages.length === 0 ? (
                                <div className="chat-welcome">
                                    <div className="chat-welcome-icon">🤖</div>
                                    <h2>Welcome to KB Copilot</h2>
                                    <p>
                                        I'm your AI-powered knowledge base assistant. Ask me anything about company policies,
                                        product documentation, security guidelines, and more. All my answers are grounded in
                                        our internal documents with cited sources.
                                    </p>
                                    <div className="suggestions">
                                        {suggestions.map((suggestion, index) => (
                                            <button
                                                key={index}
                                                className="suggestion-chip"
                                                onClick={() => handleSuggestionClick(suggestion)}
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div key={message.id} className={`message ${message.role}`}>
                                        <div className="message-avatar">
                                            {message.role === 'assistant' ? '🤖' : '👤'}
                                        </div>
                                        <div className="message-content">
                                            <div className="message-bubble">
                                                <ReactMarkdown>{message.content}</ReactMarkdown>
                                            </div>
                                            {message.citations && message.citations.length > 0 && (
                                                <div className="citations">
                                                    <div className="citations-title">
                                                        <SourceIcon />
                                                        <span>Sources ({message.citations.length})</span>
                                                    </div>
                                                    {message.citations.map((citation, idx) => (
                                                        <div key={idx} className="citation-card">
                                                            <div className="citation-header">
                                                                <span className="citation-number">{citation.sourceNumber}</span>
                                                                <span className="citation-title">{citation.documentTitle}</span>
                                                            </div>
                                                            <div className="citation-excerpt">{citation.excerpt}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            {isLoading && (
                                <div className="message assistant">
                                    <div className="message-avatar">🤖</div>
                                    <div className="message-content">
                                        <div className="loading-message">
                                            <div className="loading-dots">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                            <span>Searching knowledge base...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Chat Input */}
                        <div className="chat-input-container">
                            <div className="chat-input-wrapper">
                                <textarea
                                    className="chat-input"
                                    placeholder="Ask a question about the knowledge base..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    rows={1}
                                />
                                <button
                                    className="send-button"
                                    onClick={handleSend}
                                    disabled={!input.trim() || isLoading}
                                >
                                    <SendIcon />
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Documents View */}
                {activeView === 'documents' && (
                    <div className="documents-panel">
                        <div className="documents-header">
                            <h2>Indexed Documents</h2>
                            <button className="btn btn-primary" onClick={loadDocuments}>
                                Refresh
                            </button>
                        </div>

                        <p className="documents-hint">Click on a document to view its full content</p>

                        {documents.length === 0 ? (
                            <div className="chat-welcome">
                                <div className="chat-welcome-icon">📚</div>
                                <h2>No Documents Yet</h2>
                                <p>Run the seed script to load mock documents into the knowledge base.</p>
                            </div>
                        ) : (
                            <div className="documents-grid">
                                {documents.map((doc) => (
                                    <div
                                        key={doc._id}
                                        className="document-card clickable"
                                        onClick={() => handleDocumentClick(doc)}
                                    >
                                        <div className="document-icon">
                                            {getCategoryIcon(doc.category)}
                                        </div>
                                        <div className="document-title">{doc.title}</div>
                                        <div className="document-meta">
                                            <span className="document-category">{doc.category}</span>
                                            <span className="document-status">
                                                <span className={`status-dot ${doc.isIndexed ? 'indexed' : 'pending'}`}></span>
                                                {doc.isIndexed ? 'Indexed' : 'Pending'}
                                            </span>
                                            {doc.chunkCount > 0 && (
                                                <span>{doc.chunkCount} chunks</span>
                                            )}
                                        </div>
                                        <div className="view-document-hint">Click to view content →</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
