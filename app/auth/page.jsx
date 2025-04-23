// app/auth/page.jsx
import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';
import AuthClient from './AuthClient';

export default function AuthPage() {
    return (
        <Suspense
            fallback={
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                    }}
                >
                    <CircularProgress />
                </Box>
            }
        >
            <AuthClient />
        </Suspense>
    );
}
