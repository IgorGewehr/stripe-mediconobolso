import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail, GoogleAuthProvider
} from "firebase/auth";

import { signInWithPopup, signInWithRedirect } from "firebase/auth";

import {
    collection,
    collectionGroup,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    query,
    where,
    arrayUnion,
    limit as limitFn,
    orderBy,
    addDoc,
    startAfter
} from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import { auth, firestore, storage } from "./firebase.js";
import moduleService from './moduleService';

const googleProvider = new GoogleAuthProvider();

// Scopes necessários
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Configurações adicionais para melhor UX
googleProvider.setCustomParameters({
    prompt: 'select_account', // Força seleção de conta
    access_type: 'offline',   // Para refresh tokens
});

const lastUpdateTimestamps = {};

// Limpar o cache periodicamente (a cada 3 horas)
if (typeof window !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        Object.keys(lastUpdateTimestamps).forEach(key => {
            const age = now - lastUpdateTimestamps[key];
            // Limpar entradas mais antigas que 24 horas
            if (age > 24 * 60 * 60 * 1000) {
                delete lastUpdateTimestamps[key];
            }
        });
    }, 3 * 60 * 60 * 1000); // Executar a cada 3 horas
}



class FirebaseService {
    auth = auth;
    firestore = firestore;
    storage = storage;

    // ====================================================
    // Funções auxiliares para manipulação de datas - SIMPLIFICADAS
    // ====================================================

    // Converte qualquer tipo de data para string YYYY-MM-DD
    _formatDateTimeToString(dateValue) {
        // Se for null ou undefined, retorna null
        if (!dateValue) return null;
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
        }
        const date = new Date(dateValue);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Converte string YYYY-MM-DD para objeto Date
    _parseStringToDate(stringValue) {
        // Se for null ou undefined, indique ausência de data
        if (stringValue == null) return null;

        // Já é Date?
        if (stringValue instanceof Date) return stringValue;

        // Timestamp do Firebase?
        if (typeof stringValue.toDate === 'function') {
            return stringValue.toDate();
        }

        // String no formato YYYY-MM-DD
        if (typeof stringValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
            const [year, month, day] = stringValue.split('-').map(Number);
            return new Date(year, month - 1, day);
        }

        // Outros formatos de string
        const parsed = new Date(stringValue);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    // Processa um documento de consulta
    _processConsultationDates(consultation) {
        if (!consultation) return consultation;

        const processed = {...consultation};

        // Converter consultationDate de string para Date
        if (processed.consultationDate) {
            processed.consultationDate = this._parseStringToDate(processed.consultationDate);
        }

        return processed;
    }

    // ====================================================
    // Autenticação e Gerenciamento de Usuários
    // ====================================================



// Função para processar um arquivo de exame completo


    async loginWithGoogle() {
        try {
            console.log('🔐 Iniciando login com Google...');

            const result = await signInWithPopup(this.auth, googleProvider);
            const user = result.user;

            console.log('✅ Login com Google realizado:', user.email);

            // Verificar se o usuário já existe no Firestore
            try {
                const userData = await this.getUserData(user.uid);
                console.log('👤 Usuário existente encontrado');
                return { user, isNewUser: false, userData };
            } catch (error) {
                // Usuário não existe, é um novo usuário
                console.log('🆕 Novo usuário detectado');
                return { user, isNewUser: true, userData: null };
            }
        } catch (error) {
            console.error('❌ Erro no login com Google:', error);

            // Mapear erros específicos do Google Auth
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('Login cancelado pelo usuário');
            } else if (error.code === 'auth/popup-blocked') {
                throw new Error('Pop-up bloqueado pelo navegador');
            } else if (error.code === 'auth/cancelled-popup-request') {
                throw new Error('Solicitação de login cancelada');
            } else if (error.code === 'auth/network-request-failed') {
                throw new Error('Erro de conexão. Verifique sua internet.');
            } else if (error.code === 'auth/internal-error') {
                throw new Error('Erro interno. Tente novamente.');
            }

            throw error;
        }
    }

