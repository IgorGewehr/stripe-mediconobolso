// app/api/create-secretary/route.js
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Inicializar Firebase Admin (se ainda não foi inicializado)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const auth = admin.auth();
const firestore = admin.firestore();

export async function POST(request) {
    try {
        console.log('🚀 API: Iniciando criação de secretária...');

        // Verificar autenticação
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Token de autorização necessário' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);

        // Verificar token do Firebase
        let decodedToken;
        try {
            decodedToken = await auth.verifyIdToken(token);
        } catch (error) {
            console.error('❌ Token inválido:', error);
            return NextResponse.json(
                { error: 'Token inválido' },
                { status: 401 }
            );
        }

        const { doctorId, secretaryData } = await request.json();

        // Verificar se o usuário autenticado é o médico
        if (decodedToken.uid !== doctorId) {
            return NextResponse.json(
                { error: 'Não autorizado' },
                { status: 403 }
            );
        }

        console.log(`👨‍⚕️ Médico autenticado: ${doctorId}`);

        // ✅ CRIAR USUÁRIO FIREBASE AUTH PARA SECRETÁRIA
        let secretaryAuthUser;
        try {
            secretaryAuthUser = await auth.createUser({
                email: secretaryData.email,
                password: secretaryData.password,
                displayName: secretaryData.name,
                emailVerified: false
            });

            console.log(`✅ Usuário Firebase Auth criado: ${secretaryAuthUser.uid}`);
        } catch (authError) {
            console.error('❌ Erro ao criar usuário Auth:', authError);

            // Tratar erros específicos
            if (authError.code === 'auth/email-already-exists') {
                return NextResponse.json(
                    { error: 'E-mail já está em uso' },
                    { status: 400 }
                );
            }

            return NextResponse.json(
                { error: 'Erro ao criar conta: ' + authError.message },
                { status: 500 }
            );
        }

        // ✅ CRIAR DOCUMENTO DA SECRETÁRIA NO FIRESTORE
        const secretaryId = secretaryAuthUser.uid;
        const secretaryDocData = {
            doctorId: doctorId,
            email: secretaryData.email,
            name: secretaryData.name.trim(),
            active: true,
            permissions: secretaryData.permissions,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: doctorId,
            authUid: secretaryId,
            needsActivation: false, // Já ativada pelo admin
            lastLogin: null,
            loginCount: 0,
            version: "2.0",
            createdViaAdmin: true
        };

        try {
            await firestore.collection('secretaries').doc(secretaryId).set(secretaryDocData);
            console.log(`✅ Documento secretária criado: ${secretaryId}`);
        } catch (firestoreError) {
            console.error('❌ Erro ao criar documento:', firestoreError);

            // Se falhou ao criar documento, remover usuário Auth
            try {
                await auth.deleteUser(secretaryId);
                console.log('🧹 Usuário Auth removido após erro no Firestore');
            } catch (cleanupError) {
                console.error('❌ Erro ao limpar usuário Auth:', cleanupError);
            }

            return NextResponse.json(
                { error: 'Erro ao salvar dados da secretária' },
                { status: 500 }
            );
        }

        // ✅ ATUALIZAR CONFIGURAÇÃO DO MÉDICO
        try {
            const doctorRef = firestore.collection('users').doc(doctorId);

            await firestore.runTransaction(async (transaction) => {
                const doctorDoc = await transaction.get(doctorRef);

                if (!doctorDoc.exists) {
                    throw new Error('Médico não encontrado');
                }

                const secretaryConfig = {
                    hasSecretary: true,
                    secretaryId: secretaryId,
                    secretaryEmail: secretaryData.email,
                    secretaryName: secretaryData.name,
                    lastSecretaryCreated: admin.firestore.FieldValue.serverTimestamp(),
                    version: "2.0"
                };

                transaction.update(doctorRef, {
                    secretaryConfig: secretaryConfig,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });

            console.log(`✅ Configuração do médico atualizada`);
        } catch (configError) {
            console.error('❌ Erro ao atualizar configuração do médico:', configError);
            // Não fazer rollback aqui, apenas logar o erro
        }

        // ✅ ENVIAR EMAIL DE BOAS-VINDAS (OPCIONAL)
        try {
            // Se você tem um endpoint para envio de emails
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/secretary-welcome-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: secretaryData.email,
                    secretaryName: secretaryData.name,
                    doctorName: 'Médico', // Você pode buscar o nome do médico se necessário
                    appLink: process.env.NEXT_PUBLIC_APP_URL || 'https://mediconobolso.app'
                })
            });
        } catch (emailError) {
            console.warn('⚠️ Erro ao enviar email de boas-vindas:', emailError);
            // Não falhar a operação por conta do email
        }

        console.log(`🎉 Secretária criada com sucesso! ID: ${secretaryId}`);

        return NextResponse.json({
            success: true,
            secretaryId: secretaryId,
            message: 'Secretária criada com sucesso',
            data: {
                name: secretaryData.name,
                email: secretaryData.email,
                permissions: secretaryData.permissions
            }
        });

    } catch (error) {
        console.error('❌ Erro geral na API:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}

// ✅ FUNÇÃO AUXILIAR PARA BUSCAR DADOS DO MÉDICO (OPCIONAL)
async function getDoctorData(doctorId) {
    try {
        const doctorDoc = await firestore.collection('users').doc(doctorId).get();

        if (!doctorDoc.exists) {
            throw new Error('Médico não encontrado');
        }

        return doctorDoc.data();
    } catch (error) {
        console.error('❌ Erro ao buscar dados do médico:', error);
        throw error;
    }
}