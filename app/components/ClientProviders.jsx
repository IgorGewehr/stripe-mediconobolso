'use client';

import ThemeProvider from './themeProvider';
import { AuthProvider } from './authProvider';

export default function ClientProviders({ children }) {
    return (
        <AuthProvider>
            <ThemeProvider>
                {children}
            </ThemeProvider>
        </AuthProvider>
    );
}