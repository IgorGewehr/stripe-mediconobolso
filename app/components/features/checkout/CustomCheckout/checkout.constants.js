/**
 * Checkout constants - plans data and configuration
 */

// Brazilian states list
export const brazilianStates = [
    { value: 'AC', label: 'Acre' }, { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' }, { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' }, { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' }, { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' }, { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' }, { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' }, { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' }, { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' }, { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' }, { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' }, { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' }, { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' }, { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' }
];

// Subscription plans data
export const plansData = {
    monthly: {
        id: 'monthly',
        name: 'Pro',
        price: 'R$127',
        pricePerMonth: 'R$127/mês',
        period: '/mês',
        features: [
            'Acesso a todas as funcionalidades',
            'Pacientes ilimitados',
            'Suporte prioritário',
            'Atualizações gratuitas'
        ],
        priceId: 'price_1QyKrNI2qmEooUtqKfgYIemz'
    },
    quarterly: {
        id: 'quarterly',
        name: 'Trimestral',
        price: 'R$345',
        pricePerMonth: 'R$115/mês',
        period: '/trimestre',
        features: [
            'Acesso a todas as funcionalidades',
            'Pacientes ilimitados',
            'Suporte prioritário',
            'Atualizações gratuitas',
            'Economia de 9% em relação ao plano mensal'
        ],
        priceId: 'price_1RIH5eI2qmEooUtqsdXyxnEP'
    },
    annual: {
        id: 'annual',
        name: 'Especialista',
        price: 'R$1143',
        pricePerMonth: 'R$95,25/mês',
        period: '/ano',
        popular: true,
        features: [
            'Acesso a todas as funcionalidades',
            'Pacientes ilimitados',
            'Suporte prioritário',
            'Atualizações gratuitas',
            'Economia de 25% em relação ao plano mensal'
        ],
        priceId: 'price_1QyKwWI2qmEooUtqOJ9lCFBl'
    }
};

// Stripe card element styling options
export const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            '::placeholder': { color: '#999999' },
            backgroundColor: 'transparent',
        },
        invalid: {
            color: '#F44336',
            iconColor: '#F44336',
        },
    },
};

// Initial form data
export const initialFormData = {
    fullName: "",
    phone: "",
    email: "",
    password: "",
    billingCpf: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    cardholderName: "",
    termsAccepted: false
};
