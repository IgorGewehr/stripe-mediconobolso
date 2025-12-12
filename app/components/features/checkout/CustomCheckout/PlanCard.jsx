'use client';

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

/**
 * PlanCard - Displays a subscription plan option
 */
const PlanCard = React.memo(({ plan, isSelected, onSelect }) => {
    return (
        <Paper sx={{
            backgroundColor: '#1F1F1F',
            color: 'white',
            borderRadius: 2,
            overflow: 'hidden',
            border: isSelected ? '2px solid #F9B934' : '1px solid #3F3F3F',
            position: 'relative',
            p: 0,
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            boxShadow: isSelected ? '0 8px 16px rgba(249, 185, 52, 0.2)' : 'none',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 6px 12px rgba(0,0,0,0.2)'
            },
            fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
            width: '100%'
        }}
               onClick={onSelect}
               elevation={isSelected ? 8 : 1}>

            {plan.popular && (
                <Box sx={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    backgroundColor: '#F9B934', color: 'black',
                    fontSize: '0.8rem', fontWeight: 'bold',
                    py: 0.5, px: 1, textAlign: 'center', zIndex: 1
                }}>
                    MAIS POPULAR
                </Box>
            )}

            <Box sx={{ p: 2, flexGrow: 1, pt: plan.popular ? 4 : 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'baseline' }}>
                    {plan.price} <Typography variant="caption" sx={{ ml: 1, color: 'grey.400' }}>{plan.period}</Typography>
                </Typography>
                <Typography variant="subtitle1" sx={{ my: 1 }}>
                    {plan.name}
                </Typography>

                {plan.pricePerMonth && (
                    <Typography variant="body1" sx={{
                        color: '#F9B934', mb: 2, fontWeight: 'bold', fontSize: '1.1rem',
                        border: '1px dashed #F9B934', p: 1, borderRadius: 1, textAlign: 'center'
                    }}>
                        {plan.pricePerMonth}
                    </Typography>
                )}

                {plan.features.map((feature, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                        <CheckIcon sx={{ fontSize: '0.9rem', color: '#F9B934', mr: 1, mt: 0.3 }} />
                        <Typography variant="body2" sx={{ color: 'grey.400', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
                            {feature}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <Button variant="contained" fullWidth sx={{
                py: 1.5, borderRadius: 0,
                backgroundColor: isSelected ? '#F9B934' : '#2F2F2F',
                color: 'white',
                fontWeight: 'bold',
                '&:hover': {
                    backgroundColor: isSelected ? '#E5A830' : '#3F3F3F',
                },
                marginTop: 'auto'
            }}>
                {isSelected ? 'SELECIONADO' : 'ESCOLHA O PLANO'}
            </Button>
        </Paper>
    );
});

PlanCard.displayName = 'PlanCard';

export default PlanCard;
