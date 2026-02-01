import React, { useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Loader, Paperclip } from 'lucide-react';

const ChatInput = ({
    inputMessage,
    setInputMessage,
    onSendMessage,
    isTyping,
    isListening,
    onStartVoice,
    onStopVoice,
    voiceSupported,
    onUploadClick
}) => {
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset height
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`; // Set new height, max 300px
        }
    }, [inputMessage]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isTyping && !isListening) onSendMessage();
        }
    };

    return (
        <div className="relative flex items-end bg-gray-800 rounded-3xl px-3 py-2 shadow-sm border border-gray-700/50 focus-within:border-gray-600 focus-within:bg-gray-750 transition-all">
            {/* Left Action (Attachment) */}
            <button
                onClick={onUploadClick}
                className="p-2 mb-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Upload Document"
            >
                <Paperclip className="w-5 h-5" />
            </button>

            {/* Input Field */}
            <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping || isListening}
                placeholder={isListening ? "Listening..." : "Message DocMind AI"}
                className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none focus:ring-0 px-3 py-2 font-medium resize-none max-h-[300px] overflow-y-auto"
                style={{ height: '40px', minHeight: '40px' }}
                rows={1}
            />

            {/* Right Actions */}
            <div className="flex items-center gap-2 mb-1">
                {voiceSupported && (
                    <button
                        onClick={isListening ? onStopVoice : onStartVoice}
                        disabled={isTyping}
                        className={`p-2 rounded-full transition-all ${isListening
                            ? 'bg-red-500/20 text-red-400 animate-pulse'
                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                        title={isListening ? "Stop recording" : "Voice input"}
                    >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                )}

                <button
                    onClick={onSendMessage}
                    disabled={!inputMessage.trim() || isTyping || isListening}
                    className={`p-2 rounded-lg transition-all ${inputMessage.trim() && !isTyping && !isListening
                        ? 'bg-white text-black hover:bg-gray-200'
                        : 'bg-transparent text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {isTyping ? <Loader className="animate-spin w-5 h-5" /> : <Send className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

export default ChatInput;
