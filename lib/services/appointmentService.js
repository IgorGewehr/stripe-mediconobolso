import client from "../api/client";

class AppointmentService {
    /**
     * Listar agendamentos com filtros
     * @param {object} params - { paciente_id, profissional_id, status, data_inicio, data_fim, page, per_page }
     */
    async listAppointments(params = {}) {
        try {
            const response = await client.get('/api/v1/appointments', { params });
            return response.data;
        } catch (error) {
            console.error("AppointmentService: Erro ao listar agendamentos", error);
            throw error;
        }
    }

    /**
     * Obter agendamento por ID
     * @param {string} id 
     */
    async getAppointment(id) {
        try {
            const response = await client.get(`/api/v1/appointments/${id}`);
            return response.data;
        } catch (error) {
            console.error(`AppointmentService: Erro ao buscar agendamento ${id}`, error);
            throw error;
        }
    }

    /**
     * Obter agenda do dia para um profissional
     * @param {string} date - YYYY-MM-DD
     * @param {string} profissionalId
     */
    async getDaySchedule(date, profissionalId) {
        try {
            const response = await client.get(`/api/v1/appointments/day/${date}`, {
                params: { profissional_id: profissionalId }
            });
            return response.data;
        } catch (error) {
            console.error(`AppointmentService: Erro ao buscar agenda do dia ${date}`, error);
            throw error;
        }
    }

    /**
     * Criar novo agendamento
     * @param {object} data
     */
    async createAppointment(data) {
        try {
            const response = await client.post('/api/v1/appointments', data);
            return response.data;
        } catch (error) {
            console.error("AppointmentService: Erro ao criar agendamento", error);
            throw error;
        }
    }

    /**
     * Atualizar agendamento
     * @param {string} id 
     * @param {object} data 
     */
    async updateAppointment(id, data) {
        try {
            const response = await client.put(`/api/v1/appointments/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`AppointmentService: Erro ao atualizar agendamento ${id}`, error);
            throw error;
        }
    }

    /**
     * Cancelar agendamento
     * @param {string} id 
     * @param {string} motivo 
     */
    async cancelAppointment(id, motivo) {
        try {
            const response = await client.post(`/api/v1/appointments/${id}/cancel`, { motivo });
            return response.data;
        } catch (error) {
            console.error(`AppointmentService: Erro ao cancelar agendamento ${id}`, error);
            throw error;
        }
    }

    /**
     * Confirmar agendamento
     * @param {string} id 
     */
    async confirmAppointment(id) {
        try {
            const response = await client.post(`/api/v1/appointments/${id}/confirm`);
            return response.data;
        } catch (error) {
            console.error(`AppointmentService: Erro ao confirmar agendamento ${id}`, error);
            throw error;
        }
    }

    /**
     * Obter próximos agendamentos de um paciente
     * @param {string} patientId 
     */
    async getPatientUpcoming(patientId) {
        try {
            const response = await client.get(`/api/v1/appointments/patient/${patientId}/upcoming`);
            return response.data;
        } catch (error) {
            console.error(`AppointmentService: Erro ao buscar agendamentos futuros do paciente ${patientId}`, error);
            throw error;
        }
    }
}

export const appointmentService = new AppointmentService();
