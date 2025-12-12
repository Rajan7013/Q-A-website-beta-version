/**
 * Streaming Chat Component
 * ChatGPT-style real-time streaming responses
 */

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, FileText } from 'lucide-react';

export default function StreamingChat() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sources, setSources] = useState([]);
  const abortControllerRef = useRef(null);

  const handleStream = async () => {
    if (!query.trim() || isStreaming) return;

    setAnswer('');
    setStatus('Starting...');
    setIsStreaming(true);
    setSources([]);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('http://localhost:5000/api/query/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth
        },
        body: JSON.stringify({
          query,
          documentIds: [], // Add selected document IDs here
          language: 'en'
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Failed to start streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          setIsStreaming(false);
          setStatus('');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          const [eventLine, dataLine] = line.split('\n');
          
          if (!eventLine.startsWith('event:') || !dataLine.startsWith('data:')) {
            continue;
          }

          const event = eventLine.substring(7).trim();
          const data = JSON.parse(dataLine.substring(6));

          switch (event) {
            case 'status':
              setStatus(data.message || '');
              break;

            case 'sources':
              setSources(data.sources || []);
              break;

            case 'token':
              if (data.token) {
                setAnswer(prev => prev + data.token);
              }
              break;

            case 'done':
              setIsStreaming(false);
              setStatus('✅ Complete');
              setTimeout(() => setStatus(''), 2000);
              break;

            case 'error':
              console.error('Streaming error:', data);
              setStatus(`❌ Error: ${data.error}`);
              setIsStreaming(false);
              break;
          }
        }
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        setStatus('Cancelled');
      } else {
        console.error('Streaming error:', error);
        setStatus(`❌ Error: ${error.message}`);
      }
      setIsStreaming(false);
    }
  };

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStatus('Stopped');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Streaming Q&A
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          ChatGPT-style real-time responses from your documents
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleStream()}
            placeholder="Ask anything about your documents..."
            disabled={isStreaming}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
          
          {!isStreaming ? (
            <button
              onClick={handleStream}
              disabled={!query.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                       font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
            >
              <Send size={20} />
              Ask
            </button>
          ) : (
            <button
              onClick={stopStreaming}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg
                       font-medium transition-colors flex items-center gap-2"
            >
              Stop
            </button>
          )}
        </div>

        {/* Status */}
        {status && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            {isStreaming && <Loader2 className="animate-spin" size={16} />}
            {status}
          </div>
        )}
      </div>

      {/* Answer Section */}
      {answer && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText size={24} />
            Answer
          </h2>
          
          <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="mt-4 flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm">Generating...</span>
            </div>
          )}
        </div>
      )}

      {/* Sources Section */}
      {sources.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📚 Sources ({sources.length})
          </h3>
          
          <div className="space-y-2">
            {sources.slice(0, 10).map((source, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {source.documentName}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Page {source.page}
                    </span>
                  </div>
                  
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                    {Math.round(source.relevance * 100)}% relevant
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
