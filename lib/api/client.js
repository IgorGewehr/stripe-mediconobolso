import axios from 'axios';
import { auth } from '../firebase'; // Assuming firebase.js is in lib/

// Configuração da URL base
// Em desenvolvimento, aponta para o servidor local ou proxy
// Em produção, deve apontar para a URL da API do Doctor Server
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const client = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para adicionar o token de autenticação
client.interceptors.request.use(async (config) => {
    try {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;

            // Opcional: Adicionar Tenant ID se estiver disponível no localStorage ou Contexto
            // const tenantId = localStorage.getItem('tenantId');
            // if (tenantId) {
            //     config.headers['x-tenant-id'] = tenantId;
            // }
        }
    } catch (error) {
        console.error('Erro ao obter token de autenticação:', error);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor para tratamento de erros
client.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response) {
        // Erros de resposta do servidor (4xx, 5xx)
        if (error.response.status === 401) {
            // Token expirado ou inválido
            console.warn('Sessão expirada ou não autorizada. Redirecionando para login...');
            // Implementar lógica de logout ou refresh se necessário
            // window.location.href = '/login';
        }
    }
    return Promise.reject(error);
});

export default client;
