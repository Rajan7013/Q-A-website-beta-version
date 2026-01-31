import React, { useRef, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';

const ChatSearch = ({
    searchQuery,
    onSearch,
    searchResults,
    currentSearchIndex,
    onNavigate,
    onClose
}) => {
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    return (
        <div className="p-3 sm:p-4 bg-white/10 backdrop-blur-sm border-b border-white/10">
            <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder="Search in chat..."
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                {searchResults.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                            {currentSearchIndex + 1} / {searchResults.length}
                        </span>
                        <button
                            onClick={() => onNavigate(-1)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Previous"
                        >
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                            onClick={() => onNavigate(1)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Next"
                        >
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>
                )}
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Close search"
                >
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            </div>
        </div>
    );
};

export default ChatSearch;
