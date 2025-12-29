'use client';

/**
 * @fileoverview Financial Preferences Configuration Card
 * @description Allows users to configure automatic account generation after consultations
 */

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Alert,
  Divider,
  Chip,
  CircularProgress,
  Skeleton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Save as SaveIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useFinancialPreferences, getDiasVencimentoOptions } from '../../hooks/useFinancialPreferences';
import financialService from '@/lib/services/api/financial.service';
import { useQuery } from '@tanstack/react-query';

export default function ConfiguracaoFinanceiro() {
  const {
    preferences,
    isLoading,
    update,
    isUpdating,
    updateError,
  } = useFinancialPreferences();

  // Fetch categories for dropdown
  const { data: categorias = [] } = useQuery({
    queryKey: ['financial', 'categorias', { tipo: 'receita' }],
    queryFn: () => financialService.listCategorias({ tipo: 'receita' }),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const diasVencimentoOptions = getDiasVencimentoOptions();

  const [formData, setFormData] = useState({
    gerarContaAutomatica: false,
    valorConsultaPadrao: '',
    categoriaId: null,
    diasVencimento: 0,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load preferences into form
  useEffect(() => {
    if (preferences) {
      setFormData({
        gerarContaAutomatica: preferences.gerarContaAutomatica || false,
        valorConsultaPadrao: preferences.valorConsultaPadrao || '',
        categoriaId: preferences.categoriaId || null,
        diasVencimento: preferences.diasVencimento || 0,
      });
      setHasChanges(false);
    }
  }, [preferences]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = async () => {
    setSuccessMessage('');

    try {
      await update({
        gerarContaAutomatica: formData.gerarContaAutomatica,
        valorConsultaPadrao: formData.valorConsultaPadrao ? parseFloat(formData.valorConsultaPadrao) : null,
        categoriaId: formData.categoriaId,
        diasVencimento: formData.diasVencimento,
      });
      setSuccessMessage('Preferencias salvas com sucesso!');
      setHasChanges(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar preferencias:', err);
    }
  };

  if (isLoading && !preferences) {
    return (
      <Card>
        <CardHeader title="Preferencias Financeiras" />
        <Divider />
        <CardContent>
          <Skeleton height={40} sx={{ mb: 2 }} />
          <Skeleton height={60} sx={{ mb: 2 }} />
          <Skeleton height={60} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Preferencias Financeiras"
        titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
        subheader="Configure a geracao automatica de contas a receber"
        avatar={<MoneyIcon color="primary" />}
      />
      <Divider />
      <CardContent>
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {updateError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {updateError.message || 'Erro ao salvar preferencias'}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Toggle auto-generate */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.gerarContaAutomatica}
                  onChange={(e) => handleChange('gerarContaAutomatica', e.target.checked)}
                  disabled={isUpdating}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2">
                    Gerar conta a receber automaticamente
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Ao concluir uma consulta, uma conta a receber sera criada automaticamente
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Only show these options if auto-generate is enabled */}
          {formData.gerarContaAutomatica && (
            <>
              <Divider />

              {/* Default consultation value */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Valor Padrao da Consulta
                </Typography>
                <TextField
                  value={formData.valorConsultaPadrao}
                  onChange={(e) => handleChange('valorConsultaPadrao', e.target.value)}
                  type="number"
                  size="small"
                  placeholder="0,00"
                  sx={{ maxWidth: 200 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">R$</InputAdornment>
                    ),
                  }}
                  inputProps={{ min: 0, step: '0.01' }}
                  disabled={isUpdating}
                  helperText="Usado quando o agendamento nao tem valor definido"
                />
              </Box>

              {/* Default category */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Categoria Financeira Padrao
                </Typography>
                <FormControl size="small" sx={{ minWidth: 250 }}>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={formData.categoriaId || ''}
                    label="Categoria"
                    onChange={(e) => handleChange('categoriaId', e.target.value || null)}
                    disabled={isUpdating}
                  >
                    <MenuItem value="">Nenhuma</MenuItem>
                    {categorias.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.codigo} - {cat.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Categoria para classificar as contas geradas
                </Typography>
              </Box>

              {/* Days until due date */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Prazo para Vencimento
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {diasVencimentoOptions.map(opt => (
                    <Chip
                      key={opt.value}
                      label={opt.label}
                      variant={formData.diasVencimento === opt.value ? 'filled' : 'outlined'}
                      color={formData.diasVencimento === opt.value ? 'primary' : 'default'}
                      onClick={() => handleChange('diasVencimento', opt.value)}
                      disabled={isUpdating}
                      icon={<CalendarIcon sx={{ fontSize: 16 }} />}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Quantos dias apos a consulta o vencimento sera definido
                </Typography>
              </Box>
            </>
          )}

          {/* Info box when disabled */}
          {!formData.gerarContaAutomatica && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: '1px dashed',
                borderColor: 'grey.300',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Quando desativado, voce podera criar contas a receber manualmente
                apos concluir cada consulta.
              </Typography>
            </Box>
          )}

          {/* Submit button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isUpdating || !hasChanges}
              startIcon={isUpdating ? <CircularProgress size={16} /> : <SaveIcon />}
            >
              {isUpdating ? 'Salvando...' : 'Salvar Preferencias'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
