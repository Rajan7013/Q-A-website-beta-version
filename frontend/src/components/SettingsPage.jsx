import React, { useState, useEffect } from 'react';
import { Settings, Bell, Globe, Shield, Database, Zap, Check, Save } from 'lucide-react';
import { updateSettings } from '../utils/api';

const SettingsPage = ({ settings, setSettings, userId }) => {
  const [localSettings, setLocalSettings] = useState(settings || { language: 'en', notifications: true, autoSave: true });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync localSettings with settings prop changes
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleChange = (key, value) => {
    setLocalSettings({ ...localSettings, [key]: value });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(userId, localSettings);
      setSettings(localSettings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const settingSections = [
    {
      title: 'Language & Region',
      icon: Globe,
      color: 'from-blue-400 to-cyan-500',
      settings: [
        {
          key: 'language',
          label: 'Language',
          type: 'select',
          options: [
            { value: 'en', label: '🇬🇧 English' },
            { value: 'hi', label: '🇮🇳 Hindi (हिंदी)' },
            { value: 'te', label: '🇮🇳 Telugu (తెలుగు)' },
            { value: 'ta', label: '🇮🇳 Tamil (தமிழ்)' },
            { value: 'ml', label: '🇮🇳 Malayalam (മലയാളം)' },
            { value: 'bn', label: '🇮🇳 Bengali (বাংলা)' },
            { value: 'ne', label: '🇳🇵 Nepali (नेपाली)' },
            { value: 'mai', label: '🇮🇳 Maithili (मैथिली)' },
            { value: 'kn', label: '🇮🇳 Kannada (ಕನ್ನಡ)' }
          ],
          description: 'AI will respond and speak in your selected language (9 languages supported)'
        }
      ]
    },
    {
      title: 'Notifications & Auto-save',
      icon: Bell,
      color: 'from-purple-400 to-pink-500',
      settings: [
        {
          key: 'notifications',
          label: 'Enable Notifications',
          type: 'toggle',
          description: 'Get notified about document processing and AI responses'
        },
        {
          key: 'autoSave',
          label: 'Auto-save Conversations',
          type: 'toggle',
          description: 'Automatically save your chat history'
        }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 md:space-y-8 px-2 sm:px-4">
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-3 md:space-y-4">
          <div className="inline-block p-4 sm:p-5 md:p-6 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl sm:rounded-3xl shadow-2xl">
            <Settings className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
            Settings
          </h1>
          <p className="text-sm sm:text-lg md:text-xl text-gray-400 px-4">Customize your AI experience - 9 languages supported</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          {settingSections.map((section, idx) => (
            <div key={idx} className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-white/10">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-5 md:mb-6">
                <div className={`p-2 sm:p-3 md:p-4 bg-gradient-to-br ${section.color} rounded-xl sm:rounded-2xl`}>
                  <section.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white">{section.title}</h2>
              </div>

              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                {section.settings.map((setting, settingIdx) => (
                  <div key={settingIdx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 md:p-6 bg-white/5 rounded-xl sm:rounded-2xl gap-3 sm:gap-4">
                    <div className="flex-1">
                      <div className="font-bold text-white text-base sm:text-lg">
                        {setting.label}
                      </div>
                      {setting.description && (
                        <p className="text-gray-400 text-xs sm:text-sm mt-1">{setting.description}</p>
                      )}
                    </div>

                    <div className="sm:ml-6 flex justify-end">
                      {setting.type === 'toggle' ? (
                        <button
                          onClick={() => handleChange(setting.key, !localSettings[setting.key])}
                          className={`relative w-14 h-7 sm:w-16 sm:h-8 rounded-full transition-all duration-300 touch-manipulation ${
                            localSettings[setting.key]
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                              : 'bg-gray-300'
                          }`}
                        >
                          <div className={`absolute top-0.5 left-0.5 sm:top-1 sm:left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${localSettings[setting.key] ? 'transform translate-x-7 sm:translate-x-8' : ''}`}></div>
                        </button>
                      ) : setting.type === 'select' ? (
                        <select
                          value={localSettings[setting.key]}
                          onChange={(e) => handleChange(setting.key, e.target.value)}
                          className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg sm:rounded-xl px-3 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-bold focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-purple-300 cursor-pointer text-gray-800 w-full sm:w-auto"
                        >
                          {setting.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="text-center pb-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center justify-center space-x-2 sm:space-x-3 px-6 py-3 sm:px-10 sm:py-4 md:px-12 md:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg md:text-xl shadow-2xl transform active:scale-95 sm:hover:scale-110 transition-all duration-300 mx-auto touch-manipulation w-full sm:w-auto max-w-xs ${
              saved
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                : 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white hover:shadow-purple-500/50'
            }`}
          >
            {saving ? (
              <>
                <Save className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : saved ? (
              <>
                <Check />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <>
                <Save />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 pb-4">
          {[
            { icon: Shield, title: 'Privacy', desc: 'Your data is encrypted', color: 'from-blue-400 to-cyan-500' },
            { icon: Database, title: 'Storage', desc: 'Unlimited storage', color: 'from-green-400 to-emerald-500' },
            { icon: Zap, title: 'AI Model', desc: 'Gemini 2.5 Flash', color: 'from-orange-400 to-red-500' }
          ].map((card, idx) => (
            <div key={idx} className={`bg-gradient-to-br ${card.color} p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl text-white shadow-xl`}>
              <card.icon className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 mb-2 sm:mb-3" />
              <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2">{card.title}</h3>
              <p className="text-sm sm:text-base text-white/80">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;