import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, AlertCircle, ExternalLink, Copy, Key, Info, HelpCircle, Shield, FileText, Settings, Sparkles, Globe, Brain, Zap } from 'lucide-react';
import { validateGeminiKey } from '../utils/api';

const SettingsPage = ({ userId }) => {
  const [apiKey, setApiKey] = useState('');
  const [stored, setStored] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const [inputKey, setInputKey] = useState(0);
  const [activeTab, setActiveTab] = useState('api');

  const tabs = [
    { id: 'api', label: 'API Key', icon: Key, color: 'from-orange-400 to-red-500' },
    { id: 'about', label: 'About', icon: Info, color: 'from-blue-400 to-cyan-500' },
    { id: 'faq', label: 'FAQ', icon: HelpCircle, color: 'from-purple-400 to-pink-500' },
    { id: 'privacy', label: 'Privacy', icon: Shield, color: 'from-green-400 to-emerald-500' },
    { id: 'terms', label: 'Terms', icon: FileText, color: 'from-gray-400 to-slate-500' }
  ];

  useEffect(() => {
    const key = `user-api-${userId}`;
    const value = localStorage.getItem(key) || '';
    setApiKey(value);
    setStored(value);
    setInputKey(prev => prev + 1);
  }, [userId]);

  const handleSave = () => {
    const key = `user-api-${userId}`;
    localStorage.setItem(key, apiKey);
    setStored(apiKey);
    alert('✅ API Key saved successfully!');
  };

  const handleLoad = () => {
    const key = `user-api-${userId}`;
    const value = localStorage.getItem(key) || '';
    setApiKey(value);
    setStored(value);
    setValidation(null);
    setInputKey(prev => prev + 1);
    alert('✅ API Key loaded: ' + (value ? value.substring(0, 15) + '...' : 'None'));
  };

  const validateKey = async () => {
    if (!apiKey?.trim()) {
      alert('Please enter your API key first');
      return;
    }

    setValidating(true);
    try {
      const result = await validateGeminiKey(apiKey.trim());
      setValidation(result.valid ? 'valid' : 'invalid');
      
      const notification = document.createElement('div');
      notification.textContent = result.valid ? '✅ API Key is valid and working!' : '❌ Invalid API Key. Please check and try again.';
      notification.className = `fixed top-4 right-4 ${result.valid ? 'bg-green-500' : 'bg-red-500'} text-white px-6 py-3 rounded-xl shadow-2xl z-50 font-bold`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 4000);
    } catch (error) {
      setValidation('invalid');
      alert('❌ Validation failed. Please check your internet connection.');
    } finally {
      setValidating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    const notification = document.createElement('div');
    notification.textContent = '✅ Copied to clipboard!';
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 font-bold';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 rounded-none sm:rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 overflow-hidden shadow-2xl mb-8">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10 text-center space-y-4 sm:space-y-6">
          <div className="inline-block p-3 sm:p-4 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl sm:rounded-3xl shadow-2xl">
            <Settings className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight">
            Settings & Configuration
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto px-4">
            🔧 Configure your AI experience • 🔑 API Keys • 📋 Policies • ❓ Help
          </p>
          
          {/* Status Banner */}
          {!stored?.trim() ? (
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 sm:p-4 rounded-xl mx-4 shadow-lg">
              <div className="flex items-center gap-2 sm:gap-3 justify-center">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-xs sm:text-sm font-bold">
                  ⚠️ Add your personal Gemini API key for unlimited usage!
                </div>
              </div>
            </div>
          ) : validation === 'valid' ? (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 sm:p-4 rounded-xl mx-4 shadow-lg">
              <div className="flex items-center gap-2 sm:gap-3 justify-center">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-xs sm:text-sm font-bold">
                  ✅ Your API key is active - Unlimited usage!
                </div>
              </div>
            </div>
          ) : validation === 'invalid' ? (
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-3 sm:p-4 rounded-xl mx-4 shadow-lg">
              <div className="flex items-center gap-2 sm:gap-3 justify-center">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <div className="text-xs sm:text-sm font-bold">
                  ❌ API key needs validation - Click "Validate Key" below
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl whitespace-nowrap transition-all duration-300 font-bold text-sm sm:text-base ${
                activeTab === tab.id 
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-xl transform scale-105` 
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* API Key Tab */}
        {activeTab === 'api' && (
          <div className="space-y-6 sm:space-y-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl sm:rounded-2xl">
                  <Key className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white">Your Personal Gemini API Key</h2>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Stored securely on your device only</p>
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-4 sm:space-y-6">
                <div className="relative">
                  <label className="block mb-2 sm:mb-3 font-bold text-white text-sm sm:text-base">API Key:</label>
                  <div className="relative">
                    <input
                      key={inputKey}
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full p-3 sm:p-4 bg-gray-700 border-2 border-gray-600 text-white rounded-xl sm:rounded-2xl font-mono focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 pr-12 sm:pr-14 text-sm sm:text-base"
                      placeholder="AIzaSy... (paste your Gemini API key here)"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Validation Status */}
                {validation && (
                  <div className={`flex items-center gap-2 text-sm font-bold p-3 sm:p-4 rounded-xl ${
                    validation === 'valid' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {validation === 'valid' ? (
                      <><CheckCircle className="w-4 h-4" /> API Key is valid and working!</>
                    ) : (
                      <><AlertCircle className="w-4 h-4" /> Invalid API Key. Please check and try again.</>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button 
                    onClick={handleSave} 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                  >
                    💾 Save
                  </button>
                  <button 
                    onClick={handleLoad} 
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                  >
                    📥 Load
                  </button>
                  <button
                    onClick={validateKey}
                    disabled={validating || !apiKey?.trim()}
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {validating ? '⏳ Validating...' : '✅ Validate Key'}
                  </button>
                  <button
                    onClick={() => setShowGuide(!showGuide)}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                  >
                    {showGuide ? '🙈 Hide Guide' : '📖 How to Get Key'}
                  </button>
                </div>

                {/* Current Status - Secure Display */}
                <div className="bg-gray-700/50 p-3 sm:p-4 rounded-xl border border-gray-600">
                  <p className="text-xs sm:text-sm text-gray-400">
                    <span className="font-bold">Status:</span> {stored ? `✅ API Key Set (${stored.length} characters)` : '❌ No API Key'}
                  </p>
                </div>

                {/* Step-by-Step Guide */}
                {showGuide && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-4 sm:p-6 space-y-4">
                    <h3 className="text-lg font-black text-blue-800 flex items-center gap-2">
                      <Key className="w-5 h-5" />
                      How to Get Your Free Gemini API Key
                    </h3>
                    
                    <div className="space-y-3 text-sm text-blue-700">
                      {[
                        { step: 1, title: 'Visit Google AI Studio', content: 'https://ai.google.dev/', copyable: true },
                        { step: 2, title: 'Click "Get API Key" button', content: 'Sign in with your Google account if needed' },
                        { step: 3, title: 'Create a new API key', content: 'Choose "Create API key in new project" for simplicity' },
                        { step: 4, title: 'Copy your API key', content: 'It starts with "AIzaSy..." - copy the entire key' },
                        { step: 5, title: 'Paste it above and click "Validate Key"', content: 'We\'ll test it to make sure it works perfectly' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                            {item.step}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold">{item.title}</p>
                            {item.copyable ? (
                              <div className="flex items-center gap-2 mt-1">
                                <code className="bg-blue-100 px-2 py-1 rounded text-xs font-mono">{item.content}</code>
                                <button
                                  onClick={() => copyToClipboard(item.content)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-blue-600 mt-1">{item.content}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                      <p className="text-green-800 text-xs font-bold flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        🔒 Your API key is stored securely on your device only. No one else can see or use it.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <div className="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl sm:rounded-2xl">
                <Info className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white">About AI Document Analyzer</h2>
            </div>
            
            <div className="space-y-6 text-gray-300">
              <p className="text-base sm:text-lg leading-relaxed">
                A powerful AI-powered Question & Answer system that analyzes documents and provides intelligent responses in 9 languages with text-to-speech capabilities.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    🚀 Key Features
                  </h3>
                  <ul className="space-y-2 text-sm sm:text-base">
                    {[
                      '📄 Document Upload & Analysis (PDF, DOCX, TXT)',
                      '🤖 AI-Powered Q&A with Google Gemini 2.5 Flash',
                      '🌍 9 Languages Support with TTS',
                      '📱 Fully Responsive Design',
                      '💾 Persistent Chat History',
                      '☁️ Cloud Document Storage',
                      '🔑 Personal API Key System'
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-400 mt-1">•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-400" />
                    🛠️ Technology Stack
                  </h3>
                  <ul className="space-y-2 text-sm sm:text-base">
                    {[
                      'Frontend: React 18, Vite, TailwindCSS',
                      'Backend: Node.js, Express.js',
                      'AI: Google Gemini 2.5 Flash API',
                      'Storage: Cloudflare R2, LocalStorage',
                      'Features: Web Speech API, React Markdown'
                    ].map((tech, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{tech}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 sm:p-6 rounded-xl border border-purple-500/30">
                <p className="text-sm font-bold text-center">
                  <strong>Version:</strong> 2.0 | <strong>Author:</strong> Rajan | <strong>License:</strong> MIT
                </p>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <div className="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl sm:rounded-2xl">
                <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white">Frequently Asked Questions</h2>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  q: '❓ Why do I need my own API key?',
                  a: 'Using your personal Gemini API key gives you unlimited usage without rate limits. Google provides free API access with generous quotas, ensuring better performance and no restrictions.'
                },
                {
                  q: '🔒 Is my API key and data secure?',
                  a: 'Yes! Your API key is stored only on your device using localStorage. Your documents and chats are also stored locally and in your personal cloud storage. We never access your data.'
                },
                {
                  q: '📁 What file types are supported?',
                  a: 'We support PDF, DOCX, and TXT files up to 50MB each. The AI can extract text from these formats and analyze the content to answer your questions.'
                },
                {
                  q: '🌍 Which languages are supported?',
                  a: '9 languages with full text-to-speech: English, Hindi, Telugu, Tamil, Malayalam, Bengali, Nepali, Maithili, and Kannada. The AI responds in your selected language.'
                },
                {
                  q: '🤖 How does document analysis work?',
                  a: 'The AI follows a 4-step process: (1) Read all uploaded documents completely, (2) Analyze your question, (3) Search thoroughly in documents, (4) Provide answers from documents or general knowledge.'
                },
                {
                  q: '💰 Is there any cost?',
                  a: 'The application is free! You only need your own Google Gemini API key, which has generous free quotas. Monitor usage in Google Cloud Console.'
                }
              ].map((faq, idx) => (
                <div key={idx} className="bg-white/5 p-4 sm:p-6 rounded-xl border border-white/10">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-3">{faq.q}</h3>
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <div className="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl sm:rounded-2xl">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white">Privacy Policy</h2>
            </div>
            
            <div className="space-y-6 text-gray-300">
              {[
                {
                  title: '🔒 Data Storage & Privacy',
                  content: 'All your personal data (documents, chat history, settings, API keys) is stored locally on your device using browser localStorage and your personal cloud storage. We do not store, access, or transmit any of your personal information to our servers.'
                },
                {
                  title: '🔑 API Key Security',
                  content: 'Your Gemini API key is stored securely in your browser\'s localStorage and is never transmitted to our servers. It\'s used directly by your browser to communicate with Google\'s Gemini API.'
                },
                {
                  title: '📄 Document Processing',
                  content: 'Documents you upload are processed locally and sent directly to Google\'s Gemini API for analysis. We do not store, cache, or access your document content on our servers.'
                },
                {
                  title: '🌐 Third-Party Services',
                  content: 'We use Google Gemini AI for text processing and Cloudflare R2 for document storage. These services have their own privacy policies.'
                },
                {
                  title: '🍪 Cookies & Tracking',
                  content: 'We do not use cookies or tracking scripts. All data persistence is handled through browser localStorage, which stays on your device.'
                }
              ].map((section, idx) => (
                <div key={idx} className="bg-white/5 p-4 sm:p-6 rounded-xl border border-white/10">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-3">{section.title}</h3>
                  <p className="text-sm sm:text-base leading-relaxed">{section.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terms Tab */}
        {activeTab === 'terms' && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <div className="p-2 sm:p-3 md:p-4 bg-gradient-to-br from-gray-400 to-slate-500 rounded-xl sm:rounded-2xl">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white">Terms & Conditions</h2>
            </div>
            
            <div className="space-y-6 text-gray-300">
              {[
                {
                  title: '📋 Usage Terms',
                  content: 'This application is provided free of charge for personal, educational, and commercial use. By using this service, you agree to these terms and conditions.'
                },
                {
                  title: '🔑 API Key Responsibility',
                  content: 'You are responsible for obtaining, securing, and managing your own Google Gemini API key. You are also responsible for any costs associated with API usage.'
                },
                {
                  title: '📄 Content Responsibility',
                  content: 'You are responsible for the content you upload and the questions you ask. Do not upload copyrighted material, sensitive personal information, or content that violates applicable laws.'
                },
                {
                  title: '⚡ Service Availability',
                  content: 'We strive to keep the service available 24/7 but cannot guarantee 100% uptime. The service is provided "as is" without warranties of any kind.'
                },
                {
                  title: '🔄 Changes to Terms',
                  content: 'We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.'
                },
                {
                  title: '⚖️ Limitation of Liability',
                  content: 'We are not liable for any damages arising from the use of this service, including but not limited to data loss, API costs, or service interruptions.'
                }
              ].map((section, idx) => (
                <div key={idx} className="bg-white/5 p-4 sm:p-6 rounded-xl border border-white/10">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-3">{section.title}</h3>
                  <p className="text-sm sm:text-base leading-relaxed">{section.content}</p>
                </div>
              ))}
              
              <div className="bg-gradient-to-r from-gray-500/20 to-slate-500/20 p-4 sm:p-6 rounded-xl border border-gray-500/30">
                <p className="text-sm font-bold text-center">
                  <strong>Last Updated:</strong> January 2024 | <strong>Effective Date:</strong> January 2024
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;