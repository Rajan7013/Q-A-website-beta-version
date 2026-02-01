import React from 'react';
import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
    return (
        <div className="bg-gray-900 min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
                        Join Us
                    </h1>
                    <p className="text-gray-400 text-lg">Create your AI Workspace account</p>
                </div>

                <div className="flex justify-center">
                    <SignUp
                        appearance={{
                            elements: {
                                card: "bg-gray-800 border border-gray-700 shadow-2xl rounded-2xl",
                                headerTitle: "hidden",
                                headerSubtitle: "hidden",
                                formButtonPrimary: "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-none",
                                formFieldInput: "bg-gray-900 border-gray-600 text-white focus:border-pink-500",
                                formFieldLabel: "text-gray-300",
                                footerActionLink: "text-pink-400 hover:text-pink-300",
                                identityPreviewText: "text-gray-300",
                                formFieldInputShowPasswordButton: "text-gray-400"
                            },
                            variables: {
                                colorPrimary: '#db2777',
                                colorText: '#fff',
                                colorBackground: '#1f2937',
                                colorInputBackground: '#111827',
                                colorInputText: '#fff',
                            }
                        }}
                        signInUrl="/sign-in"
                    />
                </div>
            </div>
        </div>
    );
}
