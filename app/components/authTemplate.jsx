"use client";

import React, { useEffect, useState } from 'react';
import {Box, CircularProgress} from '@mui/material';
import { onAuthStateChanged } from 'firebase/auth';
import AuthForms from './authForms';
import PlanCard from "./planSelector";
import ComingSoon from "./comingSoon";
import firebaseService from "../../lib/firebaseService";

const AuthTemplate = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [assinouPlano, setAssinouPlano] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(firebaseService.auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                try {
                    const userData = await firebaseService.getUserData(user.uid);
                    setAssinouPlano(userData.assinouPlano);
                } catch (error) {
                    console.error("Erro ao buscar dados do usuário:", error);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        // Enquanto os dados carregam, exibe um indicador de loading
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
        // Usuário não autenticado: mostra o formulário de autenticação
        content = <AuthForms />;
    } else if (currentUser && !assinouPlano) {
        // Usuário autenticado, mas sem plano: mostra o selector de plano
        content = <PlanCard />;
    } else {
        // Usuário autenticado e com plano: mostra a tela principal (ou ComingSoon)
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
            {/* Logo reposicionada: afastada e menor */}
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

            {/* Coluna esquerda: conteúdo dinâmico */}
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

            {/* Coluna direita: imagem de fundo */}
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
