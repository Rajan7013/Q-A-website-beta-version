import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Home, MessageSquare, Upload, FileText, Settings, Brain, Menu, X, Sparkles } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect for transparency
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/upload', icon: Upload, label: 'Upload' },
    { path: '/documents', icon: FileText, label: 'Docs' }
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Desktop & Tablet Top Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? 'bg-gray-900/80 backdrop-blur-xl border-b border-white/10 shadow-lg py-1'
          : 'bg-transparent py-2'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* Logo Area */}
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 rounded-xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-2 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-white/10 group-hover:border-purple-500/50 transition-colors">
                  <Brain className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  DocMind AI
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] text-blue-400 font-medium">
                    BETA
                  </span>
                </h1>
                <span className="text-[9px] text-gray-400 font-medium tracking-wide">AI DOCUMENT INTELLIGENCE</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-2 ${isActive(item.path)
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {isActive(item.path) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg -z-10"></div>
                  )}
                  <item.icon className={`w-3.5 h-3.5 ${isActive(item.path) ? 'text-white' : 'text-current'}`} />
                  {item.label}
                </button>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/settings')}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className="h-5 w-px bg-white/10"></div>
              <div className="flex items-center">
                <UserButton
                  afterSignOutUrl="/sign-in"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 border-2 border-purple-500/30 hover:border-purple-500 transition-colors"
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Floating Pill) */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
        <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl p-2 flex justify-between items-center px-6">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative p-3 rounded-full transition-all duration-300 ${isActive(item.path)
                ? 'text-white bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg translate-y-[-4px]'
                : 'text-gray-400 hover:text-white'
                }`}
            >
              <item.icon className="w-5 h-5" />
              {isActive(item.path) && (
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/50 opacity-0 animate-fade-in">
                  {item.label}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => navigate('/settings')}
            className={`p-3 rounded-full text-gray-400 hover:text-white transition-all`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16 md:h-20"></div>
    </>
  );
}