    // ====================================================
    // 🔧 MÉTODO DE CADASTRO GRATUITO COM GOOGLE CORRIGIDO
    // ====================================================
    async signUpFreeWithGoogle(additionalData = {}) {
        try {
            console.log('🆓 Iniciando cadastro gratuito com Google...');

            const result = await signInWithPopup(this.auth, googleProvider);
            const user = result.user;

            // Extrair informações do perfil do Google
            const [firstName, ...lastNameArray] = (user.displayName || '').split(' ');
            const lastName = lastNameArray.join(' ');

            const userData = {
                fullName: user.displayName || '',
                firstName: firstName || '',
                lastName: lastName || '',
                email: user.email,
                photoURL: user.photoURL || '',
                emailVerified: user.emailVerified,
                gratuito: true,
                assinouPlano: false,
                planType: 'free',
                authProvider: 'google',
                createdAt: new Date(),
                checkoutCompleted: true,
                googleProfile: {
                    uid: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    emailVerified: user.emailVerified
                },
                // Mesclar dados adicionais fornecidos
                ...additionalData
            };

            // Verificar referralSource
            const referralSource = localStorage.getItem('referralSource');
            if (referralSource === 'enrico') {
                userData.enrico = true;
                console.log('✅ Cliente GOOGLE GRATUITO marcado como vindo através do Enrico');
            } else if (referralSource) {
                userData.referralSource = referralSource;
            }

            // Salvar dados no Firestore
            await setDoc(doc(this.firestore, "users", user.uid), userData);

            console.log('✅ Cadastro gratuito com Google concluído');
            return { user, userData };
        } catch (error) {
            console.error('❌ Erro no cadastro gratuito com Google:', error);

            // Mapear erros específicos
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('Login cancelado pelo usuário');
            } else if (error.code === 'auth/popup-blocked') {
                throw new Error('Pop-up bloqueado pelo navegador');
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                throw new Error('Já existe uma conta com este email usando outro método de login');
            }

            throw error;
        }
    }

    /**
     * Cadastro pago com Google (para checkout)
     */
    async signUpPaidWithGoogle(planType = 'monthly') {
        try {
            console.log(`💳 Iniciando cadastro pago com Google - Plano: ${planType}`);

            const result = await signInWithPopup(this.auth, googleProvider);
            const user = result.user;

            // Extrair informações do perfil do Google
            const [firstName, ...lastNameArray] = (user.displayName || '').split(' ');
            const lastName = lastNameArray.join(' ');

            const userData = {
                fullName: user.displayName || '',
                firstName: firstName || '',
                lastName: lastName || '',
                email: user.email,
                photoURL: user.photoURL || '',
                emailVerified: user.emailVerified,
                assinouPlano: false, // Será alterado após confirmação do pagamento
                gratuito: false,
                planType: planType,
                authProvider: 'google',
                createdAt: new Date(),
                checkoutStarted: true,
                googleProfile: {
                    uid: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    emailVerified: user.emailVerified
                }
            };

            // Verificar referralSource
            const referralSource = localStorage.getItem('referralSource');
            if (referralSource === 'enrico') {
                userData.enrico = true;
                console.log('✅ Cliente GOOGLE PAGO marcado como vindo através do Enrico');
            } else if (referralSource) {
                userData.referralSource = referralSource;
            }

            // Salvar dados no Firestore
            await setDoc(doc(this.firestore, "users", user.uid), userData);

            console.log('✅ Cadastro pago com Google concluído');
            return { user, userData };
        } catch (error) {
            console.error('❌ Erro no cadastro pago com Google:', error);
            throw error;
        }
    }

    /**
     * Completar perfil após login/cadastro com Google
     */
    async completeGoogleProfile(uid, profileData) {
        try {
            console.log('📝 Completando perfil do usuário Google...');

            const updateData = {
                ...profileData,
                profileCompleted: true,
                updatedAt: new Date()
            };

            await this.editUserData(uid, updateData);
            console.log('✅ Perfil Google atualizado com sucesso');
            return true;
        } catch (error) {
            console.error('❌ Erro ao completar perfil Google:', error);
            throw error;
        }
    }

    /**
     * Verificar se usuário precisa completar dados após login Google
     */
    needsProfileCompletion(userData) {
        const requiredFields = ['phone', 'cpf'];
        const addressFields = ['address.city', 'address.state', 'address.cep'];

        // Verificar campos obrigatórios
        for (const field of requiredFields) {
            if (!userData[field] || !userData[field].trim()) {
                return true;
            }
        }

        // Verificar endereço
        for (const field of addressFields) {
            const fieldPath = field.split('.');
            let value = userData;
            for (const path of fieldPath) {
                value = value?.[path];
            }
            if (!value || !value.trim()) {
                return true;
            }
        }

        return false;
    }

    /**
     * Enviar emails de boas-vindas para usuários Google
     */
    async sendGoogleWelcomeEmails(email, name) {
        try {
            const appLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mediconobolso.app'}/app`;

            const response = await fetch('/api/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    name: name,
                    type: 'both',
                    appLink: appLink,
                    authMethod: 'google'
                })
            });

            const result = await response.json();

            if (result.success) {
                console.log('✅ Emails de boas-vindas Google enviados!');
                return { success: true, data: result.data };
            } else {
                console.error('❌ Falha ao enviar emails Google:', result.error);
                return { success: false, error: result.error };
            }
        } catch (error) {
            console.error('❌ Erro ao enviar emails Google:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Inicializar módulos para um usuário baseado no plano
     */
    async initializeUserModules(uid, planType = 'free') {
        try {
            console.log(`🔧 Inicializando módulos para usuário ${uid} - Plano: ${planType}`);

            // Usar o moduleService para configurar os módulos
            const result = await moduleService.updateUserModulesFromPlan(uid, planType);

            if (result.success) {
                console.log(`✅ Módulos inicializados com sucesso para ${uid}`);
                return { success: true, modules: result.modules, limitations: result.limitations };
            } else {
                throw new Error('Falha ao inicializar módulos');
            }
        } catch (error) {
            console.error('❌ Erro ao inicializar módulos do usuário:', error);
            throw error;
        }
    }

    /**
     * Verificar e aplicar limitações de módulo
     */
    async checkModuleLimitations(uid, moduleId, currentCount = 0) {
        try {
            const userData = await this.getUserData(uid);
            const limitations = userData.limitations || userData.customLimitations || {};

            const moduleLimitation = limitations[moduleId];
            if (!moduleLimitation) {
                return { allowed: true, remaining: Infinity };
            }

            // Verificar limite de contagem
            if (moduleLimitation.maxCount) {
                const isAllowed = currentCount < moduleLimitation.maxCount;
                const remaining = Math.max(0, moduleLimitation.maxCount - currentCount);

                return {
                    allowed: isAllowed,
                    remaining: remaining,
                    limit: moduleLimitation.maxCount,
                    type: 'count'
                };
            }

            // Verificar limite mensal
            if (moduleLimitation.maxPerMonth) {
                // Aqui você precisaria implementar a lógica para contar itens do mês atual
                // Por enquanto, retornando true
                return {
                    allowed: true,
                    remaining: moduleLimitation.maxPerMonth,
                    limit: moduleLimitation.maxPerMonth,
                    type: 'monthly'
                };
            }

            return { allowed: true, remaining: Infinity };
        } catch (error) {
            console.error('❌ Erro ao verificar limitações do módulo:', error);
            return { allowed: false, error: error.message };
        }
    }

    /**
     * Atualizar plano do usuário e módulos correspondentes
     */
    async updateUserPlan(uid, newPlanType) {
        try {
            console.log(`🔄 Atualizando plano do usuário ${uid} para: ${newPlanType}`);

            // 1. Atualizar o plano no Firebase
            await this.editUserData(uid, {
                planType: newPlanType,
                assinouPlano: newPlanType !== 'free',
                gratuito: newPlanType === 'free',
                planUpdatedAt: new Date()
            });

            // 2. Atualizar os módulos baseado no novo plano
            const moduleResult = await moduleService.updateUserModulesFromPlan(uid, newPlanType);

            if (moduleResult.success) {
                console.log(`✅ Plano e módulos atualizados com sucesso para ${uid}`);
                return {
                    success: true,
                    planType: newPlanType,
                    modules: moduleResult.modules,
                    limitations: moduleResult.limitations
                };
            } else {
                throw new Error('Falha ao atualizar módulos após mudança de plano');
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar plano do usuário:', error);
            throw error;
        }
    }

    /**
     * Migrar todos os usuários existentes para o sistema de módulos
     */
    async migrateAllUsersToModuleSystem() {
        try {
            console.log('🔄 Iniciando migração global para sistema de módulos...');

            const result = await moduleService.migrateExistingUsers();

            console.log(`✅ Migração concluída: ${result.migratedCount} usuários migrados`);
            return result;
        } catch (error) {
            console.error('❌ Erro na migração global:', error);
            throw error;
        }
    }

    /**
     * Verificar se usuário tem acesso a um módulo específico
     */
    async verifyModuleAccess(uid, moduleId) {
        try {
            const userData = await this.getUserData(uid);

            // Se for administrador, tem acesso total
            if (userData.administrador === true) {
                return { hasAccess: true, reason: 'admin' };
            }

            // Verificar módulos customizados primeiro
            let userModules = userData.customModules;

            // Se não tem customização, usar módulos baseados no plano
            if (!userModules) {
                const planType = userData.planType || (userData.gratuito ? 'free' : 'monthly');
                const { getModulesByPlan } = await import('./modules/moduleConfig');
                userModules = getModulesByPlan(planType);
            }

            const hasAccess = userModules && userModules.includes(moduleId);

            return {
                hasAccess,
                reason: hasAccess ? 'granted' : 'not_in_plan',
                userModules,
                planType: userData.planType
            };
        } catch (error) {
            console.error('❌ Erro ao verificar acesso ao módulo:', error);
            return { hasAccess: false, error: error.message };
        }
    }

    /**
     * Obter estatísticas de uso dos módulos
     */
    async getModuleUsageStats(uid) {
        try {
            const userData = await this.getUserData(uid);
            const stats = {
                patients: 0,
                prescriptions: 0,
                consultations: 0,
                exams: 0,
                notes: 0
            };

            // Contar pacientes
            const patients = await this.listPatients(uid);
            stats.patients = patients.length;

            // Contar receitas (últimos 30 dias)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Aqui você precisaria implementar contadores específicos
            // Por enquanto, retornando estatísticas básicas

            return {
                success: true,
                stats,
                limitations: userData.limitations || {},
                planType: userData.planType || 'free'
            };
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas de módulos:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Função helper para criar usuário com módulos corretos
     */
    async signUpWithModules(email, password, userData, planType = 'free') {
        try {
            console.log(`👤 Criando usuário com sistema de módulos - Plano: ${planType}`);

            // 1. Criar usuário
            const userCredential = await this.signUp(email, password, userData);
            const uid = userCredential.user.uid;

            // 2. Inicializar módulos
            await this.initializeUserModules(uid, planType);

            console.log(`✅ Usuário criado com sucesso e módulos inicializados`);
            return userCredential;
        } catch (error) {
            console.error('❌ Erro ao criar usuário com módulos:', error);
            throw error;
        }
    }

// Função para processar texto de exame com IA
    async processExamTextWithAI(text) {
        try {
            // Truncar o texto para não exceder limites da API
            const truncatedText = text.substring(0, 15000);

            // Abordagem 1: Chamada direta à API OpenAI (menos segura, mas mais simples)
            // Requer que NEXT_PUBLIC_OPENAI_KEY esteja definido

            const apiKey = process.env.NEXT_PUBLIC_OPENAI_KEY;
            if (!apiKey) {
                throw new Error("Chave da API OpenAI não configurada");
            }

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "Você é um assistente especializado em processar resultados de exames médicos."
                        },
                        {
                            role: "user",
                            content: `
              Analise o texto do exame médico a seguir e extraia todos os resultados em formato JSON.
              O resultado deve ser agrupado nas seguintes categorias:
              - LabGerais: Exames Laboratoriais Gerais
              - PerfilLipidico: Perfil Lipídico
              - Hepaticos: Exames Hepáticos e Pancreáticos
              - Inflamatorios: Inflamatórios e Imunológicos
              - Hormonais: Hormonais
              - Vitaminas: Vitaminas e Minerais
              - Infecciosos: Infecciosos / Sorologias
              - Tumorais: Marcadores Tumorais
              - Cardiacos: Cardíacos e Musculares
              - Imagem: Imagem e Diagnóstico
              - Outros: Outros Exames
              
              Estruture o JSON como:
              {
                "LabGerais": {
                  "Hemograma completo": "valor",
                  "Plaquetas": "valor"
                },
                "PerfilLipidico": {
                  "Colesterol Total": "valor"
                }
              }
              
              Inclua apenas as categorias onde houver resultados identificados.
              Para cada exame, inclua o nome do exame e o resultado completo com unidades.
              
              Texto do exame:
              ${truncatedText}
            `
                        }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            const result = await response.json();

            if (!result.choices || !result.choices[0] || !result.choices[0].message) {
                console.error("Resposta inesperada da API OpenAI:", result);
                throw new Error("Resposta inválida da API");
            }

            // Analisar a resposta JSON
            try {
                return JSON.parse(result.choices[0].message.content);
            } catch (parseError) {
                console.error("Erro ao analisar JSON da resposta:", parseError);
                throw new Error("Falha ao processar a resposta da IA");
            }
        } catch (error) {
            console.error("Erro ao processar texto com IA:", error);
            throw error;
        }
    }

// Abordagem 2: Proxy através de uma API Route (melhor para produção)
// Use esta função alternativa se preferir não expor a chave da API
    async processExamTextWithAIProxy(text) {
        try {
            const response = await fetch('/api/process-exam-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text.substring(0, 15000) }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro na API: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success || !result.data) {
                throw new Error("Resposta inválida da API");
            }

            return result.data;
        } catch (error) {
            console.error("Erro ao processar texto via API proxy:", error);
            throw error;
        }
    }

// Função auxiliar para processamento em lote de exames
    async batchProcessExams(doctorId, patientId, examIds = []) {
        const results = [];
        const errors = [];

        for (const examId of examIds) {
            try {
                // Buscar o exame
                const exam = await this.getExam(doctorId, patientId, examId);
                if (!exam) {
                    errors.push({ examId, error: "Exame não encontrado" });
                    continue;
                }

                // Verificar se tem anexos PDF
                const pdfAttachments = (exam.attachments || []).filter(att =>
                    att.fileType === 'application/pdf' ||
                    (att.fileName && att.fileName.toLowerCase().endsWith('.pdf'))
                );

                if (pdfAttachments.length === 0) {
                    errors.push({ examId, error: "Nenhum PDF encontrado" });
                    continue;
                }

                // Processar o primeiro PDF
                const firstPdf = pdfAttachments[0];
                if (!firstPdf.fileUrl) {
                    errors.push({ examId, error: "URL do PDF não encontrada" });
                    continue;
                }

                const processResult = await this.processExamFile(
                    firstPdf.fileUrl,
                    doctorId,
                    patientId,
                    examId
                );

                if (processResult.success && processResult.data) {
                    // Atualizar o exame com os resultados
                    await this.updateExam(doctorId, patientId, examId, {
                        results: processResult.data,
                        lastProcessed: new Date(),
                        observations: exam.observations +
                            (exam.observations ? '\n\n' : '') +
                            `Processado automaticamente pela IA em ${new Date().toLocaleString()}.`
                    });

                    results.push({ examId, success: true });
                } else {
                    errors.push({ examId, error: processResult.error || "Falha no processamento" });
                }
            } catch (error) {
                console.error(`Erro ao processar exame ${examId}:`, error);
                errors.push({ examId, error: error.message });
            }
        }

        return {
            totalProcessed: examIds.length,
            successful: results.length,
            failed: errors.length,
            results,
            errors
        };
    }

    async login(email, password) {
        try {
            return await signInWithEmailAndPassword(this.auth, email, password);
        } catch (error) {
            console.error("Erro no login:", error);
            throw error;
        }
    }

    async signUp(email, password, userData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const uid = userCredential.user.uid;
            await setDoc(doc(this.firestore, "users", uid), userData);
            return userCredential;
        } catch (error) {
            console.error("Erro no cadastro:", error);
            throw error;
        }
    }

    async sendPasswordResetEmail(email) {
        try {
            await firebaseSendPasswordResetEmail(this.auth, email);
            return true;
        } catch (error) {
            console.error("Erro ao enviar email de recuperação:", error);
            throw error;
        }
    }

    async getUserData(uid) {
        try {
            const docRef = doc(this.firestore, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                throw new Error("Usuário não encontrado");
            }
        } catch (error) {
            console.error("Erro ao buscar dados do usuário:", error);
            throw error;
        }
    }

    async checkUserByCPF(cpf) {
        try {
            const q = query(collection(this.firestore, "users"), where("CPF", "==", cpf));
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error("Erro ao verificar CPF do usuário:", error);
            throw error;
        }
    }

    async editUserData(uid, newData) {
        try {
            const userRef = doc(this.firestore, "users", uid);

            // Tentar atualizar primeiro
            try {
                await updateDoc(userRef, newData);
                return true;
            } catch (error) {
                // Se falhar porque documento não existe, criar com setDoc
                if (error.code === 'not-found') {
                    console.log(`📝 Documento não existe para ${uid}, criando novo...`);
                    await setDoc(userRef, {
                        ...newData,
                        createdAt: new Date()
                    });
                    return true;
                } else {
                    throw error; // Re-lançar outros erros
                }
            }
        } catch (error) {
            console.error("Erro ao editar/criar dados do usuário:", error);
            throw error;
        }
    }


    // Improved weather data functions for firebaseService.js

    async getUserWeatherData(uid) {
        try {
            if (!uid) {
                console.warn("getUserWeatherData: UID não fornecido");
                return { weatherData: null, currentCity: "São Paulo,BR" };
            }

            // Get user document
            const userRef = doc(this.firestore, "users", uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                console.warn("getUserWeatherData: Usuário não encontrado", uid);
                return { weatherData: null, currentCity: "São Paulo,BR" };
            }

            const userData = userDoc.data();

            // Extract city with better fallbacks
            let currentCity = "São Paulo,BR"; // Default

            // Try to get from user's address
            if (userData.address) {
                if (userData.address.city) {
                    // Make sure city has country code
                    const cityName = userData.address.city;
                    currentCity = cityName.includes(',') ? cityName : `${cityName},BR`;
                }
            }

            // Try to get from previous weather data if no address
            if (!userData.address?.city && userData.weatherData?.cityRequested) {
                currentCity = userData.weatherData.cityRequested;
            }

            // Log data for debugging
            if (userData.weatherData) {
                console.log(`getUserWeatherData: Dados encontrados para usuário ${uid} (cidade: ${currentCity})`);

                // Calculate data age for logging
                let dataAge = "desconhecida";
                try {
                    if (userData.weatherData.timestamp) {
                        const timestamp = userData.weatherData.timestamp;
                        const timestampDate = typeof timestamp === 'object' && timestamp.toDate
                            ? timestamp.toDate()
                            : new Date(timestamp);

                        const now = new Date();
                        const diff = now - timestampDate;
                        dataAge = `${Math.round(diff/60000)} minutos`;
                    }
                } catch (e) {
                    dataAge = "erro ao calcular";
                }

                console.log(`getUserWeatherData: Idade dos dados: ${dataAge}`);
            } else {
                console.log(`getUserWeatherData: Sem dados para usuário ${uid} (cidade: ${currentCity})`);
            }

            return {
                weatherData: userData.weatherData || null,
                currentCity: currentCity
            };
        } catch (error) {
            console.error("getUserWeatherData: Erro:", error);
            // Return safe defaults
            return { weatherData: null, currentCity: "São Paulo,BR" };
        }
    }

    async updateUserWeatherData(uid, weatherData, cityRequested) {
        try {
            if (!uid) {
                console.error("[Firebase] UID não fornecido para updateUserWeatherData");
                return false;
            }

            if (!weatherData) {
                console.error("[Firebase] Dados inválidos para updateUserWeatherData");
                return false;
            }

            // Garantir que a cidade tenha um valor
            const city = cityRequested || "São Paulo,BR";

            // Gerar uma chave única para limitação de taxa POR USUÁRIO
            const updateKey = `${uid}_${city}`;
            const now = Date.now();

            // Verificar se atualizamos recentemente (últimos 5 minutos)
            if (lastUpdateTimestamps[updateKey]) {
                const timeSinceLastUpdate = now - lastUpdateTimestamps[updateKey];
                const MIN_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutos

                if (timeSinceLastUpdate < MIN_UPDATE_INTERVAL) {
                    console.log(`[Firebase] Atualização recente para usuário ${uid} (${Math.round(timeSinceLastUpdate/60000)}min)`);
                    return true; // Retorna sucesso para não mostrar erro na UI
                }
            }

            // Definir o timestamp ANTES da atualização para evitar condições de corrida
            lastUpdateTimestamps[updateKey] = now;

            // Referência para o documento do usuário
            const userRef = doc(this.firestore, "users", uid);

            // Adicionar timestamp e cidade à atualização
            const weatherDataWithMetadata = {
                ...weatherData,
                timestamp: new Date(),
                cityRequested: city,
                lastUpdated: new Date().toISOString(),
                updateId: Date.now() // ID único para esta atualização
            };

            console.log(`[Firebase] Atualizando dados de clima para ${uid} (${city})`);

            // Realizar a atualização
            await updateDoc(userRef, {
                weatherData: weatherDataWithMetadata
            });

            console.log(`[Firebase] Atualização de clima concluída para ${uid}`);
            return true;
        } catch (error) {
            console.error(`[Firebase] Erro ao atualizar dados de clima:`, error);
            return false;
        }
    }

    async filterPatients(doctorId, filters = {}) {
        try {
            let patientsRef = collection(this.firestore, "users", doctorId, "patients");
            let queryRef = patientsRef;

            // Aplicar filtros no servidor quando possível
            if (filters.status) {
                queryRef = query(queryRef, where("statusList", "array-contains", filters.status));
            }

            // Para o filtro de gênero, vamos normalizar tudo para minúsculas
            if (filters.gender) {
                // Converter o filtro para minúscula para corresponder ao formato do banco de dados
                const genderFilter = filters.gender.toLowerCase();

                // Não aplicar filtro se for "ambos", caso contrário filtrar por gênero exato
                if (genderFilter !== "ambos") {
                    queryRef = query(queryRef, where("gender", "==", genderFilter));
                }
            }

            // Executar a consulta
            const snapshot = await getDocs(queryRef);
            let patients = [];

            snapshot.forEach(doc => {
                patients.push({ id: doc.id, ...doc.data() });
            });

            console.log(`Filtro inicial: ${patients.length} pacientes carregados`);

            // Aplicar filtros adicionais no cliente
            if (Object.keys(filters).length > 0) {
                // Filtro de condições de saúde
                if (filters.conditions && filters.conditions.length > 0) {
                    console.log(`Aplicando filtro de condições: ${filters.conditions.join(', ')}`);
                    patients = patients.filter(patient => {
                        // Coletar todas as condições do paciente em um array
                        const patientConditions = [];

                        // Verificar se é fumante
                        if (patient.isSmoker === true ||
                            patient.condicoesClinicas?.ehFumante === "Sim" ||
                            (patient.chronicDiseases &&
                                Array.isArray(patient.chronicDiseases) &&
                                patient.chronicDiseases.some(d =>
                                    typeof d === 'string' && d.toLowerCase().includes("fumante")))) {
                            patientConditions.push('fumante');
                        }

                        // Verificar doenças crônicas
                        const chronicDiseases = [];

                        // Checar em chronicDiseases (array)
                        if (Array.isArray(patient.chronicDiseases)) {
                            chronicDiseases.push(...patient.chronicDiseases);
                        }

                        // Checar em condicoesClinicas.doencas (array)
                        if (Array.isArray(patient.condicoesClinicas?.doencas)) {
                            chronicDiseases.push(...patient.condicoesClinicas.doencas);
                        }

                        // Processar as doenças para extrair condições específicas
                        chronicDiseases.forEach(disease => {
                            if (!disease) return;
                            const lowerDisease = typeof disease === 'string' ? disease.toLowerCase() : '';

                            if (lowerDisease.includes('diabet')) patientConditions.push('diabetes');
                            if (lowerDisease.includes('hipertens') || lowerDisease.includes('pressão alta')) patientConditions.push('hipertensao');
                            if (lowerDisease.includes('obes')) patientConditions.push('obeso');
                            if (lowerDisease.includes('alergi')) patientConditions.push('alergia');
                            if (lowerDisease.includes('cardio') || lowerDisease.includes('coração')) patientConditions.push('cardiopatia');
                            if (lowerDisease.includes('asma') || lowerDisease.includes('respirat')) patientConditions.push('asma');
                            if (lowerDisease.includes('cancer')) patientConditions.push('cancer');
                        });

                        // Verificar status "internado"
                        if (patient.statusList && patient.statusList.includes("Internado")) {
                            patientConditions.push('internado');
                        }

                        // Verificar se o paciente tem alguma das condições filtradas
                        return filters.conditions.some(condition => patientConditions.includes(condition));
                    });
                    console.log(`Após filtro de condições: ${patients.length} pacientes`);
                }

                // Filtro de plano de saúde
                if (filters.healthPlan) {
                    console.log(`Aplicando filtro de plano de saúde: ${filters.healthPlan}`);
                    patients = patients.filter(patient => {
                        // Converter o filtro para minúscula para facilitar a comparação
                        const healthPlanFilter = filters.healthPlan.toLowerCase();

                        // Verificar em healthPlans (array)
                        if (Array.isArray(patient.healthPlans) && patient.healthPlans.length > 0) {
                            return patient.healthPlans.some(plan =>
                                plan.name?.toLowerCase().includes(healthPlanFilter));
                        }

                        // Verificar em healthPlan (objeto único)
                        if (patient.healthPlan && typeof patient.healthPlan === 'object') {
                            return patient.healthPlan.name?.toLowerCase().includes(healthPlanFilter);
                        }

                        // Verificar status "Particular"
                        if (healthPlanFilter === 'particular' &&
                            patient.statusList &&
                            patient.statusList.includes('Particular')) {
                            return true;
                        }

                        return false;
                    });
                    console.log(`Após filtro de plano de saúde: ${patients.length} pacientes`);
                }

                // Filtro de faixa etária
                if (filters.ageRange) {
                    console.log(`Aplicando filtro de faixa etária: ${filters.ageRange}`);
                    patients = patients.filter(patient => {
                        if (!patient.birthDate && !patient.dataNascimento) return false;

                        try {
                            // Converter birthDate para objeto Date (formato "dd/MM/yyyy")
                            const birthDateStr = patient.birthDate || patient.dataNascimento;
                            let birthDate;

                            if (typeof birthDateStr === 'string') {
                                // Tentar formato DD/MM/YYYY
                                const parts = birthDateStr.split('/');
                                if (parts.length === 3) {
                                    birthDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                                } else {
                                    birthDate = new Date(birthDateStr);
                                }
                            } else {
                                birthDate = new Date(birthDateStr);
                            }

                            if (isNaN(birthDate.getTime())) return false;

                            const age = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));

                            // Verificar a faixa etária selecionada
                            if (filters.ageRange.includes('-')) {
                                // Faixa com intervalo: "0-12", "13-17", etc.
                                const [minAge, maxAge] = filters.ageRange.split('-');
                                return age >= parseInt(minAge) && age <= parseInt(maxAge);
                            } else if (filters.ageRange.includes('+')) {
                                // Faixa "65+" (idosos)
                                const minAge = parseInt(filters.ageRange);
                                return age >= minAge;
                            }

                            return false;
                        } catch (e) {
                            console.warn(`Erro ao calcular idade para filtro:`, e);
                            return false;
                        }
                    });
                    console.log(`Após filtro de faixa etária: ${patients.length} pacientes`);
                }

                // Filtro de região (estado/cidade)
                if (filters.region?.state || filters.region?.city) {
                    console.log(`Aplicando filtro de região: estado=${filters.region.state}, cidade=${filters.region.city}`);
                    patients = patients.filter(patient => {
                        let match = true;

                        // Verificar estado
                        if (filters.region.state) {
                            const patientState = patient.state || patient.endereco?.estado;
                            match = match && patientState && patientState.toUpperCase() === filters.region.state.toUpperCase();
                        }

                        // Verificar cidade
                        if (filters.region.city) {
                            const patientCity = patient.city || patient.endereco?.cidade;
                            match = match && patientCity &&
                                patientCity.toLowerCase().includes(filters.region.city.toLowerCase());
                        }

                        return match;
                    });
                    console.log(`Após filtro de região: ${patients.length} pacientes`);
                }

                // Filtro de período de consulta
                if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) {
                    console.log(`Aplicando filtro de período: de=${filters.dateRange.start} até=${filters.dateRange.end}`);
                    patients = patients.filter(patient => {
                        // Buscar datas de consulta (próxima e última)
                        const nextConsultDate = this._parseStringToDate(patient.nextConsultationDate);
                        const lastConsultDate = this._parseStringToDate(patient.lastConsultationDate);

                        // Se não tiver datas de consulta, não passa no filtro
                        if (!nextConsultDate && !lastConsultDate) return false;

                        // Converter datas do filtro para objetos Date
                        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
                        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

                        // Verificar próxima consulta
                        if (nextConsultDate) {
                            if (startDate && endDate) {
                                return nextConsultDate >= startDate && nextConsultDate <= endDate;
                            } else if (startDate) {
                                return nextConsultDate >= startDate;
                            } else if (endDate) {
                                return nextConsultDate <= endDate;
                            }
                            return true;
                        }

                        // Verificar última consulta (se não encontrou próxima)
                        if (lastConsultDate) {
                            if (startDate && endDate) {
                                return lastConsultDate >= startDate && lastConsultDate <= endDate;
                            } else if (startDate) {
                                return lastConsultDate >= startDate;
                            } else if (endDate) {
                                return lastConsultDate <= endDate;
                            }
                            return true;
                        }

                        return false;
                    });
                    console.log(`Após filtro de período: ${patients.length} pacientes`);
                }
            }

            console.log(`Retornando ${patients.length} pacientes filtrados`);
            return patients;
        } catch (error) {
            console.error("Erro ao filtrar pacientes:", error);
            return [];
        }
    }

    async listAllUsers(pageSize = 100, lastUser = null, searchQuery = "") {
        try {
            const usersRef = collection(this.firestore, "users");
            let usersQuery;

            if (lastUser) {
                usersQuery = query(
                    usersRef,
                    orderBy("fullName", "asc"),
                    startAfter(lastUser),
                    limitFn(pageSize)           // usa limitFn em vez de limit
                );
            } else if (searchQuery) {
                const upperBound = searchQuery + "\uf8ff";

                const nameQuery = query(
                    usersRef,
                    where("fullName", ">=", searchQuery),
                    where("fullName", "<=", upperBound),
                    limitFn(pageSize)
                );

                const emailQuery = query(
                    usersRef,
                    where("email", ">=", searchQuery),
                    where("email", "<=", upperBound),
                    limitFn(pageSize)
                );

                const [nameSnap, emailSnap] = await Promise.all([
                    getDocs(nameQuery),
                    getDocs(emailQuery),
                ]);

                const map = new Map();
                nameSnap.forEach(doc => map.set(doc.id, { id: doc.id, ...doc.data() }));
                emailSnap.forEach(doc => {
                    if (!map.has(doc.id)) map.set(doc.id, { id: doc.id, ...doc.data() });
                });
                return Array.from(map.values());
            } else {
                usersQuery = query(
                    usersRef,
                    orderBy("fullName", "asc"),
                    limitFn(pageSize)
                );
            }

            const snap = await getDocs(usersQuery);
            const users = [];
            snap.forEach(doc => {
                const data = doc.data();
                users.push({
                    id: doc.id,
                    fullName: data.fullName || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    city: data.address?.city || "",
                    state: data.address?.state || "",
                    cpf: data.cpf || "",
                    isAdmin: data.administrador === true,
                    photoURL: data.photoURL || "",
                    assinouPlano: data.assinouPlano === true,
                    createdAt: data.createdAt || null,
                });
            });

            return users;
        } catch (error) {
            console.error("Erro ao listar usuários:", error);
            throw error;
        }
    }


