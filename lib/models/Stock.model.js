/**
 * Stock Model
 * Estrutura de dados para o controle de materiais/medicamentos.
 */

export const StockModel = {
  id: null,
  itemName: '',
  category: '',      // Ex: 'Material', 'Medicamento'
  currentQuantity: 0,
  
  // Dados de histórico 
  lastMovementType: null, // 'ENTRADA' ou 'SAIDA'
  lastMovementDate: null,
  
  // Controle
  notes: '',
  createdAt: null,
  updatedAt: null
};

/**
 * Cria um objeto de estoque garantindo os valores padrão
 */
export function createStockItem(data = {}) {
  return {
    ...StockModel,
    ...data,

    currentQuantity: data.currentQuantity !== undefined ? Number(data.currentQuantity) : 0,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  };
}

/**
 * Validação de integridade do modelo
 */
export function validateStock(data) {
  const errors = [];
  
  if (!data.itemName || data.itemName.trim().length < 2) {
    errors.push('O nome do item é obrigatório e deve ter pelo menos 2 caracteres.');
  }
  
  // Validação de Quantidade
  if (data.currentQuantity === undefined || data.currentQuantity === null || data.currentQuantity < 0) {
    errors.push('A quantidade atual deve ser um número maior ou igual a zero.');
  }

  // Validação de Categoria
  if (data.category && typeof data.category === 'string' && data.category.trim() === '') {
  }

  return { 
    valid: errors.length === 0, 
    errors 
  };
}

export default StockModel;