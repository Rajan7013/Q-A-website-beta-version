import React, { useState, useEffect } from 'react';
import { Upload, MessageSquare, FileText, Clock, GraduationCap, Brain, Sparkles, Zap, Target, Shield, ChevronRight, Globe, Volume2, Download, Search, Pin, BarChart3, Share2, Type, Mic, Copy, Trash2, BookOpen, FileCheck, TrendingUp, Award, Rocket, Star, Check, ArrowRight } from 'lucide-react';
import { getRecentChats } from '../utils/api';

const HomePage = ({ setCurrentPage, uploadedDocs, userId, stats }) => {
  const [recentChats, setRecentChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);

  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const chats = await getRecentChats(userId, 4);
        setRecentChats(chats);
      } catch (error) {
        console.error('Failed to fetch recent chats:', error);
        setRecentChats([]);
      } finally {
        setLoadingChats(false);
      }
    };

    fetchRecentChats();
  }, [userId]);

  // Complete Features - All implemented features
  const completeFeatures = [
    { icon: Zap, title: 'Hybrid Search', desc: '90-95% accuracy with semantic + keyword search', color: 'from-purple-600 to-pink-600', emoji: '⚡' },
    { icon: Brain, title: 'Smart AI Chat', desc: 'Context-aware conversations with memory', color: 'from-purple-500 to-pink-600', emoji: '🧠' },
    { icon: Target, title: 'Query Classification', desc: '15+ question types auto-detected', color: 'from-blue-600 to-cyan-600', emoji: '🎯' },
    { icon: FileCheck, title: 'Document Analysis', desc: 'Upload & analyze PDF, DOCX, TXT files', color: 'from-blue-500 to-cyan-600', emoji: '📄' },
    { icon: GraduationCap, title: 'Exam Preparation', desc: 'Tailored study assistance & Q&A', color: 'from-green-500 to-emerald-600', emoji: '🎓' },
    { icon: Globe, title: '8 Languages', desc: 'Multilingual support (Hindi, Telugu, etc.)', color: 'from-orange-500 to-red-600', emoji: '🌍' },
    { icon: Volume2, title: 'Text-to-Speech', desc: 'Listen to AI responses in Indian voices', color: 'from-teal-500 to-blue-600', emoji: '🔊' },
    { icon: Mic, title: 'Voice Input', desc: 'Speak your questions naturally', color: 'from-yellow-500 to-orange-600', emoji: '🎤' },
    { icon: Download, title: 'Export Chat', desc: 'PDF & TXT with formatting', color: 'from-green-500 to-teal-600', emoji: '📥' },
    { icon: Search, title: 'Search in Chat', desc: 'Find & highlight messages instantly', color: 'from-purple-500 to-indigo-600', emoji: '🔍' },
    { icon: Pin, title: 'Pin Messages', desc: 'Save important responses', color: 'from-yellow-500 to-amber-600', emoji: '📌' },
    { icon: Sparkles, title: 'Smart Suggestions', desc: 'Context-aware question ideas', color: 'from-pink-500 to-rose-600', emoji: '✨' },
    { icon: BarChart3, title: 'Chat Statistics', desc: 'Track words, messages & analytics', color: 'from-blue-500 to-indigo-600', emoji: '📊' },
    { icon: Type, title: 'Font Control', desc: 'Adjust text size (4 options)', color: 'from-gray-500 to-slate-600', emoji: '🔤' },
    { icon: Share2, title: 'Share Chat', desc: 'Export & share conversations', color: 'from-teal-500 to-cyan-600', emoji: '🔗' },
    { icon: Copy, title: 'Copy Chat', desc: 'One-click clipboard copy', color: 'from-indigo-500 to-purple-600', emoji: '📋' },
    { icon: Trash2, title: 'Clear Chat', desc: 'Reset conversation anytime', color: 'from-red-500 to-pink-600', emoji: '🗑️' },
  ];

  // Unique Features - What makes us special
  const uniqueFeatures = [
    { 
      icon: Zap, 
      title: '90-95% Accuracy with Hybrid Search', 
      desc: 'Industry-leading search combining keyword matching with semantic understanding. Finds answers even with synonyms and paraphrasing.',
      color: 'from-purple-600 to-pink-600',
      emoji: '⚡',
      features: ['Hybrid search', '15+ question types', 'Cross-encoder reranking']
    },
    { 
      icon: Shield, 
      title: 'Document-First Approach', 
      desc: 'AI reads your documents completely before answering. Always prioritizes your uploaded content over general knowledge.',
      color: 'from-purple-500 to-pink-500',
      emoji: '📄',
      features: ['15K chars per doc', 'Source attribution', '📄/🧠 indicators']
    },
    { 
      icon: Globe, 
      title: 'True Multilingual', 
      desc: 'Entire AI responses in 8 Indian languages. Not just translation - native language understanding and generation.',
      color: 'from-blue-500 to-cyan-500',
      emoji: '🌐',
      features: ['8 languages', 'Real-time switching', 'Native accent TTS']
    },
    { 
      icon: Brain, 
      title: 'Intelligent Classification', 
      desc: 'Automatically detects question type and optimizes search strategy. Understands factual, conceptual, technical queries and more.',
      color: 'from-green-500 to-teal-500',
      emoji: '🧠',
      features: ['15+ question types', 'Intent detection', 'Smart optimization']
    },
    { 
      icon: Rocket, 
      title: 'Gemini 2.5 Flash', 
      desc: 'Powered by Google\'s latest AI model. Lightning-fast responses with perfect markdown formatting.',
      color: 'from-orange-500 to-red-500',
      emoji: '🚀',
      features: ['8192 tokens output', 'Markdown support', 'Code highlighting']
    },
  ];

  // Smart AI Features
  const smartFeatures = [
    { icon: Zap, title: 'Hybrid Search', desc: '90-95% accuracy', color: 'bg-purple-600' },
    { icon: Target, title: 'Query Classification', desc: '15+ question types', color: 'bg-purple-500' },
    { icon: Sparkles, title: 'Smart Suggestions', desc: 'Context-aware questions', color: 'bg-pink-500' },
    { icon: BookOpen, title: 'Exam Mode', desc: 'Study assistance & prep', color: 'bg-blue-500' },
    { icon: TrendingUp, title: 'Analytics', desc: 'Track your learning', color: 'bg-green-500' },
    { icon: Award, title: 'Semantic Search', desc: 'Understands meaning', color: 'bg-cyan-500' },
  ];

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section with Animations */}
      <div className="relative bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 rounded-3xl p-8 md:p-16 overflow-hidden shadow-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl animate-ping" style={{ animationDuration: '3s' }}></div>
        
        {/* Floating Icons Animation */}
        <div className="absolute top-10 left-10 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }}>
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
            <Brain className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="absolute top-20 right-20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}>
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
            <Sparkles className="w-8 h-8 text-yellow-300" />
          </div>
        </div>
        <div className="absolute bottom-20 left-20 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3s' }}>
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
            <Rocket className="w-8 h-8 text-orange-300" />
          </div>
        </div>
        <div className="absolute bottom-10 right-10 animate-bounce" style={{ animationDelay: '2s', animationDuration: '3s' }}>
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl">
            <Award className="w-8 h-8 text-green-300" />
          </div>
        </div>
        
        <div className="relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full text-white font-bold text-sm animate-pulse">
            <Rocket className="w-5 h-5 text-yellow-300" />
            <span>⚡ Powered by Gemini 2.0 Flash</span>
            <Sparkles className="w-5 h-5 text-orange-300" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight animate-fade-in">
            Analyze Documents with
            <span className="block bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent mt-2 animate-gradient">
              AI Intelligence 🚀
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            🎯 Upload, Ask, Learn! • 🌍 8 Languages • 🧠 Context Memory • 📄 Document-First
          </p>
          
          {/* Feature Highlights */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {['15+ Features', '📊 Analytics', '🎤 Voice', '🔊 TTS', '📥 Export', '🔍 Search'].map((badge, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-bold border border-white/20">
                {badge}
              </div>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center pt-6">
            <button 
              onClick={() => setCurrentPage('upload')}
              className="group bg-white text-purple-600 px-8 md:px-12 py-4 md:py-6 rounded-2xl font-black text-base md:text-xl shadow-2xl transform hover:scale-110 transition-all duration-300 hover:shadow-purple-500/50 flex items-center justify-center space-x-3"
            >
              <Upload className="w-6 h-6 group-hover:animate-bounce" />
              <span>Upload Documents</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
            <button 
              onClick={() => setCurrentPage('chat')}
              className="group bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 md:px-12 py-4 md:py-6 rounded-2xl font-black text-base md:text-xl shadow-2xl transform hover:scale-110 transition-all duration-300 hover:shadow-orange-500/50 flex items-center justify-center space-x-3"
            >
              <MessageSquare className="w-6 h-6 group-hover:animate-bounce" />
              <span>Start Chatting</span>
              <Sparkles className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 max-w-4xl mx-auto">
            {[
              { icon: FileText, label: 'Documents', value: uploadedDocs?.length || 0, color: 'text-blue-300' },
              { icon: MessageSquare, label: 'Messages', value: stats?.questionsAnswered || 0, color: 'text-green-300' },
              { icon: Clock, label: 'Hours Saved', value: stats?.studyHours || 0, color: 'text-orange-300' },
              { icon: GraduationCap, label: 'Sessions', value: stats?.conversations || 0, color: 'text-pink-300' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl md:text-3xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-white/70 font-bold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unique Features Section - What Makes Us Special */}
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-full text-white font-bold text-sm">
            ⭐ UNIQUE FEATURES
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            What Makes Us <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">Special</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Industry-leading features that set us apart from the competition
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {uniqueFeatures.map((feature, idx) => (
            <div key={idx} className={`relative bg-gradient-to-br ${feature.color} p-8 rounded-3xl shadow-2xl overflow-hidden group hover:scale-105 transition-all duration-300`}>
              {/* Animated Background */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-5xl">{feature.emoji}</div>
                </div>
                
                <h3 className="text-2xl font-black text-white">{feature.title}</h3>
                <p className="text-white/90 text-base leading-relaxed">{feature.desc}</p>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {feature.features.map((item, i) => (
                    <div key={i} className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Features Section - All 15 Features */}
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-block bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-2 rounded-full text-white font-bold text-sm">
            🎯 ALL FEATURES
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Complete <span className="bg-gradient-to-r from-green-300 to-blue-400 bg-clip-text text-transparent">Feature Set</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            15+ powerful features to enhance your document analysis experience
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {completeFeatures.map((feature, idx) => (
            <div key={idx} className={`group bg-gradient-to-br ${feature.color} p-6 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-110 hover:-rotate-2 transition-all duration-300 cursor-pointer`}>
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="text-4xl animate-bounce" style={{ animationDelay: `${idx * 0.1}s`, animationDuration: '2s' }}>
                  {feature.emoji}
                </div>
                <feature.icon className="w-8 h-8 text-white group-hover:scale-125 transition-transform" />
                <h3 className="text-base font-black text-white leading-tight">{feature.title}</h3>
                <p className="text-xs text-white/80 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart AI Features Section */}
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-block bg-gradient-to-r from-pink-500 to-purple-500 px-6 py-2 rounded-full text-white font-bold text-sm">
            🧠 AI INTELLIGENCE
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Smart <span className="bg-gradient-to-r from-pink-300 to-purple-400 bg-clip-text text-transparent">AI Features</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Powered by advanced AI for intelligent document understanding
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {smartFeatures.map((feature, idx) => (
            <div key={idx} className="group relative overflow-hidden rounded-2xl">
              <div className={`${feature.color} p-6 text-white transform group-hover:scale-110 transition-all duration-300 h-full`}>
                <div className="flex flex-col items-center text-center space-y-3">
                  <feature.icon className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                  <h3 className="text-sm font-black">{feature.title}</h3>
                  <p className="text-xs opacity-90 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-3xl p-8 backdrop-blur-sm border border-white/10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white mb-2">Your Progress</h2>
          <p className="text-gray-400">Track your learning journey</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Documents Analyzed', value: (stats?.documentsAnalyzed || 0).toLocaleString(), icon: FileText, color: 'from-blue-400 to-cyan-500', emoji: '📄' },
            { label: 'Questions Answered', value: (stats?.questionsAnswered || 0).toLocaleString(), icon: MessageSquare, color: 'from-green-400 to-emerald-500', emoji: '💬' },
            { label: 'Study Hours Saved', value: (stats?.studyHours || 0).toLocaleString(), icon: Clock, color: 'from-orange-400 to-red-500', emoji: '⏱️' },
            { label: 'Conversations', value: (stats?.conversations || 0).toLocaleString(), icon: GraduationCap, color: 'from-purple-400 to-pink-500', emoji: '🎓' }
          ].map((stat, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${stat.color} p-6 rounded-2xl text-white shadow-xl transform hover:scale-110 hover:rotate-3 transition-all duration-300 cursor-pointer`}>
              <div className="text-3xl mb-2">{stat.emoji}</div>
              <stat.icon className="w-8 h-8 mb-3 opacity-80" />
              <div className="text-3xl md:text-4xl font-black mb-1">{stat.value}</div>
              <div className="text-xs font-bold opacity-90">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-2">
              Recent <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">Conversations</span>
            </h2>
            <p className="text-gray-400">Continue where you left off</p>
          </div>
          <button 
            onClick={() => setCurrentPage('chat')}
            className="group bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-110 transition-all duration-300 flex items-center gap-2"
          >
            <span>View All</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </button>
        </div>

        {loadingChats ? (
          <div className="text-center py-16 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-3xl border border-white/10">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
              <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-xl font-bold text-white mb-2">Loading conversations...</p>
            <p className="text-gray-400">Please wait a moment</p>
          </div>
        ) : recentChats.length === 0 ? (
          <div className="relative text-center py-16 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-3xl border-2 border-dashed border-white/20 overflow-hidden group hover:border-white/40 transition-colors">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-colors"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="inline-block p-6 bg-white/5 rounded-full">
                <MessageSquare className="w-16 h-16 text-purple-400 animate-pulse" />
              </div>
              <div>
                <p className="text-2xl font-black text-white mb-2">No conversations yet</p>
                <p className="text-gray-400 text-lg">Start chatting to see your history here!</p>
              </div>
              <button 
                onClick={() => setCurrentPage('chat')}
                className="group inline-flex items-center gap-3 mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-10 py-4 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-110 transition-all duration-300"
              >
                <MessageSquare className="w-6 h-6 group-hover:animate-bounce" />
                <span>Start Your First Chat</span>
                <Sparkles className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentChats.map((chat, idx) => (
              <div 
                key={chat.id} 
                className={`group relative bg-gradient-to-br ${chat.color} p-8 rounded-3xl shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-rotate-1 transition-all duration-300 cursor-pointer overflow-hidden`} 
                onClick={() => setCurrentPage('chat')}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:blur-3xl transition-all"></div>
                
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="text-white/90 text-xs font-bold">{chat.time}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-white/60 group-hover:translate-x-2 group-hover:text-white transition-all" />
                  </div>
                  
                  <h3 className="text-2xl font-black text-white leading-tight group-hover:text-yellow-200 transition-colors">
                    {chat.title}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-white/80 text-sm font-bold">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      <span>{chat.messages} messages</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Recent</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call to Action Section */}
      <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-3xl p-12 text-center overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-yellow-300/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
            Ready to Get Started? 🚀
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Upload your documents and experience the power of AI-driven analysis
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button 
              onClick={() => setCurrentPage('upload')}
              className="group bg-white text-purple-600 px-10 py-5 rounded-2xl font-black text-lg shadow-2xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <Upload className="w-6 h-6 group-hover:animate-bounce" />
              <span>Upload Now</span>
            </button>
            <button 
              onClick={() => setCurrentPage('chat')}
              className="group bg-black/30 backdrop-blur-sm text-white px-10 py-5 rounded-2xl font-black text-lg border-2 border-white/30 hover:border-white hover:bg-black/40 transform hover:scale-110 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <MessageSquare className="w-6 h-6 group-hover:animate-bounce" />
              <span>Start Chatting</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;