// Updated to use 30 minutes instead of 3 hours
    async shouldUpdateWeatherData(weatherData, currentCity) {
        try {
            // If no data, definitely update
            if (!weatherData) {
                console.log("shouldUpdateWeatherData: Sem dados, atualização necessária");
                return true;
            }

            // If the city is different, definitely update
            if (weatherData.cityRequested !== currentCity) {
                console.log(`shouldUpdateWeatherData: Cidade mudou de ${weatherData.cityRequested} para ${currentCity}, atualização necessária`);
                return true;
            }

            // If data exists, check age with better timestamp handling
            const now = Date.now();
            let dataTime = 0;

            try {
                if (weatherData.timestamp) {
                    // Handle different timestamp formats
                    if (typeof weatherData.timestamp === 'object' && weatherData.timestamp.toDate) {
                        dataTime = weatherData.timestamp.toDate().getTime();
                    } else if (weatherData.timestamp instanceof Date) {
                        dataTime = weatherData.timestamp.getTime();
                    } else if (typeof weatherData.timestamp === 'string') {
                        dataTime = new Date(weatherData.timestamp).getTime();
                    } else if (typeof weatherData.timestamp === 'number') {
                        dataTime = weatherData.timestamp;
                    }
                }
            } catch (e) {
                console.warn("shouldUpdateWeatherData: Erro no parsing de timestamp:", e);
            }

            // UPDATED: Changed from 3 hours to 30 minutes
            const THIRTY_MINUTES = 30 * 60 * 1000;

            if (!dataTime || (now - dataTime > THIRTY_MINUTES)) {
                const ageMinutes = dataTime ? Math.round((now - dataTime) / 60000) : "desconhecida";
                console.log(`shouldUpdateWeatherData: Dados antigos (${ageMinutes}min), atualização necessária`);
                return true;
            }

            // Data is still fresh
            console.log(`shouldUpdateWeatherData: Dados ainda válidos (${Math.round((now - dataTime) / 60000)}min de idade)`);
            return false;
        } catch (error) {
            console.error("shouldUpdateWeatherData: Erro:", error);
            // On error, be conservative and don't force an update
            return false;
        }
    }

