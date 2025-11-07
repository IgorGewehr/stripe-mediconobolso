import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail as firebaseSendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect
} from "firebase/auth";

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
    startAfter,
    serverTimestamp
} from "firebase/firestore";

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";

import { auth, firestore, storage } from "./firebase.js";
import moduleService from './moduleService';

/**
 * ==============================================
 * FIREBASE SERVICE - SISTEMA DE GESTÃO MÉDICA
 * ==============================================
 *
 * Serviço centralizado para todas as operações Firebase
 * Organizado por módulos funcionais:
 *
 * 1. CONFIGURAÇÃO & UTILITÁRIOS
 * 2. AUTENTICAÇÃO & USUÁRIOS
 * 3. ADMINISTRAÇÃO & RELATÓRIOS
 * 3.5 SECRETÁRIAS
 * 4. GESTÃO DE PACIENTES
 * 5. CONSULTAS & AGENDAMENTOS
 * 6. RECEITAS & MEDICAMENTOS
 * 7. EXAMES & RESULTADOS
 * 8. NOTAS & DOCUMENTOS
 * 9. ARQUIVOS & STORAGE
 * 10. CONVERSAS DE IA
 * 11. DADOS CLIMÁTICOS
 */

// ==============================================
// 1. CONFIGURAÇÃO & UTILITÁRIOS
// ==============================================

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
    prompt: 'select_account',
    access_type: 'offline',
});

const lastUpdateTimestamps = {};

// Cache cleanup - executa a cada 3 horas
if (typeof window !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        Object.keys(lastUpdateTimestamps).forEach(key => {
            const age = now - lastUpdateTimestamps[key];
            if (age > 24 * 60 * 60 * 1000) { // 24 horas
                delete lastUpdateTimestamps[key];
            }
        });
    }, 3 * 60 * 60 * 1000);
}

class FirebaseService {
    auth = auth;
    firestore = firestore;
    storage = storage;

    // ==============================================
    // UTILITÁRIOS DE DATA
    // ==============================================

