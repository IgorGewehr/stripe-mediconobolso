"use client";

import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { onAuthStateChanged } from 'firebase/auth';
import AuthForms from './authForms';
import ComingSoon from './comingSoon';
import firebaseService from '../../lib/firebaseService';
import { useRouter } from 'next/navigation';

const AuthTemplate = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [assinouPlano, setAssinouPlano] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseService.auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                try {
                    const userData = await firebaseService.getUserData(user.uid);
                    setAssinouPlano(userData.assinouPlano);
                    // Se o usuário está autenticado mas ainda não assinou, redireciona para "/checkout"
                    if (!userData.assinouPlano) {
                        router.push("/checkout");
                    }
                } catch (error) {
                    console.error("Erro ao buscar dados do usuário:", error);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                }}
            >
                <CircularProgress color="primary" />
            </Box>
        );
    }

    let content;
    if (!currentUser) {
        content = <AuthForms />;
    } else if (currentUser && assinouPlano) {
        content = <ComingSoon />;
    }

    return (
        <Box
            sx={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                display: 'flex',
                m: 0,
                p: 0,
            }}
        >
            <Box
                component="img"
                src="/logo.png"
                alt="Logo"
                sx={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    width: 40,
                    height: 'auto',
                    zIndex: 10,
                }}
            />

            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    m: 0,
                    p: 0,
                    marginLeft: '40px',
                }}
            >
                {content}
            </Box>

            <Box
                sx={{
                    flex: 1,
                    height: '100vh',
                    m: 0,
                    p: 0,
                    backgroundImage: 'url("/fundo.jpg")',
                    backgroundSize: 'contain',
                    backgroundPosition: 'right bottom',
                    backgroundRepeat: 'no-repeat',
                }}
            />
        </Box>
    );
};

export default AuthTemplate;