// Função para adicionar um novo registro ao histórico de status
    async addPatientStatusHistory(doctorId, patientId, status, notes = "") {
        try {
            const statusHistoryRef = collection(
                this.firestore,
                "users",
                doctorId,
                "patients",
                patientId,
                "statusHistory"
            );

            // Criar um novo documento com ID automático
            const newHistoryRecord = {
                status: status,
                timestamp: new Date(),
                updatedBy: this.auth.currentUser?.displayName || 'Usuário',
                notes: notes
            };

            await addDoc(statusHistoryRef, newHistoryRecord);
            return true;
        } catch (error) {
            console.error("Erro ao adicionar histórico de status:", error);
            return false;
        }
    }

    // ====================================================
    // Operações CRUD para receitas (subcoleção em "users/{doctorId}/patients")
    // ====================================================

    async createPrescription(doctorId, patientId, prescriptionData) {
        try {
            const prescriptionRef = doc(collection(this.firestore, "users", doctorId, "patients", patientId, "prescriptions"));

            // Garantir que temos arrays vazios para medicamentos quando não fornecidos
            if (!prescriptionData.medications) {
                prescriptionData.medications = [];
            }

            const newPrescription = {
                ...prescriptionData,
                id: prescriptionRef.id,
                doctorId: doctorId,
                patientId: patientId,
                createdAt: new Date(),
                updatedAt: new Date(),
                status: prescriptionData.status || "active"
            };

            await setDoc(prescriptionRef, newPrescription);
            return prescriptionRef.id;
        } catch (error) {
            console.error("Erro ao criar receita:", error);
            throw error;
        }
    }

    async updatePrescription(doctorId, patientId, prescriptionId, prescriptionData) {
        try {
            const prescriptionRef = doc(this.firestore, "users", doctorId, "patients", patientId, "prescriptions", prescriptionId);

            // Verifica se a receita existe
            const docSnap = await getDoc(prescriptionRef);
            if (!docSnap.exists()) {
                throw new Error("Receita não encontrada");
            }

            const updatedData = {
                ...prescriptionData,
                updatedAt: new Date()
            };

            await updateDoc(prescriptionRef, updatedData);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar receita:", error);
            throw error;
        }
    }

    async deletePrescription(doctorId, patientId, prescriptionId) {
        try {
            const prescriptionRef = doc(this.firestore, "users", doctorId, "patients", patientId, "prescriptions", prescriptionId);

            // Verifica se a receita existe
            const docSnap = await getDoc(prescriptionRef);
            if (!docSnap.exists()) {
                throw new Error("Receita não encontrada");
            }

            await deleteDoc(prescriptionRef);
            console.log("Receita deletada com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro ao deletar receita:", error);
            throw error;
        }
    }

    async addMedicationToPrescription(doctorId, patientId, prescriptionId, medicationData) {
        try {
            const prescriptionRef = doc(this.firestore, "users", doctorId, "patients", patientId, "prescriptions", prescriptionId);

            // Verifica se a receita existe
            const docSnap = await getDoc(prescriptionRef);
            if (!docSnap.exists()) {
                throw new Error("Receita não encontrada");
            }

            const prescription = docSnap.data();
            const medications = prescription.medications || [];

            // Adiciona ID único ao medicamento se não tiver
            const medication = {
                ...medicationData,
                id: medicationData.id || Date.now().toString()
            };

            medications.push(medication);

            await updateDoc(prescriptionRef, {
                medications: medications,
                updatedAt: new Date()
            });

            return medication.id;
        } catch (error) {
            console.error("Erro ao adicionar medicamento à receita:", error);
            throw error;
        }
    }

    async removeMedicationFromPrescription(doctorId, patientId, prescriptionId, medicationId) {
        try {
            const prescriptionRef = doc(this.firestore, "users", doctorId, "patients", patientId, "prescriptions", prescriptionId);

            // Verifica se a receita existe
            const docSnap = await getDoc(prescriptionRef);
            if (!docSnap.exists()) {
                throw new Error("Receita não encontrada");
            }

            const prescription = docSnap.data();
            const medications = prescription.medications || [];

            // Remove o medicamento pelo ID
            const updatedMedications = medications.filter(med => med.id !== medicationId);

            await updateDoc(prescriptionRef, {
                medications: updatedMedications,
                updatedAt: new Date()
            });

            return true;
        } catch (error) {
            console.error("Erro ao remover medicamento da receita:", error);
            throw error;
        }
    }

    // ====================================================
    // Operações CRUD para Pacientes (subcoleção em "users/{doctorId}/patients")
    // ====================================================
    async listPatients(doctorId) {
        try {
            const patientsCollection = collection(this.firestore, "users", doctorId, "patients");
            const querySnapshot = await getDocs(patientsCollection);
            const patients = [];
            querySnapshot.forEach(docSnap => {
                patients.push({ id: docSnap.id, ...docSnap.data() });
            });
            return patients;
        } catch (error) {
            console.error("Erro ao listar pacientes:", error);
            return [];
        }
    }

    // marcar ou desmarc paciente como favorito
    async updateFavoriteStatus(doctorId, patientId, isFavorite) {
        try {
            const patientRef = doc(this.firestore, "users", doctorId, "patients", patientId);
            await updateDoc(patientRef, { favorite: isFavorite, updatedAt: new Date() });
            return true;
        } catch (error) {
            console.error("Erro ao atualizar status favorito:", error);
            throw error;
        }
    }

    async getPatientsByDoctor(doctorId) {
        // Como os pacientes já estão dentro do documento do médico, basta listar
        return await this.listPatients(doctorId);
    }

    async createProblemReport(userId, reportData) {
        try {
            const reportRef = doc(collection(this.firestore, "reports"));
            const newReport = {
                ...reportData,
                id: reportRef.id,
                createdAt: new Date(),
                status: "novo",
            };
            await setDoc(reportRef, newReport);

            // Also create a reference in the user's reports subcollection
            const userReportRef = doc(collection(this.firestore, "users", userId, "reports"), reportRef.id);
            await setDoc(userReportRef, newReport);

            return reportRef.id;
        } catch (error) {
            console.error("Erro ao criar relatório de problema:", error);
            throw error;
        }
    }

    async getPatientStatusHistory(doctorId, patientId) {
        try {
            if (!doctorId || !patientId) {
                console.warn("Parâmetros inválidos para getPatientStatusHistory");
                return [];
            }

            const statusHistoryRef = collection(
                this.firestore,
                "users",
                doctorId,
                "patients",
                patientId,
                "statusHistory"
            );

            // Ordenar por timestamp, mais recente primeiro
            const q = query(statusHistoryRef, orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);

            const history = [];
            querySnapshot.forEach(doc => {
                history.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return history;
        } catch (error) {
            console.error("Erro ao buscar histórico de status do paciente:", error);
            return [];
        }
    }

    async createPatient(doctorId, patient) {
        try {
            const patientRef = doc(collection(this.firestore, "users", doctorId, "patients"));
            const newPatient = {
                ...patient,
                id: patientRef.id,
                createdAt: new Date(),
                doctorId: doctorId // opcional, para redundância
            };
            await setDoc(patientRef, newPatient);
            return patientRef.id;
        } catch (error) {
            console.error("Erro ao criar paciente:", error);
            throw error;
        }
    }

    async updatePatient(doctorId, patientId, patientData) {
        try {
            const patientRef = doc(this.firestore, "users", doctorId, "patients", patientId);
            const updatedData = {
                ...patientData,
                updatedAt: new Date()
            };
            await updateDoc(patientRef, updatedData);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar paciente:", error);
            throw error;
        }
    }

    async deletePatient(doctorId, patientId) {
        try {
            await deleteDoc(doc(this.firestore, "users", doctorId, "patients", patientId));
            console.log("Paciente deletado com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro ao deletar paciente:", error);
            throw error;
        }
    }

    async getPatient(doctorId, patientId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "patients", patientId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar paciente:", error);
            throw error;
        }
    }

    async searchPatients(doctorId, searchTerm) {
        try {
            const patientsCollection = collection(this.firestore, "users", doctorId, "patients");
            const nameQuery = query(
                patientsCollection,
                where("patientName", ">=", searchTerm),
                where("patientName", "<=", searchTerm + '\uf8ff'),
                limitFn(20)
            );
            const emailQuery = query(
                patientsCollection,
                where("email", ">=", searchTerm),
                where("email", "<=", searchTerm + '\uf8ff'),
                limitFn(20)
            );

            const [nameResults, emailResults] = await Promise.all([
                getDocs(nameQuery),
                getDocs(emailQuery)
            ]);

            const resultsMap = new Map();
            nameResults.forEach(doc => {
                resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
            });
            emailResults.forEach(doc => {
                resultsMap.set(doc.id, { id: doc.id, ...doc.data() });
            });

            return Array.from(resultsMap.values());
        } catch (error) {
            console.error("Erro na pesquisa de pacientes:", error);
            return [];
        }
    }

    // ====================================================
    // Operações CRUD para Anamneses (subcoleção em "users/{doctorId}/patients/{patientId}/anamneses")
    // ====================================================
    async listAnamneses(doctorId, patientId) {
        try {
            const q = query(
                collection(this.firestore, "users", doctorId, "patients", patientId, "anamneses"),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const anamneses = [];
            querySnapshot.forEach(docSnap => {
                anamneses.push({ id: docSnap.id, ...docSnap.data() });
            });
            return anamneses;
        } catch (error) {
            console.error("Erro ao listar anamneses:", error);
            return [];
        }
    }

    async createAnamnese(doctorId, patientId, anamnesis) {
        try {
            const anamneseRef = doc(collection(this.firestore, "users", doctorId, "patients", patientId, "anamneses"));
            const newAnamnese = {
                ...anamnesis,
                id: anamneseRef.id,
                createdAt: new Date()
            };
            await setDoc(anamneseRef, newAnamnese);
            return anamneseRef.id;
        } catch (error) {
            console.error("Erro ao criar anamnese:", error);
            throw error;
        }
    }

    async updateAnamnese(doctorId, patientId, anamneseId, anamnesis) {
        try {
            const anamneseRef = doc(this.firestore, "users", doctorId, "patients", patientId, "anamneses", anamneseId);
            const updatedData = {
                ...anamnesis,
                updatedAt: new Date()
            };
            await updateDoc(anamneseRef, updatedData);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar anamnese:", error);
            throw error;
        }
    }

    async deleteAnamnese(doctorId, patientId, anamneseId) {
        try {
            await deleteDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "anamneses", anamneseId));
            console.log("Anamnese deletada com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro ao deletar anamnese:", error);
            throw error;
        }
    }

    async getAnamnese(doctorId, patientId, anamneseId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "anamneses", anamneseId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar anamnese:", error);
            throw error;
        }
    }

    // ====================================================
    // Operações CRUD para Consultas (subcoleção em "users/{doctorId}/patients/{patientId}/consultations")
    // ====================================================
    async listPatientConsultations(doctorId, patientId, options = {}) {
        try {
            // Cria a referência para a subcoleção do paciente
            const consultationsRef = collection(
                this.firestore,
                "users",
                doctorId,
                "patients",
                patientId,
                "consultations"
            );

            // Cria a query, ordenando pelo campo consultationDate
            let q = query(
                consultationsRef,
                orderBy("consultationDate", options.order || "desc")
            );

            // Executa a consulta
            const querySnapshot = await getDocs(q);
            const consultations = [];

            querySnapshot.forEach(docSnap => {
                // Processamos o documento para converter strings para Date
                const consultation = this._processConsultationDates({
                    id: docSnap.id,
                    ...docSnap.data()
                });
                consultations.push(consultation);
            });

            return consultations;
        } catch (error) {
            console.error("Erro ao listar as consultas do paciente:", error);
            return [];
        }
    }

    async listAllConsultations(doctorId, options = {}) {
        try {
            // Consulta de collection group para todas as subcoleções "consultations"
            let q = query(
                collectionGroup(this.firestore, "consultations"),
                where("doctorId", "==", doctorId)
            );

            // Adicionar ordenação após filtros
            q = query(q, orderBy("consultationDate", options.order || "desc"));

            // Executa a consulta
            const querySnapshot = await getDocs(q);
            const consultations = [];

            querySnapshot.forEach(docSnap => {
                // Processamos o documento para converter strings para Date
                const consultation = this._processConsultationDates({
                    id: docSnap.id,
                    ...docSnap.data()
                });
                consultations.push(consultation);
            });

            return consultations;
        } catch (error) {
            console.error("Erro ao listar todas as consultas:", error);
            return [];
        }
    }

    async createConsultation(doctorId, patientId, consultation) {
        try {
            const consultationRef = doc(collection(this.firestore, "users", doctorId, "patients", patientId, "consultations"));

            // Garantir que a data já venha como string YYYY-MM-DD
            let consultationDateStr = consultation.consultationDate;

            // Se não for string, converter garantindo que mantém o dia local
            if (typeof consultationDateStr !== 'string') {
                consultationDateStr = this._formatDateTimeToString(consultation.consultationDate);
            }

            const dataToSave = {
                ...consultation,
                id: consultationRef.id,
                createdAt: new Date(),
                doctorId: doctorId,
                // Usar a string já formatada, sem permitir conversões
                consultationDate: consultationDateStr
            };

            await setDoc(consultationRef, dataToSave);

            // Atualiza a data da última consulta do paciente
            const patientRef = doc(this.firestore, "users", doctorId, "patients", patientId);
            await updateDoc(patientRef, {
                lastConsultationDate: dataToSave.consultationDate
            });

            return consultationRef.id;
        } catch (error) {
            console.error("Erro ao criar consulta:", error);
            throw error;
        }
    }

    async updateConsultation(doctorId, patientId, consultationId, consultation) {
        try {
            const consultationRef = doc(
                this.firestore,
                "users",
                doctorId,
                "patients",
                patientId,
                "consultations",
                consultationId
            );

            // Monta o objeto que será enviado ao Firestore
            const updatedData = {
                ...consultation,
                updatedAt: new Date(),
            };

            // Se vier uma data válida, formatamos e setamos.
            // Caso contrário, removemos qualquer chave para não gravar null.
            if (consultation.consultationDate != null) {
                updatedData.consultationDate = this._formatDateTimeToString(
                    consultation.consultationDate
                );
            } else {
                delete updatedData.consultationDate;
            }

            await updateDoc(consultationRef, updatedData);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar consulta:", error);
            throw error;
        }
    }


    async deleteConsultation(doctorId, patientId, consultationId) {
        try {
            await deleteDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "consultations", consultationId));
            console.log("Consulta deletada com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro ao deletar consulta:", error);
            throw error;
        }
    }

    async getConsultation(doctorId, patientId, consultationId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "consultations", consultationId));

            if (!docSnap.exists()) return null;

            // Processamos o documento para converter strings para Date
            const consultation = this._processConsultationDates(docSnap.data());
            return consultation;
        } catch (error) {
            console.error("Erro ao buscar consulta:", error);
            throw error;
        }
    }

    // ====================================================
    // Operações CRUD para Notas (subcoleção em "users/{doctorId}/patients/{patientId}/notes")
    // ====================================================
    async listNotes(doctorId, patientId) {
        try {
            const q = query(
                collection(this.firestore, "users", doctorId, "patients", patientId, "notes"),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const notes = [];
            querySnapshot.forEach(docSnap => {
                notes.push({ id: docSnap.id, ...docSnap.data() });
            });
            return notes;
        } catch (error) {
            console.error("Erro ao listar notas:", error);
            return [];
        }
    }

    async getNote(doctorId, patientId, noteId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "notes", noteId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar nota:", error);
            throw error;
        }
    }

    async createNote(doctorId, patientId, noteData) {
        try {
            const noteRef = doc(collection(this.firestore, "users", doctorId, "patients", patientId, "notes"));
            const newNote = {
                ...noteData,
                id: noteRef.id,
                patientId: patientId,
                doctorId: doctorId,
                createdAt: new Date(),
                lastModified: new Date()
            };
            await setDoc(noteRef, newNote);
            return noteRef.id;
        } catch (error) {
            console.error("Erro ao criar nota:", error);
            throw error;
        }
    }

    async updateNote(doctorId, patientId, noteId, noteData) {
        try {
            const noteRef = doc(this.firestore, "users", doctorId, "patients", patientId, "notes", noteId);
            const updatedData = {
                ...noteData,
                lastModified: new Date()
            };
            await updateDoc(noteRef, updatedData);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar nota:", error);
            throw error;
        }
    }

    async deleteNote(doctorId, patientId, noteId) {
        try {
            // Primeiro vamos buscar a nota para obter os anexos
            const noteDoc = await this.getNote(doctorId, patientId, noteId);

            // Se há anexos, precisamos deletá-los do storage
            if (noteDoc && noteDoc.attachments && noteDoc.attachments.length > 0) {
                for (const attachment of noteDoc.attachments) {
                    if (attachment.fileUrl) {
                        try {
                            await this.deleteFile(attachment.fileUrl);
                        } catch (err) {
                            console.warn(`Erro ao deletar arquivo ${attachment.fileName}:`, err);
                            // Continua com a deleção mesmo se falhar em deletar um arquivo
                        }
                    }
                }
            }

            // Agora deletamos o documento da nota
            await deleteDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "notes", noteId));
            console.log("Nota deletada com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro ao deletar nota:", error);
            throw error;
        }
    }

    // ====================================================
    // Funções para manipulação de arquivos das notas
    // ====================================================
    async uploadNoteAttachment(file, doctorId, patientId, noteId) {
        try {
            // Caminho para o arquivo no storage
            const path = `users/${doctorId}/patients/${patientId}/notes/${noteId}/${file.name}`;
            const fileUrl = await this.uploadFile(file, path);

            // Formato para retornar informações sobre o arquivo
            const fileInfo = {
                fileName: file.name,
                fileType: file.type,
                fileSize: this.formatFileSize(file.size),
                fileUrl: fileUrl,
                uploadedAt: new Date()
            };

            // Atualize o documento da nota para incluir o novo anexo
            const noteRef = doc(this.firestore, "users", doctorId, "patients", patientId, "notes", noteId);
            await updateDoc(noteRef, {
                attachments: arrayUnion(fileInfo),
                lastModified: new Date()
            });

            return fileInfo;
        } catch (error) {
            console.error("Erro ao fazer upload de anexo:", error);
            throw error;
        }
    }

    async removeNoteAttachment(doctorId, patientId, noteId, attachmentUrl, attachmentIndex) {
        try {
            // Buscamos primeiro a nota para obter a lista atual de anexos
            const noteRef = doc(this.firestore, "users", doctorId, "patients", patientId, "notes", noteId);
            const noteDoc = await getDoc(noteRef);

            if (!noteDoc.exists()) {
                throw new Error("Nota não encontrada");
            }

            const noteData = noteDoc.data();
            const attachments = [...(noteData.attachments || [])];

            // Verificamos se o índice é válido
            if (attachmentIndex < 0 || attachmentIndex >= attachments.length) {
                throw new Error("Índice de anexo inválido");
            }

            // Deletamos o arquivo do storage
            await this.deleteFile(attachmentUrl);

            // Removemos o anexo da lista
            attachments.splice(attachmentIndex, 1);

            // Atualizamos o documento da nota com a nova lista de anexos
            await updateDoc(noteRef, {
                attachments: attachments,
                lastModified: new Date()
            });

            return true;
        } catch (error) {
            console.error("Erro ao remover anexo da nota:", error);
            throw error;
        }
    }

    // Função auxiliar para formatar o tamanho do arquivo
    formatFileSize(sizeInBytes) {
        if (sizeInBytes < 1024) {
            return sizeInBytes + ' bytes';
        } else if (sizeInBytes < 1024 * 1024) {
            return (sizeInBytes / 1024).toFixed(1) + 'KB';
        } else if (sizeInBytes < 1024 * 1024 * 1024) {
            return (sizeInBytes / (1024 * 1024)).toFixed(1) + 'MB';
        } else {
            return (sizeInBytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB';
        }
    }

    // ====================================================
    // Operações CRUD para Exames (subcoleção em "users/{doctorId}/patients/{patientId}/exams")
    // ====================================================
    async listExams(doctorId, patientId) {
        try {
            const q = query(
                collection(this.firestore, "users", doctorId, "patients", patientId, "exams"),
                orderBy("examDate", "desc")
            );
            const querySnapshot = await getDocs(q);
            const exams = [];
            querySnapshot.forEach(docSnap => {
                exams.push({ id: docSnap.id, ...docSnap.data() });
            });
            return exams;
        } catch (error) {
            console.error("Erro ao listar exames:", error);
            return [];
        }
    }

    async createExam(doctorId, patientId, exam, resultFile) {
        try {
            const examRef = doc(collection(this.firestore, "users", doctorId, "patients", patientId, "exams"));
            let resultFileUrl;

            if (resultFile) {
                resultFileUrl = await this.uploadFile(
                    resultFile,
                    `users/${doctorId}/patients/${patientId}/exams/${examRef.id}/${resultFile.name}`
                );
            }

            const newExam = {
                ...exam,
                id: examRef.id,
                resultFileUrl,
                createdAt: new Date()
            };

            await setDoc(examRef, newExam);
            return examRef.id;
        } catch (error) {
            console.error("Erro ao criar exame:", error);
            throw error;
        }
    }

    async updateExam(doctorId, patientId, examId, exam, newResultFile) {
        try {
            const examRef = doc(this.firestore, "users", doctorId, "patients", patientId, "exams", examId);
            const examDoc = await getDoc(examRef);

            if (!examDoc.exists()) {
                throw new Error("Exame não encontrado.");
            }

            let updatedData = {
                ...exam,
                updatedAt: new Date()
            };

            if (newResultFile) {
                const currentData = examDoc.data();
                if (currentData.resultFileUrl) {
                    await this.deleteFile(currentData.resultFileUrl);
                }
                const resultFileUrl = await this.uploadFile(
                    newResultFile,
                    `users/${doctorId}/patients/${patientId}/exams/${examId}/${newResultFile.name}`
                );
                updatedData = {
                    ...updatedData,
                    resultFileUrl
                };
            }

            await updateDoc(examRef, updatedData);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar exame:", error);
            throw error;
        }
    }

    async deleteExam(doctorId, patientId, examId) {
        try {
            const examRef = doc(this.firestore, "users", doctorId, "patients", patientId, "exams", examId);
            const examDoc = await getDoc(examRef);

            if (examDoc.exists()) {
                const examData = examDoc.data();
                if (examData.resultFileUrl) {
                    await this.deleteFile(examData.resultFileUrl);
                }
            }

            await deleteDoc(examRef);
            console.log("Exame deletado com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro ao deletar exame:", error);
            throw error;
        }
    }

    async getExam(doctorId, patientId, examId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "exams", examId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar exame:", error);
            throw error;
        }
    }

    // ====================================================
    // Operações CRUD para Medicamentos (coleção em "users/{doctorId}/medications")
    // ====================================================
    async listMedications(doctorId) {
        try {
            const q = query(
                collection(this.firestore, "users", doctorId, "medications"),
                orderBy("name", "asc")
            );
            const querySnapshot = await getDocs(q);
            const medications = [];
            querySnapshot.forEach(docSnap => {
                medications.push({ id: docSnap.id, ...docSnap.data() });
            });
            return medications;
        } catch (error) {
            console.error("Erro ao listar medicamentos:", error);
            return [];
        }
    }

    async createMedication(doctorId, medicationData) {
        try {
            // Verificar se já existe um medicamento com o mesmo nome
            const q = query(
                collection(this.firestore, "users", doctorId, "medications"),
                where("name", "==", medicationData.name)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                throw new Error("Já existe um medicamento com este nome.");
            }

            const medicationRef = doc(collection(this.firestore, "users", doctorId, "medications"));
            const newMedication = {
                ...medicationData,
                id: medicationRef.id,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await setDoc(medicationRef, newMedication);
            return medicationRef.id;
        } catch (error) {
            console.error("Erro ao criar medicamento:", error);
            throw error;
        }
    }

    async updateMedication(doctorId, medicationId, medicationData) {
        try {
            // Verificar se já existe outro medicamento com o mesmo nome
            if (medicationData.name) {
                const q = query(
                    collection(this.firestore, "users", doctorId, "medications"),
                    where("name", "==", medicationData.name)
                );
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const existingDoc = querySnapshot.docs[0];
                    if (existingDoc.id !== medicationId) {
                        throw new Error("Já existe outro medicamento com este nome.");
                    }
                }
            }

            const medicationRef = doc(this.firestore, "users", doctorId, "medications", medicationId);
            const updatedData = {
                ...medicationData,
                updatedAt: new Date()
            };
            await updateDoc(medicationRef, updatedData);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar medicamento:", error);
            throw error;
        }
    }

    async deleteMedication(doctorId, medicationId) {
        try {
            await deleteDoc(doc(this.firestore, "users", doctorId, "medications", medicationId));
            return true;
        } catch (error) {
            console.error("Erro ao deletar medicamento:", error);
            throw error;
        }
    }

    async getMedication(doctorId, medicationId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "medications", medicationId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar medicamento:", error);
            throw error;
        }
    }

    // Função para buscar receitas com mais detalhes
    async listPrescriptionsWithDetails(doctorId, limitValue = 50) {
        try {
            const q = query(
                collectionGroup(this.firestore, "prescriptions"),
                where("doctorId", "==", doctorId),
                orderBy("createdAt", "desc"),
                limitFn(limitValue)
            );

            const querySnapshot = await getDocs(q);
            const prescriptions = [];

            for (const docSnap of querySnapshot.docs) {
                try {
                    const prescription = { id: docSnap.id, ...docSnap.data() };

                    // Obter o caminho completo do documento para extrair o patientId
                    const path = docSnap.ref.path;
                    const pathSegments = path.split('/');
                    const patientId = pathSegments[3]; // Assumindo o caminho: users/{doctorId}/patients/{patientId}/prescriptions/{prescriptionId}

                    // Buscar dados do paciente
                    try {
                        const patientData = await this.getPatient(doctorId, patientId);
                        if (patientData) {
                            prescription.patientData = {
                                id: patientId,
                                name: patientData.nome || patientData.patientName,
                                phone: patientData.telefone || patientData.phone,
                                email: patientData.email,
                                birthDate: patientData.dataNascimento || patientData.birthDate
                            };
                        } else {
                            prescription.patientData = { id: patientId, name: "Paciente não encontrado" };
                        }
                    } catch (err) {
                        console.warn(`Não foi possível obter dados do paciente ${patientId}:`, err);
                        prescription.patientData = { id: patientId, name: "Paciente não encontrado" };
                    }

                    prescriptions.push(prescription);
                } catch (docError) {
                    console.error("Erro ao processar documento de receita:", docError);
                    // Continua para o próximo documento
                }
            }

            return prescriptions;
        } catch (error) {
            console.error("Erro ao listar receitas com detalhes:", error);
            return [];
        }
    }

    async getPrescription(doctorId, patientId, prescriptionId) {
        try {
            const prescriptionRef = doc(
                this.firestore,
                "users",
                doctorId,
                "patients",
                patientId,
                "prescriptions",
                prescriptionId
            );
            const docSnap = await getDoc(prescriptionRef);
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar receita:", error);
            throw error;
        }
    }

    async searchMedications(doctorId, searchTerm) {
        try {
            if (!searchTerm || searchTerm.trim() === '') {
                return this.listMedications(doctorId);
            }

            // Versão corrigida sem usar limit diretamente na query
            const nameQueryStart = query(
                collection(this.firestore, "users", doctorId, "medications"),
                where("name", ">=", searchTerm),
                where("name", "<=", searchTerm + '\uf8ff'),
                orderBy("name")
            );

            const querySnapshot = await getDocs(nameQueryStart);
            const medications = [];

            // Limita os resultados manualmente
            let count = 0;
            querySnapshot.forEach(doc => {
                if (count < 20) { // Limite máximo de 20 resultados
                    medications.push({ id: doc.id, ...doc.data() });
                    count++;
                }
            });

            return medications;
        } catch (error) {
            console.error("Erro ao pesquisar medicamentos:", error);
            return [];
        }
    }

    // Método para filtrar receitas
    async filterPrescriptions(doctorId, filters) {
        try {
            let q = query(
                collectionGroup(this.firestore, "prescriptions"),
                where("doctorId", "==", doctorId)
            );

            // Adicionar filtros
            if (filters.status && filters.status !== 'all') {
                q = query(q, where("status", "==", filters.status));
            }

            if (filters.dateFrom) {
                const dateFromString = this._formatDateTimeToString(filters.dateFrom);
                q = query(q, where("createdAt", ">=", dateFromString));
            }

            if (filters.dateTo) {
                // Ajusta para o final do dia
                const dateToString = this._formatDateTimeToString(filters.dateTo);
                q = query(q, where("createdAt", "<=", dateToString));
            }

            // Ordenação
            q = query(q, orderBy("createdAt", filters.order || "desc"));

            // Executa a consulta
            const querySnapshot = await getDocs(q);
            const prescriptions = [];

            const maxResults = filters.limit || Number.MAX_SAFE_INTEGER;
            let resultCount = 0;

            for (const docSnap of querySnapshot.docs) {
                if (resultCount >= maxResults) break;

                // Processamos o documento para converter strings para Date
                const prescription = this._processConsultationDates({
                    id: docSnap.id,
                    ...docSnap.data()
                });

                prescriptions.push(prescription);
                resultCount++;
            }

            return prescriptions;
        } catch (error) {
            console.error("Erro ao filtrar receitas:", error);
            return [];
        }
    }

    // ====================================================
    // Operações CRUD para Agendas (Schedules) (subcoleção em "users/{doctorId}/schedules")
    // ====================================================
    async getDoctorSchedule(doctorId, date) {
        try {
            const dateString = this._formatDateTimeToString(date);
            const scheduleRef = doc(this.firestore, "users", doctorId, "schedules", dateString);
            const docSnap = await getDoc(scheduleRef);
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                return {
                    id: dateString,
                    doctorId: doctorId,
                    date: dateString,
                    slots: [],
                    createdAt: new Date()
                };
            }
        } catch (error) {
            console.error("Erro ao buscar agenda:", error);
            throw error;
        }
    }

    async updateDoctorSchedule(doctorId, date, scheduleData) {
        try {
            const dateString = this._formatDateTimeToString(date);
            const scheduleRef = doc(this.firestore, "users", doctorId, "schedules", dateString);
            const updatedData = {
                ...scheduleData,
                updatedAt: new Date()
            };
            await setDoc(scheduleRef, updatedData, { merge: true });
            return true;
        } catch (error) {
            console.error("Erro ao atualizar agenda:", error);
            throw error;
        }
    }

    async addAppointmentToSchedule(doctorId, date, appointmentData) {
        try {
            const dateString = this._formatDateTimeToString(date);
            const scheduleRef = doc(this.firestore, "users", doctorId, "schedules", dateString);
            const appointmentId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
            const appointment = {
                ...appointmentData,
                id: appointmentId,
                createdAt: new Date()
            };
            await updateDoc(scheduleRef, {
                slots: arrayUnion(appointment)
            });
            return appointmentId;
        } catch (error) {
            console.error("Erro ao adicionar agendamento:", error);
            throw error;
        }
    }

    async removeAppointmentFromSchedule(doctorId, date, appointmentId) {
        try {
            const dateString = this._formatDateTimeToString(date);
            const scheduleRef = doc(this.firestore, "users", doctorId, "schedules", dateString);
            const docSnap = await getDoc(scheduleRef);
            if (!docSnap.exists()) {
                throw new Error("Agenda não encontrada");
            }
            const scheduleData = docSnap.data();
            const slots = scheduleData.slots || [];
            const updatedSlots = slots.filter(slot => slot.id !== appointmentId);
            await updateDoc(scheduleRef, {
                slots: updatedSlots,
                updatedAt: new Date()
            });
            return true;
        } catch (error) {
            console.error("Erro ao remover agendamento:", error);
            throw error;
        }
    }



    // ====================================================
    // Funções Auxiliares para Operações com Arquivos (Storage)
    // ====================================================


