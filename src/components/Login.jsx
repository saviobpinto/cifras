import React from 'react';
import { SignIn } from '@stackframe/stack';

function Login() {
    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen flex flex-col items-center justify-center p-4">
            <main className="w-full max-w-[440px] mx-auto flex flex-col gap-6 relative">
                {/* Header / Logo Section */}
                <div className="flex flex-col items-center text-center space-y-2 pt-8 pb-2">
                    <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-3 overflow-hidden relative shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]">
                        <span className="material-symbols-outlined text-primary text-3xl relative z-10">music_note</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome Back</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-normal">Log in to access your setlists and chords.</p>
                </div>

                {/* Stack Auth SignIn Component */}
                <SignIn />
            </main>
        </div>
    );
}

export default Login;
