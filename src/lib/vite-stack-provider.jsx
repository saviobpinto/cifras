import React from 'react';
import { stackApp } from './stack';

// Custom StackProvider for Vite SPA.
// The default StackProvider from @stackframe/stack is designed for Next.js
// server components. This creates the same context that the SDK hooks expect.
//
// We import StackContext from the SDK's internal module and provide it
// with our StackClientApp instance directly.

// The StackContext is not exported from the main package, so we set it via
// the global variable that the SDK checks as a fallback.
if (typeof window !== 'undefined') {
    window.__STACK_AUTH__ = { app: stackApp };
}

export function ViteStackProvider({ children }) {
    // Ensure the global is set on every render
    if (typeof window !== 'undefined') {
        window.__STACK_AUTH__ = { app: stackApp };
    }
    return <>{children}</>;
}