// Função para buscar todos os relatórios de um usuário
    async listProblemReports(userId) {
        try {
            const reportsRef = collection(this.firestore, "users", userId, "reports");
            const q = query(reportsRef, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);

            const reports = [];
            querySnapshot.forEach(docSnap => {
                reports.push({ id: docSnap.id, ...docSnap.data() });
            });

            return reports;
        } catch (error) {
            console.error("Erro ao listar relatórios de problemas:", error);
            return [];
        }
    }

// Função para obter a URL de um arquivo de vídeo tutorial armazenado no Storage
    async getStorageFileUrl(path) {
        try {
            const storageRef = ref(this.storage, path);
            return await getDownloadURL(storageRef);
        } catch (error) {
            console.error("Erro ao obter URL do arquivo:", error);
            throw error;
        }
    }


    async uploadFile(file, path) {
        try {
            const storageRef = ref(this.storage, path);
            const snapshot = await uploadBytes(storageRef, file);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error("Erro ao fazer upload do arquivo:", error);
            throw error;
        }
    }

    async deleteFile(fileUrl) {
        try {
            // Verificar se temos uma URL válida
            if (!fileUrl || !fileUrl.includes('firebase')) {
                console.warn("URL de arquivo inválida:", fileUrl);
                return false;
            }

            // Extrair o caminho do arquivo da URL
            // URLs do Firebase têm um formato como:
            // https://firebasestorage.googleapis.com/v0/b/[PROJECT_ID].appspot.com/o/[FILE_PATH]?token=[TOKEN]

            // Decodificar a URL para obter o caminho
            const decodedUrl = decodeURIComponent(fileUrl);

            // Extrair o caminho (tudo depois de '/o/' e antes de '?')
            const pathStartIndex = decodedUrl.indexOf('/o/') + 3;
            const pathEndIndex = decodedUrl.indexOf('?', pathStartIndex);

            // Verificar se temos índices válidos
            if (pathStartIndex === 2 || pathEndIndex === -1) {
                console.warn("Formato de URL de arquivo inválido:", fileUrl);
                return false;
            }

            const filePath = decodedUrl.substring(pathStartIndex, pathEndIndex);

            // Agora usar o caminho extraído para referenciar o arquivo
            const fileRef = ref(this.storage, filePath);
            await deleteObject(fileRef);

            console.log(`Arquivo deletado: ${filePath}`);
            return true;
        } catch (error) {
            console.error("Erro ao deletar arquivo:", error);
            // Não propagar o erro para evitar interrupção do fluxo principal
            return false;
        }
    }

    // ====================================================
