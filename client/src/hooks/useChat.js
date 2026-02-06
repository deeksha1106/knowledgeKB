import { useState, useCallback } from 'react';
import { chatAPI } from '../services/api';

/**
 * Custom hook for chat functionality
 */
export function useChat() {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const sendMessage = useCallback(async (query) => {
        if (!query.trim()) return;

        // Add user message
        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: query,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setError(null);

        try {
            const response = await chatAPI.query(query);

            // Add assistant message
            const assistantMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: response.response,
                citations: response.citations || [],
                sources: response.sources || [],
                timestamp: response.timestamp
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            setError(err.message);

            // Add error message
            const errorMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: `I'm sorry, I encountered an error: ${err.message}. Please try again.`,
                isError: true,
                timestamp: new Date().toISOString()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearMessages
    };
}
