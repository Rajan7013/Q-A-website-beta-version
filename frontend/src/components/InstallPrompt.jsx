import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleClose = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 animate-fade-in-up">
            <div className="bg-gray-800/90 backdrop-blur-lg border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
                <div className="bg-purple-600/20 p-3 rounded-xl">
                    <img src="/pwa-icon.png" alt="App Icon" className="w-10 h-10 object-contain" />
                </div>

                <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm">Install App</h3>
                    <p className="text-gray-400 text-xs mt-0.5">Get the full native experience</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/5 rounded-full text-gray-400 transition-colors"
                    >
                        <X size={18} />
                    </button>

                    <button
                        onClick={handleInstallClick}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg hover:shadow-purple-500/25"
                    >
                        <Download size={16} />
                        Install
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
