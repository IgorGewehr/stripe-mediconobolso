/**
 * Logger Utility - Sistema de Logs Centralizado
 *
 * Fornece logging estruturado com:
 * - Request IDs para rastreamento
 * - Timestamps
 * - Contexto de usuário
 * - Timing de operações
 * - Categorização de erros
 */

// Gerar ID único para requests
function generateRequestId() {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
}

// Formatar timestamp
function formatTimestamp() {
  return new Date().toISOString();
}

// Sanitizar dados sensíveis
function sanitizeData(data, sensitiveKeys = ['password', 'senha', 'token', 'cpf', 'rg']) {
  if (!data || typeof data !== 'object') return data;

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key], sensitiveKeys);
    }
  }

  return sanitized;
}

// Extrair informações relevantes do erro
function extractErrorInfo(error) {
  return {
    name: error.name || 'Error',
    message: error.message || 'Unknown error',
    status: error.status || error.statusCode || null,
    code: error.code || null,
    data: error.data ? sanitizeData(error.data) : null,
    stack: error.stack?.split('\n').slice(0, 5).join('\n') || null,
  };
}

// Níveis de log
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  FATAL: 'FATAL',
};

// Cores para console (quando suportado)
const LogColors = {
  DEBUG: '\x1b[36m',  // Cyan
  INFO: '\x1b[32m',   // Green
  WARN: '\x1b[33m',   // Yellow
  ERROR: '\x1b[31m',  // Red
  FATAL: '\x1b[35m',  // Magenta
  RESET: '\x1b[0m',
};

/**
 * Classe Logger
 */
class Logger {
  constructor(serviceName = 'App') {
    this.serviceName = serviceName;
    this.enabled = process.env.NODE_ENV !== 'test';
    this.debugEnabled = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';
  }

  /**
   * Formata mensagem de log
   */
  formatMessage(level, message, context = {}) {
    const timestamp = formatTimestamp();
    const prefix = `[${timestamp}] [${level}] [${this.serviceName}]`;

    if (Object.keys(context).length > 0) {
      return `${prefix} ${message} ${JSON.stringify(sanitizeData(context))}`;
    }

    return `${prefix} ${message}`;
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message, context = {}) {
    if (!this.enabled || !this.debugEnabled) return;
    console.log(this.formatMessage(LogLevel.DEBUG, message, context));
  }

  /**
   * Log de informação
   */
  info(message, context = {}) {
    if (!this.enabled) return;
    console.log(this.formatMessage(LogLevel.INFO, message, context));
  }

  /**
   * Log de aviso
   */
  warn(message, context = {}) {
    if (!this.enabled) return;
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  /**
   * Log de erro
   */
  error(message, error = null, context = {}) {
    if (!this.enabled) return;

    const errorInfo = error ? extractErrorInfo(error) : null;
    const fullContext = {
      ...context,
      ...(errorInfo && { error: errorInfo }),
    };

    console.error(this.formatMessage(LogLevel.ERROR, message, fullContext));
  }

  /**
   * Log de erro fatal
   */
  fatal(message, error = null, context = {}) {
    const errorInfo = error ? extractErrorInfo(error) : null;
    const fullContext = {
      ...context,
      ...(errorInfo && { error: errorInfo }),
    };

    console.error(this.formatMessage(LogLevel.FATAL, message, fullContext));
  }

  /**
   * Cria um logger com contexto de request
   */
  withRequestContext(requestId) {
    const childLogger = new Logger(this.serviceName);
    childLogger.requestId = requestId;
    return childLogger;
  }
}

/**
 * Logger específico para operações de API
 */
class ApiLogger extends Logger {
  constructor() {
    super('API');
  }

  /**
   * Log de início de request
   */
  requestStart(method, endpoint, options = {}) {
    const requestId = generateRequestId();

    this.info(`>>> ${method} ${endpoint}`, {
      requestId,
      params: options.params ? sanitizeData(options.params) : undefined,
      hasBody: !!options.body,
    });

    return {
      requestId,
      startTime: performance.now(),
    };
  }

  /**
   * Log de sucesso de request
   */
  requestSuccess(requestId, startTime, method, endpoint, responseData = null) {
    const duration = Math.round(performance.now() - startTime);

    this.info(`<<< ${method} ${endpoint} [${duration}ms] OK`, {
      requestId,
      duration,
      hasData: !!responseData,
      itemCount: Array.isArray(responseData?.items) ? responseData.items.length : undefined,
    });
  }

