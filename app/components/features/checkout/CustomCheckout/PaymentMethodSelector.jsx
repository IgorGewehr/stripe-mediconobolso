'use client';

import React from 'react';
import {
    Box,
    Typography,
    FormControlLabel,
    Radio,
    RadioGroup,
    Paper,
    FormLabel
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptIcon from '@mui/icons-material/Receipt';

/**
 * PaymentMethodSelector - Allows user to select payment method (card or boleto)
 */
const PaymentMethodSelector = ({ paymentMethod, onPaymentMethodChange, selectedPlan }) => {
    const allowBoleto = selectedPlan !== 'monthly'; // Boleto not available for monthly plan

    return (
        <Box sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
                Escolha o método de pagamento:
            </FormLabel>
            <RadioGroup
                value={paymentMethod}
                onChange={(e) => onPaymentMethodChange(e.target.value)}
                sx={{ gap: 2 }}
            >
                <Paper sx={{
                    backgroundColor: paymentMethod === 'card' ? 'rgba(249, 185, 52, 0.2)' : '#2F2F2F',
                    border: paymentMethod === 'card' ? '2px solid #F9B934' : '1px solid #5F5F5F',
                    borderRadius: 2,
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }} onClick={() => onPaymentMethodChange('card')}>
                    <FormControlLabel
                        value="card"
                        control={<Radio sx={{ color: '#F9B934' }} />}
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <CreditCardIcon sx={{ color: '#F9B934' }} />
                                <Box>
                                    <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                                        Cartão de Crédito
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: 'grey.400' }}>
                                        Pagamento instantâneo • Acesso imediato
                                    </Typography>
                                </Box>
                            </Box>
                        }
                        sx={{ m: 0, width: '100%' }}
                    />
                </Paper>

                {allowBoleto && (
                    <Paper sx={{
                        backgroundColor: paymentMethod === 'boleto' ? 'rgba(249, 185, 52, 0.2)' : '#2F2F2F',
                        border: paymentMethod === 'boleto' ? '2px solid #F9B934' : '1px solid #5F5F5F',
                        borderRadius: 2,
                        p: 2,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }} onClick={() => onPaymentMethodChange('boleto')}>
                        <FormControlLabel
                            value="boleto"
                            control={<Radio sx={{ color: '#F9B934' }} />}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <ReceiptIcon sx={{ color: '#F9B934' }} />
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold' }}>
                                            Boleto Bancário
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'grey.400' }}>
                                            Vencimento em 3 dias • Acesso após confirmação
                                        </Typography>
                                    </Box>
                                </Box>
                            }
                            sx={{ m: 0, width: '100%' }}
                        />
                    </Paper>
                )}

                {!allowBoleto && (
                    <Paper sx={{
                        backgroundColor: '#1A1A1A',
                        border: '1px solid #3F3F3F',
                        borderRadius: 2,
                        p: 2,
                        opacity: 0.6
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ReceiptIcon sx={{ color: 'grey.600' }} />
                            <Box>
                                <Typography variant="subtitle1" sx={{ color: 'grey.600', fontWeight: 'bold' }}>
                                    Boleto Bancário
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'grey.600' }}>
                                    Disponível apenas para planos trimestrais e anuais
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                )}
            </RadioGroup>
        </Box>
    );
};

export default PaymentMethodSelector;
