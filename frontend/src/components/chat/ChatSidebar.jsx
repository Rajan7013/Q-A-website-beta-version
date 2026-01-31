import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, Check, FileText, Folder, Brain, ChevronsLeft } from 'lucide-react';
import { getRecentChats, deleteChatSession, renameChatSession, getDocumentUrl } from '../../utils/api';

const ChatSidebar = ({ userId, currentSessionId, onSelectSession, onNewSession, isOpen, onClose, uploadedDocs = [], onDeleteDoc }) => {
    const [chats, setChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'docs'

    useEffect(() => {
        if (userId) {
            loadChats();
        }
    }, [userId, currentSessionId]);

    const loadChats = async () => {
        try {
            const recentChats = await getRecentChats(userId);
            setChats(recentChats);
        } catch (error) {
            console.error('Failed to load chats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (e, sessionId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this chat?')) {
            try {
                await deleteChatSession(userId, sessionId);
                setChats(chats.filter(c => c.sessionId !== sessionId));
                if (currentSessionId === sessionId) onNewSession();
            } catch (error) {
                console.error('Failed to delete chat:', error);
            }
        }
    };

    const startEditing = (e, chat) => {
        e.stopPropagation();
        setEditingId(chat.sessionId);
        setEditTitle(chat.title);
    };

    const saveTitle = async (sessionId) => {
        if (!editTitle.trim()) return;
        try {
            await renameChatSession(userId, sessionId, editTitle);
            setChats(chats.map(c => c.sessionId === sessionId ? { ...c, title: editTitle } : c));
            setEditingId(null);
        } catch (error) {
            console.error('Failed to rename chat:', error);
        }
    };

    const handleOpenDoc = async (docId) => {
        try {
            const url = await getDocumentUrl(docId);
            if (url) window.open(url, '_blank');
        } catch (error) {
            console.error('Failed to open doc:', error);
            alert('Could not open document. It may have been deleted.');
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}`}>

                {/* Header */}
                <div className="p-4 border-b border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Brain className="w-6 h-6 text-blue-500" />
                            Antigravity
                        </h2>
                        <div className="flex items-center gap-2">
                            <button onClick={onNewSession} className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg" title="New Chat">
                                <Plus className="w-4 h-4" />
                            </button>
                            {/* Compress/Collapse Button */}
                            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg hidden md:block" title="Collapse Sidebar">
                                <ChevronsLeft className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-gray-800/50 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('chats')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'chats' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <MessageSquare className="w-4 h-4" /> Chats
                        </button>
                        <button
                            onClick={() => setActiveTab('docs')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'docs' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <Folder className="w-4 h-4" /> Docs
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-700">

                    {/* CHATS TAB */}
                    {activeTab === 'chats' && (
                        <div className="space-y-1">
                            {isLoading ? (
                                <div className="flex justify-center p-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div></div>
                            ) : chats.length === 0 ? (
                                <div className="text-center text-gray-500 p-8 text-sm">No chats yet</div>
                            ) : (
                                chats.map(chat => (
                                    <div key={chat.sessionId} onClick={() => onSelectSession(chat.sessionId)}
                                        className={`group relative flex items-center p-3 rounded-lg cursor-pointer transition-all ${currentSessionId === chat.sessionId ? 'bg-gray-800 text-blue-400 border border-gray-700' : 'text-gray-300 hover:bg-gray-800/50 border border-transparent'}`}
                                    >
                                        <MessageSquare className="w-4 h-4 mr-3 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            {editingId === chat.sessionId ? (
                                                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                                                        className="w-full bg-gray-900 text-white text-xs px-1 py-1 rounded border border-blue-500 focus:outline-none"
                                                        autoFocus onKeyDown={e => e.key === 'Enter' && saveTitle(chat.sessionId)}
                                                    />
                                                    <button onClick={() => saveTitle(chat.sessionId)} className="text-green-400 p-1"><Check className="w-3 h-3" /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <h3 className="text-sm font-medium truncate">{chat.title}</h3>
                                                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{chat.time}</p>
                                                </>
                                            )}
                                        </div>
                                        {!editingId && (
                                            <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex gap-1 bg-gray-800 p-1 rounded shadow-lg">
                                                <button onClick={(e) => startEditing(e, chat)} className="text-gray-400 hover:text-blue-400 p-1"><Edit2 className="w-3 h-3" /></button>
                                                <button onClick={(e) => handleDelete(e, chat.sessionId)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* DOCS TAB */}
                    {activeTab === 'docs' && (
                        <div className="space-y-2">
                            {uploadedDocs.length === 0 ? (
                                <div className="text-center text-gray-500 p-8 text-sm flex flex-col items-center">
                                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                        <Folder className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <p>No documents yet.</p>
                                    <p className="text-xs text-gray-600 mt-1">Upload via chat input</p>
                                </div>
                            ) : (
                                uploadedDocs.map(doc => (
                                    <div key={doc.id} onClick={() => handleOpenDoc(doc.id)} className="group flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800 border border-transparent hover:border-gray-700 transition-all cursor-pointer">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 shrink-0">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-medium text-gray-200 truncate pr-2" title={doc.name}>{doc.name}</h4>
                                                <span className="text-[10px] text-gray-500">{(doc.size / 1024).toFixed(1)} KB</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteDoc && onDeleteDoc(doc.id); }}
                                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete File"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 text-xs text-center text-gray-600">
                    Antigravity AI System v2.0
                </div>
            </div>
        </>
    );
};

export default ChatSidebar;
