import React, { useState, useEffect, useRef } from 'react';
import { Send, Brain, User, Target, FileCheck, Loader, Volume2, VolumeX, Pause, Play, Globe, Trash2, Copy, Mic, MicOff, Download, Search, X, ChevronUp, ChevronDown, Lightbulb, Sparkles, Pin, PinOff, BarChart3, Share2, Type, Plus, Minus } from 'lucide-react';
import { sendMessage, saveChatSession, incrementStat, logActivity } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatPage = ({ sessionId, uploadedDocs, userId, setStats, settings }) => {
  const [chatMessages, setChatMessages] = useState([
    { 
      id: 1, 
      type: 'bot', 
      text: 'Hello! 👋 I\'m your AI Document Analyzer. Upload your documents and ask me anything! I remember context and can help with exam prep too!', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatContext, setChatContext] = useState({
    topic: null,
    intent: null
  } || {});
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(settings?.language || 'en');
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
  const chatEndRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const recognitionRef = useRef(null);
  const searchResultRefs = useRef([]);

  // Update selected language when settings change
  useEffect(() => {
    if (settings?.language) {
      setSelectedLanguage(settings.language);
    }
  }, [settings]);

  const languageOptions = [
    { value: 'en', label: '🇬🇧 English' },
    { value: 'hi', label: '🇮🇳 Hindi' },
    { value: 'te', label: '🇮🇳 Telugu' },
    { value: 'ta', label: '🇮🇳 Tamil' },
    { value: 'ml', label: '🇮🇳 Malayalam' },
    { value: 'bn', label: '🇮🇳 Bengali' },
    { value: 'ne', label: '🇳🇵 Nepali' },
    { value: 'mai', label: '🇮🇳 Maithili' }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Text-to-Speech functions
  const detectLanguageFromText = (text) => {
    // Detect language from text content
    const hindiPattern = /[\u0900-\u097F]/;
    const teluguPattern = /[\u0C00-\u0C7F]/;
    const tamilPattern = /[\u0B80-\u0BFF]/;
    const malayalamPattern = /[\u0D00-\u0D7F]/;
    const bengaliPattern = /[\u0980-\u09FF]/;
    const nepaliPattern = /[\u0900-\u097F]/; // Uses Devanagari like Hindi
    
    if (hindiPattern.test(text)) return 'hi';
    if (teluguPattern.test(text)) return 'te';
    if (tamilPattern.test(text)) return 'ta';
    if (malayalamPattern.test(text)) return 'ml';
    if (bengaliPattern.test(text)) return 'bn';
    if (nepaliPattern.test(text)) return 'ne';
    
    return settings?.language || 'en';  // Fallback to user's selected language
  };

  const getIndianFemaleVoice = (language) => {
    const voices = window.speechSynthesis.getVoices();
    
    if (voices.length === 0) {
      // Voices not loaded yet, try again after a delay
      console.warn('\ud83d� Voices not loaded yet, using default');
      return null;
    }
    
    // Language code mapping for speech synthesis
    const langCodeMap = {
      'en': ['en-IN', 'en-US', 'en-GB'],
      'hi': ['hi-IN', 'hi'],
      'te': ['te-IN', 'te'],
      'ta': ['ta-IN', 'ta'],
      'ml': ['ml-IN', 'ml'],
      'bn': ['bn-IN', 'bn-BD', 'bn'],
      'ne': ['ne-NP', 'ne'],
      'mai': ['hi-IN', 'hi'] // Maithili uses Hindi voice
    };
    
    const langCodes = langCodeMap[language] || ['en-IN'];
    
    console.log('\ud83c\udf99\ufe0f Searching voice for:', language, 'codes:', langCodes);
    console.log('\ud83d� Available voices:', voices.map(v => `${v.name} (${v.lang})`));
    
    // Priority 1: Exact language match with female voice
    for (const code of langCodes) {
      const voice = voices.find(v => 
        v.lang.toLowerCase() === code.toLowerCase() && 
        (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman'))
      );
      if (voice) {
        console.log('\u2705 Found female voice:', voice.name, voice.lang);
        return voice;
      }
    }
    
    // Priority 2: Language prefix match (any gender)
    for (const code of langCodes) {
      const voice = voices.find(v => 
        v.lang.toLowerCase().startsWith(code.split('-')[0])
      );
      if (voice) {
        console.log('\u2705 Found language voice:', voice.name, voice.lang);
        return voice;
      }
    }
    
    // Priority 3: Google voices (they support many languages)
    for (const code of langCodes) {
      const voice = voices.find(v => 
        v.name.toLowerCase().includes('google') &&
        v.lang.toLowerCase().startsWith(code.split('-')[0])
      );
      if (voice) {
        console.log('\u2705 Found Google voice:', voice.name, voice.lang);
        return voice;
      }
    }
    
    // Priority 4: Any Indian voice as fallback
    const indianVoice = voices.find(v => v.lang.includes('IN'));
    if (indianVoice) {
      console.log('\u26a0\ufe0f Using Indian fallback voice:', indianVoice.name, indianVoice.lang);
      return indianVoice;
    }
    
    // Priority 5: Default voice
    console.log('\u26a0\ufe0f Using default voice:', voices[0]?.name, voices[0]?.lang);
    return voices[0];
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
    
    // Clean text from markdown
    const cleanText = stripMarkdown(text);
    
    // Detect language from text content (auto-detect)
    const detectedLanguage = detectLanguageFromText(cleanText);
    console.log('\ud83c\udf10 Detected language from text:', detectedLanguage);
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Try to load voices if not loaded yet
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Wait for voices to load
      window.speechSynthesis.onvoiceschanged = () => {
        const voice = getIndianFemaleVoice(detectedLanguage);
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        }
        window.speechSynthesis.speak(utterance);
      };
      // Trigger voice loading
      window.speechSynthesis.getVoices();
    } else {
      const voice = getIndianFemaleVoice(detectedLanguage);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
        console.log('\ud83d� Using voice:', voice.name, 'for language:', voice.lang);
      } else {
        console.warn('\u26a0\ufe0f No voice found, using default');
      }
    }
    
    // Speech parameters for natural accent
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.1; // Slightly higher for female voice
    utterance.volume = 1.0;
    
    utterance.onstart = () => {
      setSpeakingMessageId(messageId);
      setIsPaused(false);
      console.log('\u25b6\ufe0f Speech started in language:', utterance.lang);
    };
    
    utterance.onend = () => {
      setSpeakingMessageId(null);
      setIsPaused(false);
      console.log('\u23f9\ufe0f Speech ended');
    };
    
    utterance.onerror = (error) => {
      setSpeakingMessageId(null);
      setIsPaused(false);
      console.error('\u274c Speech error:', error);
    };
    
    speechSynthesisRef.current = utterance;
    
    // Speak if voices are already loaded
    if (voices.length > 0) {
      window.speechSynthesis.speak(utterance);
    }
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

  // Load voices on component mount
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Cleanup on unmount
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Clear chat function
  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear all chat messages?')) {
      setChatMessages([{
        id: 1,
        type: 'bot',
        text: 'Hello! 👋 I\'m your AI Document Analyzer. Upload your documents and ask me anything! I remember context and can help with exam prep too!',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: []
      }]);
      setChatContext({ topic: null, intent: null });
      // Show success message
      const notification = document.createElement('div');
      notification.textContent = '✅ Chat cleared successfully!';
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
        const sources = msg.sources?.length > 0 ? `\n\n📚 Sources: ${msg.sources.map(s => typeof s === 'object' ? `Page ${s.page}` : s).join(', ')}` : '';
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
          <strong>📚 Sources:</strong> ${msg.sources.map(s => typeof s === 'object' ? `Page ${s.page}` : s).join(', ')}
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
    if (chatContext?.topic) {
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
        return `${sender} (${msg.time}):\n${msg.text}\n${msg.sources?.length > 0 ? 'Sources: ' + msg.sources.map(s => typeof s === 'object' ? `Page ${s.page}` : s).join(', ') : ''}`;
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

    const userMessage = {
      id: chatMessages.length + 1,
      type: 'user',
      text: inputMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages([...chatMessages, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const processedDocs = uploadedDocs
        .filter(doc => doc.status === 'processed')
        .map(doc => ({ id: doc.id, name: doc.name, pages: doc.pages }));

      const language = selectedLanguage || 'en';
      console.log('🌍 Selected Language:', language, 'From:', selectedLanguage);
      
      const response = await sendMessage(
        inputMessage,
        sessionId,
        processedDocs,
        chatContext,
        language
      );

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: response.message || response.response,
        rawText: response.rawResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: response.sources || [],
        confidence: response.confidence,
        metadata: response.metadata || {}
      };

      // Debug: Check if sources are received
      if (response.sources && response.sources.length > 0) {
        console.log('📄 Sources received:', response.sources);
      } else {
        console.log('⚠️ No sources in response');
      }

      setChatMessages(prev => [...prev, botMessage]);
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
        await saveChatSession(userId, sessionId, chatTitle, [...chatMessages, userMessage, botMessage]);
      } catch (statError) {
        console.error('Failed to update stats:', statError);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: chatMessages.length + 2,
        type: 'bot',
        text: 'Sorry, I encountered an error. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: []
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const extractChatTitle = (messages) => {
    // Extract title from first user message
    const firstUserMsg = messages.find(m => m.type === 'user');
    if (firstUserMsg) {
      const title = firstUserMsg.text.substring(0, 50);
      return title.length < firstUserMsg.text.length ? title + '...' : title;
    }
    return 'Untitled Chat';
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
            
            // Paragraphs with spacing - larger font like Claude
            p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-gray-100 text-base" {...props} />,
            
            // Bold text - prominent like Claude
            strong: ({node, ...props}) => <strong className="font-semibold text-white" {...props} />,
            
            // Italic text
            em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
            
            // Unordered lists
            ul: ({node, ...props}) => <ul className="list-none space-y-2 mb-4 ml-2" {...props} />,
            
            // Ordered lists
            ol: ({node, ...props}) => <ol className="list-none space-y-2 mb-4 ml-2" {...props} />,
            
            // List items with custom bullets - clean like Claude
            li: ({node, ordered, index, ...props}) => (
              <li className="flex items-start gap-3 text-gray-100" {...props}>
                <span className="text-gray-400 font-normal mt-1 select-none">{ordered ? '•' : '•'}</span>
                <span className="flex-1 leading-relaxed">{props.children}</span>
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
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-120px)] bg-gradient-to-br from-gray-900 to-black rounded-none md:rounded-2xl shadow-2xl overflow-hidden">

      {/* Context Info */}
      {chatContext?.topic && (
        <div className="p-2 sm:p-3 bg-white/5 text-center text-xs sm:text-sm text-gray-300">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 flex-wrap">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
              <span className="font-bold">Context: </span>
              <span className="text-purple-300">{chatContext?.topic}</span>
              {chatContext?.intent && (
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
      <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto space-y-3 sm:space-y-4 md:space-y-6">
        {chatMessages.map((msg, msgIndex) => (
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
              <div className="text-[10px] sm:text-xs text-gray-400 mt-2 sm:mt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
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
                          title="Read aloud (Indian female voice)"
                        >
                          <Volume2 className="w-4 h-4 text-blue-400 hover:text-blue-300" />
                        </button>
                      )}
                      </div>
                    )}
                  </div>
                  
                  {/* AI Metadata Badges */}
                  {msg.type === 'bot' && msg.metadata && (
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      {/* Classification Badge */}
                      {msg.metadata.classification && (
                        <span className="bg-blue-900/40 border border-blue-600/50 text-blue-300 px-2 py-0.5 rounded-full font-medium text-[10px] sm:text-xs flex items-center gap-1">
                          <span className="text-xs">🎯</span>
                          <span className="capitalize">{msg.metadata.classification.replace('_', ' ')}</span>
                        </span>
                      )}
                      
                      {/* Search Strategy Badge */}
                      {msg.metadata.searchStrategy && (
                        <span className="bg-green-900/40 border border-green-600/50 text-green-300 px-2 py-0.5 rounded-full font-medium text-[10px] sm:text-xs flex items-center gap-1">
                          <span className="text-xs">🔍</span>
                          <span className="capitalize">{msg.metadata.searchStrategy.replace('_', ' ')}</span>
                        </span>
                      )}
                      
                      {/* Hybrid Search Badge */}
                      {msg.metadata.usedHybridSearch && (
                        <span className="bg-purple-900/40 border border-purple-600/50 text-purple-300 px-2 py-0.5 rounded-full font-medium text-[10px] sm:text-xs flex items-center gap-1">
                          <span className="text-xs">⚡</span>
                          <span>Hybrid Search</span>
                        </span>
                      )}
                      
                      {/* Results Count */}
                      {msg.metadata.resultsFound !== undefined && (
                        <span className="bg-gray-800/60 border border-gray-600/50 text-gray-300 px-2 py-0.5 rounded-full font-medium text-[10px] sm:text-xs flex items-center gap-1">
                          <span className="text-xs">📊</span>
                          <span>{msg.metadata.resultsFound} results</span>
                        </span>
                      )}
                      
                      {/* Confidence Score */}
                      {msg.confidence && (
                        <span className={`px-2 py-0.5 rounded-full font-medium text-[10px] sm:text-xs flex items-center gap-1 ${
                          msg.confidence >= 0.8 ? 'bg-emerald-900/40 border border-emerald-600/50 text-emerald-300' :
                          msg.confidence >= 0.6 ? 'bg-yellow-900/40 border border-yellow-600/50 text-yellow-300' :
                          'bg-orange-900/40 border border-orange-600/50 text-orange-300'
                        }`}>
                          <span className="text-xs">📈</span>
                          <span>{Math.round(msg.confidence * 100)}% confident</span>
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Document sources with enhanced information */}
                  {msg.type === 'bot' && msg.sources && msg.sources.length > 0 && (() => {
                    // Group sources by document name
                    const groupedSources = {};
                    msg.sources.forEach(source => {
                      if (typeof source === 'object') {
                        const docName = source.documentName || 'Document';
                        if (!groupedSources[docName]) {
                          groupedSources[docName] = [];
                        }
                        groupedSources[docName].push(source);
                      }
                    });
                    
                    return (
                      <div className="mt-2 space-y-1.5">
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
                                  <div className="font-semibold text-purple-300 text-xs sm:text-sm truncate">{docName}</div>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {sources.slice(0, 5).map((source, sIdx) => (
                                      <span key={sIdx} className="bg-purple-900/40 border border-purple-600/50 text-purple-200 px-1.5 py-0.5 rounded text-[10px] sm:text-xs flex items-center gap-1">
                                        <span>Page {source.page}</span>
                                        {source.relevance !== undefined && (
                                          <span className="opacity-60" title="Relevance Score">
                                            ({Math.round(source.relevance * 100)}%)
                                          </span>
                                        )}
                                      </span>
                                    ))}
                                    {sources.length > 5 && (
                                      <span className="text-purple-400 text-[10px] sm:text-xs opacity-75">+{sources.length - 5} more</span>
                                    )}
                                  </div>
                                  {/* Show keyword vs semantic scores for first source */}
                                  {msg.metadata?.usedHybridSearch && sources[0]?.keywordScore !== undefined && sources[0]?.semanticScore !== undefined && (
                                    <div className="mt-1.5 flex gap-2 text-[9px] sm:text-[10px]">
                                      <span className="text-blue-400 opacity-75" title="Keyword Match Score">
                                        🔤 {Math.round(sources[0].keywordScore * 100)}%
                                      </span>
                                      <span className="text-cyan-400 opacity-75" title="Semantic Similarity Score">
                                        🧠 {Math.round(sources[0].semanticScore * 100)}%
                                      </span>
                                    </div>
                                  )}
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
      <div className="p-2 sm:p-3 md:p-5 bg-white/5 border-t border-white/10">
        <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isTyping && !isListening && handleSendMessage()}
            disabled={isTyping || isListening}
            placeholder={isListening ? "Listening... 🎤" : "Ask anything... 🚀"}
            className="flex-1 bg-gray-800 border-2 border-gray-700 rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-medium text-white focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 disabled:opacity-50 touch-manipulation"
          />
          {voiceSupported && (
            <button
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              disabled={isTyping}
              className={`p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl shadow-lg active:scale-95 sm:hover:scale-110 transition-all duration-300 disabled:opacity-50 touch-manipulation ${
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
            className="p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-lg active:scale-95 sm:hover:scale-110 transition-all duration-300 disabled:opacity-50 disabled:saturate-50 touch-manipulation"
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
        
        <div className="flex justify-between items-center mt-2 sm:mt-3 px-1 sm:px-2">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-hide">
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
            
            {/* Language Selector */}
            <div className="relative inline-block">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="appearance-none bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 pr-6 sm:pr-7 rounded-lg cursor-pointer hover:from-blue-700 hover:to-purple-700 active:scale-95 active:from-blue-800 active:to-purple-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 whitespace-nowrap touch-manipulation"
                style={{
                  colorScheme: 'dark'
                }}
                title="Select AI Response Language"
              >
                {languageOptions.map((lang) => (
                  <option 
                    key={lang.value} 
                    value={lang.value}
                    className="bg-gray-800 text-white font-bold py-2"
                  >
                    {lang.label}
                  </option>
                ))}
              </select>
              <Globe className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-white pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            
            {/* Clear Chat Button */}
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1 text-[10px] sm:text-xs bg-red-500/20 text-red-300 px-2 sm:px-3 py-1 rounded-lg hover:bg-red-500/40 active:bg-red-500/60 active:scale-95 transition-all whitespace-nowrap touch-manipulation"
              title="Clear all chat messages"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Clear</span>
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
            <div className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">
              {uploadedDocs.filter(d => d.status === 'processed').length} docs
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;