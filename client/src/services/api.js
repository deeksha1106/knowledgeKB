const API_BASE = '/api';

/**
 * Fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
}

/**
 * Chat API
 */
export const chatAPI = {
    // Send a query to the knowledge base
    query: async (query, topK = 5) => {
        return fetchAPI('/chat', {
            method: 'POST',
            body: JSON.stringify({ query, topK })
        });
    },

    // Get knowledge base statistics
    getStats: async () => {
        return fetchAPI('/chat/stats');
    }
};

/**
 * Documents API
 */
export const documentsAPI = {
    // Get all documents
    getAll: async () => {
        return fetchAPI('/documents');
    },

    // Get single document
    getById: async (id) => {
        return fetchAPI(`/documents/${id}`);
    },

    // Create new document
    create: async (data) => {
        return fetchAPI('/documents', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Index a document
    index: async (id) => {
        return fetchAPI(`/documents/${id}/index`, {
            method: 'POST'
        });
    },

    // Index all unindexed documents
    indexAll: async () => {
        return fetchAPI('/documents/index-all', {
            method: 'POST'
        });
    },

    // Delete document
    delete: async (id) => {
        return fetchAPI(`/documents/${id}`, {
            method: 'DELETE'
        });
    }
};

/**
 * Health check
 */
export const healthAPI = {
    check: async () => {
        return fetchAPI('/health');
    }
};
