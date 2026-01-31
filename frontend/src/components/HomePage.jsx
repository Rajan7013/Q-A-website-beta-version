import React, { useState, useEffect } from 'react';
import {
  Upload, MessageSquare, FileText, Clock, GraduationCap, Brain, Sparkles, Zap,
  Target, Shield, ChevronRight, Globe, Volume2, Download, Search, Pin,
  BarChart3, Share2, Type, Mic, Copy, Trash2, Rocket, Star, ArrowRight,
  Cpu, Layers, Command
} from 'lucide-react';
import { getRecentChats } from '../utils/api';

const HomePage = ({ setCurrentPage, uploadedDocs, userId, stats }) => {
  const [recentChats, setRecentChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        const chats = await getRecentChats(userId, 3);
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

  const Greeting = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return (
      <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
        {greeting}, <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
          Ready to Learn?
        </span>
      </h1>
    );
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 border border-white/10 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/5"></div>
        <div className="absolute top-0 right-0 p-12 opacity-50">
          <div className="w-64 h-64 bg-blue-500/30 rounded-full blur-[100px] animate-pulse"></div>
        </div>

        <div className="relative z-10 p-8 md:p-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
              <span className="text-sm font-medium text-gray-300">New: Gemini 2.0 Flash Integration</span>
            </div>

            <Greeting />

            <p className="text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
              Your personal AI research assistant. Upload documents, ask complex questions,
              and get instant, accurate answers with source citations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setCurrentPage('upload')}
                className="group relative px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                Upload Files
              </button>

              <button
                onClick={() => setCurrentPage('chat')}
                className="group px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm"
              >
                <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Start Chat
              </button>
            </div>
          </div>
        </div>

        {/* Floating Abstract Shapes */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]"></div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Stats Card - Large */}
        <div className="md:col-span-2 bg-gray-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              Overview
            </h3>
            <span className="text-xs font-mono text-gray-500 bg-black/30 px-2 py-1 rounded">LIVE UPDATES</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Documents', value: stats?.documentsAnalyzed || 0, icon: FileText, color: 'text-blue-400' },
              { label: 'Queries', value: stats?.questionsAnswered || 0, icon: MessageSquare, color: 'text-green-400' },
              { label: 'Sessions', value: stats?.conversations || 0, icon: Clock, color: 'text-purple-400' },
              { label: 'Languages', value: '8+', icon: Globe, color: 'text-orange-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-black/20 rounded-2xl p-4 border border-white/5 hover:bg-white/5 transition-colors group">
                <stat.icon className={`w-5 h-5 ${stat.color} mb-3 group-hover:scale-110 transition-transform`} />
                <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Tips / Feature Highlight - Tall */}
        <div className="bg-gradient-to-b from-purple-900/20 to-black/40 border border-white/10 rounded-3xl p-8 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Did you know?</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Our AI uses a hybrid search approach, combining keyword matching with semantic understanding to find answers with 95% accuracy.
            </p>
          </div>
          <button className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-purple-300 transition-colors border border-purple-500/20">
            Learn More
          </button>
        </div>

        {/* Recent Activity - Wide */}
        <div className="md:col-span-3">
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              Recent Activity
            </h3>
            <button
              onClick={() => setCurrentPage('chat')}
              className="text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              View History <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loadingChats ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="min-w-[300px] h-40 bg-white/5 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : recentChats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => setCurrentPage('chat')}
                  className="group bg-gray-900 border border-white/10 p-6 rounded-2xl hover:border-purple-500/50 hover:bg-gray-800/80 cursor-pointer transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-3xl"></div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      AI
                    </div>
                    <div>
                      <div className="text-white font-bold truncate max-w-[150px]">{chat.title}</div>
                      <div className="text-xs text-gray-500">{chat.time}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-4">
                    <MessageSquare className="w-3 h-3" />
                    <span>{chat.messages} messages</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 text-center">
              <p className="text-gray-400">No recent conversations found. Start a new chat!</p>
            </div>
          )}
        </div>
      </div>

      {/* Feature Showcase Grid */}
      <div>
        <h3 className="text-xl font-bold text-white mb-6 px-2 flex items-center gap-2">
          <Layers className="w-5 h-5 text-pink-400" />
          Power Features
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Globe, title: 'Multilingual', desc: '8+ Indian Languages' },
            { icon: Zap, title: 'Hybrid Search', desc: 'Semantic + Keyword' },
            { icon: Volume2, title: 'Voice Output', desc: 'Native TTS Voices' },
            { icon: Shield, title: 'Secure', desc: 'Enterprise Grade' }
          ].map((feature, i) => (
            <div key={i} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-5 transition-all duration-300 group cursor-default">
              <feature.icon className="w-8 h-8 text-gray-400 group-hover:text-white mb-3 transition-colors" />
              <h4 className="text-white font-bold mb-1">{feature.title}</h4>
              <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Copyright */}
      <div className="text-center pt-10 border-t border-white/5">
        <p className="text-gray-600 text-sm">
          © 2026 QA System. Built with ❤️ by Antigravity.
        </p>
      </div>
    </div>
  );
};

export default HomePage;