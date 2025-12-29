import client from "../api/client";

class PatientService {
    /**
     * Listar pacientes com paginação e filtro
     * @param {object} params - query, page, per_page
     */
    async listPatients(params = {}) {
        try {
            const response = await client.get('/api/v1/patients', { params });
            return response.data;
        } catch (error) {
            console.error("PatientService: Erro ao listar pacientes", error);
            throw error;
        }
    }

    /**
     * Obter detalhes de um paciente
     * @param {string} id 
     */
    async getPatient(id) {
        try {
            const response = await client.get(`/api/v1/patients/${id}`);
            return response.data;
        } catch (error) {
            console.error(`PatientService: Erro ao buscar paciente ${id}`, error);
            throw error;
        }
    }

    /**
     * Criar novo paciente
     * @param {object} data 
     */
    async createPatient(data) {
        try {
            const response = await client.post('/api/v1/patients', data);
            return response.data;
        } catch (error) {
            console.error("PatientService: Erro ao criar paciente", error);
            throw error;
        }
    }

    /**
     * Atualizar paciente
     * @param {string} id 
     * @param {object} data 
     */
    async updatePatient(id, data) {
        try {
            const response = await client.put(`/api/v1/patients/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`PatientService: Erro ao atualizar paciente ${id}`, error);
            throw error;
        }
    }

    /**
     * Deletar paciente (soft delete)
     * @param {string} id 
     */
    async deletePatient(id) {
        try {
            await client.delete(`/api/v1/patients/${id}`);
            return true;
        } catch (error) {
            console.error(`PatientService: Erro ao deletar paciente ${id}`, error);
            throw error;
        }
    }
}

export const patientService = new PatientService();