    /**
     * Converte qualquer tipo de data para string YYYY-MM-DD
     */
    _formatDateTimeToString(dateValue) {
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

    /**
     * Converte string YYYY-MM-DD para objeto Date
     */
    _parseStringToDate(stringValue) {
        if (stringValue == null) return null;
        if (stringValue instanceof Date) return stringValue;
        if (typeof stringValue.toDate === 'function') {
            return stringValue.toDate();
        }
        if (typeof stringValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
            const [year, month, day] = stringValue.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        const parsed = new Date(stringValue);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    /**
     * Processa consulta convertendo datas
     */
    _processConsultationDates(consultation) {
        if (!consultation) return consultation;
        const processed = {...consultation};
        if (processed.consultationDate) {
            processed.consultationDate = this._parseStringToDate(processed.consultationDate);
        }
        return processed;
    }

    /**
     * Formata tamanho de arquivo
     */
    formatFileSize(sizeInBytes) {
        if (sizeInBytes < 1024) return sizeInBytes + ' bytes';
        if (sizeInBytes < 1024 * 1024) return (sizeInBytes / 1024).toFixed(1) + 'KB';
        if (sizeInBytes < 1024 * 1024 * 1024) return (sizeInBytes / (1024 * 1024)).toFixed(1) + 'MB';
        return (sizeInBytes / (1024 * 1024 * 1024)).toFixed(1) + 'GB';
    }

    // ==============================================
    // 2. AUTENTICAÇÃO & USUÁRIOS
    // ==============================================

    /**
     * Login com email e senha
     */
    async login(email, password) {
        try {
            const result = await signInWithEmailAndPassword(this.auth, email, password);
            await this.registerDetailedLogin(result.user.uid, 'email');
            return result;
        } catch (error) {
            console.error("Erro no login:", error);
            throw error;
        }
    }

    /**
     * Cadastro com email e senha
     */
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

    /**
     * Login com Google
     */
    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(this.auth, googleProvider);
            await this.registerDetailedLogin(result.user.uid, 'google');
            return { user: result.user, isNewUser: false };
        } catch (error) {
            if (error.code === 'auth/account-exists-with-different-credential') {
                const email = error.customData?.email;
                const pendingCred = GoogleAuthProvider.credentialFromError(error);
                const methods = await fetchSignInMethodsForEmail(this.auth, email);
                if (methods.includes('password')) {
                    const password = await promptUserForPassword(email);
                    const userCred = await signInWithEmailAndPassword(this.auth, email, password);
                    await linkWithCredential(userCred.user, pendingCred);
                    return { user: userCred.user, isNewUser: false };
                }
            }
            throw error;
        }
    }

    /**
     * Cadastro gratuito com Google
     */
    async signUpFreeWithGoogle(additionalData = {}) {
        try {
            console.log('🆓 Iniciando cadastro gratuito com Google...');
            const result = await signInWithPopup(this.auth, googleProvider);
            const user = result.user;

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
                ...additionalData
            };

            const referralSource = localStorage.getItem('referralSource');
            if (referralSource === 'enrico') {
                userData.enrico = true;
                console.log('✅ Cliente GOOGLE GRATUITO marcado como vindo através do Enrico');
            } else if (referralSource) {
                userData.referralSource = referralSource;
            }

            await setDoc(doc(this.firestore, "users", user.uid), userData);
            console.log('✅ Cadastro gratuito com Google concluído');
            return { user, userData };
        } catch (error) {
            console.error('❌ Erro no cadastro gratuito com Google:', error);
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
     * Completar perfil Google
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
     * Enviar email de recuperação de senha
     */
    async sendPasswordResetEmail(email) {
        try {
            await firebaseSendPasswordResetEmail(this.auth, email);
            return true;
        } catch (error) {
            console.error("Erro ao enviar email de recuperação:", error);
            throw error;
        }
    }

    /**
     * Registrar login detalhado
     */
    async registerDetailedLogin(uid, loginMethod = 'email') {
        try {
            const now = new Date();
            const loginData = {
                lastLogin: now,
                lastLoginTimestamp: serverTimestamp(),
                lastLoginMethod: loginMethod,
                lastUserAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                lastPlatform: typeof navigator !== 'undefined' ? navigator.platform : '',
                isCurrentlyOnline: true,
                loginCount: this.firestore.FieldValue?.increment ? this.firestore.FieldValue.increment(1) : 1,
                lastLoginDay: now.getDate(),
                lastLoginMonth: now.getMonth() + 1,
                lastLoginYear: now.getFullYear(),
                lastLoginHour: now.getHours(),
                lastLoginMinute: now.getMinutes(),
                lastLoginFormatted: now.toLocaleString('pt-BR'),
                updatedAt: now
            };

            const userRef = doc(this.firestore, "users", uid);
            await updateDoc(userRef, loginData);
            console.log(`✅ Login registrado para usuário ${uid}`);
            return true;
        } catch (error) {
            console.error("❌ Erro ao registrar login:", error);
            return false;
        }
    }

    /**
     * Buscar dados do usuário
     */
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

    /**
     * Editar dados do usuário
     */
    async editUserData(uid, newData) {
        try {
            const userRef = doc(this.firestore, "users", uid);
            try {
                await updateDoc(userRef, newData);
                return true;
            } catch (error) {
                if (error.code === 'not-found') {
                    console.log(`📝 Documento não existe para ${uid}, criando novo...`);
                    await setDoc(userRef, {
                        ...newData,
                        createdAt: new Date()
                    });
                    return true;
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error("Erro ao editar/criar dados do usuário:", error);
            throw error;
        }
    }

    // ==============================================
    // GESTÃO DE PLANOS E MÓDULOS
    // ==============================================

    /**
     * Enviar emails de boas-vindas Google
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
     * Inicializar módulos do usuário
     */
    async initializeUserModules(uid, planType = 'free') {
        try {
            console.log(`🔧 Inicializando módulos para usuário ${uid} - Plano: ${planType}`);
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
     * Verificar limitações de módulo
     */
    async checkModuleLimitations(uid, moduleId, currentCount = 0) {
        try {
            const userData = await this.getUserData(uid);
            const limitations = userData.limitations || userData.customLimitations || {};
            const moduleLimitation = limitations[moduleId];

            if (!moduleLimitation) {
                return { allowed: true, remaining: Infinity };
            }

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

            if (moduleLimitation.maxPerMonth) {
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
     * Atualizar plano do usuário
     */
    async updateUserPlan(uid, newPlanType) {
        try {
            console.log(`🔄 Atualizando plano do usuário ${uid} para: ${newPlanType}`);

            await this.editUserData(uid, {
                planType: newPlanType,
                assinouPlano: newPlanType !== 'free',
                gratuito: newPlanType === 'free',
                planUpdatedAt: new Date()
            });

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

    // ==============================================
    // 3. ADMINISTRAÇÃO & RELATÓRIOS
    // ==============================================

    /**
     * Listar todos os usuários para admin
     */
    async listAllUsers(pageSize = 100, lastUser = null, searchQuery = "") {
        try {
            const usersRef = collection(this.firestore, "users");
            let usersQuery;

            if (lastUser) {
                usersQuery = query(
                    usersRef,
                    orderBy("fullName", "asc"),
                    startAfter(lastUser),
                    limitFn(pageSize)
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

    /**
     * Buscar usuários com dados de presença
     */
    async getUsersWithPresenceData(options = {}) {
        try {
            const {
                pageSize = 50,
                searchQuery = "",
                planFilter = "all",
                statusFilter = "all",
                sortBy = "lastLogin",
                sortOrder = "desc"
            } = options;

            console.log(`🔍 Buscando usuários com filtros:`, options);

            const usersRef = collection(this.firestore, "users");
            let usersQuery = query(usersRef);

            if (searchQuery && searchQuery.length > 2) {
                const upperBound = searchQuery + "\uf8ff";
                usersQuery = query(
                    usersRef,
                    where("fullName", ">=", searchQuery),
                    where("fullName", "<=", upperBound)
                );
            }

            const snapshot = await getDocs(usersQuery);
            let users = [];

            snapshot.forEach(doc => {
                const userData = doc.data();
                users.push({
                    id: doc.id,
                    ...userData
                });
            });

            console.log(`📊 ${users.length} usuários encontrados antes dos filtros`);

            // Aplicar filtros no cliente
            users = users.filter(user => {
                if (searchQuery && searchQuery.length > 0) {
                    const search = searchQuery.toLowerCase();
                    const matchName = user.fullName?.toLowerCase().includes(search);
                    const matchEmail = user.email?.toLowerCase().includes(search);
                    const matchCPF = user.cpf?.includes(search);
                    if (!matchName && !matchEmail && !matchCPF) return false;
                }

                if (planFilter !== "all") {
                    switch (planFilter) {
                        case "admin":
                            if (!user.administrador) return false;
                            break;
                        case "premium":
                            if (!user.assinouPlano) return false;
                            break;
                        case "free":
                            if (!user.gratuito && !user.administrador) return false;
                            break;
                    }
                }

                if (statusFilter !== "all") {
                    const now = Date.now();
                    const lastLogin = user.lastLogin ?
                        (user.lastLogin.toDate ? user.lastLogin.toDate() : new Date(user.lastLogin)) : null;
                    const timeSinceLogin = lastLogin ? now - lastLogin.getTime() : Infinity;
                    const hoursOffline = timeSinceLogin / (1000 * 60 * 60);

                    switch (statusFilter) {
                        case "online":
                            if (!user.isCurrentlyOnline) return false;
                            break;
                        case "offline":
                            if (user.isCurrentlyOnline) return false;
                            break;
                        case "recent":
                            if (hoursOffline > 24) return false;
                            break;
                    }
                }

                return true;
            });

            const enrichedUsers = await Promise.all(
                users.slice(0, pageSize).map(async (user) => {
                    return await this.enrichUserData(user);
                })
            );

            enrichedUsers.sort((a, b) => {
                let aValue, bValue;
                switch (sortBy) {
                    case "lastLogin":
                        aValue = a.lastLogin ? new Date(a.lastLogin) : new Date(0);
                        bValue = b.lastLogin ? new Date(b.lastLogin) : new Date(0);
                        break;
                    case "createdAt":
                        aValue = a.createdAt ? new Date(a.createdAt) : new Date(0);
                        bValue = b.createdAt ? new Date(b.createdAt) : new Date(0);
                        break;
                    case "fullName":
                        aValue = a.fullName || "";
                        bValue = b.fullName || "";
                        return sortOrder === "asc" ?
                            aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                    default:
                        aValue = a.lastLogin ? new Date(a.lastLogin) : new Date(0);
                        bValue = b.lastLogin ? new Date(b.lastLogin) : new Date(0);
                }

                return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
            });

            console.log(`✅ Retornando ${enrichedUsers.length} usuários processados`);
            return {
                users: enrichedUsers,
                totalCount: users.length,
                hasMore: users.length > pageSize
            };

        } catch (error) {
            console.error("❌ Erro ao buscar usuários com dados de presença:", error);
            throw error;
        }
    }

    /**
     * Enriquecer dados do usuário
     */
    async enrichUserData(user) {
        try {
            const enrichedUser = { ...user };

            // Determinar tipo de plano
            if (user.administrador) {
                enrichedUser.planType = 'Admin';
                enrichedUser.planColor = 'error';
                enrichedUser.planIcon = 'admin';
            } else if (user.assinouPlano) {
                enrichedUser.planType = user.planType || 'Premium';
                enrichedUser.planColor = 'primary';
                enrichedUser.planIcon = 'premium';
            } else {
                enrichedUser.planType = 'Gratuito';
                enrichedUser.planColor = 'default';
                enrichedUser.planIcon = 'free';
            }

            enrichedUser.isOnline = user.isCurrentlyOnline === true;

            // Calcular tempo desde último login
            if (user.lastLogin) {
                const lastLogin = user.lastLogin.toDate ? user.lastLogin.toDate() : new Date(user.lastLogin);
                const now = Date.now();
                const diffMs = now - lastLogin.getTime();
                const diffMins = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                if (diffMins < 5) {
                    enrichedUser.lastSeenText = 'Agora há pouco';
                    enrichedUser.lastSeenColor = 'success';
                } else if (diffMins < 60) {
                    enrichedUser.lastSeenText = `${diffMins}min atrás`;
                    enrichedUser.lastSeenColor = 'success';
                } else if (diffHours < 24) {
                    enrichedUser.lastSeenText = `${diffHours}h atrás`;
                    enrichedUser.lastSeenColor = 'warning';
                } else if (diffDays < 7) {
                    enrichedUser.lastSeenText = `${diffDays}d atrás`;
                    enrichedUser.lastSeenColor = 'warning';
                } else {
                    enrichedUser.lastSeenText = lastLogin.toLocaleDateString('pt-BR');
                    enrichedUser.lastSeenColor = 'default';
                }
            } else {
                enrichedUser.lastSeenText = 'Nunca';
                enrichedUser.lastSeenColor = 'error';
            }

            // Calcular tempo de conta
            if (user.createdAt) {
                const createdAt = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
                const diffDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays === 0) {
                    enrichedUser.accountAge = 'Hoje';
                } else if (diffDays === 1) {
                    enrichedUser.accountAge = 'Ontem';
                } else if (diffDays < 30) {
                    enrichedUser.accountAge = `${diffDays}d`;
                } else if (diffDays < 365) {
                    const months = Math.floor(diffDays / 30);
                    enrichedUser.accountAge = `${months}m`;
                } else {
                    const years = Math.floor(diffDays / 365);
                    enrichedUser.accountAge = `${years}a`;
                }
            } else {
                enrichedUser.accountAge = 'N/A';
            }

            // Fonte de referência
            if (user.enrico) {
                enrichedUser.referralDisplay = '🎯 Enrico';
                enrichedUser.referralColor = 'primary';
            } else if (user.referralSource) {
                enrichedUser.referralDisplay = `📊 ${user.referralSource}`;
                enrichedUser.referralColor = 'secondary';
            } else {
                enrichedUser.referralDisplay = '🌐 Direto';
                enrichedUser.referralColor = 'default';
            }

            return enrichedUser;
        } catch (error) {
            console.warn(`⚠️ Erro ao enriquecer dados do usuário ${user.id}:`, error);
            return user;
        }
    }

    /**
     * Buscar estatísticas detalhadas do usuário
     */
    async getUserDetailedStats(userId) {
        try {
            console.log(`📊 Buscando estatísticas detalhadas para usuário: ${userId}`);

            const userData = await this.getUserData(userId);
            const patientsSnapshot = await getDocs(collection(this.firestore, "users", userId, "patients"));
            const patientIds = [];
            patientsSnapshot.forEach(doc => {
                patientIds.push(doc.id);
            });

            let totalConsultations = 0;
            let totalPrescriptions = 0;
            let totalExams = 0;
            let totalNotes = 0;
            const allConsultations = [];

            const batchSize = 10;
            for (let i = 0; i < patientIds.length; i += batchSize) {
                const batch = patientIds.slice(i, i + batchSize);
                const batchPromises = batch.map(async (patientId) => {
                    try {
                        const consultationsRef = collection(this.firestore, "users", userId, "patients", patientId, "consultations");
                        const consultationsSnapshot = await getDocs(consultationsRef);

                        consultationsSnapshot.forEach(doc => {
                            totalConsultations++;
                            allConsultations.push({
                                id: doc.id,
                                patientId: patientId,
                                ...doc.data()
                            });
                        });

                        const prescriptionsRef = collection(this.firestore, "users", userId, "patients", patientId, "prescriptions");
                        const prescriptionsSnapshot = await getDocs(prescriptionsRef);
                        totalPrescriptions += prescriptionsSnapshot.size;

                        const examsRef = collection(this.firestore, "users", userId, "patients", patientId, "exams");
                        const examsSnapshot = await getDocs(examsRef);
                        totalExams += examsSnapshot.size;

                        const notesRef = collection(this.firestore, "users", userId, "patients", patientId, "notes");
                        const notesSnapshot = await getDocs(notesRef);
                        totalNotes += notesSnapshot.size;

                    } catch (error) {
                        console.warn(`Erro ao processar paciente ${patientId}:`, error);
                    }
                });

                await Promise.all(batchPromises);
            }

            const now = new Date();
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const thisYear = new Date(now.getFullYear(), 0, 1);

            const consultationsThisMonth = allConsultations.filter(c => {
                if (!c.consultationDate) return false;
                const date = typeof c.consultationDate === 'string' ?
                    new Date(c.consultationDate) : c.consultationDate.toDate();
                return date >= thisMonth;
            }).length;

            const consultationsLastMonth = allConsultations.filter(c => {
                if (!c.consultationDate) return false;
                const date = typeof c.consultationDate === 'string' ?
                    new Date(c.consultationDate) : c.consultationDate.toDate();
                return date >= lastMonth && date < thisMonth;
            }).length;

            const consultationsThisYear = allConsultations.filter(c => {
                if (!c.consultationDate) return false;
                const date = typeof c.consultationDate === 'string' ?
                    new Date(c.consultationDate) : c.consultationDate.toDate();
                return date >= thisYear;
            }).length;

            const upcomingConsultations = allConsultations
                .filter(c => {
                    if (!c.consultationDate) return false;
                    const date = typeof c.consultationDate === 'string' ?
                        new Date(c.consultationDate) : c.consultationDate.toDate();
                    return date >= now;
                })
                .sort((a, b) => {
                    const dateA = typeof a.consultationDate === 'string' ?
                        new Date(a.consultationDate) : a.consultationDate.toDate();
                    const dateB = typeof b.consultationDate === 'string' ?
                        new Date(b.consultationDate) : b.consultationDate.toDate();
                    return dateA - dateB;
                })
                .slice(0, 3);

            let registrationTime = 'Não informado';
            let daysSinceRegistration = null;
            if (userData.createdAt) {
                const createdAt = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
                daysSinceRegistration = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                registrationTime = createdAt.toLocaleDateString('pt-BR');
            }

            let lastLoginFormatted = 'Nunca';
            let daysSinceLastLogin = null;
            if (userData.lastLogin) {
                const lastLogin = userData.lastLogin.toDate ? userData.lastLogin.toDate() : new Date(userData.lastLogin);
                lastLoginFormatted = lastLogin.toLocaleString('pt-BR');
                daysSinceLastLogin = Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
            }

            const stats = {
                userData,
                patientsCount: patientIds.length,
                consultationsCount: totalConsultations,
                prescriptionsCount: totalPrescriptions,
                examsCount: totalExams,
                notesCount: totalNotes,
                consultationsThisMonth,
                consultationsLastMonth,
                consultationsThisYear,
                upcomingConsultations,
                registrationTime,
                daysSinceRegistration,
                lastLoginFormatted,
                daysSinceLastLogin,
                isCurrentlyOnline: userData.isCurrentlyOnline || false,
                loginCount: userData.loginCount || 0,
                lastUserAgent: userData.lastUserAgent || 'Não informado',
                lastLoginMethod: userData.lastLoginMethod || 'email',
                referralSource: userData.referralSource || null,
                isEnricoUser: userData.enrico === true,
                monthlyGrowth: consultationsThisMonth - consultationsLastMonth,
                monthlyGrowthPercent: consultationsLastMonth > 0 ?
                    Math.round(((consultationsThisMonth - consultationsLastMonth) / consultationsLastMonth) * 100) :
                    (consultationsThisMonth > 0 ? 100 : 0)
            };

            console.log(`✅ Estatísticas calculadas para ${userId}:`, {
                pacientes: stats.patientsCount,
                consultas: stats.consultationsCount,
                crescimentoMensal: stats.monthlyGrowthPercent
            });

            return stats;

        } catch (error) {
            console.error(`❌ Erro ao buscar estatísticas detalhadas do usuário ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Buscar estatísticas aprimoradas da plataforma
     */
    async getEnhancedPlatformStats() {
        try {
            console.log('📊 Calculando estatísticas aprimoradas da plataforma...');

            const usersRef = collection(this.firestore, "users");
            const allUsersSnapshot = await getDocs(usersRef);

            const stats = {
                totalUsers: 0,
                adminUsers: 0,
                paidUsers: 0,
                freeUsers: 0,
                onlineUsers: 0,
                newUsersToday: 0,
                newUsersThisWeek: 0,
                newUsersThisMonth: 0,
                activeUsersToday: 0,
                activeUsersThisWeek: 0,
                activeUsersThisMonth: 0,
                enricoUsers: 0,
                usersActive7Days: 0,
                usersActive30Days: 0,
                dormantUsers: 0,
                planDistribution: {
                    free: 0,
                    monthly: 0,
                    quarterly: 0,
                    annual: 0,
                    admin: 0
                }
            };

            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            allUsersSnapshot.forEach(doc => {
                const data = doc.data();
                stats.totalUsers++;

                if (data.administrador === true) {
                    stats.adminUsers++;
                    stats.planDistribution.admin++;
                } else if (data.assinouPlano === true) {
                    stats.paidUsers++;
                    switch (data.planType) {
                        case 'monthly':
                            stats.planDistribution.monthly++;
                            break;
                        case 'quarterly':
                            stats.planDistribution.quarterly++;
                            break;
                        case 'annual':
                            stats.planDistribution.annual++;
                            break;
                        default:
                            stats.planDistribution.monthly++;
                    }
                } else {
                    stats.freeUsers++;
                    stats.planDistribution.free++;
                }

                if (data.isCurrentlyOnline === true) {
                    stats.onlineUsers++;
                }

                if (data.enrico === true) {
                    stats.enricoUsers++;
                }

                if (data.createdAt) {
                    const createdAt = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    if (createdAt >= todayStart) stats.newUsersToday++;
                    if (createdAt >= weekStart) stats.newUsersThisWeek++;
                    if (createdAt >= monthStart) stats.newUsersThisMonth++;
                }

                if (data.lastLogin) {
                    const lastLogin = data.lastLogin.toDate ? data.lastLogin.toDate() : new Date(data.lastLogin);
                    if (lastLogin >= todayStart) stats.activeUsersToday++;
                    if (lastLogin >= weekStart) stats.activeUsersThisWeek++;
                    if (lastLogin >= monthStart) stats.activeUsersThisMonth++;
                    if (lastLogin >= sevenDaysAgo) stats.usersActive7Days++;
                    if (lastLogin >= thirtyDaysAgo) stats.usersActive30Days++;
                    if (lastLogin < thirtyDaysAgo) stats.dormantUsers++;
                } else {
                    stats.dormantUsers++;
                }
            });

            stats.percentages = {
                adminUsers: ((stats.adminUsers / stats.totalUsers) * 100).toFixed(1),
                paidUsers: ((stats.paidUsers / stats.totalUsers) * 100).toFixed(1),
                freeUsers: ((stats.freeUsers / stats.totalUsers) * 100).toFixed(1),
                onlineUsers: ((stats.onlineUsers / stats.totalUsers) * 100).toFixed(1),
                enricoUsers: ((stats.enricoUsers / stats.totalUsers) * 100).toFixed(1),
                retention7Days: ((stats.usersActive7Days / stats.totalUsers) * 100).toFixed(1),
                retention30Days: ((stats.usersActive30Days / stats.totalUsers) * 100).toFixed(1)
            };

            console.log('✅ Estatísticas da plataforma calculadas:', stats);
            return stats;

        } catch (error) {
            console.error("❌ Erro ao buscar estatísticas aprimoradas da plataforma:", error);
            throw error;
        }
    }

    /**
     * Atualizar status admin do usuário
     */
    async updateUserAdminStatus(userId, isAdmin) {
        try {
            console.log(`🔧 Atualizando status admin do usuário ${userId} para: ${isAdmin}`);

            const userRef = doc(this.firestore, "users", userId);
            const updateData = {
                administrador: isAdmin,
                updatedAt: new Date()
            };

            if (!isAdmin) {
                const userData = await this.getUserData(userId);
                if (!userData.assinouPlano) {
                    updateData.gratuito = true;
                    updateData.planType = 'free';
                }
            } else {
                updateData.assinouPlano = false;
                updateData.gratuito = false;
                updateData.planType = 'admin';
            }

            await updateDoc(userRef, updateData);
            console.log(`✅ Status admin atualizado para usuário ${userId}`);
            return true;
        } catch (error) {
            console.error(`❌ Erro ao atualizar status admin do usuário ${userId}:`, error);
            throw error;
        }
    }

    // ==============================================
// SECRETÁRIAS - VERSÃO CORRIGIDA SEM LOGOUT
// ==============================================

    async createSecretaryAccount(doctorId, secretaryData) {
        let tempApp = null;

        try {
            console.log(`🚀 Criando secretária sem afetar sessão do médico...`);

            // STEP 1: Validações iniciais
            const validation = await this.validateSecretaryCreation(doctorId, secretaryData);
            const { doctorData, secretaryCount } = validation;

            // STEP 2: Verificar se médico está logado na instância principal
            const currentUser = this.auth.currentUser;
            if (!currentUser || currentUser.uid !== doctorId) {
                throw new Error('Médico deve estar logado');
            }

            console.log(`👨‍⚕️ Médico autenticado: ${currentUser.email}`);

            // ✅ STEP 3: VERIFICAR SE EMAIL JÁ EXISTE (SIMPLIFICADO)
            const emailCheck = await this.checkEmailExistsInSystemSimplified(secretaryData.email);
            if (emailCheck.exists) {
                throw new Error(`E-mail já cadastrado no sistema como ${emailCheck.type}`);
            }

            // ✅ STEP 4: CRIAR INSTÂNCIA TEMPORÁRIA DE AUTH
            console.log(`🔧 Criando instância temporária de Auth...`);

            const { initializeApp, deleteApp } = await import('firebase/app');
            const { getAuth, createUserWithEmailAndPassword, signOut } = await import('firebase/auth');

            // Usar a mesma configuração, mas com nome único
            const tempAppName = `temp-secretary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            tempApp = initializeApp({
                apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB3VIRZ-rCbRVC4eybhJNG-dMdw1LVMF9I",
                authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "projeto-med-19a8b.firebaseapp.com",
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "projeto-med-19a8b",
            }, tempAppName);

            const tempAuth = getAuth(tempApp);

            console.log(`✅ Instância temporária criada: ${tempAppName}`);

            // ✅ STEP 5: CRIAR USUÁRIO NA INSTÂNCIA TEMPORÁRIA
            console.log(`👩‍💼 Criando conta da secretária na instância temporária...`);

            const secretaryCredential = await createUserWithEmailAndPassword(
                tempAuth, // ✅ USA INSTÂNCIA TEMPORÁRIA
                secretaryData.email,
                secretaryData.password
            );

            const secretaryId = secretaryCredential.user.uid;
            console.log(`✅ Conta criada na instância temporária: ${secretaryId}`);

            // ✅ STEP 6: LOGOUT DA INSTÂNCIA TEMPORÁRIA
            await signOut(tempAuth);
            console.log(`🚪 Logout da instância temporária realizado`);

            // ✅ STEP 7: CRIAR DOCUMENTO DA SECRETÁRIA NO FIRESTORE
            const secretaryDocData = {
                doctorId: doctorId,
                email: secretaryData.email,
                name: secretaryData.name.trim(),
                active: true,
                permissions: secretaryData.permissions || {
                    patients: { read: true, write: false, viewDetails: false },
                    appointments: { read: true, write: true },
                    prescriptions: { read: true, write: false },
                    exams: { read: true, write: false },
                    notes: { read: true, write: false },
                    financial: { read: false, write: false },
                    reports: { read: true, write: false }
                },
                createdAt: new Date(),
                createdBy: doctorId,
                authUid: secretaryId,
                lastLogin: null,
                loginCount: 0,
                version: "3.0",
                createdWithMultiAuth: true
            };

            // Usar a instância principal do Firestore
            const secretaryRef = doc(this.firestore, "secretaries", secretaryId);
            await setDoc(secretaryRef, secretaryDocData);
            console.log(`✅ Documento secretária criado: ${secretaryId}`);

            // ✅ STEP 8: ATUALIZAR CONFIGURAÇÃO DO MÉDICO
            await this.updateDoctorConfiguration(doctorId, secretaryId, secretaryData, secretaryCount);

            // ✅ STEP 9: DELETAR INSTÂNCIA TEMPORÁRIA (MÉTODO CORRETO)
            await deleteApp(tempApp);
            tempApp = null;
            console.log(`🗑️ Instância temporária deletada`);

            // ✅ VERIFICAR SE MÉDICO AINDA ESTÁ LOGADO
            const stillLoggedIn = this.auth.currentUser && this.auth.currentUser.uid === doctorId;
            console.log(`🔍 Médico ainda logado: ${stillLoggedIn ? 'SIM ✅' : 'NÃO ❌'}`);

            if (!stillLoggedIn) {
                throw new Error('Erro: Sessão do médico foi perdida durante o processo');
            }

            console.log(`🎉 Secretária criada com sucesso! Médico permanece logado! 🎉`);

            return {
                success: true,
                secretaryId: secretaryId,
                needsDoctorRelogin: false,
                data: {
                    name: secretaryData.name,
                    email: secretaryData.email,
                    permissions: secretaryData.permissions,
                    doctorName: doctorData.fullName,
                    currentCount: secretaryCount + 1
                }
            };

        } catch (error) {
            console.error("❌ Erro na criação da secretária:", error);

            // ✅ CLEANUP DA INSTÂNCIA TEMPORÁRIA EM CASO DE ERRO
            if (tempApp) {
                try {
                    const { deleteApp } = await import('firebase/app');
                    await deleteApp(tempApp);
                    console.log(`🧹 Instância temporária removida após erro`);
                } catch (cleanupError) {
                    console.error('❌ Erro no cleanup:', cleanupError);
                }
            }

            throw error;
        }
    }

    /**
     * ✅ VALIDAR CRIAÇÃO DE SECRETÁRIA
     */
    async validateSecretaryCreation(doctorId, secretaryData) {
        try {
            console.log('🔍 Validando criação de secretária...');

            // Validar dados obrigatórios
            if (!secretaryData.name?.trim()) {
                throw new Error('Nome da secretária é obrigatório');
            }

            if (!secretaryData.email?.trim()) {
                throw new Error('E-mail da secretária é obrigatório');
            }

            if (!secretaryData.password || secretaryData.password.length < 6) {
                throw new Error('Senha deve ter pelo menos 6 caracteres');
            }

            // Verificar se médico existe
            const doctorData = await this.getUserData(doctorId);
            if (!doctorData) {
                throw new Error('Médico não encontrado');
            }

            // Contar secretárias existentes
            const secretaryCount = await this.countDoctorSecretaries(doctorId);

            // Verificar limites por plano
            let maxSecretaries = 1; // Padrão gratuito
            if (doctorData.administrador) {
                maxSecretaries = 10;
            } else if (doctorData.assinouPlano) {
                maxSecretaries = 5;
            }

            if (secretaryCount >= maxSecretaries) {
                throw new Error(`Limite de ${maxSecretaries} secretária(s) atingido para seu plano`);
            }

            console.log('✅ Validação concluída com sucesso');
            return { doctorData, secretaryCount };

        } catch (error) {
            console.error('❌ Erro na validação:', error);
            throw error;
        }
    }

    /**
     * ✅ CONTAR SECRETÁRIAS ATIVAS DO MÉDICO
     */
    async countDoctorSecretaries(doctorId) {
        try {
            const secretariesRef = collection(this.firestore, "secretaries");
            const q = query(
                secretariesRef,
                where("doctorId", "==", doctorId),
                where("active", "==", true)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.size;

        } catch (error) {
            console.error('❌ Erro ao contar secretárias:', error);
            return 0;
        }
    }

    /**
     * ✅ VERIFICAR SE EMAIL EXISTE NO SISTEMA - VERSÃO SIMPLIFICADA E CORRIGIDA
     */
    async checkEmailExistsInSystemSimplified(email) {
        try {
            console.log('🔍 Verificando se email já existe:', email);

            // ✅ VERIFICAR EM USUÁRIOS (MÉDICOS) VIA FIRESTORE
            try {
                const usersRef = collection(this.firestore, "users");
                const userQuery = query(usersRef, where("email", "==", email));
                const userSnapshot = await getDocs(userQuery);

                if (!userSnapshot.empty) {
                    console.log('❌ Email já existe como médico');
                    return { exists: true, type: 'médico' };
                }
            } catch (userError) {
                console.warn('⚠️ Erro ao verificar em users:', userError);
            }

            // ✅ VERIFICAR EM SECRETÁRIAS VIA FIRESTORE
            try {
                const secretariesRef = collection(this.firestore, "secretaries");
                const secretaryQuery = query(
                    secretariesRef,
                    where("email", "==", email),
                    where("active", "==", true)
                );
                const secretarySnapshot = await getDocs(secretaryQuery);

                if (!secretarySnapshot.empty) {
                    console.log('❌ Email já existe como secretária ativa');
                    return { exists: true, type: 'secretária' };
                }
            } catch (secretaryError) {
                console.warn('⚠️ Erro ao verificar em secretaries:', secretaryError);
            }

            // ✅ SE CHEGOU ATÉ AQUI, EMAIL ESTÁ DISPONÍVEL
            console.log('✅ Email disponível para uso');
            return { exists: false };

        } catch (error) {
            console.error("❌ Erro geral ao verificar email:", error);
            // ✅ EM CASO DE ERRO, PERMITIR CRIAÇÃO (FAIL-SAFE)
            console.log('⚠️ Permitindo criação devido a erro na verificação');
            return { exists: false };
        }
    }

    /**
     * ✅ VERIFICAR SE EMAIL EXISTE NO SISTEMA - MÉTODO ANTIGO SUBSTITUÍDO
     */
    async checkEmailExistsInSystem(email) {
        // ✅ USAR MÉTODO SIMPLIFICADO PARA EVITAR ERROS
        return await this.checkEmailExistsInSystemSimplified(email);
    }

    /**
     * ✅ ATUALIZAR CONFIGURAÇÃO DO MÉDICO APÓS CRIAR SECRETÁRIA
     */
    async updateDoctorConfiguration(doctorId, secretaryId, secretaryData, currentCount) {
        try {
            console.log('🔧 Atualizando configuração do médico...');

            const doctorRef = doc(this.firestore, "users", doctorId);

            const updateData = {
                hasSecretary: true,
                secretaryCount: currentCount + 1,
                lastSecretaryCreated: new Date(),
                updatedAt: new Date()
            };

            await updateDoc(doctorRef, updateData);
            console.log('✅ Configuração do médico atualizada');

        } catch (error) {
            console.error('❌ Erro ao atualizar configuração do médico:', error);
            throw error;
        }
    }

    /**
     * ✅ BUSCAR INFORMAÇÕES DA SECRETÁRIA DO MÉDICO - CORRIGIDA
     */
    async getDoctorSecretaryInfo(doctorId) {
        try {
            if (!doctorId || typeof doctorId !== 'string') {
                console.warn('getDoctorSecretaryInfo: doctorId inválido:', doctorId);
                return null;
            }

            console.log(`🔍 Buscando secretária para médico: ${doctorId}`);

            const secretariesRef = collection(this.firestore, "secretaries");

            // ✅ QUERY SIMPLIFICADA PARA EVITAR ERRO DE ÍNDICE
            const q = query(
                secretariesRef,
                where("doctorId", "==", doctorId),
                where("active", "==", true),
                limitFn(1)
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const secretaryDoc = querySnapshot.docs[0];
                const secretaryData = secretaryDoc.data();

                const secretaryInfo = {
                    id: secretaryDoc.id,
                    name: secretaryData.name,
                    email: secretaryData.email,
                    active: secretaryData.active,
                    permissions: secretaryData.permissions,
                    createdAt: secretaryData.createdAt,
                    lastLogin: secretaryData.lastLogin,
                    loginCount: secretaryData.loginCount || 0,
                    needsActivation: secretaryData.needsActivation || false
                };

                console.log(`✅ Secretária encontrada: ${secretaryData.name}`);
                return secretaryInfo;
            }

            console.log('📝 Nenhuma secretária ativa encontrada');
            return null;

        } catch (error) {
            console.error("❌ Erro ao buscar informações da secretária:", error);
            return null;
        }
    }

    /**
     * ✅ LISTAR TODAS AS SECRETÁRIAS DO MÉDICO - CORRIGIDA PARA EVITAR ERRO DE ÍNDICE
     */
    async listDoctorSecretaries(doctorId, includeInactive = false) {
        try {
            console.log(`📋 Listando secretárias para médico: ${doctorId}`);

            const secretariesRef = collection(this.firestore, "secretaries");

            // ✅ QUERY SIMPLIFICADA PARA EVITAR ERRO DE ÍNDICE
            let q;
            if (includeInactive) {
                // Buscar todas as secretárias do médico (ativas e inativas)
                q = query(
                    secretariesRef,
                    where("doctorId", "==", doctorId)
                );
            } else {
                // Buscar apenas secretárias ativas
                q = query(
                    secretariesRef,
                    where("doctorId", "==", doctorId),
                    where("active", "==", true)
                );
            }

            const querySnapshot = await getDocs(q);
            const secretaries = [];

            querySnapshot.forEach(doc => {
                const data = doc.data();
                secretaries.push({
                    id: doc.id,
                    name: data.name,
                    email: data.email,
                    active: data.active,
                    permissions: data.permissions,
                    createdAt: data.createdAt,
                    lastLogin: data.lastLogin,
                    loginCount: data.loginCount || 0
                });
            });

            // ✅ ORDENAR NO CLIENTE PARA EVITAR ERRO DE ÍNDICE
            secretaries.sort((a, b) => {
                if (!a.createdAt && !b.createdAt) return 0;
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;

                const dateA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                const dateB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);

                return dateB - dateA; // Mais recentes primeiro
            });

            console.log(`✅ ${secretaries.length} secretária(s) encontrada(s)`);
            return secretaries;

        } catch (error) {
            console.error("❌ Erro ao listar secretárias:", error);
            return [];
        }
    }

    /**
     * ✅ ATUALIZAR PERMISSÕES DA SECRETÁRIA - COM VALIDAÇÃO DE SEGURANÇA
     */
    async updateSecretaryPermissions(doctorId, secretaryId, newPermissions) {
        try {
            console.log(`🔧 Atualizando permissões da secretária ${secretaryId}...`);

            // ✅ VALIDAÇÃO DE SEGURANÇA: Verificar se usuário atual é médico
            const currentUser = this.auth.currentUser;
            if (!currentUser || currentUser.uid !== doctorId) {
                throw new Error('SEGURANÇA: Apenas o médico responsável pode alterar permissões');
            }

            // Verificar se secretária pertence ao médico
            const secretaryRef = doc(this.firestore, "secretaries", secretaryId);
            const secretaryDoc = await getDoc(secretaryRef);

            if (!secretaryDoc.exists()) {
                throw new Error('Secretária não encontrada');
            }

            const secretaryData = secretaryDoc.data();
            if (secretaryData.doctorId !== doctorId) {
                throw new Error('SEGURANÇA: Secretária não pertence a este médico');
            }

            // ✅ VALIDAÇÃO DE PERMISSÕES: Verificar se as permissões são válidas
            const validModules = ['patients', 'appointments', 'prescriptions', 'exams', 'notes', 'financial', 'reports'];
            const validActions = ['read', 'create', 'write', 'viewDetails'];
            
            // Validar estrutura das permissões
            if (typeof newPermissions !== 'object' || newPermissions === null) {
                throw new Error('SEGURANÇA: Formato de permissões inválido');
            }
            
            // Verificar se todas as permissões são válidas
            for (const [module, actions] of Object.entries(newPermissions)) {
                if (!validModules.includes(module)) {
                    throw new Error(`SEGURANÇA: Módulo inválido: ${module}`);
                }
                
                if (typeof actions !== 'object' || actions === null) {
                    throw new Error(`SEGURANÇA: Ações inválidas para módulo: ${module}`);
                }
                
                for (const [action, value] of Object.entries(actions)) {
                    if (!validActions.includes(action)) {
                        throw new Error(`SEGURANÇA: Ação inválida: ${action} para módulo: ${module}`);
                    }
                    
                    if (typeof value !== 'boolean') {
                        throw new Error(`SEGURANÇA: Valor de permissão deve ser boolean para ${module}.${action}`);
                    }
                }
            }

            // Atualizar permissões
            await updateDoc(secretaryRef, {
                permissions: newPermissions,
                updatedAt: new Date(),
                lastUpdatedBy: doctorId
            });

            console.log('✅ Permissões atualizadas com sucesso');
            return { success: true };

        } catch (error) {
            console.error("❌ Erro ao atualizar permissões:", error);
            throw error;
        }
    }

    /**
     * ✅ DESATIVAR CONTA DA SECRETÁRIA
     */
    async deactivateSecretaryAccount(doctorId, secretaryId) {
        try {
            console.log(`🚫 Desativando secretária ${secretaryId}...`);

            // Verificar se secretária pertence ao médico
            const secretaryRef = doc(this.firestore, "secretaries", secretaryId);
            const secretaryDoc = await getDoc(secretaryRef);

            if (!secretaryDoc.exists()) {
                throw new Error('Secretária não encontrada');
            }

            const secretaryData = secretaryDoc.data();
            if (secretaryData.doctorId !== doctorId) {
                throw new Error('Secretária não pertence a este médico');
            }

            // Desativar secretária
            await updateDoc(secretaryRef, {
                active: false,
                deactivatedAt: new Date(),
                deactivatedBy: doctorId
            });

            // Atualizar contador do médico
            const doctorRef = doc(this.firestore, "users", doctorId);
            const activeCount = await this.countDoctorSecretaries(doctorId);

            await updateDoc(doctorRef, {
                secretaryCount: activeCount,
                hasSecretary: activeCount > 0,
                updatedAt: new Date()
            });

            console.log('✅ Secretária desativada com sucesso');
            return { success: true };

        } catch (error) {
            console.error("❌ Erro ao desativar secretária:", error);
            throw error;
        }
    }

    /**
     * ✅ REATIVAR CONTA DA SECRETÁRIA - CORRIGIDA
     */
    async reactivateSecretaryAccount(doctorId, secretaryId) {
        try {
            console.log(`✅ Reativando secretária ${secretaryId}...`);

            // ✅ VERIFICAR LIMITES ANTES DE REATIVAR
            const activeCount = await this.countDoctorSecretaries(doctorId);
            const doctorData = await this.getUserData(doctorId);

            let maxSecretaries = 1; // Padrão gratuito
            if (doctorData?.administrador) {
                maxSecretaries = 10;
            } else if (doctorData?.assinouPlano) {
                maxSecretaries = 5;
            }

            if (activeCount >= maxSecretaries) {
                throw new Error(`Limite de ${maxSecretaries} secretária(s) ativas atingido`);
            }

            // Verificar se secretária pertence ao médico
            const secretaryRef = doc(this.firestore, "secretaries", secretaryId);
            const secretaryDoc = await getDoc(secretaryRef);

            if (!secretaryDoc.exists()) {
                throw new Error('Secretária não encontrada');
            }

            const secretaryData = secretaryDoc.data();
            if (secretaryData.doctorId !== doctorId) {
                throw new Error('Secretária não pertence a este médico');
            }

            // Reativar secretária
            await updateDoc(secretaryRef, {
                active: true,
                reactivatedAt: new Date(),
                reactivatedBy: doctorId
            });

            // Atualizar contador do médico
            const doctorRef = doc(this.firestore, "users", doctorId);
            const newActiveCount = await this.countDoctorSecretaries(doctorId);

            await updateDoc(doctorRef, {
                secretaryCount: newActiveCount,
                hasSecretary: newActiveCount > 0,
                updatedAt: new Date()
            });

            console.log('✅ Secretária reativada com sucesso');
            return { success: true };

        } catch (error) {
            console.error("❌ Erro ao reativar secretária:", error);
            throw error;
        }
    }

    /**
     * ✅ OBTER DETALHES COMPLETOS DA SECRETÁRIA
     */
    async getSecretaryDetails(secretaryId, doctorId = null) {
        try {
            console.log(`🔍 Buscando detalhes da secretária: ${secretaryId}`);

            const secretaryRef = doc(this.firestore, "secretaries", secretaryId);
            const secretaryDoc = await getDoc(secretaryRef);

            if (!secretaryDoc.exists()) {
                throw new Error('Secretária não encontrada');
            }

            const secretaryData = secretaryDoc.data();

            // Se doctorId foi fornecido, verificar se pertence
            if (doctorId && secretaryData.doctorId !== doctorId) {
                throw new Error('Secretária não pertence a este médico');
            }

            // Buscar dados do médico responsável
            const doctorData = await this.getUserData(secretaryData.doctorId);

            const details = {
                id: secretaryId,
                name: secretaryData.name,
                email: secretaryData.email,
                active: secretaryData.active,
                permissions: secretaryData.permissions,
                createdAt: secretaryData.createdAt,
                lastLogin: secretaryData.lastLogin,
                loginCount: secretaryData.loginCount || 0,
                doctorId: secretaryData.doctorId,
                doctorName: doctorData?.fullName || 'Médico não encontrado',
                version: secretaryData.version || '1.0'
            };

            console.log(`✅ Detalhes da secretária obtidos: ${secretaryData.name}`);
            return details;

        } catch (error) {
            console.error("❌ Erro ao buscar detalhes da secretária:", error);
            throw error;
        }
    }

    /**
     * ✅ VERIFICAR SE USUÁRIO É SECRETÁRIA VÁLIDA
     */
    async checkIfUserIsSecretary(userId) {
        try {
            const secretaryRef = doc(this.firestore, "secretaries", userId);
            const secretaryDoc = await getDoc(secretaryRef);

            if (!secretaryDoc.exists()) {
                return { isSecretary: false };
            }

            const secretaryData = secretaryDoc.data();

            if (!secretaryData.active) {
                return {
                    isSecretary: true,
                    isActive: false,
                    reason: 'Conta desativada'
                };
            }

            // Verificar se médico ainda existe
            const doctorData = await this.getUserData(secretaryData.doctorId);
            if (!doctorData) {
                return {
                    isSecretary: true,
                    isActive: false,
                    reason: 'Médico responsável não encontrado'
                };
            }

            return {
                isSecretary: true,
                isActive: true,
                secretaryData,
                doctorData,
                permissions: secretaryData.permissions
            };

        } catch (error) {
            console.error("❌ Erro ao verificar se é secretária:", error);
            return { isSecretary: false, error: error.message };
        }
    }

    /**
     * ✅ VALIDAR SE OPERAÇÃO PODE SER EXECUTADA POR SECRETÁRIA - FUNÇÃO DE SEGURANÇA
     */
    async validateSecretaryOperation(userId, requiredModule, requiredAction = 'read') {
        try {
            // Verificar se usuário atual é o mesmo que está tentando a operação
            const currentUser = this.auth.currentUser;
            if (!currentUser || currentUser.uid !== userId) {
                throw new Error('SEGURANÇA: Usuário não autenticado ou token inválido');
            }

            // Verificar se é secretária
            const secretaryCheck = await this.checkIfUserIsSecretary(userId);
            
            if (!secretaryCheck.isSecretary) {
                // Se não é secretária, assumir que é médico (permitir operação)
                return { allowed: true, type: 'doctor' };
            }

            if (!secretaryCheck.isActive) {
                throw new Error(`SEGURANÇA: Conta de secretária inativa - ${secretaryCheck.reason}`);
            }

            // Verificar permissões específicas
            const permissions = secretaryCheck.permissions || {};
            const modulePermissions = permissions[requiredModule];
            
            if (!modulePermissions) {
                return { 
                    allowed: false, 
                    reason: `Acesso negado ao módulo: ${requiredModule}`,
                    type: 'secretary'
                };
            }

            const hasPermission = modulePermissions[requiredAction] === true;
            
            if (!hasPermission) {
                return { 
                    allowed: false, 
                    reason: `Permissão negada para ação: ${requiredAction} no módulo: ${requiredModule}`,
                    type: 'secretary'
                };
            }

            return { 
                allowed: true, 
                type: 'secretary',
                doctorId: secretaryCheck.secretaryData.doctorId,
                permissions: permissions
            };

        } catch (error) {
            console.error('❌ Erro na validação de operação da secretária:', error);
            throw error;
        }
    }

    /**
     * ✅ GERAR RELATÓRIO DE SECRETÁRIAS DO MÉDICO
     */
    async generateSecretaryReport(doctorId) {
        try {
            console.log(`📊 Gerando relatório de secretárias para médico: ${doctorId}`);

            const secretaries = await this.listDoctorSecretaries(doctorId, true);
            const doctorData = await this.getUserData(doctorId);

            const report = {
                doctorId,
                doctorName: doctorData?.fullName || 'Médico não encontrado',
                totalSecretaries: secretaries.length,
                activeSecretaries: secretaries.filter(s => s.active).length,
                inactiveSecretaries: secretaries.filter(s => !s.active).length,
                secretaries,
                generatedAt: new Date(),
                planType: doctorData?.planType || 'unknown',
                maxAllowed: doctorData?.administrador ? 10 : (doctorData?.assinouPlano ? 5 : 1)
            };

            console.log(`✅ Relatório gerado: ${report.activeSecretaries}/${report.maxAllowed} secretárias ativas`);
            return report;

        } catch (error) {
            console.error("❌ Erro ao gerar relatório:", error);
            throw error;
        }
    }

    // ==============================================
    // SISTEMA DE RELATÓRIOS E MENSAGENS
    // ==============================================

    /**
     * Buscar todas as mensagens dos usuários
     */
    async getAllUsersMessages(filters = {}) {
        try {
            console.log('🔄 Buscando todas as mensagens dos usuários...');

            const usersRef = collection(this.firestore, "users");
            const usersSnapshot = await getDocs(usersRef);
            console.log(`👥 Total de usuários encontrados: ${usersSnapshot.size}`);

            const allMessages = [];

            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
                const userData = userDoc.data();

                try {
                    const messagesRef = collection(this.firestore, "users", userId, "messages");
                    let q = query(messagesRef, orderBy("updatedAt", "desc"));

                    if (filters.status) {
                        q = query(messagesRef, where("status", "==", filters.status), orderBy("updatedAt", "desc"));
                    }

                    const messagesSnapshot = await getDocs(q);

                    messagesSnapshot.forEach(messageDoc => {
                        const messageData = messageDoc.data();
                        if (messageData && messageDoc.id) {
                            allMessages.push({
                                ...messageData,
                                id: messageDoc.id,
                                userId: userId,
                                userName: userData.fullName || userData.email || 'Usuário Anônimo',
                                userEmail: userData.email || 'Email não informado'
                            });
                        }
                    });
                } catch (userError) {
                    console.warn(`⚠️ Erro ao buscar mensagens do usuário ${userId}:`, userError);
                }
            }

            allMessages.sort((a, b) => {
                const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt || 0);
                const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt || 0);
                return dateB - dateA;
            });

            console.log(`✅ Total de mensagens coletadas: ${allMessages.length}`);
            return allMessages;
        } catch (error) {
            console.error("❌ Erro ao buscar todas as mensagens:", error);
            return [];
        }
    }

    /**
     * Buscar conversa admin-usuário
     */
    async getAdminUserConversation(userId) {
        try {
            console.log(`🔄 Buscando conversa admin-usuário para ${userId}...`);

            const reports = await this.getAllReports({
                type: 'admin_chat'
            });

            const userConversations = reports.filter(report =>
                report.userId === userId && report.type === 'admin_chat'
            );

            const conversation = userConversations.length > 0 ?
                userConversations.sort((a, b) => {
                    const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt || 0);
                    const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt || 0);
                    return dateB - dateA;
                })[0] : null;

            console.log(conversation ? '✅ Conversa encontrada' : '📝 Nenhuma conversa encontrada');
            return conversation;
        } catch (error) {
            console.error("❌ Erro ao buscar conversa admin-usuário:", error);
            throw error;
        }
    }

    /**
     * Criar conversa admin-usuário
     */
    async createAdminUserConversation(userId, initialMessage, adminInfo) {
        try {
            console.log(`📤 Criando conversa admin->usuário para ${userId}...`);

            const reportId = await this.createReport(userId, {
                subject: "Conversa iniciada pelo administrador",
                content: initialMessage,
                type: "admin_chat",
                priority: "medium",
                isAdminInitiated: true,
                adminInitiatorId: adminInfo.uid,
                adminInitiatorName: adminInfo.fullName || 'Administrador'
            });

            console.log('✅ Conversa admin criada:', reportId);
            return reportId;
        } catch (error) {
            console.error("❌ Erro ao criar conversa admin-usuário:", error);
            throw error;
        }
    }

    /**
     * Enviar mensagem admin
     */
    async sendAdminMessage(conversationId, message, adminInfo) {
        try {
            console.log(`📤 Enviando mensagem admin para conversa ${conversationId}...`);

            await this.addReportResponse(conversationId, {
                content: message,
                isAdmin: true,
                authorId: adminInfo.uid,
                authorName: adminInfo.fullName || 'Administrador'
            });

            console.log('✅ Mensagem admin enviada');
        } catch (error) {
            console.error("❌ Erro ao enviar mensagem admin:", error);
            throw error;
        }
    }

    /**
     * Buscar todas as conversas admin-usuário
     */
    async getAllAdminUserConversations(filters = {}) {
        try {
            console.log('🔄 Buscando todas as conversas admin-usuário...');

            const allFilters = {
                ...filters,
                type: 'admin_chat'
            };

            const conversations = await this.getAllReports(allFilters);
            console.log(`✅ ${conversations.length} conversas admin encontradas`);
            return conversations;
        } catch (error) {
            console.error("❌ Erro ao buscar conversas admin:", error);
            return [];
        }
    }

    /**
     * Criar relatório/ticket
     */
    async createReport(userId, reportData) {
        try {
            if (!userId || !reportData?.subject || !reportData?.content) {
                throw new Error('userId, subject e content são obrigatórios');
            }

            console.log(`Criando report para usuário ${userId}...`);

            let userData = { fullName: 'Usuário', email: 'usuario@exemplo.com' };
            try {
                const fetchedUserData = await this.getUserData(userId);
                if (fetchedUserData) {
                    userData = fetchedUserData;
                }
            } catch (error) {
                console.warn("Usando dados padrão do usuário:", error.message);
            }

            const reportRef = doc(collection(this.firestore, "reports"));

            const newReport = {
                id: reportRef.id,
                userId: userId,
                userName: userData.fullName || userData.email || 'Usuário Anônimo',
                userEmail: userData.email || 'usuario@exemplo.com',
                subject: reportData.subject.trim(),
                content: reportData.content.trim(),
                type: reportData.type || 'support',
                status: 'new',
                priority: reportData.priority || 'medium',
                createdAt: new Date(),
                updatedAt: new Date(),
                responses: [],
                hasUnreadResponses: false,
                hasUnreadFromUser: true,
                lastResponseAt: null
            };

            await setDoc(reportRef, newReport);
            console.log('Report criado com sucesso:', reportRef.id);
            return reportRef.id;
        } catch (error) {
            console.error("Erro ao criar report:", error);
            throw error;
        }
    }

    /**
     * Buscar reports do usuário
     */
    async getUserReports(userId) {
        try {
            if (!userId) {
                throw new Error('userId é obrigatório');
            }

            console.log(`Buscando reports do usuário ${userId}...`);

            const reportsRef = collection(this.firestore, "reports");
            const q = query(
                reportsRef,
                where("userId", "==", userId),
                orderBy("updatedAt", "desc")
            );

            const querySnapshot = await getDocs(q);
            const reports = [];

            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data && data.userId === userId) {
                    reports.push({
                        id: doc.id,
                        ...data
                    });
                }
            });

            console.log(`${reports.length} reports encontrados para o usuário`);

            if (reports.length === 0) {
                console.log('Tentando busca manual como fallback...');
                return await this.debugUserReports(userId);
            }

            return reports;
        } catch (error) {
            console.error("Erro ao buscar reports do usuário:", error);
            try {
                return await this.debugUserReports(userId);
            } catch (fallbackError) {
                console.error("Fallback também falhou:", fallbackError);
                return [];
            }
        }
    }

    /**
     * Adicionar resposta ao report
     */
    async addReportResponse(reportId, responseData) {
        try {
            if (!reportId || !responseData?.content) {
                throw new Error('reportId e content são obrigatórios');
            }

            console.log(`🔄 Adicionando resposta ao report ${reportId}...`);

            const reportRef = doc(this.firestore, "reports", reportId);
            const reportDoc = await getDoc(reportRef);

            if (!reportDoc.exists()) {
                throw new Error("Report não encontrado");
            }

            const reportData = reportDoc.data();
            const responses = reportData.responses || [];

            const newResponse = {
                id: Date.now().toString(),
                content: responseData.content.trim(),
                isAdmin: responseData.isAdmin || false,
                authorId: responseData.authorId,
                authorName: responseData.authorName,
                createdAt: new Date()
            };

            responses.push(newResponse);

            const updateData = {
                responses: responses,
                updatedAt: new Date(),
                lastResponseAt: new Date()
            };

            if (responseData.isAdmin) {
                updateData.status = 'in_progress';
                updateData.hasUnreadResponses = true;
                updateData.hasUnreadFromUser = false;
            } else {
                updateData.hasUnreadFromUser = true;
                updateData.hasUnreadResponses = false;
            }

            await updateDoc(reportRef, updateData);
            console.log('✅ Resposta adicionada ao report:', reportId);
            console.log('📝 Flags atualizadas:', {
                hasUnreadResponses: updateData.hasUnreadResponses,
                hasUnreadFromUser: updateData.hasUnreadFromUser,
                isAdminResponse: responseData.isAdmin
            });

            return newResponse.id;
        } catch (error) {
            console.error("❌ Erro ao adicionar resposta:", error);
            throw error;
        }
    }

    /**
     * Debug de reports do usuário
     */
    async debugUserReports(userId) {
        try {
            console.log(`🔍 DEBUG: Verificando reports para usuário ${userId}`);

            const allReportsRef = collection(this.firestore, "reports");
            const allReportsSnapshot = await getDocs(allReportsRef);

            console.log(`📊 Total de reports na coleção: ${allReportsSnapshot.size}`);

            const userReports = [];
            allReportsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.userId === userId) {
                    userReports.push({
                        id: doc.id,
                        userId: data.userId,
                        subject: data.subject,
                        status: data.status,
                        hasUnreadResponses: data.hasUnreadResponses,
                        createdAt: data.createdAt
                    });
                }
            });

            console.log(`🎯 Reports do usuário ${userId}:`, userReports);
            return userReports;
        } catch (error) {
            console.error("❌ Erro no debug:", error);
            return [];
        }
    }

    /**
     * Buscar todos os reports
     */
    async getAllReports(filters = {}) {
        try {
            console.log('🔄 Buscando todos os reports...');

            let reportsQuery = collection(this.firestore, "reports");
            let queryConstraints = [];

            if (filters.status && filters.status !== 'all') {
                queryConstraints.push(where("status", "==", filters.status));
            }

            if (filters.type && filters.type !== 'all') {
                queryConstraints.push(where("type", "==", filters.type));
            }

            if (filters.priority && filters.priority !== 'all') {
                queryConstraints.push(where("priority", "==", filters.priority));
            }

            if (filters.hasUnreadFromUser === true) {
                queryConstraints.push(where("hasUnreadFromUser", "==", true));
            }

            queryConstraints.push(orderBy("updatedAt", "desc"));

            if (filters.limit) {
                queryConstraints.push(limitFn(filters.limit));
            }

            const q = query(reportsQuery, ...queryConstraints);
            const querySnapshot = await getDocs(q);

            const reports = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data) {
                    reports.push({
                        id: doc.id,
                        ...data
                    });
                }
            });

            console.log(`✅ ${reports.length} reports encontrados`);
            return reports;
        } catch (error) {
            console.error("❌ Erro ao buscar reports:", error);
            return [];
        }
    }

    /**
     * Atualizar status do report
     */
    async updateReportStatus(reportId, status, updatedBy = null) {
        try {
            if (!reportId || !status) {
                throw new Error('reportId e status são obrigatórios');
            }

            console.log(`🔄 Atualizando status do report ${reportId} para ${status}...`);

            const reportRef = doc(this.firestore, "reports", reportId);
            const updateData = {
                status: status,
                updatedAt: new Date()
            };

            if (updatedBy) {
                updateData.lastUpdatedBy = updatedBy;
            }

            if (status === 'resolved') {
                updateData.hasUnreadResponses = false;
                updateData.hasUnreadFromUser = false;
            }

            await updateDoc(reportRef, updateData);
            console.log('✅ Status do report atualizado:', status);
            return true;
        } catch (error) {
            console.error("❌ Erro ao atualizar status do report:", error);
            return false;
        }
    }

    /**
     * Marcar report como lido pelo usuário
     */
    async markReportAsReadByUser(reportId) {
        try {
            if (!reportId) {
                throw new Error('reportId é obrigatório');
            }

            const reportRef = doc(this.firestore, "reports", reportId);
            await updateDoc(reportRef, {
                hasUnreadResponses: false,
                updatedAt: new Date()
            });

            console.log('✅ Report marcado como lido pelo usuário');
            return true;
        } catch (error) {
            console.error("❌ Erro ao marcar report como lido:", error);
            return false;
        }
    }

    /**
     * Marcar report como lido pelo admin
     */
    async markReportAsReadByAdmin(reportId) {
        try {
            if (!reportId) {
                throw new Error('reportId é obrigatório');
            }

            const reportRef = doc(this.firestore, "reports", reportId);
            await updateDoc(reportRef, {
                hasUnreadFromUser: false,
                updatedAt: new Date()
            });

            console.log('✅ Report marcado como lido pelo admin');
            return true;
        } catch (error) {
            console.error("❌ Erro ao marcar report como lido pelo admin:", error);
            return false;
        }
    }

    /**
     * Buscar estatísticas dos reports
     */
    async getReportsStats() {
        try {
            console.log('🔄 Calculando estatísticas dos reports...');

            const allReports = await this.getAllReports({ limit: 1000 });

            const stats = {
                total: allReports.length,
                new: allReports.filter(r => r.status === 'new').length,
                inProgress: allReports.filter(r => r.status === 'in_progress').length,
                resolved: allReports.filter(r => r.status === 'resolved').length,
                unreadByAdmin: allReports.filter(r => r.hasUnreadFromUser === true).length,
                byType: {
                    support: allReports.filter(r => r.type === 'support').length,
                    feedback: allReports.filter(r => r.type === 'feedback').length,
                    bug: allReports.filter(r => r.type === 'bug').length,
                    system: allReports.filter(r => r.type === 'system').length
                },
                byPriority: {
                    low: allReports.filter(r => r.priority === 'low').length,
                    medium: allReports.filter(r => r.priority === 'medium').length,
                    high: allReports.filter(r => r.priority === 'high').length
                }
            };

            console.log('✅ Estatísticas dos reports calculadas:', stats);
            return stats;
        } catch (error) {
            console.error("❌ Erro ao buscar estatísticas dos reports:", error);
            return {
                total: 0,
                new: 0,
                inProgress: 0,
                resolved: 0,
                unreadByAdmin: 0,
                byType: { support: 0, feedback: 0, bug: 0, system: 0 },
                byPriority: { low: 0, medium: 0, high: 0 }
            };
        }
    }

    /**
     * Buscar report específico
     */
    async getReport(reportId) {
        try {
            if (!reportId) {
                throw new Error('reportId é obrigatório');
            }

            const reportDoc = await getDoc(doc(this.firestore, "reports", reportId));

            if (!reportDoc.exists()) {
                return null;
            }

            return {
                id: reportDoc.id,
                ...reportDoc.data()
            };
        } catch (error) {
            console.error("❌ Erro ao buscar report:", error);
            return null;
        }
    }

    // ==============================================
    // 4. GESTÃO DE PACIENTES
    // ==============================================

    /**
     * Listar pacientes do médico
     */
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

    /**
     * Buscar paciente específico
     */
    async getPatient(doctorId, patientId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "patients", patientId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar paciente:", error);
            throw error;
        }
    }

