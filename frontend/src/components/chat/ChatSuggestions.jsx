import React from 'react';
import { Sparkles, X, Lightbulb } from 'lucide-react';

const ChatSuggestions = ({ uploadedDocs, chatContext, onSuggestionClick, onClose }) => {
    const getSuggestedQuestions = () => {
        const hasDocuments = uploadedDocs.filter(d => d.status === 'processed').length > 0;

        if (!hasDocuments) {
            return [
                "What can you help me with?",
                "How do I upload documents?",
                "Can you explain any topic?",
                "Tell me about your features"
            ];
        }

        // Document-based suggestions
        const docCount = uploadedDocs.filter(d => d.status === 'processed').length;
        const docNames = uploadedDocs
            .filter(d => d.status === 'processed')
            .map(d => d.name.replace(/\.[^/.]+$/, '')) // Remove extension
            .slice(0, 2);

        const suggestions = [
            `Summarize the key points from ${docNames[0] || 'my document'}`,
            `What are the main topics in ${docCount > 1 ? 'these documents' : 'this document'}?`,
            `Explain the important concepts from ${docNames[0] || 'the document'}`,
            "Create practice questions from the documents",
            "What should I focus on for exam preparation?",
            "Compare the main ideas across documents"
        ];

        // Context-based suggestions
        if (chatContext?.topic) {
            suggestions.unshift(`Tell me more about ${chatContext.topic}`);
            suggestions.push(`Give me examples related to ${chatContext.topic}`);
        }

        return suggestions.slice(0, 6);
    };

    return (
        <div className="mt-3 p-3 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-300" />
                <span className="text-sm font-bold text-purple-200">Suggested Questions</span>
                <button
                    onClick={onClose}
                    className="ml-auto p-1 hover:bg-white/10 rounded transition-colors"
                >
                    <X className="w-3 h-3 text-gray-400" />
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {getSuggestedQuestions().map((question, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSuggestionClick(question)}
                        className="text-left text-xs sm:text-sm p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-purple-500/50 transition-all text-gray-200 hover:text-white active:scale-95"
                    >
                        <Lightbulb className="w-3 h-3 inline mr-1 text-yellow-400" />
                        {question}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ChatSuggestions;
