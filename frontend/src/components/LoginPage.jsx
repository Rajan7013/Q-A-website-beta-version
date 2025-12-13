import React from 'react';
import { useSignIn } from "@clerk/clerk-react";
import { Chrome } from 'lucide-react';

export default function LoginPage() {
    const { signIn, isLoaded } = useSignIn();

    const handleGoogleSignIn = async () => {
        if (!isLoaded) return;
        try {
            await signIn.authenticateWithRedirect({
                strategy: "oauth_google",
                redirectUrl: "/sso-callback",
                redirectUrlComplete: "/"
            });
        } catch (err) {
            console.error("Error signing in:", err);
        }
    };

    return (
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 w-full max-w-sm mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
                    Welcome Back
                </h1>
                <p className="text-gray-400">Sign in to continue to QA System</p>
            </div>

            <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
                <Chrome className="w-5 h-5 text-blue-600" />
                <span>Sign in with Google</span>
            </button>

            <div className="mt-6 text-center text-xs text-gray-500">
                By signing in, you agree to our Terms of Service and Privacy Policy.
            </div>
        </div>
    );
}
