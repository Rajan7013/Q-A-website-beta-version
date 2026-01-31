import React from 'react';
import { Send, Mic, MicOff, Loader, Plus, Paperclip } from 'lucide-react';

const ChatInput = ({
    inputMessage,
    setInputMessage,
    onSendMessage,
    isTyping,
    isListening,
    onStartVoice,
    onStopVoice,
    voiceSupported,
    onUploadClick // New prop
}) => {
    return (
        <div className="relative flex items-center bg-gray-800 rounded-3xl px-4 py-3 shadow-sm border border-gray-700/50 focus-within:border-gray-600 focus-within:bg-gray-750 transition-all">
            {/* Left Action (Attachment) */}
            <button
                onClick={onUploadClick}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Upload Document"
            >
                <Paperclip className="w-5 h-5" />
            </button>

            {/* Input Field */}
            <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isTyping && !isListening && onSendMessage()}
                disabled={isTyping || isListening}
                placeholder={isListening ? "Listening..." : "Message Antigravity"}
                className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none focus:ring-0 px-3 py-1 font-medium"
            />

            {/* Right Actions */}
            <div className="flex items-center gap-2">
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
