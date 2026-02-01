import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Brain, Loader, Target, Menu } from 'lucide-react';
import { sendMessage, saveChatSession, getChatSession, incrementStat, logActivity, uploadDocument } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import ChatStats from './chat/ChatStats';
import ChatSuggestions from './chat/ChatSuggestions';
import ChatToolbar from './chat/ChatToolbar';
import ChatInput from './chat/ChatInput';
import ChatMessage from './chat/ChatMessage';
import ChatSidebar from './chat/ChatSidebar';

const ChatPage = ({ uploadedDocs, userId, setStats, settings, onDocumentDelete, onDocumentUpload }) => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [chatContext, setChatContext] = useState({ topic: null, intent: null });
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(settings?.language || 'en');

  // Voice & Search States
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load Session
  useEffect(() => {
    if (sessionId && userId) {
      loadSession(sessionId);
      localStorage.setItem('lastSessionId', sessionId);
    }
  }, [sessionId, userId]);

  const loadSession = async (id) => {
    setChatMessages([]);
    setIsTyping(true);
    try {
      const session = await getChatSession(userId, id);
      if (session && session.messages && session.messages.length > 0) {
        setChatMessages(session.messages);
      } else {
        setChatMessages([{
          id: 1,
          type: 'bot',
          text: 'Hello! 👋 I\'m your AI Document Analyzer. Upload documents via the sidebar or the attach button below!',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (e) { console.error(e); } finally { setIsTyping(false); }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);


  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setInputMessage('');
    setIsTyping(true);

    try {
      const result = await sendMessage(
        inputMessage,
        sessionId,
        uploadedDocs,
        chatContext,
        selectedLanguage
      );

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: result.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: result.sources, // Now supports array from backend
        confidence: result.confidence
      };

      const updatedMessages = [...newMessages, botMessage];
      setChatMessages(updatedMessages);

      const title = newMessages.length <= 2 ? (userMessage.text.slice(0, 30) + '...') : undefined;
      await saveChatSession(userId, sessionId, title, updatedMessages);

      await incrementStat(userId, 'queriesAsked', 1);

    } catch (error) {
      console.error('Error sending message:', error);
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        text: '⚠️ Sorry, I encountered an error. Please try again.',
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    try {
      setIsUploading(true);
      const newDoc = await uploadDocument(file, userId);
      if (onDocumentUpload) onDocumentUpload(newDoc);

      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'bot',
        text: `✅ **Success!** File "${file.name}" has been uploaded and analyzed. Check the "Docs" tab in the sidebar.`,
        time: new Date().toLocaleTimeString()
      }]);
    } catch (e) {
      alert('Upload failed: ' + e.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Voice Input Handlers
  const recognitionRef = useRef(null);

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Text-to-Speech
  const speakMessage = (id, text) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop previous
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';

    utterance.onend = () => {
      setSpeakingMessageId(null);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
      setIsPaused(false);
    };

    setSpeakingMessageId(id);
    setIsPaused(false);
    window.speechSynthesis.speak(utterance);
  };

  const pauseSpeech = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeech = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
    setIsPaused(false);
  };

  return (
    <div className="flex h-[100dvh] bg-gray-900 text-gray-100 font-sans overflow-hidden">

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.txt,.docx"
      />

      {/* SIDEBAR */}
      <ChatSidebar
        userId={userId}
        currentSessionId={sessionId}
        onSelectSession={(id) => { navigate(`/chat/${id}`); if (window.innerWidth < 768) setSidebarOpen(false); }}
        onNewSession={() => { navigate(`/chat/session-${Date.now()}`); if (window.innerWidth < 768) setSidebarOpen(false); }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        uploadedDocs={uploadedDocs}
        onDeleteDoc={onDocumentDelete}
      />

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col h-full relative w-full bg-gray-900">

        {/* Toggle Sidebar Button (Visible when closed) */}
        <div className={`fixed top-4 left-4 z-50 transition-all duration-300 ${sidebarOpen ? 'opacity-0 pointer-events-none -translate-x-full' : 'opacity-100 translate-x-0'}`}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg text-white"
            title="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-gray-800">
          <div className="max-w-5xl mx-auto w-full px-2 md:px-4 py-6 space-y-6 pb-4">
            {/* Empty State */}
            {chatMessages.length === 0 && !isTyping && (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center opacity-70 animate-fade-in">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
                  <Brain className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-gray-500 max-w-md">Upload documents or start chatting. I'm ready to help.</p>
              </div>
            )}

            {chatMessages.map((msg, index) => (
              <ChatMessage
                key={msg.id}
                msg={msg}
                msgIndex={index}
                onSpeak={speakMessage}
                speakingMessageId={speakingMessageId}
                isPaused={isPaused}
                onPause={pauseSpeech}
                onResume={resumeSpeech}
                onStop={stopSpeech}
              />
            ))}

            {/* Uploading Bubble */}
            {isUploading && (
              <div className="flex items-start gap-1.5 sm:gap-2 animate-fade-in pl-2">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="p-3 bg-gray-800 text-gray-200 rounded-2xl rounded-bl-none shadow-xl border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                    <span className="text-sm">Uploading & analyzing document...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Typing Bubble */}
            {isTyping && !isUploading && (
              <div className="flex items-start gap-1.5 sm:gap-2 animate-fade-in pl-2">
                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                  <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="p-4 bg-gray-800 rounded-2xl rounded-bl-none shadow-xl">
                  <div className="flex gap-1.5 grayscale opacity-70">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-300"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="p-2 md:p-4 bg-gray-900 border-t border-gray-800">
          <div className="max-w-5xl mx-auto w-full">
            <ChatInput
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              onSendMessage={handleSendMessage}
              isTyping={isTyping}
              isListening={isListening}
              onStartVoice={startVoiceInput}
              onStopVoice={stopVoiceInput}
              voiceSupported={voiceSupported}
              onUploadClick={() => fileInputRef.current?.click()}
            />
            <div className="text-center mt-3">
              <p className="text-[10px] text-gray-600">
                AI can make mistakes. Verify important info.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatPage;