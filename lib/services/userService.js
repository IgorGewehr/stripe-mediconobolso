import client from "../api/client";

class UserService {
    /**
     * Obtém o perfil do usuário logado diretamente do backend (Postgres)
     * @returns {Promise<User>}
     */
    async getProfile() {
        try {
            const response = await client.get('/api/v1/account/me');
            return response.data;
        } catch (error) {
            console.error("UserService: Falha ao buscar perfil:", error);
            throw error;
        }
    }

    /**
     * Atualiza dados do usuário
     * Utiliza o endpoint de provisionamento que também serve para atualização
     * @param {object} data
     * @returns {Promise<User>}
     */
    async updateProfile(data) {
        try {
            // O endpoint provision atualiza dados se o usuário já existir
            const response = await client.post('/api/v1/account/provision', {
                email: data.email,
                name: data.fullName || data.name,
                ...data
            });
            return response.data;
        } catch (error) {
            console.error("UserService: Falha ao atualizar perfil:", error);
            throw error;
        }
    }

    /**
     * Inicializa/Busca módulos com base no plano
     * O backend (Rust) faz o `get_or_create` automaticamente ao listar
     */
    async getUserModules() {
        try {
            // Rota correta conforme api/modules.rs: route("", web::get().to(list_modules)) sob /modules
            const response = await client.get('/api/v1/modules');
            return response.data;
        } catch (error) {
            console.error("UserService: Falha ao buscar módulos:", error);
            throw error;
        }
    }
    /**
     * Listar todos os usuários (Admin)
     * @param {object} params - query params (page, per_page, email, role, etc)
     */
    async listUsers(params = {}) {
        try {
            const response = await client.get('/api/v1/users', { params });
            return response.data;
        } catch (error) {
            console.error("UserService: Falha ao listar usuários:", error);
            throw error;
        }
    }

    /**
     * Criar usuário (Admin)
     * @param {object} userData
     */
    async createUser(userData) {
        try {
            const response = await client.post('/api/v1/users', userData);
            return response.data;
        } catch (error) {
            console.error("UserService: Falha ao criar usuário:", error);
            throw error;
        }
    }
}

export const userService = new UserService();
