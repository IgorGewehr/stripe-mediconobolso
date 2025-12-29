import client from "../api/client";

class PrescriptionService {
    /**
     * Listar prescrições com filtros
     * @param {object} params - { patient_id, status, limit, offset }
     */
    async listPrescriptions(params = {}) {
        try {
            const response = await client.get('/api/v1/prescriptions', { params });
            return response.data;
        } catch (error) {
            console.error("PrescriptionService: Erro ao listar prescrições", error);
            throw error;
        }
    }

    /**
     * Listar prescrições de um paciente
     * @param {string} patientId 
     * @param {object} params - { limit, offset }
     */
    async listByPatient(patientId, params = {}) {
        try {
            const response = await client.get(`/api/v1/prescriptions/patient/${patientId}`, { params });
            return response.data;
        } catch (error) {
            console.error(`PrescriptionService: Erro ao listar prescrições do paciente ${patientId}`, error);
            throw error;
        }
    }

    /**
     * Obter prescrição por ID
     * @param {string} id 
     */
    async getPrescription(id) {
        try {
            const response = await client.get(`/api/v1/prescriptions/${id}`);
            return response.data;
        } catch (error) {
            console.error(`PrescriptionService: Erro ao buscar prescrição ${id}`, error);
            throw error;
        }
    }

    /**
     * Criar prescrição
     * @param {object} data
     */
    async createPrescription(data) {
        try {
            const response = await client.post('/api/v1/prescriptions', data);
            return response.data;
        } catch (error) {
            console.error("PrescriptionService: Erro ao criar prescrição", error);
            throw error;
        }
    }

    /**
     * Adicionar item à prescrição
     * @param {string} prescriptionId 
     * @param {object} item
     */
    async addItem(prescriptionId, item) {
        try {
            const response = await client.post(`/api/v1/prescriptions/${prescriptionId}/items`, item);
            return response.data;
        } catch (error) {
            console.error(`PrescriptionService: Erro ao adicionar item à prescrição ${prescriptionId}`, error);
            throw error;
        }
    }

    /**
     * Remover item da prescrição
     * @param {string} prescriptionId 
     * @param {string} itemId 
     */
    async removeItem(prescriptionId, itemId) {
        try {
            const response = await client.delete(`/api/v1/prescriptions/${prescriptionId}/items/${itemId}`);
            return response.data;
        } catch (error) {
            console.error(`PrescriptionService: Erro ao remover item ${itemId} da prescrição ${prescriptionId}`, error);
            throw error;
        }
    }

    /**
     * Assinar prescrição
     * @param {string} prescriptionId 
     * @param {object} data - { certificate_id, signature_hash }
     */
    async signPrescription(prescriptionId, data) {
        try {
            const response = await client.post(`/api/v1/prescriptions/${prescriptionId}/sign`, data);
            return response.data;
        } catch (error) {
            console.error(`PrescriptionService: Erro ao assinar prescrição ${prescriptionId}`, error);
            throw error;
        }
    }

    /**
     * Cancelar prescrição
     * @param {string} prescriptionId 
     * @param {string} reason 
     */
    async cancelPrescription(prescriptionId, reason) {
        try {
            const response = await client.post(`/api/v1/prescriptions/${prescriptionId}/cancel`, { reason });
            return response.data;
        } catch (error) {
            console.error(`PrescriptionService: Erro ao cancelar prescrição ${prescriptionId}`, error);
            throw error;
        }
    }

    /**
     * Buscar medicamentos
     * @param {string} query 
     */
    async searchDrugs(query) {
        try {
            const response = await client.get('/api/v1/prescriptions/drugs/search', { params: { q: query } });
            return response.data;
        } catch (error) {
            console.error(`PrescriptionService: Erro ao buscar medicamentos com query "${query}"`, error);
            throw error;
        }
    }
}

export const prescriptionService = new PrescriptionService();
