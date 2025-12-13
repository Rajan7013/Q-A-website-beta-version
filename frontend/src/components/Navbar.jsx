import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import { Home, MessageSquare, Upload, FileText, Settings, Brain } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname.substring(1) || '';

  const navItems = [
    { path: '/', icon: Home, label: 'Home', id: '' },
    { path: '/chat', icon: MessageSquare, label: 'Chat', id: 'chat' },
    { path: '/upload', icon: Upload, label: 'Upload', id: 'upload' },
    { path: '/documents', icon: FileText, label: 'Documents', id: 'documents' }
  ];

  return (
    <>
      <nav className="hidden md:block bg-gradient-to-r from-purple-900 via-pink-800 to-orange-700 p-4 md:p-6 rounded-2xl mb-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8 flex-wrap">
            <div onClick={() => navigate('/')} className="flex items-center space-x-4 cursor-pointer transform hover:scale-105 transition-all">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">AI Doc Analyzer</h1>
                <p className="text-xs text-white/80 font-bold">Smart • Contextual</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-bold transition-all ${currentPage === item.id
                      ? 'bg-white text-purple-600 shadow-xl'
                      : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/settings')} className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-xl transition-all">
                <Settings className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl">
                <UserButton afterSignOutUrl="/sign-in" showName={true} />
              </div>
            </div>
          </div>
        </div>
      </nav>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900 via-pink-800 to-orange-700 border-t border-white/10 z-50">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center p-2 rounded-xl min-w-[60px] ${currentPage === item.id ? 'text-white' : 'text-white/70'}`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}