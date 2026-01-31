import React from 'react';
import { BarChart3, X } from 'lucide-react';

const ChatStats = ({ messages, onClose }) => {
    const getChatStatistics = () => {
        const totalMessages = messages.length;
        const userMessages = messages.filter(m => m.type === 'user').length;
        const aiMessages = messages.filter(m => m.type === 'bot').length;

        const totalWords = messages.reduce((sum, msg) => {
            return sum + msg.text.split(/\s+/).filter(w => w.length > 0).length;
        }, 0);

        const totalChars = messages.reduce((sum, msg) => sum + msg.text.length, 0);
        const avgWordsPerMessage = totalMessages > 0 ? Math.round(totalWords / totalMessages) : 0;

        const documentsUsed = [...new Set(
            messages.flatMap(m => m.sources || [])
        )].length;

        return {
            totalMessages,
            userMessages,
            aiMessages,
            totalWords,
            totalChars,
            avgWordsPerMessage,
            documentsUsed
        };
    };

    const stats = getChatStatistics();

    return (
        <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-sm border-b border-blue-500/30">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-300" />
                    <span className="text-sm font-bold text-white">Chat Statistics</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Close statistics"
                >
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Messages', value: stats.totalMessages, icon: '💬', color: 'blue' },
                    { label: 'Your Messages', value: stats.userMessages, icon: '👤', color: 'purple' },
                    { label: 'AI Responses', value: stats.aiMessages, icon: '🤖', color: 'cyan' },
                    { label: 'Total Words', value: stats.totalWords, icon: '📝', color: 'green' },
                    { label: 'Avg Words/Msg', value: stats.avgWordsPerMessage, icon: '📊', color: 'yellow' },
                    { label: 'Documents Used', value: stats.documentsUsed, icon: '📚', color: 'orange' },
                    { label: 'Characters', value: stats.totalChars.toLocaleString(), icon: '🔤', color: 'indigo' },
                ].map((stat, idx) => (
                    <div key={idx} className={`bg-${stat.color}-500/20 p-3 rounded-lg border border-${stat.color}-500/30`}>
                        <div className="text-xs text-gray-300 mb-1">{stat.icon} {stat.label}</div>
                        <div className={`text-xl sm:text-2xl font-bold text-${stat.color}-200`}>{stat.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatStats;
