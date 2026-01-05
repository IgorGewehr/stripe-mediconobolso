'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ThemeProvider from './themeProvider';
import { AuthProvider } from './authProvider';
import { WebSocketProvider } from './WebSocketProvider';
import { FeedbackProvider } from '../ui/feedback';

export default function ClientProviders({ children }) {
    // Create a stable QueryClient instance
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 5, // 5 minutes
                retry: 1,
                refetchOnWindowFocus: false,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <WebSocketProvider>
                    <ThemeProvider>
                        <FeedbackProvider>
                            {children}
                        </FeedbackProvider>
                    </ThemeProvider>
                </WebSocketProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}