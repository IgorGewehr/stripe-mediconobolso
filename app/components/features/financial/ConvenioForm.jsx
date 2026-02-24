'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useConvenios } from '../../hooks/useConvenios';

const initialFormData = {
  nome: '',
  codigoAns: '',
  cnpj: '',
  telefone: '',
  email: '',
  prazoPagamentoDias: 30,
  aceitaParticular: false,
};

export default function ConvenioForm({ open, onClose, convenioToEdit = null, onSuccess }) {
  const { createConvenio, updateConvenio, saving } = useConvenios({ autoLoad: false });

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  const isEditing = Boolean(convenioToEdit);

  // Initialize form with existing data when editing
  useEffect(() => {
    if (convenioToEdit) {
      setFormData({
        nome: convenioToEdit.nome || '',
        codigoAns: convenioToEdit.codigoAns || convenioToEdit.codigo_ans || '',
        cnpj: convenioToEdit.cnpj || '',
        telefone: convenioToEdit.telefone || '',
        email: convenioToEdit.email || '',
        prazoPagamentoDias: convenioToEdit.prazoPagamentoDias || convenioToEdit.prazo_pagamento_dias || 30,
        aceitaParticular: convenioToEdit.aceitaParticular || convenioToEdit.aceita_particular || false,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
    setSubmitError(null);
  }, [convenioToEdit, open]);

  // Handle field change
  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox'
      ? event.target.checked
      : event.target.value;

    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // Format CNPJ as user types
  const handleCnpjChange = (event) => {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);
    setFormData((prev) => ({ ...prev, cnpj: value }));
    setErrors((prev) => ({ ...prev, cnpj: null }));
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome e obrigatorio';
    }

    if (!formData.codigoAns || formData.codigoAns.length !== 6) {
      newErrors.codigoAns = 'Codigo ANS deve ter 6 digitos';
    }

    if (!formData.cnpj || formData.cnpj.length !== 14) {
      newErrors.cnpj = 'CNPJ deve ter 14 digitos';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitError(null);

    try {
      const data = {
        nome: formData.nome,
        codigoAns: formData.codigoAns,
        cnpj: formData.cnpj,
        telefone: formData.telefone || null,
        email: formData.email || null,
        prazoPagamentoDias: parseInt(formData.prazoPagamentoDias) || 30,
        aceitaParticular: formData.aceitaParticular,
      };

      if (isEditing) {
        await updateConvenio(convenioToEdit.id, data);
      } else {
        await createConvenio(data);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error saving convenio:', err);
      setSubmitError(err.message || 'Erro ao salvar convênio');
    }
  };

  // Handle close
  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  // Format CNPJ for display
  const formatCnpj = (cnpj) => {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {isEditing ? 'Editar Convênio' : 'Novo Convênio'}
      </DialogTitle>

      <DialogContent dividers>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Nome */}
          <Grid item xs={12}>
            <TextField
              label="Nome do Convênio"
              value={formData.nome}
              onChange={handleChange('nome')}
              fullWidth
              required
              error={Boolean(errors.nome)}
              helperText={errors.nome}
              placeholder="Ex: Unimed, Bradesco Saude..."
            />
          </Grid>

          {/* Codigo ANS */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Codigo ANS"
              value={formData.codigoAns}
              onChange={handleChange('codigoAns')}
              fullWidth
              required
              error={Boolean(errors.codigoAns)}
              helperText={errors.codigoAns || '6 digitos'}
              inputProps={{ maxLength: 6 }}
            />
          </Grid>

          {/* CNPJ */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="CNPJ"
              value={formatCnpj(formData.cnpj)}
              onChange={handleCnpjChange}
              fullWidth
              required
              error={Boolean(errors.cnpj)}
              helperText={errors.cnpj}
              placeholder="00.000.000/0001-00"
            />
          </Grid>

          {/* Telefone */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Telefone"
              value={formData.telefone}
              onChange={handleChange('telefone')}
              fullWidth
              placeholder="(00) 0000-0000"
            />
          </Grid>

          {/* Email */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              fullWidth
              error={Boolean(errors.email)}
              helperText={errors.email}
            />
          </Grid>

          {/* Prazo Pagamento */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Prazo de Pagamento (dias)"
              type="number"
              value={formData.prazoPagamentoDias}
              onChange={handleChange('prazoPagamentoDias')}
              fullWidth
              inputProps={{ min: 1, max: 365 }}
            />
          </Grid>

          {/* Aceita Particular */}
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.aceitaParticular}
                  onChange={handleChange('aceitaParticular')}
                />
              }
              label="Aceita Particular"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving && <CircularProgress size={20} />}
        >
          {isEditing ? 'Salvar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
