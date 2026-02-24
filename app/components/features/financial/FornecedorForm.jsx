'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Box,
  Divider,
  Typography,
} from '@mui/material';
import { useFornecedores } from '../../hooks/useFinancial';

const CATEGORIAS = [
  'Aluguel',
  'Equipamentos',
  'Insumos',
  'Laboratorio',
  'Manutencao',
  'Marketing',
  'Servicos',
  'Software',
  'Outros',
];

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const TIPOS_CONTA = [
  { value: 'corrente', label: 'Conta Corrente' },
  { value: 'poupanca', label: 'Conta Poupanca' },
];

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function FornecedorForm({
  open,
  onClose,
  fornecedorToEdit = null,
  onSuccess,
  viewMode = false,
}) {
  const { createFornecedor, updateFornecedor, saving, error: saveError } = useFornecedores({ autoLoad: false });

  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    razaoSocial: '',
    nomeFantasia: '',
    cpfCnpj: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    telefone: '',
    celular: '',
    email: '',
    website: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    banco: '',
    agencia: '',
    conta: '',
    tipoConta: '',
    chavePix: '',
    categoria: '',
    observacoes: '',
  });

  const [errors, setErrors] = useState({});

  // Load data when editing
  useEffect(() => {
    if (fornecedorToEdit) {
      setFormData({
        razaoSocial: fornecedorToEdit.razaoSocial || '',
        nomeFantasia: fornecedorToEdit.nomeFantasia || '',
        cpfCnpj: fornecedorToEdit.cpfCnpj || '',
        inscricaoEstadual: fornecedorToEdit.inscricaoEstadual || '',
        inscricaoMunicipal: fornecedorToEdit.inscricaoMunicipal || '',
        telefone: fornecedorToEdit.telefone || '',
        celular: fornecedorToEdit.celular || '',
        email: fornecedorToEdit.email || '',
        website: fornecedorToEdit.website || '',
        cep: fornecedorToEdit.cep || '',
        logradouro: fornecedorToEdit.logradouro || '',
        numero: fornecedorToEdit.numero || '',
        complemento: fornecedorToEdit.complemento || '',
        bairro: fornecedorToEdit.bairro || '',
        cidade: fornecedorToEdit.cidade || '',
        uf: fornecedorToEdit.uf || '',
        banco: fornecedorToEdit.banco || '',
        agencia: fornecedorToEdit.agencia || '',
        conta: fornecedorToEdit.conta || '',
        tipoConta: fornecedorToEdit.tipoConta || '',
        chavePix: fornecedorToEdit.chavePix || '',
        categoria: fornecedorToEdit.categoria || '',
        observacoes: fornecedorToEdit.observacoes || '',
      });
    } else {
      resetForm();
    }
    setActiveTab(0);
  }, [fornecedorToEdit, open]);

  const resetForm = () => {
    setFormData({
      razaoSocial: '',
      nomeFantasia: '',
      cpfCnpj: '',
      inscricaoEstadual: '',
      inscricaoMunicipal: '',
      telefone: '',
      celular: '',
      email: '',
      website: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      banco: '',
      agencia: '',
      conta: '',
      tipoConta: '',
      chavePix: '',
      categoria: '',
      observacoes: '',
    });
    setErrors({});
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.razaoSocial?.trim()) {
      newErrors.razaoSocial = 'Razao social e obrigatoria';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = {
      razaoSocial: formData.razaoSocial.trim(),
      nomeFantasia: formData.nomeFantasia?.trim() || null,
      cpfCnpj: formData.cpfCnpj?.replace(/\D/g, '') || null,
      inscricaoEstadual: formData.inscricaoEstadual?.trim() || null,
      inscricaoMunicipal: formData.inscricaoMunicipal?.trim() || null,
      telefone: formData.telefone?.trim() || null,
      celular: formData.celular?.trim() || null,
      email: formData.email?.trim() || null,
      website: formData.website?.trim() || null,
      cep: formData.cep?.replace(/\D/g, '') || null,
      logradouro: formData.logradouro?.trim() || null,
      numero: formData.numero?.trim() || null,
      complemento: formData.complemento?.trim() || null,
      bairro: formData.bairro?.trim() || null,
      cidade: formData.cidade?.trim() || null,
      uf: formData.uf || null,
      banco: formData.banco?.trim() || null,
      agencia: formData.agencia?.trim() || null,
      conta: formData.conta?.trim() || null,
      tipoConta: formData.tipoConta || null,
      chavePix: formData.chavePix?.trim() || null,
      categoria: formData.categoria || null,
      observacoes: formData.observacoes?.trim() || null,
    };

    try {
      if (fornecedorToEdit) {
        await updateFornecedor(fornecedorToEdit.id, payload);
      } else {
        await createFornecedor(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error saving fornecedor:', err);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getDialogTitle = () => {
    if (viewMode) return 'Visualizar Fornecedor';
    if (fornecedorToEdit) return 'Editar Fornecedor';
    return 'Novo Fornecedor';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {getDialogTitle()}
      </DialogTitle>

      <DialogContent>
        {saveError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Dados Gerais" />
          <Tab label="Endereco" />
          <Tab label="Dados Bancarios" />
        </Tabs>

        {/* Dados Gerais */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Razao Social"
                value={formData.razaoSocial}
                onChange={handleChange('razaoSocial')}
                fullWidth
                size="small"
                required={!viewMode}
                error={!!errors.razaoSocial}
                helperText={errors.razaoSocial}
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nome Fantasia"
                value={formData.nomeFantasia}
                onChange={handleChange('nomeFantasia')}
                fullWidth
                size="small"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="CPF/CNPJ"
                value={formData.cpfCnpj}
                onChange={handleChange('cpfCnpj')}
                fullWidth
                size="small"
                placeholder="00.000.000/0000-00"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Inscricao Estadual"
                value={formData.inscricaoEstadual}
                onChange={handleChange('inscricaoEstadual')}
                fullWidth
                size="small"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Inscricao Municipal"
                value={formData.inscricaoMunicipal}
                onChange={handleChange('inscricaoMunicipal')}
                fullWidth
                size="small"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Contato
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Telefone"
                value={formData.telefone}
                onChange={handleChange('telefone')}
                fullWidth
                size="small"
                placeholder="(00) 0000-0000"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Celular"
                value={formData.celular}
                onChange={handleChange('celular')}
                fullWidth
                size="small"
                placeholder="(00) 00000-0000"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                value={formData.email}
                onChange={handleChange('email')}
                fullWidth
                size="small"
                type="email"
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Website"
                value={formData.website}
                onChange={handleChange('website')}
                fullWidth
                size="small"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" disabled={viewMode}>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={formData.categoria}
                  onChange={handleChange('categoria')}
                  label="Categoria"
                  readOnly={viewMode}
                >
                  <MenuItem value="">Sem categoria</MenuItem>
                  {CATEGORIAS.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Observacoes"
                value={formData.observacoes}
                onChange={handleChange('observacoes')}
                fullWidth
                size="small"
                multiline
                rows={2}
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Endereco */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                label="CEP"
                value={formData.cep}
                onChange={handleChange('cep')}
                fullWidth
                size="small"
                placeholder="00000-000"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Logradouro"
                value={formData.logradouro}
                onChange={handleChange('logradouro')}
                fullWidth
                size="small"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Numero"
                value={formData.numero}
                onChange={handleChange('numero')}
                fullWidth
                size="small"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Complemento"
                value={formData.complemento}
                onChange={handleChange('complemento')}
                fullWidth
                size="small"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Bairro"
                value={formData.bairro}
                onChange={handleChange('bairro')}
                fullWidth
                size="small"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Cidade"
                value={formData.cidade}
                onChange={handleChange('cidade')}
                fullWidth
                size="small"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small" disabled={viewMode}>
                <InputLabel>UF</InputLabel>
                <Select
                  value={formData.uf}
                  onChange={handleChange('uf')}
                  label="UF"
                  readOnly={viewMode}
                >
                  <MenuItem value="">-</MenuItem>
                  {UFS.map((uf) => (
                    <MenuItem key={uf} value={uf}>{uf}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Dados Bancarios */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Banco"
                value={formData.banco}
                onChange={handleChange('banco')}
                fullWidth
                size="small"
                placeholder="Ex: Banco do Brasil"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" disabled={viewMode}>
                <InputLabel>Tipo de Conta</InputLabel>
                <Select
                  value={formData.tipoConta}
                  onChange={handleChange('tipoConta')}
                  label="Tipo de Conta"
                  readOnly={viewMode}
                >
                  <MenuItem value="">-</MenuItem>
                  {TIPOS_CONTA.map((tipo) => (
                    <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Agencia"
                value={formData.agencia}
                onChange={handleChange('agencia')}
                fullWidth
                size="small"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Conta"
                value={formData.conta}
                onChange={handleChange('conta')}
                fullWidth
                size="small"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Chave PIX"
                value={formData.chavePix}
                onChange={handleChange('chavePix')}
                fullWidth
                size="small"
                placeholder="CPF, CNPJ, email, telefone ou chave aleatoria"
                InputProps={{ readOnly: viewMode }}
              />
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          {viewMode ? 'Fechar' : 'Cancelar'}
        </Button>
        {!viewMode && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} /> : fornecedorToEdit ? 'Salvar' : 'Criar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