// Gerenciamento de Status do Paciente
// ====================================================
    async updatePatientStatus(doctorId, patientId, statusList) {
        try {
            const patientRef = doc(this.firestore, "users", doctorId, "patients", patientId);
            await updateDoc(patientRef, {
                statusList: statusList,
                updatedAt: new Date()
            });
            return true;
        } catch (error) {
            console.error("Erro ao atualizar status do paciente:", error);
            throw error;
        }
    }

    async addPatientStatus(doctorId, patientId, status) {
        try {
            const patientRef = doc(this.firestore, "users", doctorId, "patients", patientId);
            const patientDoc = await getDoc(patientRef);

            if (!patientDoc.exists()) {
                throw new Error("Paciente não encontrado");
            }

            const patientData = patientDoc.data();
            const currentStatusList = patientData.statusList || [];

            // Verifica se o status já existe para evitar duplicações
            if (!currentStatusList.includes(status)) {
                await updateDoc(patientRef, {
                    statusList: arrayUnion(status),
                    updatedAt: new Date()
                });
            }

            return true;
        } catch (error) {
            console.error("Erro ao adicionar status ao paciente:", error);
            throw error;
        }
    }

    async removePatientStatus(doctorId, patientId, status) {
        try {
            const patientRef = doc(this.firestore, "users", doctorId, "patients", patientId);
            const patientDoc = await getDoc(patientRef);

            if (!patientDoc.exists()) {
                throw new Error("Paciente não encontrado");
            }

            const patientData = patientDoc.data();
            const currentStatusList = patientData.statusList || [];

            // Remove o status da lista
            const updatedStatusList = currentStatusList.filter(s => s !== status);

            await updateDoc(patientRef, {
                statusList: updatedStatusList,
                updatedAt: new Date()
            });

            return true;
        } catch (error) {
            console.error("Erro ao remover status do paciente:", error);
            throw error;
        }
    }

