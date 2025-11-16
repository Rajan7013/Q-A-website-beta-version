import React, { useState, useEffect, useRef } from 'react';
import { Send, Brain, User, Target, FileCheck, Loader, Volume2, VolumeX, Pause, Play, Globe, Trash2, Copy, Mic, MicOff, Download, Search, X, ChevronUp, ChevronDown, Lightbulb, Sparkles, Pin, PinOff, BarChart3, Share2, Type, Plus, Minus, MessageSquare, Edit3, MoreVertical } from 'lucide-react';
import { sendMessage, saveChatSession, incrementStat, logActivity, getChatMessages } from '../utils/api';
import { Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatPage = ({ sessionId, uploadedDocs, userId, setStats, settings, onSessionChange, currentSessionId, chatSessions, onNewChat, onDeleteChat, onRenameChat, onChatSave }) => {
  const [forceNewSession, setForceNewSession] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { 
      id: 1, 
      type: 'bot', 
      text: 'Hello! 👋 I\'m your AI Document Analyzer. Upload your documents and ask me anything! I remember context and can help with exam prep too!', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: []
    }
  ]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatContext, setChatContext] = useState({
    topic: null,
    intent: null
  });
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showPinned, setShowPinned] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [fontSize, setFontSize] = useState('base'); // 'sm', 'base', 'lg', 'xl'
  const [showFontControl, setShowFontControl] = useState(false);
  const [showChatManager, setShowChatManager] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingChatTitle, setEditingChatTitle] = useState('');
  const chatEndRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const recognitionRef = useRef(null);
  const searchResultRefs = useRef([]);

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem(`user-lang-${userId}`) || 'en';
    setSelectedLanguage(savedLang);
  }, [userId]);

  // Load chat messages when session changes
  useEffect(() => {
    const loadChatMessages = async () => {
      if (sessionId) {
        setIsLoadingChat(true);
        
        // Reset context for new session
        setChatContext({ topic: null, intent: null });
        
        try {
          // Check if this is a brand new session (created within last 5 seconds) or forced new
          const sessionTimestamp = sessionId.split('-')[1];
          const currentTime = Date.now();
          const isNewSession = forceNewSession || (sessionTimestamp && (currentTime - parseInt(sessionTimestamp)) < 5000);
          
          // Reset force flag
          if (forceNewSession) {
            setForceNewSession(false);
          }
          
          if (isNewSession) {
            // For new sessions, always start fresh
            const welcomeMessages = [{
              id: 1,
              type: 'bot',
              text: 'Hello! 👋 I\'m your AI Document Analyzer. Upload your documents and ask me anything! I remember context and can help with exam prep too!',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              sources: []
            }];
            setChatMessages(welcomeMessages);
            const localStorageKey = `chat-messages-${sessionId}`;
            localStorage.setItem(localStorageKey, JSON.stringify(welcomeMessages));
            console.log('✅ Started fresh new session:', sessionId);
          } else {
            // For existing sessions, try to load from backend first
            try {
              const messages = await getChatMessages(userId, sessionId);
              if (messages && messages.length > 0) {
                setChatMessages(messages);
                // Update localStorage cache
                const localStorageKey = `chat-messages-${sessionId}`;
                localStorage.setItem(localStorageKey, JSON.stringify(messages));
                console.log('✅ Loaded', messages.length, 'messages from backend for session:', sessionId);
              } else {
                // Try localStorage as fallback
                const localStorageKey = `chat-messages-${sessionId}`;
                const cachedMessages = localStorage.getItem(localStorageKey);
                
                if (cachedMessages) {
                  const messages = JSON.parse(cachedMessages);
                  setChatMessages(messages);
                  console.log('✅ Loaded', messages.length, 'messages from cache for session:', sessionId);
                } else {
                  // No data found, start with welcome message
                  const welcomeMessages = [{
                    id: 1,
                    type: 'bot',
                    text: 'Hello! 👋 I\'m your AI Document Analyzer. Upload your documents and ask me anything! I remember context and can help with exam prep too!',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    sources: []
                  }];
                  setChatMessages(welcomeMessages);
                  localStorage.setItem(localStorageKey, JSON.stringify(welcomeMessages));
                  console.log('✅ No existing data, started with welcome message');
                }
              }
            } catch (apiError) {
              console.log('Backend unavailable, trying localStorage cache');
              // Fallback to localStorage
              const localStorageKey = `chat-messages-${sessionId}`;
              const cachedMessages = localStorage.getItem(localStorageKey);
              
              if (cachedMessages) {
                const messages = JSON.parse(cachedMessages);
                setChatMessages(messages);
                console.log('✅ Loaded', messages.length, 'messages from cache (backend offline)');
              } else {
                // Default welcome message
                const welcomeMessages = [{
                  id: 1,
                  type: 'bot',
                  text: 'Hello! 👋 I\'m your AI Document Analyzer. Upload your documents and ask me anything! I remember context and can help with exam prep too!',
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  sources: []
                }];
                setChatMessages(welcomeMessages);
                localStorage.setItem(localStorageKey, JSON.stringify(welcomeMessages));
              }
            }
          }
        } catch (error) {
          console.error('Failed to load chat messages:', error);
        } finally {
          setIsLoadingChat(false);
        }
      }
    };

    loadChatMessages();
  }, [sessionId, userId, forceNewSession]);

  // Save messages to localStorage and sync with backend whenever they change
  useEffect(() => {
    if (sessionId && chatMessages.length > 0) {
      // Save to localStorage immediately
      const localStorageKey = `chat-messages-${sessionId}`;
      localStorage.setItem(localStorageKey, JSON.stringify(chatMessages));
      console.log('💾 Cached', chatMessages.length, 'messages for session:', sessionId);
      
      // Sync with backend (debounced to avoid too many calls)
      const syncTimeout = setTimeout(async () => {
        try {
          const chatTitle = extractChatTitle(chatMessages);
          await saveChatSession(userId, sessionId, chatTitle, chatMessages);
          console.log('🔄 Synced chat session with backend');
        } catch (error) {
          console.log('⚠️ Backend sync failed, data saved locally:', error.message);
        }
      }, 2000); // 2 second debounce
      
      return () => clearTimeout(syncTimeout);
    }
  }, [chatMessages, sessionId, userId]);

  const languageOptions = [
    { value: 'en', label: '🇬🇧 English' },
    { value: 'hi', label: '🇮🇳 Hindi (हिंदी)' },
    { value: 'te', label: '🇮🇳 Telugu (తెలుగు)' },
    { value: 'ta', label: '🇮🇳 Tamil (தமிழ்)' },
    { value: 'ml', label: '🇮🇳 Malayalam (മലയാളം)' },
    { value: 'bn', label: '🇮🇳 Bengali (বাংলা)' },
    { value: 'ne', label: '🇳🇵 Nepali (नेपाली)' },
    { value: 'mai', label: '🇮🇳 Maithili (मैथिली)' },
    { value: 'kn', label: '🇮🇳 Kannada (ಕನ್ನಡ)' }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Text-to-Speech functions
  const getIndianFemaleVoice = (language) => {
    const voices = window.speechSynthesis.getVoices();
    
    // Language code mapping for speech synthesis
    const langCodeMap = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'te': 'te-IN',
      'ta': 'ta-IN',
      'ml': 'ml-IN',
      'bn': 'bn-IN',
      'ne': 'ne-NP',
      'mai': 'hi-IN', // Fallback to Hindi for Maithili
      'kn': 'kn-IN'
    };
    
    const langCode = langCodeMap[language] || 'en-IN';
    const baseLang = langCode.split('-')[0];
    
    console.log('🔊 TTS Debug:', {
      selectedLanguage: language,
      mappedLangCode: langCode,
      baseLang: baseLang,
      availableVoices: voices.map(v => ({ name: v.name, lang: v.lang }))
    });
    
    // Priority 1: Exact language match with Indian accent
    let voice = voices.find(v => 
      v.lang === langCode && 
      (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman'))
    );
    
    // Priority 2: Base language match with Indian accent
    if (!voice) {
      voice = voices.find(v => 
        v.lang.startsWith(baseLang) && 
        v.lang.includes('IN') &&
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman'))
      );
    }
    
    // Priority 3: Any voice for the exact language
    if (!voice) {
      voice = voices.find(v => v.lang === langCode);
    }
    
    // Priority 4: Any voice for the base language with Indian accent
    if (!voice) {
      voice = voices.find(v => 
        v.lang.startsWith(baseLang) && 
        v.lang.includes('IN')
      );
    }
    
    // Priority 5: Any voice for the base language
    if (!voice) {
      voice = voices.find(v => v.lang.startsWith(baseLang));
    }
    
    // Priority 6: Indian English female voice as fallback
    if (!voice) {
      voice = voices.find(v => 
        v.lang.includes('en-IN') && 
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman'))
      );
    }
    
    // Priority 7: Any Indian voice
    if (!voice) {
      voice = voices.find(v => v.lang.includes('IN'));
    }
    
    // Priority 8: Any female voice
    if (!voice) {
      voice = voices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.toLowerCase().includes('woman')
      );
    }
    
    // Last resort: first available voice
    const selectedVoice = voice || voices[0];
    
    console.log('🔊 Selected Voice:', {
      name: selectedVoice?.name,
      lang: selectedVoice?.lang,
      forLanguage: language
    });
    
    return selectedVoice;
  };

  const stripMarkdown = (text) => {
    // Remove markdown formatting for clean speech
    return text
      .replace(/#{1,6}\s/g, '') // Remove headings
      .replace(/\*\*\*(.*?)\*\*\*/g, '$1') // Bold+Italic
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`{3}[\s\S]*?`{3}/g, '') // Code blocks
      .replace(/`(.*?)`/g, '$1') // Inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/^>\s/gm, '') // Blockquotes
      .replace(/^[-*+]\s/gm, '') // List bullets
      .replace(/^\d+\.\s/gm, '') // Numbered lists
      .replace(/\n{2,}/g, '. ') // Multiple line breaks
      .replace(/\|/g, ' ') // Table separators
      .trim();
  };

  const speakMessage = (messageId, text) => {
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    if (speakingMessageId === messageId && !isPaused) {
      // Stop if already speaking this message
      setSpeakingMessageId(null);
      setIsPaused(false);
      return;
    }
    
    // Input validation
    if (!text || typeof text !== 'string') {
      console.log('🔊 Invalid text for speech');
      return;
    }
    
    // Clean text from markdown
    const cleanText = stripMarkdown(text);
    
    // Ensure we have text to speak
    if (!cleanText || cleanText.trim().length === 0) {
      console.log('🔊 No text to speak');
      return;
    }
    
    // Use the selected language
    const currentLanguage = selectedLanguage || 'en';
    console.log('🔊 Speaking in language:', currentLanguage, 'Text length:', cleanText.length, 'Text:', cleanText.substring(0, 50) + '...');
    
    // Force reload voices to ensure they're available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Voices not loaded yet, wait and try again
      setTimeout(() => speakMessage(messageId, text), 200);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Language code mapping for speech synthesis
    const langCodeMap = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'te': 'te-IN',
      'ta': 'ta-IN',
      'ml': 'ml-IN',
      'bn': 'bn-IN',
      'ne': 'ne-NP',
      'mai': 'hi-IN', // Fallback to Hindi for Maithili
      'kn': 'kn-IN'
    };
    
    const targetLangCode = langCodeMap[currentLanguage] || 'en-IN';
    const baseLang = targetLangCode.split('-')[0];
    
    // FORCE the language setting - this is critical for non-English
    utterance.lang = targetLangCode;
    
    // Try to find the best voice for the language
    const voice = getIndianFemaleVoice(currentLanguage);
    if (voice) {
      utterance.voice = voice;
      console.log('🔊 Using voice:', voice.name, 'with lang:', voice.lang);
    } else {
      console.log('🔊 No specific voice found, using lang code:', targetLangCode);
    }
    
    // Speech parameters optimized for different languages
    utterance.rate = currentLanguage === 'en' ? 0.9 : 0.8; // Slower for non-English
    utterance.pitch = 1.1; // Slightly higher for female voice
    utterance.volume = 1.0;
    
    utterance.onstart = () => {
      setSpeakingMessageId(messageId);
      setIsPaused(false);
      console.log('🔊 Speech started for language:', currentLanguage, 'with lang code:', utterance.lang);
    };
    
    utterance.onend = () => {
      setSpeakingMessageId(null);
      setIsPaused(false);
      console.log('🔊 Speech ended successfully');
    };
    
    utterance.onerror = (event) => {
      setSpeakingMessageId(null);
      setIsPaused(false);
      console.error('🔊 Speech error:', event.error, 'for language:', currentLanguage);
      
      // Try fallback to English if non-English fails
      if (currentLanguage !== 'en') {
        console.log('🔊 Retrying with English fallback');
        const fallbackUtterance = new SpeechSynthesisUtterance(cleanText);
        fallbackUtterance.lang = 'en-IN';
        fallbackUtterance.rate = 0.9;
        fallbackUtterance.pitch = 1.1;
        fallbackUtterance.volume = 1.0;
        window.speechSynthesis.speak(fallbackUtterance);
      }
    };
    
    speechSynthesisRef.current = utterance;
    
    // Ensure voices are loaded and speak
    setTimeout(() => {
      console.log('🔊 Starting speech synthesis with:', {
        text: cleanText.substring(0, 50) + '...',
        lang: utterance.lang,
        voice: utterance.voice?.name || 'default',
        rate: utterance.rate,
        pitch: utterance.pitch
      });
      window.speechSynthesis.speak(utterance);
    }, 150);
  };

  const pauseSpeech = () => {
    if (window.speechSynthesis.speaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeech = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
    setIsPaused(false);
  };

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Indian English by default
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setInputMessage(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access in your browser settings.');
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    } else {
      setVoiceSupported(false);
      console.log('Speech recognition not supported in this browser');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Load voices on component mount and when language changes
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      console.log('🔊 Voices loaded:', voices.length, 'voices available');
      console.log('🔊 Available languages:', [...new Set(voices.map(v => v.lang))].sort());
    };
    
    // Load voices immediately
    loadVoices();
    
    // Also load when voices change (some browsers load voices asynchronously)
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Cleanup on unmount
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);
  
  // Re-load voices when language changes
  useEffect(() => {
    if (settings?.language || selectedLanguage) {
      const currentLang = settings?.language || selectedLanguage;
      console.log('🔊 Language changed to:', currentLang);
      
      // Force reload voices to ensure they're available
      setTimeout(() => {
        const voices = window.speechSynthesis.getVoices();
        const voice = getIndianFemaleVoice(currentLang);
        console.log('🔊 Voice for', currentLang, ':', voice?.name, voice?.lang);
      }, 500);
    }
  }, [settings?.language, selectedLanguage]);
  


  // Clear chat function
  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to start a new chat? Current conversation will be saved.')) {
      // Force new session
      setForceNewSession(true);
      
      // Start new chat session
      if (onNewChat) {
        onNewChat();
      }
      
      // Show success message
      const notification = document.createElement('div');
      notification.textContent = '✅ New chat started!';
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    }
  };

  // Voice input functions
  const startVoiceInput = () => {
    if (!voiceSupported) {
      alert('Voice input is not supported in your browser. Please try Chrome, Edge, or Safari.');
      return;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  };
  
  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Export chat as TXT
  const exportChatAsTXT = () => {
    const header = `
╔═══════════════════════════════════════════════════════════════════╗
║         AI CHAT CONVERSATION EXPORT                               ║
╚═══════════════════════════════════════════════════════════════════╝

Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Time: ${new Date().toLocaleTimeString()}
Total Messages: ${chatMessages.length}

${'═'.repeat(70)}

`;

    const chatText = chatMessages
      .map((msg, index) => {
        const sender = msg.type === 'user' ? '👤 YOU' : '🤖 AI ASSISTANT';
        const sources = msg.sources?.length > 0 ? `\n\n📚 Sources: ${msg.sources.join(', ')}` : '';
        const separator = '─'.repeat(70);
        
        return `
${separator}
Message #${index + 1} | ${sender} | ${msg.time}
${separator}

${msg.text}${sources}
`;
      })
      .join('\n');

    const footer = `
${'═'.repeat(70)}

Generated by AI Document Analyzer
Exported on: ${new Date().toLocaleString()}
`;
    
    const fullText = header + chatText + footer;
    
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success message
    const notification = document.createElement('div');
    notification.textContent = '✅ Chat exported as TXT!';
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  // Convert markdown to HTML for PDF export
  const markdownToHTML = (text) => {
    let html = text;
    
    // Escape HTML
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Headings
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    
    // Bold + Italic
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Lists - unordered
    html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    return `<p>${html}</p>`;
  };

  // Export chat as PDF (HTML-based)
  const exportChatAsPDF = () => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AI Chat Export</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      background: #ffffff;
      color: #000000;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px;
      line-height: 1.8;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #000000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: bold;
      color: #000000;
      margin-bottom: 10px;
    }
    
    .header .meta {
      font-size: 14px;
      color: #333333;
      margin-top: 10px;
    }
    
    .message {
      margin: 30px 0;
      padding: 20px;
      border: 1px solid #cccccc;
      border-radius: 8px;
      page-break-inside: avoid;
      background: #fafafa;
    }
    
    .message.user {
      background: #f0f0f0;
      border-left: 4px solid #666666;
    }
    
    .message.bot {
      background: #ffffff;
      border-left: 4px solid #000000;
    }
    
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #dddddd;
    }
    
    .sender {
      font-weight: bold;
      font-size: 16px;
      color: #000000;
    }
    
    .time {
      font-size: 12px;
      color: #666666;
      font-style: italic;
    }
    
    .content {
      color: #000000;
      font-size: 14px;
    }
    
    /* Markdown formatting */
    .content h1 {
      font-size: 24px;
      font-weight: bold;
      margin: 20px 0 10px 0;
      color: #000000;
      border-bottom: 2px solid #000000;
      padding-bottom: 5px;
    }
    
    .content h2 {
      font-size: 20px;
      font-weight: bold;
      margin: 18px 0 8px 0;
      color: #000000;
    }
    
    .content h3 {
      font-size: 18px;
      font-weight: bold;
      margin: 16px 0 8px 0;
      color: #000000;
    }
    
    .content p {
      margin: 10px 0;
      text-align: justify;
    }
    
    .content strong {
      font-weight: bold;
      color: #000000;
    }
    
    .content em {
      font-style: italic;
    }
    
    .content ul {
      margin: 10px 0 10px 30px;
      list-style-type: disc;
    }
    
    .content ol {
      margin: 10px 0 10px 30px;
      list-style-type: decimal;
    }
    
    .content li {
      margin: 5px 0;
    }
    
    .content code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 13px;
      color: #000000;
      border: 1px solid #dddddd;
    }
    
    .content pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      margin: 15px 0;
      border: 1px solid #cccccc;
    }
    
    .content pre code {
      background: none;
      padding: 0;
      border: none;
      font-size: 13px;
    }
    
    .content blockquote {
      border-left: 4px solid #666666;
      padding-left: 15px;
      margin: 15px 0;
      color: #333333;
      font-style: italic;
    }
    
    .sources {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px solid #dddddd;
      font-size: 12px;
      color: #666666;
    }
    
    .sources strong {
      color: #000000;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #000000;
      text-align: center;
      font-size: 12px;
      color: #666666;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      .message {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>AI Chat Conversation Export</h1>
    <div class="meta">
      <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
      <p><strong>Total Messages:</strong> ${chatMessages.length}</p>
    </div>
  </div>
  
  ${chatMessages.map(msg => `
    <div class="message ${msg.type}">
      <div class="message-header">
        <div class="sender">${msg.type === 'user' ? '👤 You' : '🤖 AI Assistant'}</div>
        <div class="time">${msg.time}</div>
      </div>
      <div class="content">
        ${markdownToHTML(msg.text)}
      </div>
      ${msg.sources?.length > 0 ? `
        <div class="sources">
          <strong>📚 Sources:</strong> ${msg.sources.join(', ')}
        </div>
      ` : ''}
    </div>
  `).join('')}
  
  <div class="footer">
    <p>Generated by AI Document Analyzer</p>
    <p>Exported on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success message
    const notification = document.createElement('div');
    notification.textContent = '✅ Chat exported as HTML! (Open in browser and print to PDF)';
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  // Search in chat functions
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(0);
      return;
    }
    
    const results = [];
    chatMessages.forEach((msg, msgIndex) => {
      const text = msg.text.toLowerCase();
      const searchTerm = query.toLowerCase();
      let index = text.indexOf(searchTerm);
      
      while (index !== -1) {
        results.push({ msgIndex, textIndex: index });
        index = text.indexOf(searchTerm, index + 1);
      }
    });
    
    setSearchResults(results);
    setCurrentSearchIndex(0);
    
    // Scroll to first result
    if (results.length > 0) {
      setTimeout(() => {
        const firstResult = results[0];
        const msgElement = document.getElementById(`message-${firstResult.msgIndex}`);
        if (msgElement) {
          msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };
  
  const navigateSearch = (direction) => {
    if (searchResults.length === 0) return;
    
    let newIndex = currentSearchIndex + direction;
    if (newIndex < 0) newIndex = searchResults.length - 1;
    if (newIndex >= searchResults.length) newIndex = 0;
    
    setCurrentSearchIndex(newIndex);
    
    const result = searchResults[newIndex];
    const msgElement = document.getElementById(`message-${result.msgIndex}`);
    if (msgElement) {
      msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };
  
  const closeSearch = () => {
    setSearchVisible(false);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(0);
  };
  
  // Highlight search matches
  const highlightText = (text, msgIndex) => {
    if (!searchQuery.trim() || searchResults.length === 0) return text;
    
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

  // Generate suggested questions based on documents
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
    if (chatContext.topic) {
      suggestions.unshift(`Tell me more about ${chatContext.topic}`);
      suggestions.push(`Give me examples related to ${chatContext.topic}`);
    }
    
    return suggestions.slice(0, 6);
  };
  
  const handleSuggestionClick = (question) => {
    setInputMessage(question);
    setShowSuggestions(false);
    // Auto-focus input
    setTimeout(() => {
      const inputElement = document.querySelector('input[type="text"]');
      if (inputElement) inputElement.focus();
    }, 100);
  };

  // Pin/Unpin message functions
  const togglePinMessage = (messageId) => {
    setPinnedMessages(prev => {
      if (prev.includes(messageId)) {
        // Unpin
        const notification = document.createElement('div');
        notification.textContent = '✅ Message unpinned!';
        notification.className = 'fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
        return prev.filter(id => id !== messageId);
      } else {
        // Pin
        const notification = document.createElement('div');
        notification.textContent = '✅ Message pinned!';
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
        return [...prev, messageId];
      }
    });
  };
  
  const scrollToMessage = (msgIndex) => {
    const msgElement = document.getElementById(`message-${msgIndex}`);
    if (msgElement) {
      msgElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight effect
      msgElement.style.animation = 'pulse 1s ease-in-out';
      setTimeout(() => {
        msgElement.style.animation = '';
      }, 1000);
    }
    setShowPinned(false);
  };
  
  const getPinnedMessagesData = () => {
    return chatMessages
      .map((msg, idx) => ({ ...msg, index: idx }))
      .filter(msg => pinnedMessages.includes(msg.id));
  };

  // Chat Statistics
  const getChatStatistics = () => {
    const totalMessages = chatMessages.length;
    const userMessages = chatMessages.filter(m => m.type === 'user').length;
    const aiMessages = chatMessages.filter(m => m.type === 'bot').length;
    
    const totalWords = chatMessages.reduce((sum, msg) => {
      return sum + msg.text.split(/\s+/).filter(w => w.length > 0).length;
    }, 0);
    
    const totalChars = chatMessages.reduce((sum, msg) => sum + msg.text.length, 0);
    
    const avgWordsPerMessage = totalMessages > 0 ? Math.round(totalWords / totalMessages) : 0;
    
    const documentsUsed = [...new Set(
      chatMessages.flatMap(m => m.sources || [])
    )].length;
    
    return {
      totalMessages,
      userMessages,
      aiMessages,
      totalWords,
      totalChars,
      avgWordsPerMessage,
      documentsUsed,
      pinnedCount: pinnedMessages.length
    };
  };
  
  // Font size control
  const fontSizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };
  
  const changeFontSize = (size) => {
    setFontSize(size);
    const notification = document.createElement('div');
    notification.textContent = `✅ Font size: ${size.toUpperCase()}`;
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 1500);
  };
  
  // Share chat function
  const shareChat = () => {
    const shareText = `🤖 AI Chat Conversation\n\nDate: ${new Date().toLocaleDateString()}\nMessages: ${chatMessages.length}\n\n${chatMessages.map((msg, i) => `${i + 1}. ${msg.type === 'user' ? '👤 You' : '🤖 AI'} (${msg.time}):\n${msg.text.substring(0, 100)}${msg.text.length > 100 ? '...' : ''}\n`).join('\n')}`;
    
    if (navigator.share) {
      // Use native share API if available
      navigator.share({
        title: 'AI Chat Conversation',
        text: shareText,
      }).then(() => {
        const notification = document.createElement('div');
        notification.textContent = '✅ Chat shared successfully!';
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareText);
        const notification = document.createElement('div');
        notification.textContent = '✅ Chat summary copied to clipboard!';
        notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        const notification = document.createElement('div');
        notification.textContent = '✅ Chat summary copied! Share it anywhere!';
        notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
      });
    }
  };

  // Copy chat function
  const handleCopyChat = () => {
    const chatText = chatMessages
      .map(msg => {
        const sender = msg.type === 'user' ? 'You' : 'AI';
        return `${sender} (${msg.time}):\n${msg.text}\n${msg.sources?.length > 0 ? 'Sources: ' + msg.sources.join(', ') : ''}`;
      })
      .join('\n\n---\n\n');
    
    navigator.clipboard.writeText(chatText).then(() => {
      // Show success message
      const notification = document.createElement('div');
      notification.textContent = '✅ Chat copied to clipboard!';
      notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    }).catch(err => {
      alert('Failed to copy chat. Please try again.');
      console.error('Copy failed:', err);
    });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Input validation
    if (inputMessage.length > 10000) {
      alert('Message too long. Please keep it under 10,000 characters.');
      return;
    }

    const userMessage = {
      id: chatMessages.length + 1,
      type: 'user',
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setInputMessage('');
    setIsTyping(true);

    try {
      const processedDocs = uploadedDocs
        .filter(doc => doc.status === 'processed')
        .map(doc => ({ id: doc.id, name: doc.name, pages: doc.pages }));

      // Use the selected language
      const language = selectedLanguage || 'en';
      console.log('🌍 Using Language:', language, 'Selected:', selectedLanguage, 'Settings:', settings?.language);
      
      // Get user's API key directly from localStorage
      const userApiKey = localStorage.getItem(`user-api-${userId}`)?.trim() || null;
      
      console.log('🚀 Sending message with language:', language);
      console.log('🔑 Using user API key:', userApiKey ? 'Yes' : 'No (system fallback)');
      
      const response = await sendMessage(
        inputMessage,
        sessionId,
        processedDocs,
        chatContext,
        language,
        userApiKey,
        userId
      );
      console.log('🤖 AI Response received:', response.response?.substring(0, 100) + '...');

      const botMessage = {
        id: chatMessages.length + 2,
        type: 'bot',
        text: response.response,
        rawText: response.rawResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: response.sources || []
      };

      const finalMessages = [...chatMessages, userMessage, botMessage];
      setChatMessages(finalMessages);
      setChatContext(response.context);

      // Increment questions answered stat
      try {
        const updatedStats = await incrementStat(userId, 'questionsAnswered', 1);
        setStats(updatedStats);

        // Log activity for today
        const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
        await logActivity(userId, today, 1);

        // Save chat session
        const chatTitle = extractChatTitle([...chatMessages, userMessage, botMessage]);
        const chatData = await saveChatSession(userId, sessionId, chatTitle, [...chatMessages, userMessage, botMessage]);
        if (onChatSave) {
          onChatSave(chatData.chat);
        }
      } catch (statError) {
        console.error('Failed to update stats:', statError);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: chatMessages.length + 2,
        type: 'bot',
        text: error.response?.data?.error || 'AI service is temporarily busy. Please try again in a moment.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: []
      };
      const errorMessages = [...chatMessages, userMessage, errorMessage];
      setChatMessages(errorMessages);
    } finally {
      setIsTyping(false);
    }
  };

  const extractChatTitle = (messages) => {
    // Extract title from first user message
    const firstUserMsg = messages.find(m => m.type === 'user');
    if (firstUserMsg) {
      // Clean the text and create a meaningful title
      let title = firstUserMsg.text
        .replace(/[\n\r]+/g, ' ') // Replace line breaks with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      
      // Limit to 60 characters for better display
      if (title.length > 60) {
        title = title.substring(0, 60).trim() + '...';
      }
      
      return title || 'Untitled Chat';
    }
    return 'New Chat Session';
  };

  const renderMessage = (text) => {
    return (
      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Headings with proper styling
            h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-4 mt-6 text-purple-300 border-b border-purple-500/30 pb-2" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-2xl font-bold mb-3 mt-5 text-purple-300" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-xl font-bold mb-2 mt-4 text-purple-400" {...props} />,
            h4: ({node, ...props}) => <h4 className="text-lg font-bold mb-2 mt-3 text-purple-400" {...props} />,
            h5: ({node, ...props}) => <h5 className="text-base font-bold mb-2 mt-3 text-purple-500" {...props} />,
            h6: ({node, ...props}) => <h6 className="text-sm font-bold mb-2 mt-2 text-purple-500" {...props} />,
            
            // Paragraphs with spacing
            p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-gray-200" {...props} />,
            
            // Bold text
            strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
            
            // Italic text
            em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
            
            // Unordered lists
            ul: ({node, ...props}) => <ul className="list-none space-y-2 mb-4 ml-2" {...props} />,
            
            // Ordered lists
            ol: ({node, ...props}) => <ol className="list-none space-y-2 mb-4 ml-2" {...props} />,
            
            // List items with custom bullets
            li: ({node, ordered, ...props}) => (
              <li className="flex items-start gap-2" {...props}>
                <span className="text-purple-400 font-bold mt-0.5">{ordered ? '•' : '•'}</span>
                <span className="flex-1">{props.children}</span>
              </li>
            ),
            
            // Code blocks
            code: ({node, inline, ...props}) => 
              inline ? (
                <code className="bg-gray-700/50 text-purple-300 px-2 py-0.5 rounded text-sm font-mono" {...props} />
              ) : (
                <code className="block bg-gray-900/50 text-purple-200 p-4 rounded-lg my-4 overflow-x-auto font-mono text-sm border border-purple-500/20" {...props} />
              ),
            
            // Blockquotes
            blockquote: ({node, ...props}) => (
              <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-4 italic text-gray-300 bg-purple-500/5" {...props} />
            ),
            
            // Horizontal rules
            hr: ({node, ...props}) => <hr className="border-purple-500/30 my-6" {...props} />,
            
            // Links
            a: ({node, ...props}) => <a className="text-purple-400 hover:text-purple-300 underline" {...props} />,
            
            // Tables
            table: ({node, ...props}) => <table className="w-full border-collapse my-4" {...props} />,
            th: ({node, ...props}) => <th className="border border-purple-500/30 bg-purple-500/20 px-4 py-2 text-left font-bold" {...props} />,
            td: ({node, ...props}) => <td className="border border-purple-500/30 px-4 py-2" {...props} />,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] sm:h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] lg:h-[calc(100vh-120px)] bg-gradient-to-br from-gray-900 to-black rounded-none md:rounded-2xl shadow-2xl overflow-hidden max-w-full">

      {/* Chat Manager */}
      {showChatManager && (
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Chat Sessions</h3>
              <button
                onClick={() => setShowChatManager(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            {/* New Chat Button */}
            <button
              onClick={() => {
                setForceNewSession(true);
                onNewChat();
                setShowChatManager(false);
              }}
              className="w-full mb-4 p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Chat
            </button>
            
            {/* Chat Sessions List */}
            <div className="space-y-2">
              {chatSessions.map((chat) => (
                <div key={chat.id} className={`p-3 rounded-lg border transition-all ${
                  currentSessionId === chat.id 
                    ? 'bg-purple-600/20 border-purple-500' 
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                }`}>
                  {editingChatId === chat.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingChatTitle}
                        onChange={(e) => setEditingChatTitle(e.target.value)}
                        className="flex-1 bg-gray-700 text-white px-2 py-1 rounded text-sm"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            onRenameChat(chat.id, editingChatTitle);
                            setEditingChatId(null);
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          onRenameChat(chat.id, editingChatTitle);
                          setEditingChatId(null);
                        }}
                        className="p-1 text-green-400 hover:bg-green-400/20 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          onSessionChange(chat.id);
                          setShowChatManager(false);
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="text-white font-medium text-sm truncate">{chat.title}</div>
                        <div className="text-gray-400 text-xs">{chat.time} • {chat.messages} messages</div>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingChatId(chat.id);
                            setEditingChatTitle(chat.title);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-400/20 rounded"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteChat(chat.id)}
                          className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-400/20 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Context Info */}
      {chatContext.topic && (
        <div className="p-2 sm:p-3 bg-white/5 text-center text-xs sm:text-sm text-gray-300">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 flex-wrap">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
              <span className="font-bold">Context: </span>
              <span className="text-purple-300">{chatContext.topic}</span>
              {chatContext.intent && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span className="font-bold">Intent: </span>
                  <span className="text-pink-300">{chatContext.intent}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Statistics Panel */}
      {showStats && (
        <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-900/40 to-purple-900/40 backdrop-blur-sm border-b border-blue-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-300" />
              <span className="text-sm font-bold text-white">Chat Statistics</span>
            </div>
            <button
              onClick={() => setShowStats(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Close statistics"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(() => {
              const stats = getChatStatistics();
              return [
                { label: 'Total Messages', value: stats.totalMessages, icon: '💬', color: 'blue' },
                { label: 'Your Messages', value: stats.userMessages, icon: '👤', color: 'purple' },
                { label: 'AI Responses', value: stats.aiMessages, icon: '🤖', color: 'cyan' },
                { label: 'Total Words', value: stats.totalWords, icon: '📝', color: 'green' },
                { label: 'Avg Words/Msg', value: stats.avgWordsPerMessage, icon: '📊', color: 'yellow' },
                { label: 'Documents Used', value: stats.documentsUsed, icon: '📚', color: 'orange' },
                { label: 'Pinned Messages', value: stats.pinnedCount, icon: '📌', color: 'pink' },
                { label: 'Characters', value: stats.totalChars.toLocaleString(), icon: '🔤', color: 'indigo' },
              ].map((stat, idx) => (
                <div key={idx} className={`bg-${stat.color}-500/20 p-3 rounded-lg border border-${stat.color}-500/30`}>
                  <div className="text-xs text-gray-300 mb-1">{stat.icon} {stat.label}</div>
                  <div className={`text-xl sm:text-2xl font-bold text-${stat.color}-200`}>{stat.value}</div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Font Size Control Panel */}
      {showFontControl && (
        <div className="p-3 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Type className="w-4 h-4 text-gray-300" />
              <span className="text-sm font-bold text-white">Font Size</span>
              <div className="flex items-center gap-2">
                {['sm', 'base', 'lg', 'xl'].map(size => (
                  <button
                    key={size}
                    onClick={() => changeFontSize(size)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      fontSize === size
                        ? 'bg-blue-500 text-white font-bold'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {size === 'sm' ? 'A' : size === 'base' ? 'A' : size === 'lg' ? 'A' : 'A'}
                    <span className="text-xs ml-1">{size.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowFontControl(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Pinned Messages Panel */}
      {showPinned && (
        <div className="p-3 sm:p-4 bg-white/10 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-bold text-white">Pinned Messages ({pinnedMessages.length})</span>
            </div>
            <button
              onClick={() => setShowPinned(false)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Close pinned messages"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          {getPinnedMessagesData().length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {getPinnedMessagesData().map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => scrollToMessage(msg.index)}
                  className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-yellow-400/30 transition-all active:scale-95"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-yellow-400">
                      {msg.type === 'user' ? '👤 You' : '🤖 AI'}
                    </span>
                    <span className="text-xs text-gray-400">{msg.time}</span>
                  </div>
                  <div className="text-sm text-gray-200 line-clamp-2">
                    {msg.text.substring(0, 100)}{msg.text.length > 100 ? '...' : ''}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">
              No pinned messages yet. Click the pin icon on any message to pin it.
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      {searchVisible && (
        <div className="p-3 sm:p-4 bg-white/10 backdrop-blur-sm border-b border-white/10">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search in chat..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {currentSearchIndex + 1} / {searchResults.length}
                </span>
                <button
                  onClick={() => navigateSearch(-1)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Previous"
                >
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => navigateSearch(1)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  title="Next"
                >
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}
            <button
              onClick={closeSearch}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Close search"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 p-2 sm:p-4 md:p-6 overflow-y-auto space-y-2 sm:space-y-4 md:space-y-6 min-h-0">
        {isLoadingChat && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader className="animate-spin w-6 h-6 text-purple-400" />
              <span className="text-gray-300">Loading chat messages...</span>
            </div>
          </div>
        )}
        {!isLoadingChat && chatMessages.map((msg, msgIndex) => (
          <div 
            key={msg.id} 
            id={`message-${msgIndex}`}
            className={`flex items-start gap-2 sm:gap-3 md:gap-4 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg ${msg.type === 'user' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-500 to-cyan-400'}`}>
              {msg.type === 'user' ? <User className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" /> : <Brain className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />}
            </div>
            <div className={`p-3 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl shadow-xl max-w-[90%] sm:max-w-[85%] md:max-w-4xl ${msg.type === 'user' ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
              <div className={`prose prose-invert max-w-none ${fontSizeClasses[fontSize]}`}>
                {msg.type === 'user' 
                  ? (searchQuery ? highlightText(msg.text, msgIndex) : msg.text)
                  : renderMessage(msg.text)
                }
              </div>
              <div className="text-[10px] sm:text-xs text-gray-400 mt-2 sm:mt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
                <div className="flex items-center gap-2">
                  <span>{msg.time}</span>
                  {msg.type === 'bot' && (
                    <div className="flex items-center gap-1">
                      {/* Pin/Unpin Button */}
                      <button
                        onClick={() => togglePinMessage(msg.id)}
                        className="p-1 hover:bg-white/10 rounded transition-colors touch-manipulation"
                        title={pinnedMessages.includes(msg.id) ? "Unpin message" : "Pin message"}
                      >
                        {pinnedMessages.includes(msg.id) ? (
                          <Pin className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ) : (
                          <PinOff className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      {speakingMessageId === msg.id && !isPaused ? (
                        <>
                          <button
                            onClick={() => pauseSpeech()}
                            className="p-1 hover:bg-white/10 rounded transition-colors touch-manipulation"
                            title="Pause"
                          >
                            <Pause className="w-4 h-4 text-purple-400" />
                          </button>
                          <button
                            onClick={() => stopSpeech()}
                            className="p-1 hover:bg-white/10 rounded transition-colors touch-manipulation"
                            title="Stop"
                          >
                            <VolumeX className="w-4 h-4 text-red-400" />
                          </button>
                        </>
                      ) : speakingMessageId === msg.id && isPaused ? (
                        <>
                          <button
                            onClick={() => resumeSpeech()}
                            className="p-1 hover:bg-white/10 rounded transition-colors touch-manipulation"
                            title="Resume"
                          >
                            <Play className="w-4 h-4 text-green-400 animate-pulse" />
                          </button>
                          <button
                            onClick={() => stopSpeech()}
                            className="p-1 hover:bg-white/10 rounded transition-colors touch-manipulation"
                            title="Stop"
                          >
                            <VolumeX className="w-4 h-4 text-red-400" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => speakMessage(msg.id, msg.text)}
                          className="p-1 hover:bg-white/10 rounded transition-colors touch-manipulation"
                          title={`Read aloud in ${languageOptions.find(l => l.value === (settings?.language || selectedLanguage))?.label || 'selected language'}`}
                        >
                          <Volume2 className="w-4 h-4 text-blue-400 hover:text-blue-300" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    <FileCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-bold text-[10px] sm:text-xs">Sources:</span>
                    {msg.sources.map((source, idx) => (
                      <span key={idx} className="bg-gray-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-xs">{source}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="p-3 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl shadow-xl bg-gray-800 text-gray-200 rounded-bl-none">
              <div className="flex items-center gap-2">
                <Loader className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area - Mobile Optimized */}
      <div className="p-2 sm:p-3 md:p-4 lg:p-5 bg-white/5 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isTyping && !isListening && handleSendMessage()}
            disabled={isTyping || isListening}
            placeholder={isListening ? "Listening... 🎤" : "Ask anything... 🚀"}
            className="flex-1 bg-gray-800 border-2 border-gray-700 rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-2.5 md:py-3 lg:py-4 text-sm sm:text-base md:text-lg font-medium text-white focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 disabled:opacity-50 touch-manipulation min-w-0"
          />
          {voiceSupported && (
            <button
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              disabled={isTyping}
              className={`p-2.5 sm:p-3 md:p-4 lg:p-5 rounded-xl sm:rounded-2xl shadow-lg active:scale-95 sm:hover:scale-110 transition-all duration-300 disabled:opacity-50 touch-manipulation flex-shrink-0 ${
                isListening 
                  ? 'bg-gradient-to-br from-red-600 to-red-500 animate-pulse' 
                  : 'bg-gradient-to-br from-blue-600 to-cyan-500'
              } text-white`}
              title={isListening ? "Stop recording" : "Start voice input"}
            >
              {isListening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
            </button>
          )}
          <button
            onClick={handleSendMessage}
            disabled={isTyping || isListening}
            className="p-2 sm:p-3 md:p-4 lg:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-lg active:scale-95 sm:hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:saturate-50 touch-manipulation flex-shrink-0"
          >
            {isTyping ? <Loader className="animate-spin w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />}
          </button>
        </div>
        {/* Suggested Questions Panel */}
        {showSuggestions && (
          <div className="mt-3 p-3 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span className="text-sm font-bold text-purple-200">Suggested Questions</span>
              <button
                onClick={() => setShowSuggestions(false)}
                className="ml-auto p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {getSuggestedQuestions().map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(question)}
                  className="text-left text-xs sm:text-sm p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-purple-500/50 transition-all text-gray-200 hover:text-white active:scale-95"
                >
                  <Lightbulb className="w-3 h-3 inline mr-1 text-yellow-400" />
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 sm:mt-3 px-1 sm:px-2 gap-2 sm:gap-0">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-hide w-full sm:w-auto">
            {/* Search Button */}
            <button 
              onClick={() => setSearchVisible(!searchVisible)}
              className={`flex items-center gap-1 text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-lg hover:bg-yellow-500/40 active:bg-yellow-500/60 active:scale-95 transition-all whitespace-nowrap touch-manipulation ${
                searchVisible ? 'bg-yellow-500/40 text-yellow-200' : 'bg-yellow-500/20 text-yellow-300'
              }`}
              title="Search in chat"
            >
              <Search className="w-3 h-3" />
              <span className="hidden sm:inline">Search</span>
            </button>
            {/* Chat Statistics Button */}
            <button 
              onClick={() => setShowStats(!showStats)}
              className={`flex items-center gap-1 text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-lg hover:bg-blue-500/40 active:bg-blue-500/60 active:scale-95 transition-all whitespace-nowrap touch-manipulation ${
                showStats ? 'bg-blue-500/40 text-blue-200' : 'bg-blue-500/20 text-blue-300'
              }`}
              title="View chat statistics"
            >
              <BarChart3 className="w-3 h-3" />
              <span className="hidden sm:inline">Stats</span>
            </button>
            {/* Font Size Button */}
            <button 
              onClick={() => setShowFontControl(!showFontControl)}
              className={`flex items-center gap-1 text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-lg hover:bg-gray-500/40 active:bg-gray-500/60 active:scale-95 transition-all whitespace-nowrap touch-manipulation ${
                showFontControl ? 'bg-gray-500/40 text-gray-200' : 'bg-gray-500/20 text-gray-300'
              }`}
              title="Adjust font size"
            >
              <Type className="w-3 h-3" />
              <span className="hidden sm:inline">Font</span>
            </button>
            {/* Pinned Messages Button */}
            <button 
              onClick={() => setShowPinned(!showPinned)}
              className={`flex items-center gap-1 text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-lg hover:bg-yellow-500/40 active:bg-yellow-500/60 active:scale-95 transition-all whitespace-nowrap touch-manipulation ${
                showPinned ? 'bg-yellow-500/40 text-yellow-200' : 'bg-yellow-500/20 text-yellow-300'
              }`}
              title="View pinned messages"
            >
              <Pin className="w-3 h-3" />
              {pinnedMessages.length > 0 && (
                <span className="bg-yellow-500 text-black rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold">
                  {pinnedMessages.length}
                </span>
              )}
              <span className="hidden sm:inline">Pinned</span>
            </button>
            {/* Suggestions Button */}
            <button 
              onClick={() => setShowSuggestions(!showSuggestions)}
              className={`flex items-center gap-1 text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-lg hover:bg-purple-500/40 active:bg-purple-500/60 active:scale-95 transition-all whitespace-nowrap touch-manipulation ${
                showSuggestions ? 'bg-purple-500/40 text-purple-200' : 'bg-purple-500/20 text-purple-300'
              }`}
              title="Show suggested questions"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Suggestions</span>
            </button>
            <button 
              onClick={() => handleSuggestionClick("Create practice questions from the documents")}
              className="text-[10px] sm:text-xs bg-blue-500/20 text-blue-300 px-2 sm:px-3 py-1 rounded-lg hover:bg-blue-500/40 active:bg-blue-500/60 active:scale-95 transition-all whitespace-nowrap touch-manipulation"
            >
              📚 Exam
            </button>
            <button 
              onClick={() => handleSuggestionClick("Summarize the key points from my documents")}
              className="text-[10px] sm:text-xs bg-cyan-500/20 text-cyan-300 px-2 sm:px-3 py-1 rounded-lg hover:bg-cyan-500/40 active:bg-cyan-500/60 active:scale-95 transition-all whitespace-nowrap touch-manipulation"
            >
              ✨ Summary
            </button>
            <button 
              onClick={() => handleSuggestionClick("Give me practical examples with explanations")}
              className="text-[10px] sm:text-xs bg-green-500/20 text-green-300 px-2 sm:px-3 py-1 rounded-lg hover:bg-green-500/40 active:bg-green-500/60 active:scale-95 transition-all whitespace-nowrap touch-manipulation"
            >
              💡 Examples
            </button>
            
            {/* Chat Manager Button */}
            <button 
              onClick={() => setShowChatManager(true)}
              className="flex items-center gap-1 text-[10px] sm:text-xs bg-purple-500/20 text-purple-300 px-2 sm:px-3 py-1 rounded-lg hover:bg-purple-500/40 active:bg-purple-500/60 active:scale-95 transition-all whitespace-nowrap touch-manipulation"
              title="Manage chat sessions"
            >
              <MessageSquare className="w-3 h-3" />
              <span className="hidden sm:inline">Chats</span>
            </button>
            
            {/* Language Selector - Mobile Optimized */}
            <div className="relative inline-block flex-shrink-0">
              <select
                value={selectedLanguage}
                onChange={async (e) => {
                  const newLanguage = e.target.value;
                  console.log('🌍 Chat language changed to:', newLanguage);
                  
                  // Update local state immediately
                  setSelectedLanguage(newLanguage);
                  
                  // Update settings automatically (but don't block UI)
                  const langName = languageOptions.find(l => l.value === newLanguage)?.label || newLanguage;
                  
                  // Show immediate success notification
                  const notification = document.createElement('div');
                  notification.textContent = `✅ ${langName} - AI will respond in this language`;
                  notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                  document.body.appendChild(notification);
                  setTimeout(() => notification.remove(), 2500);
                  
                  // Language changes work immediately without storage
                }}
                className="appearance-none bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[9px] sm:text-xs font-bold px-1.5 sm:px-3 py-1 pr-5 sm:pr-7 rounded-lg cursor-pointer hover:from-blue-700 hover:to-purple-700 active:scale-95 transition-all whitespace-nowrap touch-manipulation min-w-[60px] sm:min-w-[80px]"
                style={{ colorScheme: 'dark' }}
                title="Select AI Language"
              >
                {languageOptions.map((lang) => (
                  <option key={lang.value} value={lang.value} className="bg-gray-800 text-white py-2">
                    {lang.label}
                  </option>
                ))}
              </select>
              <Globe className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 text-white pointer-events-none" />
            </div>

            

          </div>
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto">
            {/* Share Chat Button */}
            <button
              onClick={shareChat}
              className="flex items-center gap-1 text-[10px] sm:text-xs bg-teal-500/20 text-teal-300 px-2 sm:px-3 py-1 rounded-lg hover:bg-teal-500/40 active:bg-teal-500/60 active:scale-95 transition-all whitespace-nowrap touch-manipulation"
              title="Share chat"
            >
              <Share2 className="w-3 h-3" />
              <span className="hidden sm:inline">Share</span>
            </button>
            {/* Export TXT Button */}
            <button
              onClick={exportChatAsTXT}
              className="flex items-center gap-1 text-[10px] sm:text-xs bg-green-500/20 text-green-300 px-2 sm:px-3 py-1 rounded-lg hover:bg-green-500/40 active:bg-green-500/60 active:scale-95 transition-all whitespace-nowrap touch-manipulation"
              title="Export chat as TXT file"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">TXT</span>
            </button>
            
            {/* Export PDF Button */}
            <button
              onClick={exportChatAsPDF}
              className="flex items-center gap-1 text-[10px] sm:text-xs bg-orange-500/20 text-orange-300 px-2 sm:px-3 py-1 rounded-lg hover:bg-orange-500/40 active:bg-orange-500/60 active:scale-95 transition-all whitespace-nowrap touch-manipulation"
              title="Export chat as PDF"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            
            {/* New Chat Button */}
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1 text-[10px] sm:text-xs bg-green-500/20 text-green-300 px-2 sm:px-3 py-1 rounded-lg hover:bg-green-500/40 active:bg-green-500/60 active:scale-95 transition-all whitespace-nowrap touch-manipulation"
              title="Start new chat"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline">New</span>
            </button>
            
            {/* Copy Chat Button */}
            <button
              onClick={handleCopyChat}
              className="flex items-center gap-1 text-[10px] sm:text-xs bg-cyan-500/20 text-cyan-300 px-2 sm:px-3 py-1 rounded-lg hover:bg-cyan-500/40 active:bg-cyan-500/60 active:scale-95 transition-all whitespace-nowrap touch-manipulation"
              title="Copy chat to clipboard"
            >
              <Copy className="w-3 h-3" />
              <span className="hidden sm:inline">Copy</span>
            </button>
            
            {/* Docs Count */}
            <div className="text-[9px] sm:text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
              {uploadedDocs.filter(d => d.status === 'processed').length} docs
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;