    /**
     * Atualizar paciente
     */
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

    /**
     * Deletar paciente
     */
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

    /**
     * Filtrar pacientes com critérios avançados
     */
    async filterPatients(doctorId, filters = {}) {
        try {
            let patientsRef = collection(this.firestore, "users", doctorId, "patients");
            let queryRef = patientsRef;

            if (filters.status) {
                queryRef = query(queryRef, where("statusList", "array-contains", filters.status));
            }

            if (filters.gender) {
                const genderFilter = filters.gender.toLowerCase();
                if (genderFilter !== "ambos") {
                    queryRef = query(queryRef, where("gender", "==", genderFilter));
                }
            }

            const snapshot = await getDocs(queryRef);
            let patients = [];

            snapshot.forEach(doc => {
                patients.push({ id: doc.id, ...doc.data() });
            });

            console.log(`Filtro inicial: ${patients.length} pacientes carregados`);

            // Aplicar filtros no cliente
            if (Object.keys(filters).length > 0) {
                if (filters.conditions && filters.conditions.length > 0) {
                    console.log(`Aplicando filtro de condições: ${filters.conditions.join(', ')}`);
                    patients = patients.filter(patient => {
                        const patientConditions = [];

                        if (patient.isSmoker === true ||
                            patient.condicoesClinicas?.ehFumante === "Sim" ||
                            (patient.chronicDiseases &&
                                Array.isArray(patient.chronicDiseases) &&
                                patient.chronicDiseases.some(d =>
                                    typeof d === 'string' && d.toLowerCase().includes("fumante")))) {
                            patientConditions.push('fumante');
                        }

                        const chronicDiseases = [];
                        if (Array.isArray(patient.chronicDiseases)) {
                            chronicDiseases.push(...patient.chronicDiseases);
                        }
                        if (Array.isArray(patient.condicoesClinicas?.doencas)) {
                            chronicDiseases.push(...patient.condicoesClinicas.doencas);
                        }

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

                        if (patient.statusList && patient.statusList.includes("Internado")) {
                            patientConditions.push('internado');
                        }

                        return filters.conditions.some(condition => patientConditions.includes(condition));
                    });
                    console.log(`Após filtro de condições: ${patients.length} pacientes`);
                }

                if (filters.healthPlan) {
                    console.log(`Aplicando filtro de plano de saúde: ${filters.healthPlan}`);
                    patients = patients.filter(patient => {
                        const healthPlanFilter = filters.healthPlan.toLowerCase();

                        if (Array.isArray(patient.healthPlans) && patient.healthPlans.length > 0) {
                            return patient.healthPlans.some(plan =>
                                plan.name?.toLowerCase().includes(healthPlanFilter));
                        }

                        if (patient.healthPlan && typeof patient.healthPlan === 'object') {
                            return patient.healthPlan.name?.toLowerCase().includes(healthPlanFilter);
                        }

                        if (healthPlanFilter === 'particular' &&
                            patient.statusList &&
                            patient.statusList.includes('Particular')) {
                            return true;
                        }

                        return false;
                    });
                    console.log(`Após filtro de plano de saúde: ${patients.length} pacientes`);
                }

                if (filters.ageRange) {
                    console.log(`Aplicando filtro de faixa etária: ${filters.ageRange}`);
                    patients = patients.filter(patient => {
                        if (!patient.birthDate && !patient.dataNascimento) return false;

                        try {
                            const birthDateStr = patient.birthDate || patient.dataNascimento;
                            let birthDate;

                            if (typeof birthDateStr === 'string') {
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

                            if (filters.ageRange.includes('-')) {
                                const [minAge, maxAge] = filters.ageRange.split('-');
                                return age >= parseInt(minAge) && age <= parseInt(maxAge);
                            } else if (filters.ageRange.includes('+')) {
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

                if (filters.region?.state || filters.region?.city) {
                    console.log(`Aplicando filtro de região: estado=${filters.region.state}, cidade=${filters.region.city}`);
                    patients = patients.filter(patient => {
                        let match = true;

                        if (filters.region.state) {
                            const patientState = patient.state || patient.endereco?.estado;
                            match = match && patientState && patientState.toUpperCase() === filters.region.state.toUpperCase();
                        }

                        if (filters.region.city) {
                            const patientCity = patient.city || patient.endereco?.cidade;
                            match = match && patientCity &&
                                patientCity.toLowerCase().includes(filters.region.city.toLowerCase());
                        }

                        return match;
                    });
                    console.log(`Após filtro de região: ${patients.length} pacientes`);
                }

                if (filters.dateRange && (filters.dateRange.start || filters.dateRange.end)) {
                    console.log(`Aplicando filtro de período: de=${filters.dateRange.start} até=${filters.dateRange.end}`);
                    patients = patients.filter(patient => {
                        const nextConsultDate = this._parseStringToDate(patient.nextConsultationDate);
                        const lastConsultDate = this._parseStringToDate(patient.lastConsultationDate);

                        if (!nextConsultDate && !lastConsultDate) return false;

                        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
                        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

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

    /**
     * Atualizar status favorito do paciente
     */
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

    /**
     * Buscar pacientes por médico (alias para listPatients)
     */
    async getPatientsByDoctor(doctorId) {
        return await this.listPatients(doctorId);
    }

    /**
     * Buscar histórico de status do paciente
     */
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

    /**
     * Adicionar histórico de status do paciente
     */
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

    /**
     * Atualizar status do paciente
     */
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

    // ==============================================
    // DOCUMENTOS DO PACIENTE
    // ==============================================

    /**
     * Upload de documento do paciente
     */
    async uploadPatientDocument(file, doctorId, patientId, documentData) {
        try {
            const path = `users/${doctorId}/patients/${patientId}/documents/${file.name}`;
            const fileUrl = await this.uploadFile(file, path);

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

    /**
     * Remover documento do paciente
     */
    async removePatientDocument(doctorId, patientId, documentId) {
        try {
            const patientRef = doc(this.firestore, "users", doctorId, "patients", patientId);
            const patientDoc = await getDoc(patientRef);

            if (!patientDoc.exists()) {
                throw new Error("Paciente não encontrado");
            }

            const patientData = patientDoc.data();
            const documents = patientData.documents || [];

            const documentToDelete = documents.find(doc => doc.id === documentId);

            if (!documentToDelete) {
                throw new Error("Documento não encontrado");
            }

            if (documentToDelete.fileUrl) {
                await this.deleteFile(documentToDelete.fileUrl);
            }

            const updatedDocuments = documents.filter(doc => doc.id !== documentId);

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

    /**
     * Buscar documentos do paciente
     */
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

    // ==============================================
    // 5. CONSULTAS & AGENDAMENTOS
    // ==============================================

    /**
     * Listar consultas de um paciente específico
     */
    async listPatientConsultations(doctorId, patientId, options = {}) {
        try {
            const consultationsRef = collection(
                this.firestore,
                "users",
                doctorId,
                "patients",
                patientId,
                "consultations"
            );

            let q = query(
                consultationsRef,
                orderBy("consultationDate", options.order || "desc")
            );

            const querySnapshot = await getDocs(q);
            const consultations = [];

            querySnapshot.forEach(docSnap => {
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

    /**
     * Listar todas as consultas do médico
     */
    async listAllConsultations(doctorId, options = {}) {
        try {
            let q = query(
                collectionGroup(this.firestore, "consultations"),
                where("doctorId", "==", doctorId)
            );

            q = query(q, orderBy("consultationDate", options.order || "desc"));

            const querySnapshot = await getDocs(q);
            const consultations = [];

            querySnapshot.forEach(docSnap => {
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

    /**
     * Criar nova consulta
     */
    async createConsultation(doctorId, patientId, consultation) {
        try {
            const consultationRef = doc(collection(this.firestore, "users", doctorId, "patients", patientId, "consultations"));

            let consultationDateStr = consultation.consultationDate;

            if (typeof consultationDateStr !== 'string') {
                consultationDateStr = this._formatDateTimeToString(consultation.consultationDate);
            }

            const dataToSave = {
                ...consultation,
                id: consultationRef.id,
                createdAt: new Date(),
                doctorId: doctorId,
                consultationDate: consultationDateStr
            };

            await setDoc(consultationRef, dataToSave);

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

    /**
     * Atualizar consulta
     */
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

            const updatedData = {
                ...consultation,
                updatedAt: new Date(),
            };

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

    // ==============================================
    // ANAMNESES
    // ==============================================

    /**
     * Listar anamneses do paciente
     */
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

    /**
     * Criar anamnese
     */
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

    /**
     * Atualizar anamnese
     */
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

    /**
     * Buscar anamnese específica
     */
    async getAnamnese(doctorId, patientId, anamneseId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "anamneses", anamneseId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar anamnese:", error);
            throw error;
        }
    }

    // ==============================================
    // 6. RECEITAS & MEDICAMENTOS
    // ==============================================

    /**
     * Criar receita
     */
    async createPrescription(doctorId, patientId, prescriptionData) {
        try {
            const prescriptionRef = doc(collection(this.firestore, "users", doctorId, "patients", patientId, "prescriptions"));

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

    /**
     * Atualizar receita
     */
    async updatePrescription(doctorId, patientId, prescriptionId, prescriptionData) {
        try {
            const prescriptionRef = doc(this.firestore, "users", doctorId, "patients", patientId, "prescriptions", prescriptionId);

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

    /**
     * Deletar receita
     */
    async deletePrescription(doctorId, patientId, prescriptionId) {
        try {
            const prescriptionRef = doc(this.firestore, "users", doctorId, "patients", patientId, "prescriptions", prescriptionId);

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

    /**
     * Buscar receita específica
     */
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

    /**
     * Listar receitas com detalhes
     */
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

                    const path = docSnap.ref.path;
                    const pathSegments = path.split('/');
                    const patientId = pathSegments[3];

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
                }
            }

            return prescriptions;
        } catch (error) {
            console.error("Erro ao listar receitas com detalhes:", error);
            return [];
        }
    }

    /**
     * Filtrar receitas com critérios
     */
    async filterPrescriptions(doctorId, filters) {
        try {
            let q = query(
                collectionGroup(this.firestore, "prescriptions"),
                where("doctorId", "==", doctorId)
            );

            if (filters.status && filters.status !== 'all') {
                q = query(q, where("status", "==", filters.status));
            }

            if (filters.dateFrom) {
                const dateFromString = this._formatDateTimeToString(filters.dateFrom);
                q = query(q, where("createdAt", ">=", dateFromString));
            }

            if (filters.dateTo) {
                const dateToString = this._formatDateTimeToString(filters.dateTo);
                q = query(q, where("createdAt", "<=", dateToString));
            }

            q = query(q, orderBy("createdAt", filters.order || "desc"));

            const querySnapshot = await getDocs(q);
            const prescriptions = [];

            const maxResults = filters.limit || Number.MAX_SAFE_INTEGER;
            let resultCount = 0;

            for (const docSnap of querySnapshot.docs) {
                if (resultCount >= maxResults) break;

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

    // ==============================================
    // MEDICAMENTOS
    // ==============================================

    /**
     * Listar medicamentos do médico
     */
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

    /**
     * Criar medicamento
     */
    async createMedication(doctorId, medicationData) {
        try {
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

    /**
     * Atualizar medicamento
     */
    async updateMedication(doctorId, medicationId, medicationData) {
        try {
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

    /**
     * Deletar medicamento
     */
    async deleteMedication(doctorId, medicationId) {
        try {
            await deleteDoc(doc(this.firestore, "users", doctorId, "medications", medicationId));
            return true;
        } catch (error) {
            console.error("Erro ao deletar medicamento:", error);
            throw error;
        }
    }

    /**
     * Buscar medicamento específico
     */
    async getMedication(doctorId, medicationId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "medications", medicationId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar medicamento:", error);
            throw error;
        }
    }

    // ==============================================
    // 7. EXAMES & RESULTADOS
    // ==============================================

    /**
     * Listar exames do paciente
     */
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

    /**
     * Buscar exame específico
     */
    async getExam(doctorId, patientId, examId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "exams", examId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar exame:", error);
            throw error;
        }
    }

    /**
     * Criar exame
     */
    async createExam(doctorId, patientId, examData) {
        try {
            const examRef = doc(collection(this.firestore, "users", doctorId, "patients", patientId, "exams"));

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

    /**
     * Atualizar exame
     */
    async updateExam(doctorId, patientId, examId, examData) {
        try {
            const examRef = doc(this.firestore, "users", doctorId, "patients", patientId, "exams", examId);

            const docSnap = await getDoc(examRef);
            if (!docSnap.exists()) {
                throw new Error("Exame não encontrado");
            }

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

    /**
     * Deletar exame
     */
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

    // ==============================================
    // ANEXOS DE EXAMES
    // ==============================================

    /**
     * Upload de anexo para exame
     */
    async uploadExamAttachment(file, doctorId, patientId, examId) {
        try {
            const path = `users/${doctorId}/patients/${patientId}/exams/${examId}/${file.name}`;
            const fileUrl = await this.uploadFile(file, path);

            const fileInfo = {
                fileName: file.name,
                fileType: file.type,
                fileSize: this.formatFileSize(file.size),
                fileUrl: fileUrl,
                storagePath: path,
                uploadedAt: new Date()
            };

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

    /**
     * Remover anexo de exame
     */
    async removeExamAttachment(doctorId, patientId, examId, attachmentUrl, attachmentIndex) {
        try {
            const examRef = doc(this.firestore, "users", doctorId, "patients", patientId, "exams", examId);
            const examDoc = await getDoc(examRef);

            if (!examDoc.exists()) {
                throw new Error("Exame não encontrado");
            }

            const examData = examDoc.data();
            const attachments = [...(examData.attachments || [])];

            if (attachmentIndex < 0 || attachmentIndex >= attachments.length) {
                throw new Error("Índice de anexo inválido");
            }

            await this.deleteFile(attachmentUrl);
            attachments.splice(attachmentIndex, 1);

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

    // ==============================================
    // 8. NOTAS & DOCUMENTOS
    // ==============================================

    /**
     * Listar notas do paciente
     */
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

    /**
     * Buscar nota específica
     */
    async getNote(doctorId, patientId, noteId) {
        try {
            const docSnap = await getDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "notes", noteId));
            return docSnap.exists() ? docSnap.data() : null;
        } catch (error) {
            console.error("Erro ao buscar nota:", error);
            throw error;
        }
    }

    /**
     * Criar nota
     */
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

    /**
     * Atualizar nota
     */
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

    /**
     * Deletar nota
     */
    async deleteNote(doctorId, patientId, noteId) {
        try {
            const noteDoc = await this.getNote(doctorId, patientId, noteId);

            if (noteDoc && noteDoc.attachments && noteDoc.attachments.length > 0) {
                for (const attachment of noteDoc.attachments) {
                    if (attachment.fileUrl) {
                        try {
                            await this.deleteFile(attachment.fileUrl);
                        } catch (err) {
                            console.warn(`Erro ao deletar arquivo ${attachment.fileName}:`, err);
                        }
                    }
                }
            }

            await deleteDoc(doc(this.firestore, "users", doctorId, "patients", patientId, "notes", noteId));
            console.log("Nota deletada com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro ao deletar nota:", error);
            throw error;
        }
    }

    // ==============================================
    // ANEXOS DE NOTAS
    // ==============================================

    /**
     * Upload de anexo para nota
     */
    async uploadNoteAttachment(file, doctorId, patientId, noteId) {
        try {
            const path = `users/${doctorId}/patients/${patientId}/notes/${noteId}/${file.name}`;
            const fileUrl = await this.uploadFile(file, path);

            const fileInfo = {
                fileName: file.name,
                fileType: file.type,
                fileSize: this.formatFileSize(file.size),
                fileUrl: fileUrl,
                uploadedAt: new Date()
            };

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

    /**
     * Remover anexo de nota
     */
    async removeNoteAttachment(doctorId, patientId, noteId, attachmentUrl, attachmentIndex) {
        try {
            const noteRef = doc(this.firestore, "users", doctorId, "patients", patientId, "notes", noteId);
            const noteDoc = await getDoc(noteRef);

            if (!noteDoc.exists()) {
                throw new Error("Nota não encontrada");
            }

            const noteData = noteDoc.data();
            const attachments = [...(noteData.attachments || [])];

            if (attachmentIndex < 0 || attachmentIndex >= attachments.length) {
                throw new Error("Índice de anexo inválido");
            }

            await this.deleteFile(attachmentUrl);
            attachments.splice(attachmentIndex, 1);

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

    // ==============================================
    // 9. ARQUIVOS & STORAGE
    // ==============================================

    /**
     * Upload de arquivo para storage
     */
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

    /**
     * Deletar arquivo do storage
     */
    async deleteFile(fileUrl) {
        try {
            if (!fileUrl || !fileUrl.includes('firebase')) {
                console.warn("URL de arquivo inválida:", fileUrl);
                return false;
            }

            const decodedUrl = decodeURIComponent(fileUrl);
            const pathStartIndex = decodedUrl.indexOf('/o/') + 3;
            const pathEndIndex = decodedUrl.indexOf('?', pathStartIndex);

            if (pathStartIndex === 2 || pathEndIndex === -1) {
                console.warn("Formato de URL de arquivo inválido:", fileUrl);
                return false;
            }

            const filePath = decodedUrl.substring(pathStartIndex, pathEndIndex);
            const fileRef = ref(this.storage, filePath);
            await deleteObject(fileRef);

            console.log(`Arquivo deletado: ${filePath}`);
            return true;
        } catch (error) {
            console.error("Erro ao deletar arquivo:", error);
            return false;
        }
    }

    /**
     * Buscar URL de arquivo no storage
     */
    async getStorageFileUrl(path) {
        try {
            const storageRef = ref(this.storage, path);
            return await getDownloadURL(storageRef);
        } catch (error) {
            console.error("Erro ao obter URL do arquivo:", error);
            throw error;
        }
    }

    // ==============================================
    // 10. CONVERSAS DE IA
    // ==============================================

    /**
     * Salvar conversa de IA
     */
    async saveConversation(userId, conversationData) {
        try {
            if (!userId) {
                throw new Error('userId é obrigatório');
            }

            const conversationsRef = collection(this.firestore, 'users', userId, 'aiConversations');

            const docData = {
                ...conversationData,
                createdAt: serverTimestamp(),
                lastMessageAt: serverTimestamp(),
                userId: userId
            };

            const docRef = await addDoc(conversationsRef, docData);
            console.log('Conversa salva com ID:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('Erro ao salvar conversa:', error);
            throw new Error('Erro ao salvar conversa: ' + error.message);
        }
    }

    /**
     * Buscar conversas do usuário
     */
    async getConversations(userId) {
        try {
            if (!userId) {
                throw new Error('userId é obrigatório');
            }

            const conversationsRef = collection(this.firestore, 'users', userId, 'aiConversations');
            const q = query(
                conversationsRef,
                orderBy('lastMessageAt', 'desc'),
                limitFn(50)
            );

            const querySnapshot = await getDocs(q);
            const conversations = [];

            querySnapshot.forEach((doc) => {
                conversations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`Carregadas ${conversations.length} conversas para usuário ${userId}`);
            return conversations;
        } catch (error) {
            console.error('Erro ao buscar conversas:', error);
            throw new Error('Erro ao buscar conversas: ' + error.message);
        }
    }

    /**
     * Buscar conversa específica
     */
    async getConversation(userId, conversationId) {
        try {
            if (!userId || !conversationId) {
                throw new Error('userId e conversationId são obrigatórios');
            }

            const conversationRef = doc(this.firestore, 'users', userId, 'aiConversations', conversationId);
            const conversationDoc = await getDoc(conversationRef);

            if (!conversationDoc.exists()) {
                throw new Error('Conversa não encontrada');
            }

            return {
                id: conversationDoc.id,
                ...conversationDoc.data()
            };
        } catch (error) {
            console.error('Erro ao buscar conversa:', error);
            throw new Error('Erro ao buscar conversa: ' + error.message);
        }
    }

    /**
     * Atualizar conversa
     */
    async updateConversation(userId, conversationId, conversationData) {
        try {
            if (!userId || !conversationId) {
                throw new Error('userId e conversationId são obrigatórios');
            }

            const conversationRef = doc(this.firestore, 'users', userId, 'aiConversations', conversationId);

            const updateData = {
                ...conversationData,
                lastMessageAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await updateDoc(conversationRef, updateData);
            console.log('Conversa atualizada:', conversationId);
            return conversationId;
        } catch (error) {
            console.error('Erro ao atualizar conversa:', error);
            throw new Error('Erro ao atualizar conversa: ' + error.message);
        }
    }

    /**
     * Deletar conversa
     */
    async deleteConversation(userId, conversationId) {
        try {
            if (!userId || !conversationId) {
                throw new Error('userId e conversationId são obrigatórios');
            }

            const conversationRef = doc(this.firestore, 'users', userId, 'aiConversations', conversationId);
            await deleteDoc(conversationRef);

            console.log('Conversa deletada:', conversationId);
            return true;
        } catch (error) {
            console.error('Erro ao deletar conversa:', error);
            throw new Error('Erro ao deletar conversa: ' + error.message);
        }
    }

    /**
     * Buscar conversas por termo
     */
    async searchConversations(userId, searchTerm) {
        try {
            if (!userId || !searchTerm) {
                throw new Error('userId e searchTerm são obrigatórios');
            }

            const conversationsRef = collection(this.firestore, 'users', userId, 'aiConversations');
            const q = query(
                conversationsRef,
                orderBy('lastMessageAt', 'desc'),
                limitFn(100)
            );

            const querySnapshot = await getDocs(q);
            const conversations = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const matchTitle = data.title?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchMessages = data.messages?.some(msg =>
                    msg.content?.toLowerCase().includes(searchTerm.toLowerCase())
                );

                if (matchTitle || matchMessages) {
                    conversations.push({
                        id: doc.id,
                        ...data
                    });
                }
            });

            console.log(`Encontradas ${conversations.length} conversas com o termo: ${searchTerm}`);
            return conversations;
        } catch (error) {
            console.error('Erro ao buscar conversas:', error);
            throw new Error('Erro ao buscar conversas: ' + error.message);
        }
    }

    /**
     * Limpar conversas antigas
     */
    async cleanOldConversations(userId, daysOld = 30) {
        try {
            if (!userId) {
                throw new Error('userId é obrigatório');
            }

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const conversationsRef = collection(this.firestore, 'users', userId, 'aiConversations');
            const q = query(conversationsRef, orderBy('lastMessageAt', 'asc'));
            const querySnapshot = await getDocs(q);

            const deletePromises = [];

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const lastMessageDate = data.lastMessageAt?.toDate() || new Date(data.lastMessageAt);

                if (lastMessageDate < cutoffDate) {
                    deletePromises.push(deleteDoc(docSnap.ref));
                }
            });

            await Promise.all(deletePromises);
            console.log(`Limpas ${deletePromises.length} conversas antigas (>${daysOld} dias)`);
            return deletePromises.length;
        } catch (error) {
            console.error('Erro ao limpar conversas antigas:', error);
            throw new Error('Erro ao limpar conversas antigas: ' + error.message);
        }
    }

    /**
     * Obter estatísticas das conversas
     */
    async getConversationStats(userId) {
        try {
            if (!userId) {
                throw new Error('userId é obrigatório');
            }

            const conversationsRef = collection(this.firestore, 'users', userId, 'aiConversations');
            const querySnapshot = await getDocs(conversationsRef);

            let totalConversations = 0;
            let totalMessages = 0;
            let totalTokens = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                totalConversations++;

                if (data.messages) {
                    totalMessages += data.messages.length;
                    data.messages.forEach(msg => {
                        if (msg.tokensUsed) {
                            totalTokens += msg.tokensUsed;
                        }
                    });
                }
            });

            const stats = {
                totalConversations,
                totalMessages,
                totalTokens,
                averageMessagesPerConversation: totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0
            };

            console.log('Estatísticas das conversas:', stats);
            return stats;
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            throw new Error('Erro ao obter estatísticas: ' + error.message);
        }
    }

    // ==============================================
    // 11. DADOS CLIMÁTICOS
    // ==============================================

    /**
     * Buscar dados climáticos do usuário
     */
    async getUserWeatherData(uid) {
        try {
            if (!uid) {
                console.warn("getUserWeatherData: UID não fornecido");
                return { weatherData: null, currentCity: "São Paulo,BR" };
            }

            const userRef = doc(this.firestore, "users", uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                console.warn("getUserWeatherData: Usuário não encontrado", uid);
                return { weatherData: null, currentCity: "São Paulo,BR" };
            }

            const userData = userDoc.data();
            let currentCity = "São Paulo,BR";

            if (userData.address) {
                if (userData.address.city) {
                    const cityName = userData.address.city;
                    currentCity = cityName.includes(',') ? cityName : `${cityName},BR`;
                }
            }

            if (!userData.address?.city && userData.weatherData?.cityRequested) {
                currentCity = userData.weatherData.cityRequested;
            }

            if (userData.weatherData) {
                console.log(`getUserWeatherData: Dados encontrados para usuário ${uid} (cidade: ${currentCity})`);

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
            return { weatherData: null, currentCity: "São Paulo,BR" };
        }
    }

    /**
     * Atualizar dados climáticos do usuário
     */
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

            const city = cityRequested || "São Paulo,BR";
            const updateKey = `${uid}_${city}`;
            const now = Date.now();

            if (lastUpdateTimestamps[updateKey]) {
                const timeSinceLastUpdate = now - lastUpdateTimestamps[updateKey];
                const MIN_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutos

                if (timeSinceLastUpdate < MIN_UPDATE_INTERVAL) {
                    console.log(`[Firebase] Atualização recente para usuário ${uid} (${Math.round(timeSinceLastUpdate/60000)}min)`);
                    return true;
                }
            }

            lastUpdateTimestamps[updateKey] = now;

            const userRef = doc(this.firestore, "users", uid);
            const weatherDataWithMetadata = {
                ...weatherData,
                timestamp: new Date(),
                cityRequested: city,
                lastUpdated: new Date().toISOString(),
                updateId: Date.now()
            };

            console.log(`[Firebase] Atualizando dados de clima para ${uid} (${city})`);

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
}

export default new FirebaseService();