// ====================================================
// Gerenciamento de Plano de Saúde do Paciente
// ====================================================
    async updateHealthPlan(doctorId, patientId, healthPlanData) {
        try {
            const patientRef = doc(this.firestore, "users", doctorId, "patients", patientId);
            await updateDoc(patientRef, {
                healthPlan: healthPlanData,
                updatedAt: new Date()
            });
            return true;
        } catch (error) {
            console.error("Erro ao atualizar plano de saúde do paciente:", error);
            throw error;
        }
    }

// ====================================================
// Gerenciamento de Documentos/Arquivos do Paciente
// ====================================================
    async uploadPatientDocument(file, doctorId, patientId, documentData) {
        try {
            // Caminho para o arquivo no storage
            const path = `users/${doctorId}/patients/${patientId}/documents/${file.name}`;
            const fileUrl = await this.uploadFile(file, path);

            // Formato para retornar informações sobre o arquivo
            const fileInfo = {
                id: Date.now().toString(),
                fileName: file.name,
                fileType: file.type,
                fileSize: this.formatFileSize(file.size),
                fileUrl: fileUrl,
                category: documentData.category || "Geral",
                description: documentData.description || "",
                uploadedAt: new Date()
            };

            // Atualize o documento do paciente para incluir o novo anexo
            const patientRef = doc(this.firestore, "users", doctorId, "patients", patientId);
            const patientDoc = await getDoc(patientRef);

            if (!patientDoc.exists()) {
                throw new Error("Paciente não encontrado");
            }

            const patientData = patientDoc.data();
            const documents = patientData.documents || [];

            await updateDoc(patientRef, {
                documents: [...documents, fileInfo],
                updatedAt: new Date()
            });

            return fileInfo;
        } catch (error) {
            console.error("Erro ao fazer upload de documento do paciente:", error);
            throw error;
        }
    }

    async removePatientDocument(doctorId, patientId, documentId) {
        try {
            // Buscamos primeiro o paciente para obter a lista atual de documentos
            const patientRef = doc(this.firestore, "users", doctorId, "patients", patientId);
            const patientDoc = await getDoc(patientRef);

            if (!patientDoc.exists()) {
                throw new Error("Paciente não encontrado");
            }

            const patientData = patientDoc.data();
            const documents = patientData.documents || [];

            // Encontramos o documento pelo ID
            const documentToDelete = documents.find(doc => doc.id === documentId);

            if (!documentToDelete) {
                throw new Error("Documento não encontrado");
            }

            // Deletamos o arquivo do storage
            if (documentToDelete.fileUrl) {
                await this.deleteFile(documentToDelete.fileUrl);
            }

            // Removemos o documento da lista
            const updatedDocuments = documents.filter(doc => doc.id !== documentId);

            // Atualizamos o paciente com a nova lista de documentos
            await updateDoc(patientRef, {
                documents: updatedDocuments,
                updatedAt: new Date()
            });

            return true;
        } catch (error) {
            console.error("Erro ao remover documento do paciente:", error);
            throw error;
        }
    }

    async getPatientDocuments(doctorId, patientId) {
        try {
            const patientRef = doc(this.firestore, "users", doctorId, "patients", patientId);
            const patientDoc = await getDoc(patientRef);

            if (!patientDoc.exists()) {
                throw new Error("Paciente não encontrado");
            }

            const patientData = patientDoc.data();
            return patientData.documents || [];
        } catch (error) {
            console.error("Erro ao buscar documentos do paciente:", error);
            return [];
        }
    }

    // ====================================================
// Operações CRUD para Exames (subcoleção em "users/{doctorId}/patients/{patientId}/exams")
// ====================================================

// Listar exames de um paciente
    async listExams(doctorId, patientId) {
        try {
            const q = query(
                collection(this.firestore, "users", doctorId, "patients", patientId, "exams"),
                orderBy("examDate", "desc")
            );
            const querySnapshot = await getDocs(q);
            const exams = [];
            querySnapshot.forEach(docSnap => {
                exams.push({ id: docSnap.id, ...docSnap.data() });
            });
            return exams;
        } catch (error) {
            console.error("Erro ao listar exames:", error);
            return [];
        }
    }

