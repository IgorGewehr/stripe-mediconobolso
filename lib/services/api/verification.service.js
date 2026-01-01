/**
 * Verification Service - Verificação Pública de Documentos
 *
 * Serviço para verificação de autenticidade de documentos digitais
 * (prescrições e atestados). Este serviço utiliza endpoints públicos
 * que não requerem autenticação.
 */

import { createCrudLogger } from '@/lib/utils/logger';

// URL base do servidor - usar endpoint público
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const logger = createCrudLogger('Verificação');

/**
 * Formata código de verificação para o padrão XXXX-XXXX-XXXX-XXXX
 */
function formatVerificationCode(code) {
  // Remove hífens e espaços
  const cleaned = code.replace(/[-\s]/g, '').toUpperCase();

  // Se tem 16 caracteres, formata
  if (cleaned.length === 16) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}-${cleaned.slice(12, 16)}`;
  }

  return code;
}

/**
 * Serviço de Verificação de Documentos
 */
const verificationService = {
  /**
   * Verifica autenticidade de um documento pelo código de verificação
   * @param {string} code - Código de verificação (XXXX-XXXX-XXXX-XXXX)
   * @returns {Promise<Object>} Resultado da verificação
   */
  async verifyDocument(code) {
    const { requestId, startTime } = logger.operationStart('VERIFY', code);

    try {
      const formattedCode = formatVerificationCode(code);

      // Endpoint público - não precisa de autenticação
      const response = await fetch(`${API_BASE_URL}/public/verify/${formattedCode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = new Error('Documento não encontrado');
        error.status = response.status;

        if (response.status === 404) {
          error.userMessage = 'Código de verificação não encontrado. Verifique se o código está correto.';
        } else {
          error.userMessage = 'Erro ao verificar documento. Tente novamente.';
        }

        throw error;
      }

      const data = await response.json();

      const result = {
        valid: data.valid,
        documentType: data.document_type,
        documentId: data.document_id,
        status: data.status,
        verificationCode: data.verification_code,
        issuedAt: data.issued_at,
        signedAt: data.signed_at,
        expiryDate: data.expiry_date,
        professionalName: data.professional_name,
        professionalCrm: data.professional_crm,
        patientNameMasked: data.patient_name_masked,
        verifiedAt: data.verified_at,
        message: data.message,
      };

      logger.operationSuccess(requestId, startTime, 'VERIFY', code);
      return result;
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'VERIFY', error, code);
      error.userMessage = error.userMessage || userMessage;
      throw error;
    }
  },

  /**
   * Obtém URL de download temporário para o documento
   * @param {string} code - Código de verificação
   * @returns {Promise<Object>} URL de download
   */
  async getDownloadUrl(code) {
    const { requestId, startTime } = logger.operationStart('DOWNLOAD', code);

    try {
      const formattedCode = formatVerificationCode(code);

      const response = await fetch(`${API_BASE_URL}/public/verify/${formattedCode}/download`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = new Error('Erro ao obter link de download');
        error.status = response.status;
        throw error;
      }

      const data = await response.json();

      logger.operationSuccess(requestId, startTime, 'DOWNLOAD', code);
      return {
        downloadUrl: data.download_url,
        expiresAt: data.expires_at,
        token: data.token,
      };
    } catch (error) {
      const { userMessage } = logger.operationError(requestId, startTime, 'DOWNLOAD', error, code);
      error.userMessage = userMessage;
      throw error;
    }
  },

  /**
   * Valida formato do código de verificação
   * @param {string} code - Código a ser validado
   * @returns {boolean} true se o código tem formato válido
   */
  isValidFormat(code) {
    if (!code) return false;

    // Remove hífens e espaços
    const cleaned = code.replace(/[-\s]/g, '');

    // Deve ter exatamente 16 caracteres alfanuméricos
    return /^[A-Z0-9]{16}$/i.test(cleaned);
  },

  /**
   * Formata código para exibição
   * @param {string} code - Código bruto
   * @returns {string} Código formatado (XXXX-XXXX-XXXX-XXXX)
   */
  formatCode(code) {
    return formatVerificationCode(code);
  },
};

export default verificationService;
