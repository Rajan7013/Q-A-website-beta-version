import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Brain, FileCheck, Volume2, VolumeX, Pause, Play, Loader, ExternalLink } from 'lucide-react';
import { getDocumentUrl } from '../../utils/api';

const ChatMessage = ({
    msg,
    msgIndex,
    searchQuery,
    searchResults,
    currentSearchIndex,
    speakingMessageId,
    isPaused,
    onSpeak,
    onPause,
    onResume,
    onStop
}) => {

    // Highlight search matches
    const highlightText = (text) => {
        if (!searchQuery?.trim() || !searchResults?.length) return text;

        const parts = [];
        const lowerText = text.toLowerCase();
        const lowerQuery = searchQuery.toLowerCase();
        let lastIndex = 0;
        let index = lowerText.indexOf(lowerQuery);

        while (index !== -1) {
            // Add text before match
            if (index > lastIndex) {
                parts.push(text.substring(lastIndex, index));
            }

            // Add highlighted match
            const matchText = text.substring(index, index + searchQuery.length);
            const isCurrentMatch = searchResults[currentSearchIndex]?.msgIndex === msgIndex &&
                searchResults[currentSearchIndex]?.textIndex === index;

            parts.push(
                <mark
                    key={`match-${index}`}
                    className={isCurrentMatch ? 'bg-yellow-400 text-black font-bold' : 'bg-yellow-200 text-black'}
                >
                    {matchText}
                </mark>
            );

            lastIndex = index + searchQuery.length;
            index = lowerText.indexOf(lowerQuery, lastIndex);
        }

        // Add remaining text
        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return parts;
    };

    const handleSourceClick = async (source) => {
        const docId = source.documentId || source.document_id || source.id;
        if (!docId) {
            console.warn('No document ID found in source', source);
            return;
        }

        try {
            const url = await getDocumentUrl(docId);
            if (url) {
                window.open(url, '_blank');
            }
        } catch (error) {
            console.error('Failed to open source document:', error);
        }
    };

    return (
        <div
            id={`message-${msgIndex}`}
            className={`flex items-start gap-1.5 sm:gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
        >
            <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg ${msg.type === 'user' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-cyan-400'}`}>
                {msg.type === 'user' ? <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" /> : <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
            </div>

            <div className={`p-3 rounded-2xl shadow-xl max-w-[95%] md:max-w-4xl ${msg.type === 'user' ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                <div className="prose prose-invert max-w-none text-base">
                    {msg.type === 'user' ? (
                        searchQuery ? highlightText(msg.text) : msg.text
                    ) : (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mb-4 mt-6 text-purple-300 border-b border-purple-500/30 pb-2" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mb-3 mt-5 text-purple-300" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-xl font-bold mb-2 mt-4 text-purple-400" {...props} />,
                                h4: ({ node, ...props }) => <h4 className="text-lg font-bold mb-2 mt-3 text-purple-400" {...props} />,
                                p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-gray-100 text-base" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                                em: ({ node, ...props }) => <em className="italic text-gray-300" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-none space-y-2 mb-4 ml-2" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-none space-y-2 mb-4 ml-2" {...props} />,
                                li: ({ node, ordered, index, ...props }) => (
                                    <li className="flex items-start gap-3 text-gray-100" {...props}>
                                        <span className="text-gray-400 font-normal mt-1 select-none">•</span>
                                        <span className="flex-1 leading-relaxed">{props.children}</span>
                                    </li>
                                ),
                                code: ({ node, inline, ...props }) =>
                                    inline ? (
                                        <code className="bg-gray-700/50 text-purple-300 px-2 py-0.5 rounded text-sm font-mono" {...props} />
                                    ) : (
                                        <code className="block bg-gray-900/50 text-purple-200 p-4 rounded-lg my-4 overflow-x-auto font-mono text-sm border border-purple-500/20" {...props} />
                                    ),
                                blockquote: ({ node, ...props }) => (
                                    <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-4 italic text-gray-300 bg-purple-500/5" {...props} />
                                ),
                                hr: ({ node, ...props }) => <hr className="border-purple-500/30 my-6" {...props} />,
                                a: ({ node, ...props }) => <a className="text-purple-400 hover:text-purple-300 underline" {...props} />,
                                table: ({ node, ...props }) => <table className="w-full border-collapse my-4" {...props} />,
                                th: ({ node, ...props }) => <th className="border border-purple-500/30 bg-purple-500/20 px-4 py-2 text-left font-bold" {...props} />,
                                td: ({ node, ...props }) => <td className="border border-purple-500/30 px-4 py-2" {...props} />,
                            }}
                        >
                            {msg.text}
                        </ReactMarkdown>
                    )}
                </div>

                {/* Metadata & Actions */}
                <div className="text-[10px] sm:text-xs text-gray-400 mt-2 sm:mt-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                            <span>{msg.time}</span>
                            {msg.type === 'bot' && (
                                <div className="flex items-center gap-1">
                                    {speakingMessageId === msg.id && !isPaused ? (
                                        <>
                                            <button onClick={onPause} className="p-1 hover:bg-white/10 rounded transition-colors" title="Pause">
                                                <Pause className="w-4 h-4 text-purple-400" />
                                            </button>
                                            <button onClick={onStop} className="p-1 hover:bg-white/10 rounded transition-colors" title="Stop">
                                                <VolumeX className="w-4 h-4 text-red-400" />
                                            </button>
                                        </>
                                    ) : speakingMessageId === msg.id && isPaused ? (
                                        <>
                                            <button onClick={onResume} className="p-1 hover:bg-white/10 rounded transition-colors" title="Resume">
                                                <Play className="w-4 h-4 text-green-400 animate-pulse" />
                                            </button>
                                            <button onClick={onStop} className="p-1 hover:bg-white/10 rounded transition-colors" title="Stop">
                                                <VolumeX className="w-4 h-4 text-red-400" />
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => onSpeak(msg.id, msg.text)} className="p-1 hover:bg-white/10 rounded transition-colors" title="Read aloud">
                                            <Volume2 className="w-4 h-4 text-blue-400 hover:text-blue-300" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* AI Badges */}
                        {msg.type === 'bot' && msg.metadata && (
                            <div className="flex items-center gap-2 flex-wrap mt-2">
                                {msg.metadata.classification && (
                                    <span className="bg-blue-900/40 border border-blue-600/50 text-blue-300 px-2 py-0.5 rounded-full font-medium text-[10px] sm:text-xs flex items-center gap-1">
                                        <span className="text-xs">🎯</span>
                                        <span className="capitalize">{msg.metadata.classification.replace('_', ' ')}</span>
                                    </span>
                                )}
                                {/* Add other badges if needed, keeping it minimal for now */}
                            </div>
                        )}

                        {/* Sources */}
                        {msg.type === 'bot' && msg.sources && msg.sources.length > 0 && (() => {
                            const groupedSources = {};
                            msg.sources.forEach(source => {
                                if (typeof source === 'object') {
                                    const docName = source.documentName || 'Document';
                                    if (!groupedSources[docName]) groupedSources[docName] = [];
                                    groupedSources[docName].push(source);
                                }
                            });

                            return (
                                <div className="mt-2 space-y-1.5 w-full">
                                    <div className="flex items-center gap-1.5">
                                        <FileCheck className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                                        <span className="font-semibold text-purple-400 text-xs sm:text-sm">Sources:</span>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        {Object.entries(groupedSources).map(([docName, sources], idx) => (
                                            <div key={idx} className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-2">
                                                <div className="flex items-start gap-2 flex-wrap">
                                                    <span className="opacity-75 text-lg">📄</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div
                                                            onClick={() => handleSourceClick(sources[0])}
                                                            className="font-semibold text-purple-300 text-xs sm:text-sm truncate cursor-pointer hover:text-purple-200 hover:underline flex items-center gap-1 group transition-all"
                                                            title="Click to view document"
                                                        >
                                                            {docName}
                                                            <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                                            {sources.slice(0, 5).map((source, sIdx) => (
                                                                <span key={sIdx} className="bg-purple-900/40 border border-purple-600/50 text-purple-200 px-1.5 py-0.5 rounded text-[10px] sm:text-xs flex items-center gap-1">
                                                                    <span>Page {source.page}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