// Criar um novo exame
    async createExam(doctorId, patientId, examData) {
        try {
            const examRef = doc(collection(this.firestore, "users", doctorId, "patients", patientId, "exams"));

            // Garantir que dados obrigatórios estejam presentes
            const newExam = {
                ...examData,
                id: examRef.id,
                createdAt: new Date(),
                lastModified: new Date(),
                doctorId: doctorId
            };

            await setDoc(examRef, newExam);
            console.log("Exame criado com sucesso:", examRef.id);
            return examRef.id;
        } catch (error) {
            console.error("Erro ao criar exame:", error);
            throw error;
        }
    }

// Atualizar um exame existente
    async updateExam(doctorId, patientId, examId, examData) {
        try {
            const examRef = doc(this.firestore, "users", doctorId, "patients", patientId, "exams", examId);

            // Verificar se o exame existe
            const docSnap = await getDoc(examRef);
            if (!docSnap.exists()) {
                throw new Error("Exame não encontrado");
            }

            // Adicionar data de modificação
            const updatedData = {
                ...examData,
                lastModified: new Date()
            };

            await updateDoc(examRef, updatedData);
            console.log("Exame atualizado com sucesso:", examId);
            return true;
        } catch (error) {
            console.error("Erro ao atualizar exame:", error);
            throw error;
        }
    }

// Obter um exame específico
    async getExam(doctorId, patientId, examId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "exams", examId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar exame:", error);
            throw error;
        }
    }

// Deletar um exame
    async deleteExam(doctorId, patientId, examId) {
        try {
            // Primeiro, buscar o exame para verificar se tem anexos para deletar também
            const examRef = doc(this.firestore, "users", doctorId, "patients", patientId, "exams", examId);
            const examDoc = await getDoc(examRef);

            if (examDoc.exists()) {
                const examData = examDoc.data();

                // Deletar os anexos do Storage, se existirem
                if (examData.attachments && examData.attachments.length > 0) {
                    for (const attachment of examData.attachments) {
                        if (attachment.fileUrl) {
                            try {
                                await this.deleteFile(attachment.fileUrl);
                                console.log(`Anexo deletado: ${attachment.fileName}`);
                            } catch (err) {
                                console.warn(`Erro ao deletar anexo ${attachment.fileName}:`, err);
                                // Continuar mesmo se falhar em deletar um arquivo
                            }
                        }
                    }
                }
            }

            // Deletar o documento do exame
            await deleteDoc(examRef);
            console.log("Exame deletado com sucesso:", examId);
            return true;
        } catch (error) {
            console.error("Erro ao deletar exame:", error);
            throw error;
        }
    }

// ====================================================
// Funções para anexos de exames
// ====================================================

// Upload de anexo para um exame
    async uploadExamAttachment(file, doctorId, patientId, examId) {
        try {
            // Caminho para o arquivo no storage
            const path = `users/${doctorId}/patients/${patientId}/exams/${examId}/${file.name}`;
            const fileUrl = await this.uploadFile(file, path);

            // Formato para retornar informações sobre o arquivo
            const fileInfo = {
                fileName: file.name,
                fileType: file.type,
                fileSize: this.formatFileSize(file.size),
                fileUrl: fileUrl,
                storagePath: path,
                uploadedAt: new Date()
            };

            // Atualizar o documento do exame para incluir o novo anexo
            const examRef = doc(this.firestore, "users", doctorId, "patients", patientId, "exams", examId);
            await updateDoc(examRef, {
                attachments: arrayUnion(fileInfo),
                lastModified: new Date()
            });

            return fileInfo;
        } catch (error) {
            console.error("Erro ao fazer upload de anexo do exame:", error);
            throw error;
        }
    }

// Remover anexo de um exame
    async removeExamAttachment(doctorId, patientId, examId, attachmentUrl, attachmentIndex) {
        try {
            // Buscar primeiro o exame para obter a lista atual de anexos
            const examRef = doc(this.firestore, "users", doctorId, "patients", patientId, "exams", examId);
            const examDoc = await getDoc(examRef);

            if (!examDoc.exists()) {
                throw new Error("Exame não encontrado");
            }

            const examData = examDoc.data();
            const attachments = [...(examData.attachments || [])];

            // Verificar se o índice é válido
            if (attachmentIndex < 0 || attachmentIndex >= attachments.length) {
                throw new Error("Índice de anexo inválido");
            }

            // Deletar o arquivo do storage
            await this.deleteFile(attachmentUrl);

            // Remover o anexo da lista
            attachments.splice(attachmentIndex, 1);

            // Atualizar o documento do exame com a nova lista de anexos
            await updateDoc(examRef, {
                attachments: attachments,
                lastModified: new Date()
            });

            return true;
        } catch (error) {
            console.error("Erro ao remover anexo do exame:", error);
            throw error;
        }
    }

// ====================================================
// Funções de busca e filtragem de exames
// ====================================================

// Filtrar exames por categoria e/ou data
    async filterExams(doctorId, patientId, filters = {}) {
        try {
            let baseQuery = collection(this.firestore, "users", doctorId, "patients", patientId, "exams");
            let queryConstraints = [];

            // Filtrar por categoria
            if (filters.category) {
                queryConstraints.push(where("category", "==", filters.category));
            }

            // Filtrar por intervalo de datas
            if (filters.dateFrom) {
                const dateFrom = typeof filters.dateFrom === 'string'
                    ? filters.dateFrom
                    : this._formatDateTimeToString(filters.dateFrom);
                queryConstraints.push(where("examDate", ">=", dateFrom));
            }

            if (filters.dateTo) {
                const dateTo = typeof filters.dateTo === 'string'
                    ? filters.dateTo
                    : this._formatDateTimeToString(filters.dateTo);
                queryConstraints.push(where("examDate", "<=", dateTo));
            }

            // Adicionar ordenação
            queryConstraints.push(orderBy("examDate", filters.order || "desc"));

            // Executar a consulta
            const q = query(baseQuery, ...queryConstraints);
            const querySnapshot = await getDocs(q);

            const exams = [];
            querySnapshot.forEach(docSnap => {
                exams.push({ id: docSnap.id, ...docSnap.data() });
            });

            return exams;
        } catch (error) {
            console.error("Erro ao filtrar exames:", error);
            return [];
        }
    }

// Buscar exames por título ou conteúdo
    async searchExams(doctorId, patientId, searchTerm) {
        try {
            // No Firestore, não é possível fazer busca por texto diretamente
            // Vamos buscar todos os exames e filtrar no lado do cliente
            const exams = await this.listExams(doctorId, patientId);

            if (!searchTerm || searchTerm.trim() === "") {
                return exams;
            }

            const normalizedSearchTerm = searchTerm.toLowerCase().trim();

            // Filtrar exames que contêm o termo de busca no título ou observações
            return exams.filter(exam => {
                const titleMatch = exam.title && exam.title.toLowerCase().includes(normalizedSearchTerm);
                const observationsMatch = exam.observations && exam.observations.toLowerCase().includes(normalizedSearchTerm);

                // Buscar também nos resultados de exames
                let resultsMatch = false;
                if (exam.results) {
                    // Verificar em cada categoria de resultados
                    for (const category in exam.results) {
                        for (const examName in exam.results[category]) {
                            const value = exam.results[category][examName];
                            if (value && value.toString().toLowerCase().includes(normalizedSearchTerm)) {
                                resultsMatch = true;
                                break;
                            }
                        }
                        if (resultsMatch) break;
                    }
                }

                return titleMatch || observationsMatch || resultsMatch;
            });
        } catch (error) {
            console.error("Erro ao buscar exames:", error);
            return [];
        }
    }

// ====================================================
// Funções para análise e estatísticas de exames
// ====================================================

// Contar exames por categoria
    async countExamsByCategory(doctorId, patientId) {
        try {
            const exams = await this.listExams(doctorId, patientId);

            // Agrupar exames por categoria
            const categoryCounts = {};

            exams.forEach(exam => {
                const category = exam.category || 'Uncategorized';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });

            return categoryCounts;
        } catch (error) {
            console.error("Erro ao contar exames por categoria:", error);
            return {};
        }
    }

// Obter histórico de um tipo específico de exame para acompanhamento
    async getExamHistory(doctorId, patientId, examType, examName) {
        try {
            const exams = await this.listExams(doctorId, patientId);

            // Filtrar exames por categoria e ordenar por data
            const filteredExams = exams
                .filter(exam => exam.category === examType)
                .sort((a, b) => {
                    const dateA = new Date(a.examDate);
                    const dateB = new Date(b.examDate);
                    return dateA - dateB; // Ordem cronológica
                });

            // Extrair os resultados específicos do exame desejado
            const history = filteredExams.map(exam => {
                return {
                    date: exam.examDate,
                    value: exam.results &&
                    exam.results[examType] &&
                    exam.results[examType][examName] ?
                        exam.results[examType][examName] : null,
                    examId: exam.id,
                    title: exam.title
                };
            }).filter(item => item.value !== null);

            return history;
        } catch (error) {
            console.error(`Erro ao obter histórico do exame ${examType}/${examName}:`, error);
            return [];
        }
    }

// ====================================================
// Funções auxiliares para integração com outros módulos
// ====================================================

// Criar nota com base em um exame (para facilitar o registro de um exame como uma nota)
    async createNoteFromExam(doctorId, patientId, examId) {
        try {
            // Buscar os dados do exame
            const exam = await this.getExam(doctorId, patientId, examId);

            if (!exam) {
                throw new Error("Exame não encontrado");
            }

            // Preparar o conteúdo da nota
            let noteContent = `Exame: ${exam.title}\n`;
            noteContent += `Data: ${exam.examDate}\n\n`;

            if (exam.observations) {
                noteContent += `Observações: ${exam.observations}\n\n`;
            }

            // Adicionar resultados, se existirem
            if (exam.results) {
                noteContent += "Resultados:\n";
                for (const category in exam.results) {
                    noteContent += `\n${category}:\n`;
                    for (const examName in exam.results[category]) {
                        const value = exam.results[category][examName];
                        noteContent += `- ${examName}: ${value}\n`;
                    }
                }
            }

            // Criar a nota
            const noteData = {
                noteTitle: `Exame: ${exam.title}`,
                noteText: noteContent,
                noteType: "Exame",
                category: "Exames",
                consultationDate: null,
                examId: examId, // Referência ao exame original
                attachments: exam.attachments || []
            };

            return await this.createNote(doctorId, patientId, noteData);
        } catch (error) {
            console.error("Erro ao criar nota a partir do exame:", error);
            throw error;
        }
    }

// Gerar PDF de exame
    async generateExamPDF(doctorId, patientId, examId) {
        // Esta é uma função placeholder que seria implementada com uma biblioteca de geração de PDF
        // Normalmente, você usaria algo como jsPDF ou pdfmake para gerar o PDF no lado do cliente
        // ou uma solução no lado do servidor

        try {
            // Buscar os dados do exame
            const exam = await this.getExam(doctorId, patientId, examId);

            if (!exam) {
                throw new Error("Exame não encontrado");
            }

            // Aqui você implementaria a lógica de geração do PDF
            // Esta é apenas uma simulação

            console.log("Gerando PDF para o exame:", examId);

            // Retornaria o URL do PDF gerado ou um objeto Blob/File
            return {
                success: true,
                message: "Esta função será implementada com uma biblioteca de geração de PDF",
                examData: exam
            };
        } catch (error) {
            console.error("Erro ao gerar PDF do exame:", error);
            throw error;
        }
    }
}

export default new FirebaseService();