import React from 'react';
import { Home, MessageSquare, Upload, FileText, Settings, User, Brain } from 'lucide-react';

const Navbar = ({ currentPage, setCurrentPage, userProfile }) => {
  const navItems = [
    { icon: Home, label: 'Home', page: 'home' },
    { icon: MessageSquare, label: 'Chat', page: 'chat' },
    { icon: Upload, label: 'Upload', page: 'upload' },
    { icon: FileText, label: 'Documents', page: 'documents' }
  ];

  return (
    <>
      {/* Desktop & Tablet Navbar */}
      <nav className="hidden md:block bg-gradient-to-r from-purple-900 via-pink-800 to-orange-700 p-3 md:p-4 lg:p-6 rounded-none md:rounded-2xl mb-0 md:mb-6 shadow-2xl">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3 md:gap-4 lg:gap-6 flex-wrap justify-center">
            <div 
              className="flex items-center space-x-2 md:space-x-3 cursor-pointer transform hover:scale-105 transition-all duration-300" 
              onClick={() => setCurrentPage('home')}
            >
              <div className="p-2 md:p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                <Brain className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base md:text-lg lg:text-xl font-black text-white">AI Doc Analyzer</h1>
                <p className="text-[9px] md:text-[10px] text-white/80 font-bold">Smart • Contextual</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => setCurrentPage(item.page)}
                  className={`flex items-center space-x-1 md:space-x-1.5 px-2.5 md:px-3 lg:px-4 py-2 md:py-2.5 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 text-xs md:text-sm lg:text-base ${
                    currentPage === item.page 
                      ? 'bg-white text-purple-600 shadow-xl' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <item.icon className="w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                  <span className="hidden md:inline lg:inline">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <button 
                onClick={() => setCurrentPage('settings')}
                className="bg-white/20 hover:bg-white/30 text-white p-2 md:p-2.5 rounded-lg transition-all duration-300 transform hover:scale-110"
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button 
                onClick={() => setCurrentPage('profile')}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-2.5 md:px-3 lg:px-4 py-2 md:py-2.5 rounded-lg font-bold transition-all duration-300 transform hover:scale-110 shadow-xl flex items-center space-x-1 text-xs md:text-sm lg:text-base"
              >
                <span className="text-sm md:text-base">{userProfile?.avatar || '👤'}</span>
                <span className="hidden lg:inline">{userProfile?.name?.split(' ')[0] || 'Guest'}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900 via-pink-800 to-orange-700 border-t border-white/10 z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-1.5 px-1">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => setCurrentPage(item.page)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all duration-300 min-w-[50px] max-w-[70px] touch-manipulation ${
                currentPage === item.page 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/70 active:bg-white/10'
              }`}
            >
              <item.icon className={`w-5 h-5 mb-0.5 ${
                currentPage === item.page ? 'text-white' : 'text-white/70'
              }`} />
              <span className={`text-[9px] font-medium leading-tight ${
                currentPage === item.page ? 'text-white' : 'text-white/70'
              }`}>{item.label}</span>
            </button>
          ))}
          <button 
            onClick={() => setCurrentPage('settings')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all duration-300 min-w-[50px] max-w-[70px] touch-manipulation ${
              currentPage === 'settings'
                ? 'bg-white/20 text-white' 
                : 'text-white/70 active:bg-white/10'
            }`}
          >
            <Settings className={`w-5 h-5 mb-0.5 ${
              currentPage === 'settings' ? 'text-white' : 'text-white/70'
            }`} />
            <span className={`text-[9px] font-medium leading-tight ${
              currentPage === 'settings' ? 'text-white' : 'text-white/70'
            }`}>Settings</span>
          </button>
          <button 
            onClick={() => setCurrentPage('profile')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all duration-300 min-w-[50px] max-w-[70px] touch-manipulation ${
              currentPage === 'profile'
                ? 'bg-white/20 text-white' 
                : 'text-white/70 active:bg-white/10'
            }`}
          >
            <span className="text-xl mb-0.5">{userProfile?.avatar || '👤'}</span>
            <span className={`text-[9px] font-medium leading-tight ${
              currentPage === 'profile' ? 'text-white' : 'text-white/70'
            }`}>Profile</span>
          </button>
        </div>
      </nav>
    </>
  );

};

export default Navbar;