  /**
   * Log de erro de request
   */
  requestError(requestId, startTime, method, endpoint, error) {
    const duration = Math.round(performance.now() - startTime);
    const errorInfo = extractErrorInfo(error);

    this.error(`<<< ${method} ${endpoint} [${duration}ms] FAILED`, null, {
      requestId,
      duration,
      status: errorInfo.status,
      errorName: errorInfo.name,
      errorMessage: errorInfo.message,
      errorData: errorInfo.data,
    });
  }

  /**
   * Log de retry
   */
  requestRetry(requestId, attempt, maxRetries, delay, status) {
    this.warn(`Retry ${attempt}/${maxRetries} after ${delay}ms`, {
      requestId,
      attempt,
      maxRetries,
      delay,
      status,
    });
  }
}

/**
 * Logger específico para operações CRUD
 */
class CrudLogger extends Logger {
  constructor(entityName) {
    super(entityName);
    this.entityName = entityName;
  }

  /**
   * Log de operação CRUD iniciada
   */
  operationStart(operation, entityId = null, data = null) {
    const requestId = generateRequestId();

    this.info(`${operation} ${this.entityName} iniciado`, {
      requestId,
      operation,
      entityId,
      hasData: !!data,
      dataFields: data ? Object.keys(data) : undefined,
    });

    return {
      requestId,
      startTime: performance.now(),
    };
  }

  /**
   * Log de operação CRUD bem-sucedida
   */
  operationSuccess(requestId, startTime, operation, entityId = null, result = null) {
    const duration = Math.round(performance.now() - startTime);

    this.info(`${operation} ${this.entityName} concluído`, {
      requestId,
      operation,
      entityId: entityId || result?.id,
      duration,
    });
  }

  /**
   * Log de erro em operação CRUD
   */
  operationError(requestId, startTime, operation, error, entityId = null, inputData = null) {
    const duration = Math.round(performance.now() - startTime);
    const errorInfo = extractErrorInfo(error);

    // Classificar o tipo de erro
    let errorCategory = 'UNKNOWN';
    if (errorInfo.status === 400) errorCategory = 'VALIDATION';
    else if (errorInfo.status === 401) errorCategory = 'AUTH';
    else if (errorInfo.status === 403) errorCategory = 'PERMISSION';
    else if (errorInfo.status === 404) errorCategory = 'NOT_FOUND';
    else if (errorInfo.status === 409) errorCategory = 'CONFLICT';
    else if (errorInfo.status === 422) errorCategory = 'VALIDATION';
    else if (errorInfo.status === 429) errorCategory = 'RATE_LIMIT';
    else if (errorInfo.status >= 500) errorCategory = 'SERVER';
    else if (!errorInfo.status) errorCategory = 'NETWORK';

    this.error(`${operation} ${this.entityName} falhou`, null, {
      requestId,
      operation,
      entityId,
      duration,
      errorCategory,
      status: errorInfo.status,
      errorMessage: errorInfo.message,
      errorData: errorInfo.data,
      inputFields: inputData ? Object.keys(inputData) : undefined,
      // Incluir dados de entrada sanitizados para debugging
      inputData: inputData ? sanitizeData(inputData) : undefined,
    });

    return {
      errorCategory,
      userMessage: this.getUserFriendlyMessage(errorCategory, errorInfo),
    };
  }

  /**
   * Retorna mensagem amigável para o usuário
   */
  getUserFriendlyMessage(category, errorInfo) {
    const messages = {
      VALIDATION: `Dados inválidos: ${errorInfo.message || 'Verifique os campos obrigatórios'}`,
      AUTH: 'Sessão expirada. Faça login novamente.',
      PERMISSION: 'Você não tem permissão para esta ação.',
      NOT_FOUND: `${this.entityName} não encontrado(a).`,
      CONFLICT: `Conflito: ${errorInfo.message || 'Este registro já existe'}`,
      RATE_LIMIT: 'Muitas requisições. Aguarde um momento.',
      SERVER: 'Erro no servidor. Tente novamente em instantes.',
      NETWORK: 'Erro de conexão. Verifique sua internet.',
      UNKNOWN: 'Ocorreu um erro inesperado.',
    };

    return messages[category] || messages.UNKNOWN;
  }
}

// Instâncias pré-configuradas
const apiLogger = new ApiLogger();
const appLogger = new Logger('App');

// Factory para criar loggers de CRUD
function createCrudLogger(entityName) {
  return new CrudLogger(entityName);
}

// Exports
export {
  Logger,
  ApiLogger,
  CrudLogger,
  LogLevel,
  apiLogger,
  appLogger,
  createCrudLogger,
  generateRequestId,
  sanitizeData,
  extractErrorInfo,
};

export default appLogger;
