/**
 * Checkout utilities - validation and formatting functions
 */

// CPF validation
export const validateCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf === '' || cpf.length !== 11) return false;

    if (
        cpf === '00000000000' || cpf === '11111111111' || cpf === '22222222222' ||
        cpf === '33333333333' || cpf === '44444444444' || cpf === '55555555555' ||
        cpf === '66666666666' || cpf === '77777777777' || cpf === '88888888888' ||
        cpf === '99999999999'
    ) {
        return false;
    }

    let add = 0;
    for (let i = 0; i < 9; i++) {
        add += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;

    add = 0;
    for (let i = 0; i < 10; i++) {
        add += parseInt(cpf.charAt(i)) * (11 - i);
    }
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;

    return true;
};

// CPF formatting
export const formatCPF = (value) => {
    value = value.replace(/\D/g, '');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d)/, '$1.$2');
    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return value;
};

// CEP formatting
export const formatCEP = (value) => {
    value = value.replace(/\D/g, '');
    value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    return value;
};

// Phone formatting
export const formatPhone = (value) => {
    value = value.replace(/\D/g, '');
    if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/g, '$1 $2');
        value = value.replace(/(\d{5})(\d)/, '$1 $2');
    }
    return value;
};

// Firebase error mapping
export const mapFirebaseError = (error) => {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return "Este email já está em uso.";
        case 'auth/weak-password':
            return "A senha é muito fraca. Use pelo menos 6 caracteres.";
        case 'auth/invalid-email':
            return "Email inválido.";
        case 'auth/user-not-found':
        case 'auth/wrong-password':
            return "Email ou senha incorretos.";
        default:
            return `Erro no cadastro: ${error.message}`;
    }
};

// Stripe error mapping
export const mapStripeError = (error) => {
    switch (error.code) {
        case 'card_declined':
            return "Seu cartão foi recusado. Verifique com seu banco ou tente outro cartão.";
        case 'insufficient_funds':
            return "Fundos insuficientes no cartão.";
        case 'expired_card':
            return "Cartão expirado. Por favor, use outro cartão.";
        case 'incorrect_cvc':
            return "Código de segurança incorreto.";
        case 'processing_error':
            return "Erro de processamento. Tente novamente.";
        default:
            return error.message || "Erro ao processar o pagamento.";
    }
};
