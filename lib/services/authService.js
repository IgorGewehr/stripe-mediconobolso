import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from "firebase/auth";
import { auth } from "../firebase";
import client from "../api/client";

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
    prompt: 'select_account',
});

class AuthService {
    constructor() {
        this.auth = auth;
    }

    /**
     * Login com email e senha
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<UserCredential>}
     */
    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            // Após login no Firebase, sincronizar com o backend
            await this.syncUserWithBackend();
            return userCredential;
        } catch (error) {
            console.error("AuthService: Erro no login:", error);
            throw error;
        }
    }

    /**
     * Cadastro com email e senha
     * @param {string} email 
     * @param {string} password 
     * @param {object} userData - Dados adicionais para criar o perfil
     * @returns {Promise<UserCredential>}
     */
    async signUp(email, password, userData) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

            // Chamar API para criar/provisionar usuário no backend
            await client.post('/api/v1/account/provision', {
                email,
                name: userData.fullName || userData.name || email.split('@')[0],
                ...userData
            });

            return userCredential;
        } catch (error) {
            console.error("AuthService: Erro no cadastro:", error);
            throw error;
        }
    }

    /**
     * Login com Google
     */
    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(this.auth, googleProvider);
            // Sincronizar/Provisionar usuário Google no backend
            await client.post('/api/v1/account/provision', {
                email: result.user.email,
                name: result.user.displayName,
                photoURL: result.user.photoURL,
                provider: 'google'
            });
            return result;
        } catch (error) {
            console.error("AuthService: Erro no login Google:", error);
            throw error;
        }
    }

    /**
     * Logout
     */
    async logout() {
        try {
            await signOut(this.auth);
            // Opcional: avisar backend para invalidar sessão se houver
        } catch (error) {
            console.error("AuthService: Erro no logout:", error);
            throw error;
        }
    }

    /**
     * Enviar email de recuperação de senha
     */
    async sendPasswordResetEmail(email) {
        return sendPasswordResetEmail(this.auth, email);
    }

    /**
     * Obter token atual do usuário
     */
    async getToken() {
        const user = this.auth.currentUser;
        if (user) {
            return user.getIdToken();
        }
        return null;
    }

    /**
     * Sincroniza o usuário atual com o backend (ex: para garantir que existe no Postgres)
     */
    async syncUserWithBackend() {
        try {
            // GET /me verifica se o usuário existe e retorna os dados
            const response = await client.get('/api/v1/account/me');
            return response.data;
        } catch (error) {
            console.warn("AuthService: Usuário não encontrado no backend ou erro de conexão.", error);
            // Se não encontrar, pode ser necessário provisionar (embora o cadastro já faça isso)
        }
    }

    /**
     * Observer para estado de autenticação
     */
    onAuthStateChanged(callback) {
        return onAuthStateChanged(this.auth, callback);
    }
}

export const authService = new AuthService();
